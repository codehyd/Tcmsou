import { create } from "zustand";

import { createCustomHerb } from "@/data/catalog/herbs";
import { normalizeHerbName } from "@/lib/herb-import";
import type { HerbCabinetState } from "@/store/herb-cabinet/HerbCabinetState";
import { loadImportState, saveImportState } from "@/store/herb-cabinet/storage";

// 页面通过这个仓库读写药柜。启动时从浏览器读存档
export const useHerbCabinetStore = create<HerbCabinetState>((set, get) => ({
  // 药材数据源
  ...loadImportState(),

  // 用户手写一味新药，追加到新药列表并立刻存盘
  addCustomHerb: (draft) => {
    const herb = createCustomHerb(draft);
    const extraHerbs = [...get().extraHerbs, herb];
    const next = { extraHerbs, overrides: get().overrides };

    saveImportState(next);
    set(next);

    return herb;
  },

  // 导入确认后写入。同名新药保留原来的编号和来源；教材册修订按药材编号覆盖
  applyHerbImport: ({ extras, overrides }) => {
    const extraHerbs = [...get().extraHerbs];
    const nextOverrides = { ...get().overrides };

    for (const herb of extras) {
      const index = extraHerbs.findIndex(
        (item) => normalizeHerbName(item.name) === normalizeHerbName(herb.name),
      );

      if (index >= 0) {
        extraHerbs[index] = {
          ...herb,
          id: extraHerbs[index].id,
          origin: extraHerbs[index].origin,
        };
      } else {
        extraHerbs.push(herb);
      }
    }

    for (const herb of overrides) {
      nextOverrides[herb.id] = herb;
    }

    const next = { extraHerbs, overrides: nextOverrides };

    saveImportState(next);
    set(next);
  },
}));
