import type { Herb } from "@/types/herb";

// 药柜存在浏览器里的两份数据：后加的新药，以及按药材编号存放的修订
export interface CabinetImportState {
  extraHerbs: Herb[];
  overrides: Record<string, Herb>;
}

// 没有存档或读坏时用的空数据。新药和修订都是空的，自带的 30 味不在这里
export const EMPTY_IMPORT_STATE: CabinetImportState = {
  extraHerbs: [],
  overrides: {},
};
