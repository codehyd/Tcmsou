import type { CabinetImportState } from "@/data/cabinet/defaults";
import type { CustomHerbDraft, Herb } from "@/types/herb";

// 药柜状态：存档里的新药和修订，加上写入这两份数据的方法
export interface HerbCabinetState extends CabinetImportState {
  // 手写添加一味新药，写入新药列表
  addCustomHerb: (draft: CustomHerbDraft) => Herb;

  // 导入确认后写入。新药进新药列表，和自带药重名的进替换表
  applyHerbImport: (payload: { extras: Herb[]; overrides: Herb[] }) => void;
}
