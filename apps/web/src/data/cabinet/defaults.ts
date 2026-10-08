import type { Herb } from "@/types/herb";

// 药柜存在浏览器里的数据：后加的新药、按编号存放的修订，以及从柜里拿走的自带药
export interface CabinetImportState {
  extraHerbs: Herb[];
  overrides: Record<string, Herb>;

  // 自带药删不掉源数据，编号记在这里，打开药柜时就不再摆出来
  removedIds: string[];
}

// 没有存档或读坏时用的空数据。新药和修订都是空的，自带的药照常摆出
export const EMPTY_IMPORT_STATE: CabinetImportState = {
  extraHerbs: [],
  overrides: {},
  removedIds: [],
};
