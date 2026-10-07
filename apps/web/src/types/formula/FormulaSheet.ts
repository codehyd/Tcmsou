import type { FormulaLine } from "@/types/formula/FormulaLine";

// 一张拟方。同一张可以反复打开，在上面加药、改剂量
export interface FormulaSheet {
  // id 是这张拟方的编号
  id: string;

  // createdAt、updatedAt 是创建和最后修改时间，ISO 字符串
  createdAt: string;
  updatedAt: string;

  // doseCount 是共几剂。草稿可以空着
  doseCount: string;

  // usage 是整张方怎么用，例如水煎服，日一剂。和每一行的脚注不是一回事
  usage: string;

  // lines 是方里的药，顺序就是表上的顺序
  lines: FormulaLine[];
}
