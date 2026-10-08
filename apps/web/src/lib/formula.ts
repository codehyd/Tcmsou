import type { Herb, HerbChild } from "@/types/herb";
import {
  FORMULA_PROCESSES,
  type FormulaLine,
  type FormulaProcessId,
  type FormulaSheet,
} from "@/types/formula";

import { getHerbClassTag } from "@/lib/herb-catalog";

// 剂量是否已经写成大于 0 的数。10 和 10.5 都可以，空的、0、字母不行
export function isFilledDose(dose: string) {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(dose.trim()) && Number(dose) > 0;
}

// 剂数是否是正整数
export function isFilledDoseCount(doseCount: string) {
  return /^[1-9]\d*$/.test(doseCount.trim());
}

// 每一行都有剂量，并且写了共几剂，才算开好。否则还是草稿
export function isFormulaReady(sheet: FormulaSheet) {
  if (!isFilledDoseCount(sheet.doseCount) || sheet.lines.length === 0) {
    return false;
  }

  return sheet.lines.every((line) => isFilledDose(line.dose));
}

// 拟方格子里的药名。选了植物来源就写在药名后面，黄芪 (蒙古黄芪)；没选来源就只写黄芪
export function formulaHerbName(line: Pick<FormulaLine, "name" | "source">) {
  const source = line.source.trim();

  if (!source) {
    return line.name;
  }

  return `${line.name} (${source})`;
}

// 列表上这一行怎么称呼。来源写在药名括号里，炮制再接在后面
function formulaLineLabel(line: FormulaLine) {
  const titled = formulaHerbName(line);

  // 炮制没选时，列表上只写药名，来源已经在药名里
  const process = FORMULA_PROCESSES.find((item) => item.id === line.process)?.label ?? "";

  if (!process) {
    return titled;
  }

  // 选了炮制就再写一层，方子列表上才能看出这行是炙过的
  return `${titled}（${process}）`;
}

// 点药名重新选药时调用。同一味药只改这次点到的炮制或来源；换成另一味药则按新药重写
export function applyHerbPickToLine(line: FormulaLine, herb: Herb, child?: HerbChild): FormulaLine {
  // 还是不是这一味。换成别的药时，不把上一味的炮制和来源带过去
  const sameHerb = line.herbId === herb.id;

  // 点了炙黄芪这类才改炮制。同一味药没点到炮制时，炮制列原来的值留着
  let process: FormulaProcessId = "";

  if (child?.process) {
    process = child.process;
  } else if (sameHerb) {
    process = line.process;
  }

  // 点本尊就清掉来源，药名只剩黄芪。点蒙古黄芪才写来源；同一味药只改炮制时，来源留着
  let source = "";

  if (child?.source) {
    source = child.source;
  } else if (child && sameHerb) {
    source = line.source;
  }

  return {
    ...line,
    herbId: herb.id,
    name: herb.name,
    categoryTag: getHerbClassTag(herb),
    unit: herb.unit?.trim() || "克",
    process,
    source,
  };
}

// 列表上显示的名字：有药就用前几味药名，没有就叫空拟方
export function formulaTitle(sheet: FormulaSheet) {
  const names = sheet.lines.map((line) => formulaLineLabel(line)).filter(Boolean);

  if (names.length === 0) {
    return "空拟方";
  }

  if (names.length <= 3) {
    return names.join("、");
  }

  return `${names.slice(0, 3).join("、")}等`;
}

// 从药柜抄一行。选本尊时炮制和来源都空着；选子项时把炮制或来源带上。单位没写就按克
export function lineFromHerb(
  herb: Herb,
  pick?: { process?: FormulaProcessId; source?: string; lineKey?: string },
): FormulaLine {
  // 子项才带炮制和来源。没传就当选的是本尊
  const process = pick?.process ?? "";
  const source = pick?.source ?? "";

  return {
    lineId: `line-${herb.id}-${pick?.lineKey ?? "base"}-${Date.now().toString(36)}`,
    herbId: herb.id,
    name: herb.name,
    categoryTag: getHerbClassTag(herb),
    unit: herb.unit?.trim() || "克",
    dose: "",
    standard: "",
    process,
    source,
    footnote: "none",
  };
}
