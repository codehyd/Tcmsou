import { create } from "zustand";

import type { FormulaSheet } from "@/types/formula";

import { loadFormulaSheets, saveFormulaSheets } from "./storage";

// 拟方列表和改一张方的方法。数据在浏览器里，刷新还在
interface FormulaState {
  sheets: FormulaSheet[];
  createSheet: () => FormulaSheet;
  updateSheet: (id: string, change: (sheet: FormulaSheet) => FormulaSheet) => void;
  deleteSheet: (id: string) => void;
}

// 新开一张空的，先记成草稿
function createEmptySheet(): FormulaSheet {
  const now = new Date().toISOString();

  return {
    id: `formula-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
    doseCount: "",
    usage: "",
    lines: [],
  };
}

export const useFormulaStore = create<FormulaState>((set, get) => ({
  sheets: loadFormulaSheets(),

  // 列表页点新开时调用。空方插到最前，并立刻写入浏览器
  createSheet: () => {
    const sheet = createEmptySheet();
    const sheets = [sheet, ...get().sheets];

    saveFormulaSheets(sheets);
    set({ sheets });

    return sheet;
  },

  // 编辑页每改一处就调用。先读这张方现在的内容再改，避免两次连着改互相盖掉
  updateSheet: (id, change) => {
    const sheets = get().sheets.map((item) => {
      if (item.id !== id) {
        return item;
      }

      return {
        ...change(item),
        id: item.id,
        updatedAt: new Date().toISOString(),
      };
    });

    saveFormulaSheets(sheets);
    set({ sheets });
  },

  // 列表或编辑页点删除时调用。从列表拿掉后写回浏览器
  deleteSheet: (id) => {
    const sheets = get().sheets.filter((item) => item.id !== id);

    saveFormulaSheets(sheets);
    set({ sheets });
  },
}));
