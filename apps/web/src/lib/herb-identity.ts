import type { Herb } from "@/types/herb";
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

// 收藏和选药看到的清单。同一味药只留一条，炮制品和来源名并进本尊
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

// 拟方上的旧药名如果写成了炙黄芪、蒙古黄芪，收成药材名，炮制和来源挪到各自的栏
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

// 一组原名收成一条。本尊的功效和编号留下，其余名字记成别名或来源
function mergeHerbGroup(canonical: string, items: Herb[], knownNames: Set<string>): Herb {
  const primary = items.find((item) => item.name.trim() === canonical) ?? items[0];
  const aliases = unique(
    items.map((item) => item.name.trim()).filter((item) => item && item !== canonical),
  );
  const sources = unique(
    items
      .map((item) => interpretHerbName(item.name, knownNames).source)
      .filter((item) => item),
  );
  const mergedIds = items.map((item) => item.id).filter((id) => id !== primary.id);

  return {
    ...primary,
    name: canonical,
    aliases: aliases.length > 0 ? aliases : undefined,
    sources: sources.length > 0 ? sources : undefined,
    mergedIds: mergedIds.length > 0 ? mergedIds : undefined,
  };
}

function unique(values: string[]) {
  return [...new Set(values)];
}
