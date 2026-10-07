import type { FormulaFootnoteId } from "@/types/formula/FormulaFootnote";
import type { FormulaProcessId } from "@/types/formula/FormulaProcess";
import type { FormulaStandardId } from "@/types/formula/FormulaStandard";

// 拟方里的一行。药名和单位在选药时抄下来，药柜以后改字不会改这行
export interface FormulaLine {
  // lineId 是这一行自己的编号。同一味药炮制或来源不同时可以各占一行
  lineId: string;

  // herbId 是药柜里这味药的编号
  herbId: string;

  // name 是药材名。炮制和来源不写进药名
  name: string;

  // standard 是执行标准。空着表示还没选，可选国标、部颁、省标、企标
  standard: FormulaStandardId;

  // process 是炮制。空着表示不另标，可选生、炒、麸炒、炙、酒制、醋制、盐制、姜制、清、法、煅、炭
  process: FormulaProcessId;

  // source 是这一行选用的植物来源或货品名。空着表示不单标，比如只写黄芪
  source: string;

  // categoryTag 是选药当时的分类标签，只用来认药
  categoryTag: string;

  // unit 是选药当时抄下来的单位，这味药在药柜里改单位后，要重新选一次才会更新
  unit: string;

  // dose 是每一剂的用量。草稿可以空着，开好时必须是大于 0 的数，可以有小数
  dose: string;

  // footnote 是这一味药的煎法，默认无
  footnote: FormulaFootnoteId;
}
