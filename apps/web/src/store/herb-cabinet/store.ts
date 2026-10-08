import { create } from "zustand";

import { HERBS, createCustomHerb } from "@/data/catalog/herbs";
import { normalizeHerbName } from "@/lib/herb-import";
import type { CustomHerbDraft, Herb } from "@/types/herb";
import type { HerbCabinetState } from "@/store/herb-cabinet/HerbCabinetState";
import { loadImportState, saveImportState } from "@/store/herb-cabinet/storage";

// 把表单上的字写回一味药。归并出来的子项清单不进存档，下次打开再算
function applyDraft(base: Herb, draft: CustomHerbDraft): Herb {
  return {
    ...base,
    name: draft.name.trim(),
    pinyin: draft.pinyin.trim(),
    categoryId: draft.categoryId,
    subclassId: draft.subclassId,
    functions: draft.functions.trim(),
    nature: draft.nature.trim(),
    meridians: draft.meridians.trim(),
    indications: draft.indications.trim(),
    aliases: undefined,
    sources: undefined,
    children: undefined,
    mergedIds: undefined,
  };
}

// 页面通过这个仓库读写药柜。启动时从浏览器读存档
export const useHerbCabinetStore = create<HerbCabinetState>((set, get) => ({
  // 药材数据源
  ...loadImportState(),

  // 用户手写一味新药，追加到新药列表并立刻存盘
  addCustomHerb: (draft) => {
    const herb = createCustomHerb(draft);
    const extraHerbs = [...get().extraHerbs, herb];
    const next = {
      extraHerbs,
      overrides: get().overrides,
      removedIds: get().removedIds ?? [],
    };

    saveImportState(next);
    set(next);

    return herb;
  },

  // 收藏柜里改一味药时调用。自带药留修订，后加的药改原来那一条
  updateHerb: (id, draft) => {
    const extraHerbs = [...get().extraHerbs];
    const index = extraHerbs.findIndex((item) => item.id === id);

    // 后加的药直接改原条，编号和来源不动
    if (index >= 0) {
      extraHerbs[index] = applyDraft(extraHerbs[index], draft);
      const next = {
        extraHerbs,
        overrides: get().overrides,
        removedIds: get().removedIds ?? [],
      };

      saveImportState(next);
      set(next);

      return;
    }

    // 自带药不能改教材原文，把改过的一份按编号存进修订
    const builtin = HERBS.find((item) => item.id === id);
    const current = get().overrides[id] ?? builtin;

    if (!current) {
      return;
    }

    const next = {
      extraHerbs,
      overrides: {
        ...get().overrides,
        [id]: applyDraft({ ...current, origin: "builtin" }, draft),
      },
      removedIds: get().removedIds ?? [],
    };

    saveImportState(next);
    set(next);
  },

  // 收藏柜里删除一味药时调用。自带药记编号，后加的药从清单里拿掉
  removeHerb: (herb) => {
    const ids = new Set([herb.id, ...(herb.mergedIds ?? [])]);
    const extraHerbs = get().extraHerbs.filter((item) => !ids.has(item.id));
    const overrides = { ...get().overrides };
    const removedIds = new Set(get().removedIds ?? []);

    for (const id of ids) {
      delete overrides[id];

      // 只有教材里本来就有的药才要记一笔，否则删了还会被原文摆回来
      if (HERBS.some((item) => item.id === id)) {
        removedIds.add(id);
      }
    }

    const next = {
      extraHerbs,
      overrides,
      removedIds: [...removedIds],
    };

    saveImportState(next);
    set(next);
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

    const next = {
      extraHerbs,
      overrides: nextOverrides,
      removedIds: get().removedIds ?? [],
    };

    saveImportState(next);
    set(next);
  },
}));
