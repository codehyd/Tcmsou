import type { FormulaLine } from "@/types/formula/FormulaLine";

// 这张方上次按哪个按钮记下的。草稿可以不齐，已保存表示当时剂数和剂量都写好了
export type FormulaSheetStatus = "draft" | "saved";

// 一张拟方。同一张可以反复打开，在上面加药、改剂量
export interface FormulaSheet {
  // id 是这张拟方的编号
  id: string;

  // createdAt、updatedAt 是创建和最后修改时间，ISO 字符串
  createdAt: string;
  updatedAt: string;

  // doseCount 是一共几付。一付按一天算，所以几付就是可服几天。草稿可以空着，保存时必须是大于 0 的整数
  doseCount: string;

  // dailyDoses 是一日几剂。和共几付相乘，得到一共多少剂。空着就不算一共几剂
  dailyDoses: string;

  // doseEach 是一次几剂。一日几剂除以它，得到一天吃几次。空着就不算次数
  doseEach: string;

  // name 是处方名，例如桂枝汤。草稿可以空着，点「保存」时必须写
  name: string;

  // usage 是整张方怎么用，例如水煎服，日一剂。和每一行的脚注不是一回事
  usage: string;

  // status 是保存状态。改药、改剂量会回到草稿，要点「保存」才变成已保存
  status: FormulaSheetStatus;

  // lines 是方里的药，顺序就是表上的顺序
  lines: FormulaLine[];
}
