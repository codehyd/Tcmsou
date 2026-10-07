// 这一行饮片的炮制。空着表示方子上不另标，药名按柜里的名字
export const FORMULA_PROCESSES = [
  { id: "sheng", label: "生" },
  { id: "chao", label: "炒" },
  { id: "fu_chao", label: "麸炒" },
  { id: "zhi", label: "炙" },
  { id: "jiu", label: "酒制" },
  { id: "cu", label: "醋制" },
  { id: "yan", label: "盐制" },
  { id: "jiang", label: "姜制" },
  { id: "qing", label: "清" },
  { id: "fa", label: "法" },
  { id: "duan", label: "煅" },
  { id: "tan", label: "炭" },
] as const;

// 炮制编号。空字符串是默认，表示这一行还没标炮制
export type FormulaProcessId = (typeof FORMULA_PROCESSES)[number]["id"] | "";
