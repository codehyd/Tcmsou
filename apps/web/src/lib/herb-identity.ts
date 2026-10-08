import type { Herb, HerbChild } from "@/types/herb";
import type { FormulaLine, FormulaProcessId } from "@/types/formula";

// 药名前面一眼能认出的炮制。剩下至少两个字才拆，避免把单字药名拆没
const STRONG_PROCESS_PREFIXES: { prefix: string; process: FormulaProcessId }[] = [
  { prefix: "蜜炙", process: "zhi" },
  { prefix: "麸炒", process: "fu_chao" },
  { prefix: "酒炙", process: "jiu" },
  { prefix: "醋炙", process: "cu" },
  { prefix: "盐炙", process: "yan" },
  { prefix: "姜炙", process: "jiang" },
  { prefix: "炙", process: "zhi" },
  { prefix: "煅", process: "duan" },
];

// 单个字的炮制。只有柜里已经有这味药才拆，避免把生姜拆成姜
const WEAK_PROCESS_PREFIXES: { prefix: string; process: FormulaProcessId }[] = [
  { prefix: "炒", process: "chao" },
  { prefix: "酒", process: "jiu" },
  { prefix: "醋", process: "cu" },
  { prefix: "盐", process: "yan" },
  { prefix: "姜", process: "jiang" },
  { prefix: "生", process: "sheng" },
  { prefix: "清", process: "qing" },
  { prefix: "法", process: "fa" },
];

// 从一个药名里读出药材、炮制和来源。收藏列表、导入和以后新加的药都用这一套
export function interpretHerbName(name: string, knownNames: Set<string>) {
  const trimmed = name.trim();
  const processed = splitProcess(trimmed, knownNames);
  const base = matchSourceBase(processed.name, knownNames);

  if (!base) {
    return {
      name: processed.name,
      process: processed.process,
      source: "",
    };
  }

  return {
    name: base,
    process: processed.process,
    source: processed.name,
  };
}

// 收藏和选药看到的清单。同一味药只留一张卡，炮制品和植物来源挂在它下面
export function groupCabinetHerbs(herbs: Herb[]): Herb[] {
  const knownNames = new Set(herbs.map((herb) => herb.name.trim()).filter(Boolean));

  for (const herb of herbs) {
    knownNames.add(splitProcess(herb.name.trim(), knownNames).name);
  }

  const groups = new Map<string, Herb[]>();
  const order: string[] = [];

  for (const herb of herbs) {
    const reading = interpretHerbName(herb.name, knownNames);
    const bucket = groups.get(reading.name);

    if (!bucket) {
      groups.set(reading.name, [herb]);
      order.push(reading.name);
      continue;
    }

    bucket.push(herb);
  }

  return order.map((name) => mergeHerbGroup(name, groups.get(name) ?? [], knownNames));
}

// 拟方上的旧药名如果写成了炙黄芪、蒙古黄芪，药名收成本尊，炮制和来源挪到各自的栏
export function alignFormulaLineName(line: FormulaLine, knownNames: Set<string>): FormulaLine {
  const reading = interpretHerbName(line.name, knownNames);
  const process = line.process || reading.process;
  const source = line.source || reading.source;
  const lineId = line.lineId || line.herbId;

  if (
    line.name === reading.name &&
    line.process === process &&
    line.source === source &&
    line.lineId === lineId
  ) {
    return line;
  }

  return {
    ...line,
    lineId,
    name: reading.name,
    process,
    source,
  };
}

// 先认炮制。明确的前缀直接拆；单字前缀和「炭」要柜里已有这味药
function splitProcess(name: string, knownNames: Set<string>) {
  for (const item of STRONG_PROCESS_PREFIXES) {
    if (!name.startsWith(item.prefix)) {
      continue;
    }

    const rest = name.slice(item.prefix.length);

    if (rest.length >= 2) {
      return { name: rest, process: item.process };
    }
  }

  for (const item of WEAK_PROCESS_PREFIXES) {
    if (!name.startsWith(item.prefix)) {
      continue;
    }

    const rest = name.slice(item.prefix.length);

    if (knownNames.has(rest)) {
      return { name: rest, process: item.process };
    }
  }

  if (name.endsWith("炭")) {
    const rest = name.slice(0, -1);

    if (rest.length >= 2 && knownNames.has(rest)) {
      return { name: rest, process: "tan" as FormulaProcessId };
    }
  }

  return { name, process: "" as FormulaProcessId };
}

// 名字末尾是柜里已有的药，前面至少还有两个字，就当成这种来源。一个字的前缀不并，免得红黄芪并进黄芪
function matchSourceBase(name: string, knownNames: Set<string>) {
  let base = "";

  for (const candidate of knownNames) {
    if (candidate.length < 2 || candidate.length >= name.length) {
      continue;
    }

    if (!name.endsWith(candidate)) {
      continue;
    }

    if (name.length - candidate.length < 2) {
      continue;
    }

    if (candidate.length > base.length) {
      base = candidate;
    }
  }

  return base;
}

// 一组原名收成一张卡。本尊留下，炮制品和植物来源各自带着功效挂到子项
function mergeHerbGroup(canonical: string, items: Herb[], knownNames: Set<string>): Herb {
  const primary = pickPrimary(canonical, items, knownNames);

  // 炮制名、来源名都做成子项。本尊自己的原名如果就是黄芪，不会进这个清单
  const children = dedupeChildren(
    items
      .map((item) => toHerbChild(item, knownNames))
      .filter((child): child is HerbChild => child !== null),
  );

  // 被收进来的编号都留着，旧链接还能打开这张卡
  const mergedIds = unique(items.map((item) => item.id).filter((id) => id !== primary.id));

  // 来源栏只收下植物来源。炙黄芪的炮制不写进这里
  const sources = unique(children.map((child) => child.source).filter((item) => item));

  // 搜索仍能用原名找到这张卡
  const aliases = unique(children.map((child) => child.name).filter((item) => item));

  // 卡上显示本尊的名字。这条如果本身是炮制品，功效留在子项，不抄到本尊
  const parent = asParent(primary, canonical, knownNames);

  return {
    ...parent,
    aliases: aliases.length > 0 ? aliases : undefined,
    sources: sources.length > 0 ? sources : undefined,
    children: children.length > 0 ? children : undefined,
    mergedIds: mergedIds.length > 0 ? mergedIds : undefined,
  };
}

// 先用名字正好是本尊的那条。没有的话，用来源名顶上，因为它和本尊是同一味药
function pickPrimary(canonical: string, items: Herb[], knownNames: Set<string>): Herb {
  const bare = items.find((item) => isBareName(item, canonical, knownNames));

  if (bare) {
    return bare;
  }

  const sourceOnly = items.find((item) => {
    const reading = interpretHerbName(item.name, knownNames);

    return Boolean(reading.source) && !reading.process;
  });

  if (sourceOnly) {
    return sourceOnly;
  }

  return items[0];
}

// 名字和读出来的药材名一样，而且没有炮制、没有来源，才是本尊
function isBareName(item: Herb, canonical: string, knownNames: Set<string>) {
  const reading = interpretHerbName(item.name, knownNames);

  return item.name.trim() === canonical && !reading.process && !reading.source;
}

// 卡上的药名改成本尊。这条如果本身是炮制品，功效留在子项上，不写到本尊身上
function asParent(primary: Herb, canonical: string, knownNames: Set<string>): Herb {
  const reading = interpretHerbName(primary.name, knownNames);
  const bare = isBareName(primary, canonical, knownNames);

  if (bare || !reading.process) {
    return {
      ...primary,
      name: canonical,
    };
  }

  return {
    ...primary,
    name: canonical,
    nature: "",
    meridians: "",
    functions: "",
    indications: "",
  };
}

// 把一条炮制名或来源名收成子项。本尊自己返回空，避免黄芪再挂一个黄芪
function toHerbChild(item: Herb, knownNames: Set<string>): HerbChild | null {
  const reading = interpretHerbName(item.name, knownNames);

  if (!reading.process && !reading.source) {
    return null;
  }

  return {
    id: item.id,
    name: item.name.trim(),
    process: reading.process,
    source: reading.source,
    pinyin: item.pinyin,
    nature: item.nature,
    meridians: item.meridians,
    functions: item.functions,
    indications: item.indications,
  };
}

// 同名又同炮制、同来源的子项只留一条。后一条没有功效时，不覆盖已经有功效的那条
function dedupeChildren(children: HerbChild[]): HerbChild[] {
  const seen = new Map<string, HerbChild>();
  const order: string[] = [];

  for (const child of children) {
    const key = `${child.name}\n${child.process}\n${child.source}`;
    const previous = seen.get(key);

    if (!previous) {
      seen.set(key, child);
      order.push(key);
      continue;
    }

    if (!previous.functions.trim() && child.functions.trim()) {
      seen.set(key, { ...child, id: previous.id });
    }
  }

  return order.flatMap((key) => {
    const child = seen.get(key);

    return child ? [child] : [];
  });
}

function unique(values: string[]) {
  return [...new Set(values)];
}
