// 这一行饮片按哪套标准。空着表示还没选
export const FORMULA_STANDARDS = [
  { id: "guo_biao", label: "国标" },
  { id: "bu_ban", label: "部颁" },
  { id: "sheng_biao", label: "省标" },
  { id: "qi_biao", label: "企标" },
] as const;

// 标准编号。空字符串是默认，表示这一行还没标
export type FormulaStandardId = (typeof FORMULA_STANDARDS)[number]["id"] | "";
