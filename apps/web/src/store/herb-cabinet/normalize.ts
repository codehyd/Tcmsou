import { getSubclassesByCategory } from "@/data/catalog/categories";
import { getDefaultSubclassId } from "@/data/catalog/herbs";
import type { Herb, HerbCategoryId, HerbSubclassId } from "@/types/herb";

// 读本地存档时用：确认二级小类属于这个功效分类，对不上就用该分类的第一项
function resolveSubclassId(
  categoryId: HerbCategoryId,
  subclassId: unknown,
): HerbSubclassId {
  const belongsHere = getSubclassesByCategory(categoryId).some(
    (subclass) => subclass.id === subclassId,
  );

  if (belongsHere) {
    return subclassId as HerbSubclassId;
  }

  return getDefaultSubclassId(categoryId);
}

// 存档里的一条至少要有编号和药名，否则丢掉
export function isHerbRecord(value: unknown): value is Herb {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Herb>;

  return typeof record.id === "string" && typeof record.name === "string";
}

// 把存档里的药补全缺字段。旧数据可能没有性味、出处，或小类挂错分类
export function normalizeStoredHerb(record: Herb, origin: Herb["origin"]): Herb {
  const categoryId = record.categoryId ?? "bu_xu";

  return {
    ...record,
    nature: record.nature ?? "",
    meridians: record.meridians ?? "",
    functions: record.functions ?? "",
    indications: record.indications ?? "",
    pinyin: record.pinyin ?? "",
    categoryId,
    subclassId: resolveSubclassId(categoryId, record.subclassId),
    image: record.image ?? null,
    unit: record.unit?.trim() || "克",
    origin: record.origin ?? origin,

    // 本室典籍不记出处。外来药要有来源名称；网址必须是 http 或 https
    source:
      record.origin === "builtin" || !record.source?.label
        ? undefined
        : {
            label: record.source.label,
            url:
              typeof record.source.url === "string" && /^https?:\/\//i.test(record.source.url)
                ? record.source.url
                : undefined,
          },
  };
}
