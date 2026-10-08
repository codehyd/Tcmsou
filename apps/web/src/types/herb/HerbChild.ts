import type { FormulaProcessId } from "@/types/formula";

// 挂在一味药下面的子项。炮制品和植物来源都留在父味药下，不另开一张柜卡
export interface HerbChild {
  // 子项原来那一条的编号。旧链接打开时回到父味药
  id: string;

  // 子项原名，比如炙黄芪、蒙古黄芪。拟方选中后药名仍用父味药
  name: string;

  // 炮制。植物来源子项这里空着；选中后写进拟方的炮制栏
  process: FormulaProcessId;

  // 植物来源或货品名。纯炮制子项这里空着；选中后写进拟方的来源栏
  source: string;

  // 子项自己的拼音。柜卡和搜索靠它，不拿父味药的拼音顶上
  pinyin: string;

  // 子项自己的性味。炙黄芪和黄芪可以不同
  nature: string;

  // 子项自己的归经
  meridians: string;

  // 子项自己的功效。炮制不同时功效留在这里，不写进父味药
  functions: string;

  // 子项自己的主治
  indications: string;
}
