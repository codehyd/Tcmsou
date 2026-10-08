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

// 剂数、付数、一次几剂是否是大于 0 的数。整数和小数都可以，空的、0、字母不行
function readPositive(value: string) {
  const text = value.trim();

  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text) || Number(text) <= 0) {
    return null;
  }

  return Number(text);
}

// 算出的剂数、次数、天数写到下面那一句。整数不带小数点，其余最多留两位
function formatCourseNumber(value: number) {
  const rounded = Math.round(value * 100) / 100;

  if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
    return String(Math.round(rounded));
  }

  return String(rounded);
}

// 工具条下面那一句。付数就是可服几天；付数乘一日几剂是一共多少剂；一日几剂除以一次几剂是一天几次
export function formulaCourseHint(sheet: Pick<FormulaSheet, "doseCount" | "dailyDoses" | "doseEach">) {
  const days = readPositive(sheet.doseCount);
  const perDay = readPositive(sheet.dailyDoses ?? "");
  const each = readPositive(sheet.doseEach ?? "");
  const parts: string[] = [];

  // 一共多少剂。两栏都写成大于 0 的数才乘
  if (days != null && perDay != null) {
    parts.push(`一共 ${formatCourseNumber(days * perDay)} 剂`);
  }

  // 一天吃几次。一次几剂空着就不写
  if (perDay != null && each != null) {
    parts.push(`一天 ${formatCourseNumber(perDay / each)} 次`);
  }

  // 几付就是几天
  if (days != null) {
    parts.push(`可服 ${formatCourseNumber(days)} 天`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `${parts.join("，")}。`;
}

// 付数是否是正整数。保存共几付时用，7 可以，7.5 不行
export function isFilledDoseCount(doseCount: string) {
  return /^[1-9]\d*$/.test(doseCount.trim());
}

// 每一行都有剂量，写了共几付，并且有处方名，才允许点「保存」。草稿不看这个
export function isFormulaReady(sheet: FormulaSheet) {
  if (!(sheet.name ?? "").trim() || !isFilledDoseCount(sheet.doseCount) || sheet.lines.length === 0) {
    return false;
  }

  return sheet.lines.every((line) => isFilledDose(line.dose));
}

// 点「保存」前调用。缺处方名、药、剂数或某一味的剂量时，返回页面上要显示的那句；齐了就没有这句话
export function formulaSaveBlockReason(sheet: FormulaSheet) {
  if (!(sheet.name ?? "").trim()) {
    return "保存要先写处方名。";
  }

  if (sheet.lines.length === 0) {
    return "还没有药，先添进行再保存。";
  }

  if (!isFilledDoseCount(sheet.doseCount)) {
    return "共几付要写成大于 0 的整数，才能保存。";
  }

  if (sheet.lines.some((line) => !isFilledDose(line.dose))) {
    return "每一味都要写上剂量，才能保存。";
  }

  return null;
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

// 改已有的一行时调用。剂量留下，脚注、标准、炮制、来源先回到新开一行的空值，再按这次点到的本尊或子项写上
export function applyHerbPickToLine(line: FormulaLine, herb: Herb, child?: HerbChild): FormulaLine {
  // 先按这次选中的药排一行。本尊的炮制和来源是空的，子项才带上炙或蒙古黄芪
  const fresh = lineFromHerb(herb, {
    process: child?.process ?? "",
    source: child?.source ?? "",
    lineKey: child?.id ?? "base",
  });

  return {
    ...fresh,

    // 还是这一行，编号不能换，否则剂量输入框对不上
    lineId: line.lineId,

    // 已经写过的用量留着，重新选药不把克数清掉
    dose: line.dose,
  };
}

// 列表卡片上的称呼。写了处方名就用处方名，没写就用前几味药，一味都没有叫空拟方
export function formulaTitle(sheet: FormulaSheet) {
  const named = (sheet.name ?? "").trim();

  if (named) {
    return named;
  }

  return formulaComposition(sheet);
}

// 用前几味药拼一行，写了处方名时放在标题下面
export function formulaComposition(sheet: FormulaSheet) {
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
