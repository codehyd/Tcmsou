// 一行药的煎法标记。只允许这些选项，不能手写
export const FORMULA_FOOTNOTES = [
  { id: "none", label: "无" },
  { id: "xian_jian", label: "先煎" },
  { id: "hou_xia", label: "后下" },
  { id: "bao_jian", label: "包煎" },
  { id: "yang_hua", label: "烊化" },
  { id: "chong_fu", label: "冲服" },
  { id: "da_sui", label: "打碎" },
] as const;

// 脚注编号，对应上面每一项的 id
export type FormulaFootnoteId = (typeof FORMULA_FOOTNOTES)[number]["id"];
