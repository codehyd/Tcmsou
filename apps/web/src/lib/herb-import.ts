import { HERB_CATEGORIES, HERB_CLASS_ALIASES, HERB_SUBCLASSES } from "@/data/categories";
import { getDefaultSubclassId } from "@/data/herbs";
import symmapHerbNotes from "@/data/symmap-herb-notes.json";
import { formatHerbClassPath } from "@/lib/herb-catalog";
import type {
  Herb,
  HerbCategoryId,
  HerbPack,
  HerbPackHerb,
  HerbSubclassId,
  ImportFieldKey,
  ImportFieldPick,
} from "@/types/herb";

// 试用 JSON 仍放在站点里，给想先练对照的人；正式货源走 SymMap
export const OPEN_HERB_PACK_URL = "/packs/open-herb-pack.json";

export const OPEN_HERB_PACK_FILENAME = "open-herb-pack.json";

// SymMap 下载页：用户去那里领 Herb 的 SMHB 表，我们不替站点跑接口
export const SYMMAP_DOWNLOAD_PAGE = "http://symmap.org/download/";

// Herb 这一行的 SMHB 文件，点它等于已经帮人翻到正确那一格
export const SYMMAP_SMHB_FILE_URL =
  "http://symmap.org/static/download/V2.0/SymMap%20v2.0%2C%20SMHB%20file.xlsx";

export const SYMMAP_SMHB_FILENAME = "SymMap-v2.0-SMHB.xlsx";

// 审查表上要亮的栏目，顺序跟详情说明书一样，对照时不迷路
export const IMPORT_FIELD_LABELS: Record<ImportFieldKey, string> = {
  pinyin: "拼音",
  class: "功效分类",
  nature: "性味",
  meridians: "归经",
  functions: "功效",
  indications: "主治",
};

export const IMPORT_FIELD_KEYS = Object.keys(IMPORT_FIELD_LABELS) as ImportFieldKey[];

// 药包解析失败或某味对不上柜门时，把原因说给人听
export interface InvalidPackHerb {
  name: string;
  reason: string;
}

// 药名撞车：左边是本室现货，右边是药包来客，diffs 是两边字不一样的栏目
export interface ImportDuplicate {
  existing: Herb;
  incoming: Herb;
  diffs: ImportFieldKey[];
}

// 一包药拆完后的四堆：新货、撞名要审的、和本室一样的、废票
export interface ParsedHerbImport {
  packName: string;
  fresh: Herb[];
  duplicates: ImportDuplicate[];
  unchanged: Herb[];
  invalid: InvalidPackHerb[];
}

// 把药名收成同一把尺子：去空格、小写，避免「麻黄」和「 麻黄 」算两味
export function normalizeHerbName(name: string): string {
  return name.trim().replace(/\s+/g, "").toLowerCase();
}

// 分类签也收一收：去掉「药」字尾巴，解表药和解表才能对上号
function normalizeClassLabel(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(/药$/, "");
}

// 按中文名在现货里找人，找不到就说明是新面孔
export function findHerbByName(herbs: Herb[], name: string): Herb | undefined {
  const needle = normalizeHerbName(name);

  return herbs.find((herb) => normalizeHerbName(herb.name) === needle);
}

// 拼音收成门牌用的字母数字，空着就写 herb，避免编号变成符号串
function slugFromPinyin(pinyin: string, name: string): string {
  const fromPinyin = pinyin.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

  if (fromPinyin) {
    return fromPinyin;
  }

  return `herb-${normalizeHerbName(name) || "item"}`;
}

// 拿分类签去目录里对柜门：先认 SymMap 别名，再认本室章名
function resolveClassIds(record: HerbPackHerb): {
  categoryId?: HerbCategoryId;
  subclassId?: HerbSubclassId;
  error?: string;
} {
  if (record.categoryId) {
    const known = HERB_CATEGORIES.some((category) => category.id === record.categoryId);

    if (!known) {
      return { error: "功效分类编号不在本室柜门里" };
    }

    return {
      categoryId: record.categoryId,
      subclassId: resolveSubclassId(record.categoryId, record),
    };
  }

  const raw = (record.categoryTag ?? "").trim();

  if (!raw) {
    return {
      categoryId: "wei_fen_lei",
      subclassId: "wei_fen_lei_yao",
    };
  }

  // 单元格里偶尔写成「攻下药,泻下药」，先取第一段再对
  const firstTag = raw.split(/[,，;；]/)[0]?.trim() ?? raw;
  const alias = HERB_CLASS_ALIASES[normalizeClassLabel(firstTag)];

  if (alias) {
    return {
      categoryId: alias.categoryId,
      subclassId: record.subclassTag
        ? resolveSubclassId(alias.categoryId, record)
        : alias.subclassId,
    };
  }

  const needle = normalizeClassLabel(firstTag);
  const match = HERB_CATEGORIES.find((category) => {
    return (
      normalizeClassLabel(category.tag) === needle ||
      normalizeClassLabel(category.name) === needle
    );
  });

  if (!match) {
    return { error: `对不上柜门「${firstTag}」` };
  }

  return {
    categoryId: match.id,
    subclassId: resolveSubclassId(match.id, record),
  };
}

// 二级小类挂在已经认过的柜门下，写错节或没写节就落到该章第一格
function resolveSubclassId(
  categoryId: HerbCategoryId,
  record: HerbPackHerb,
): HerbSubclassId {
  if (record.subclassId) {
    const known = HERB_SUBCLASSES.some(
      (subclass) => subclass.id === record.subclassId && subclass.categoryId === categoryId,
    );

    if (known) {
      return record.subclassId;
    }
  }

  const raw = record.subclassTag?.trim() ?? "";

  if (raw) {
    const needle = normalizeClassLabel(raw);
    const match = HERB_SUBCLASSES.find((subclass) => {
      return (
        subclass.categoryId === categoryId &&
        (normalizeClassLabel(subclass.tag) === needle ||
          normalizeClassLabel(subclass.name) === needle)
      );
    });

    if (match) {
      return match.id;
    }
  }

  return getDefaultSubclassId(categoryId);
}

// 把药包纸条收成本室认识的药牌；分类对不上就退回原因，不硬塞进错误抽屉
function packHerbToHerb(
  record: HerbPackHerb,
  options: { existing?: Herb },
): { herb?: Herb; error?: string } {
  const name = record.name.trim();

  if (!name) {
    return { error: "药名是空的" };
  }

  const classResult = resolveClassIds(record);

  if (!classResult.categoryId || !classResult.subclassId) {
    return { error: classResult.error ?? "缺少功效分类" };
  }

  const categoryId = classResult.categoryId;
  const subclassId = classResult.subclassId;
  const pinyin = (record.pinyin ?? options.existing?.pinyin ?? "").trim();

  return {
    herb: {
      id: options.existing?.id ?? `imported-${slugFromPinyin(pinyin, name)}`,
      name,
      pinyin: pinyin || slugFromPinyin(pinyin, name),
      categoryId,
      subclassId,
      nature: (record.nature ?? "").trim(),
      meridians: (record.meridians ?? "").trim(),
      functions: (record.functions ?? "").trim(),
      indications: (record.indications ?? "").trim(),
      image: options.existing?.image ?? null,
      origin: options.existing?.origin ?? "imported",
    },
  };
}

// 取出某一栏给人看的字：分类要写成章·节，其他栏目原样
export function getImportFieldValue(herb: Herb, key: ImportFieldKey): string {
  if (key === "class") {
    return formatHerbClassPath(herb);
  }

  return herb[key] ?? "";
}

// 两边字不一样才进审查，完全相同就当没这回事，免得无意义勾选
export function listImportDiffs(existing: Herb, incoming: Herb): ImportFieldKey[] {
  return IMPORT_FIELD_KEYS.filter((key) => {
    return getImportFieldValue(existing, key) !== getImportFieldValue(incoming, key);
  });
}

// 按审查勾选把两份说明书合成一味：没勾的栏目默认留本室，像以旧账为准
export function mergeHerbByPicks(
  existing: Herb,
  incoming: Herb,
  picks: Partial<Record<ImportFieldKey, ImportFieldPick>>,
): Herb {
  const useIncoming = (key: ImportFieldKey) => picks[key] === "incoming";

  return {
    ...existing,
    pinyin: useIncoming("pinyin") ? incoming.pinyin : existing.pinyin,
    categoryId: useIncoming("class") ? incoming.categoryId : existing.categoryId,
    subclassId: useIncoming("class") ? incoming.subclassId : existing.subclassId,
    nature: useIncoming("nature") ? incoming.nature : existing.nature,
    meridians: useIncoming("meridians") ? incoming.meridians : existing.meridians,
    functions: useIncoming("functions") ? incoming.functions : existing.functions,
    indications: useIncoming("indications") ? incoming.indications : existing.indications,
    image: existing.image,
    origin: existing.origin,
    id: existing.id,
    name: existing.name,
  };
}

// 一栏全选某一边，审查里「本室全部 / 导入全部」靠它一次勾完
export function picksForSide(
  diffs: ImportFieldKey[],
  side: ImportFieldPick,
): Record<ImportFieldKey, ImportFieldPick> {
  const picks = {} as Record<ImportFieldKey, ImportFieldPick>;

  for (const key of diffs) {
    picks[key] = side;
  }

  return picks;
}

// 认药包封面：要么是带 herbs 的对象，要么直接是一叠药牌
function asHerbPack(value: unknown): HerbPack | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    return { name: "未命名药包", herbs: value as HerbPackHerb[] };
  }

  const record = value as Partial<HerbPack>;

  if (!Array.isArray(record.herbs)) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    source: record.source,
    herbs: record.herbs,
  };
}

// 读文件、拆四堆：新药能上架，撞名进对照，完全一样的也留在清单上让人看见，废票跟人说原因
export function parseHerbImport(raw: unknown, cabinet: Herb[]): ParsedHerbImport {
  const pack = asHerbPack(raw);

  if (!pack) {
    throw new Error("药包格式不对，需要带 herbs 列表的 JSON");
  }

  const fresh: Herb[] = [];
  const duplicates: ImportDuplicate[] = [];
  const unchanged: Herb[] = [];
  const invalid: InvalidPackHerb[] = [];
  const seen = new Set<string>();

  for (const record of pack.herbs) {
    const name = typeof record?.name === "string" ? record.name : "";
    const key = normalizeHerbName(name);

    if (!key) {
      invalid.push({ name: name || "（空名）", reason: "药名是空的" });
      continue;
    }

    if (seen.has(key)) {
      invalid.push({ name, reason: "药包里自己就出现了两次" });
      continue;
    }

    seen.add(key);

    const existing = findHerbByName(cabinet, name);
    const converted = packHerbToHerb(record, { existing });

    if (!converted.herb) {
      invalid.push({ name, reason: converted.error ?? "读不出来" });
      continue;
    }

    if (!existing) {
      fresh.push(converted.herb);
      continue;
    }

    const diffs = listImportDiffs(existing, converted.herb);

    // 字完全一样也留一行，不然人不知道这味药在表里、只是不用改柜
    if (diffs.length === 0) {
      unchanged.push(existing);
      continue;
    }

    duplicates.push({
      existing,
      incoming: converted.herb,
      diffs,
    });
  }

  return {
    packName: pack.name?.trim() || "未命名药包",
    fresh,
    duplicates,
    unchanged,
    invalid,
  };
}

// 把中文顿号理顺：Excel 里常用逗号，展签上改成顿号更好读
function polishChineseList(value: string): string {
  return value
    .trim()
    .replace(/,/g, "、")
    .replace(/，/g, "、")
    .replace(/、+/g, "、")
    .replace(/^、|、$/g, "");
}

// 读表格里某一列：表头大小写不统一，挨个试，免得漏掉药名
function cell(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];

    if (value === undefined || value === null) {
      continue;
    }

    const text = String(value).trim();

    if (text) {
      return text;
    }
  }

  return "";
}

// 把 SymMap 的 SMHB 表收成本室药包：只留没被废弃的药材行
// 功效、主治不在这张 Excel 里，按 Herb_id 去补注里取
function herbPackFromSymMapRows(
  rows: Record<string, unknown>[],
): HerbPack {
  const herbs: HerbPackHerb[] = [];

  for (const row of rows) {
    const suppressed = cell(row, ["Suppress", "suppress"]);

    if (suppressed === "1") {
      continue;
    }

    const name = cell(row, ["Chinese_name", "chinese_name"]);

    if (!name) {
      continue;
    }

    const meridians = polishChineseList(cell(row, ["Meridians_Chinese", "meridians_chinese"]));

    // 表上没有功效和主治。功效来自详情页中文，主治用关联的中医症状，空着就别编
    const note = symmapHerbNotes[cell(row, ["Herb_id", "herb_id"]) as keyof typeof symmapHerbNotes];

    herbs.push({
      name,
      pinyin: cell(row, ["Pinyin_name", "pinyin_name"]).toLowerCase(),
      categoryTag: cell(row, ["Class_Chinese", "class_chinese"]),
      nature: polishChineseList(cell(row, ["Properties_Chinese", "properties_chinese"])),
      meridians: meridians && !meridians.endsWith("经") ? `${meridians}经` : meridians,
      functions: note?.functions ?? "",
      indications: note?.indications ?? "",
    });
  }

  return {
    id: "symmap-smhb-v2",
    name: "SymMap 药材表（SMHB）",
    source: "http://symmap.org/download/",
    herbs,
  };
}

// 读用户丢进来的文件：JSON 是本室格式，Excel 按 SymMap 药材表拆
export async function parseHerbImportFile(
  file: File,
  cabinet: Herb[],
): Promise<ParsedHerbImport> {
  const filename = file.name.toLowerCase();

  if (filename.endsWith(".json")) {
    const raw: unknown = JSON.parse(await file.text());

    return parseHerbImport(raw, cabinet);
  }

  if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("Excel 里没有工作表");
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[sheetName],
      { defval: "" },
    );
    const sample = rows[0] ?? {};
    const looksLikeSmhb = Boolean(
      cell(sample, ["Chinese_name", "chinese_name"]) ||
        Object.keys(sample).some((key) => key.toLowerCase().includes("chinese_name")),
    );

    if (!looksLikeSmhb && rows.length > 0) {
      throw new Error("这不是 SymMap 的药材表。请到下载页取 Herb 这一行的 SMHB file。");
    }

    return parseHerbImport(herbPackFromSymMapRows(rows), cabinet);
  }

  throw new Error("请选择 JSON，或 SymMap 下载的 SMHB Excel");
}

// 柜门和抽屉的中文签，导出文件靠它认章，不只有 jie_biao 这种内部编号
function classTags(herb: Herb) {
  const category = HERB_CATEGORIES.find((item) => item.id === herb.categoryId);
  const subclass = HERB_SUBCLASSES.find((item) => item.id === herb.subclassId);

  return {
    categoryTag: category?.tag,
    subclassTag: subclass?.tag,
  };
}

// 把当前货架整柜收成药包：教材、后导入的新药、盖过章的修订都在里面
export function buildHerbPackFromCabinet(herbs: Herb[]): HerbPack {
  return {
    id: "cabinet-export",
    name: "本室导出",
    source: "从收藏室导出",
    herbs: herbs.map((herb) => ({
      name: herb.name,
      pinyin: herb.pinyin,
      ...classTags(herb),
      categoryId: herb.categoryId,
      subclassId: herb.subclassId,
      nature: herb.nature,
      meridians: herb.meridians,
      functions: herb.functions,
      indications: herb.indications,
    })),
  };
}

// 把药包存成文件递给浏览器下载，像把账本复印一份带走
export function downloadHerbPackFile(pack: HerbPack, filename: string) {
  const blob = new Blob([`${JSON.stringify(pack, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
