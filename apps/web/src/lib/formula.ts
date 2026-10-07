import type { Herb } from "@/types/herb";
import type { FormulaLine, FormulaSheet } from "@/types/formula";

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

// 列表上显示的名字：有药就用前几味药名，没有就叫空拟方
export function formulaTitle(sheet: FormulaSheet) {
  const names = sheet.lines.map((line) => line.name).filter(Boolean);

  if (names.length === 0) {
    return "空拟方";
  }

  if (names.length <= 3) {
    return names.join("、");
  }

  return `${names.slice(0, 3).join("、")}等`;
}

// 从药柜抄一行。单位没写就按克
export function lineFromHerb(herb: Herb): FormulaLine {
  return {
    lineId: `line-${herb.id}-${Date.now().toString(36)}`,
    herbId: herb.id,
    name: herb.name,
    categoryTag: getHerbClassTag(herb),
    unit: herb.unit?.trim() || "克",
    dose: "",
    standard: "",
    process: "",
    source: "",
    footnote: "none",
  };
}
