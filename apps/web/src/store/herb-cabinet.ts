import { useMemo } from "react";
import { create } from "zustand";

import { getSubclassesByCategory } from "@/data/categories";
import { createCustomHerb, getDefaultSubclassId, HERBS } from "@/data/herbs";
import { normalizeHerbName } from "@/lib/herb-import";
import type { CustomHerbDraft, Herb, HerbCategoryId, HerbSubclassId } from "@/types/herb";

// 旧本子只记自添；新本子还要记下药包新货和对典籍的修订
const CUSTOM_HERBS_KEY = "tcmsou.custom-herbs";
const CABINET_IMPORT_KEY = "tcmsou.cabinet-import-v1";

// 药柜活页：新药另起抽屉，修订盖在教材册对应页上
interface CabinetImportState {
  extraHerbs: Herb[];
  overrides: Record<string, Herb>;
}

// 空活页：刚开馆时只有教材册
const EMPTY_IMPORT_STATE: CabinetImportState = {
  extraHerbs: [],
  overrides: {},
};

// 核对二级小类是不是挂在这扇柜门上；旧本子缺节或挂错就退回该章第一格
function resolveSubclassId(
  categoryId: HerbCategoryId,
  subclassId: unknown,
): HerbSubclassId {
  const belongsHere = getSubclassesByCategory(categoryId).some(
    (subclass) => subclass.id === subclassId,
  );

  if (belongsHere) {
    return subclassId as HerbSubclassId;
  }

  return getDefaultSubclassId(categoryId);
}

// 粗认一张药牌：至少有编号和药名，才让它上台
function isHerbRecord(value: unknown): value is Herb {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Herb>;

  return typeof record.id === "string" && typeof record.name === "string";
}

// 把读出来的药牌补栏目：缺的填空，节对不上章就改回默认节
function normalizeStoredHerb(record: Herb, origin: Herb["origin"]): Herb {
  const categoryId = record.categoryId ?? "bu_xu";

  return {
    ...record,
    nature: record.nature ?? "",
    meridians: record.meridians ?? "",
    functions: record.functions ?? "",
    indications: record.indications ?? "",
    pinyin: record.pinyin ?? "",
    categoryId,
    subclassId: resolveSubclassId(categoryId, record.subclassId),
    image: record.image ?? null,
    origin: record.origin ?? origin,
    // 旧账本没有出处就空着；有名字才留下，网址必须是网页，避免脏数据点出去
    source:
      record.origin === "builtin" || !record.source?.label
        ? undefined
        : {
            label: record.source.label,
            url:
              typeof record.source.url === "string" && /^https?:\/\//i.test(record.source.url)
                ? record.source.url
                : undefined,
          },
  };
}

// 从旧抽屉把自添药读出来，给新账本当第一批活页
function loadLegacyCustomHerbs(): Herb[] {
  try {
    const raw = localStorage.getItem(CUSTOM_HERBS_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHerbRecord).map((record) => normalizeStoredHerb(record, "custom"));
  } catch {
    return [];
  }
}

// 打开活页账本；本子坏了就当没进过货，教材册还在
function loadImportState(): CabinetImportState {
  try {
    const raw = localStorage.getItem(CABINET_IMPORT_KEY);

    if (!raw) {
      return {
        extraHerbs: loadLegacyCustomHerbs(),
        overrides: {},
      };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return EMPTY_IMPORT_STATE;
    }

    const record = parsed as Partial<CabinetImportState>;
    const extraHerbs = Array.isArray(record.extraHerbs)
      ? record.extraHerbs.filter(isHerbRecord).map((herb) =>
          normalizeStoredHerb(herb, herb.origin === "custom" ? "custom" : "imported"),
        )
      : [];

    const overrides: Record<string, Herb> = {};

    if (record.overrides && typeof record.overrides === "object") {
      for (const [id, herb] of Object.entries(record.overrides)) {
        if (isHerbRecord(herb)) {
          overrides[id] = normalizeStoredHerb(herb, "builtin");
        }
      }
    }

    if (extraHerbs.length === 0) {
      extraHerbs.push(...loadLegacyCustomHerbs());
    }

    return { extraHerbs, overrides };
  } catch {
    return EMPTY_IMPORT_STATE;
  }
}

// 把活页写回小本本，刷新后货还在
function saveImportState(state: CabinetImportState) {
  localStorage.setItem(CABINET_IMPORT_KEY, JSON.stringify(state));
}

// 药柜账本：教材册是印好的，药包和自添记在活页里
interface HerbCabinetState extends CabinetImportState {
  addCustomHerb: (draft: CustomHerbDraft) => Herb;
  applyHerbImport: (payload: { extras: Herb[]; overrides: Herb[] }) => void;
}

export const useHerbCabinetStore = create<HerbCabinetState>((set, get) => ({
  ...loadImportState(),

  addCustomHerb: (draft) => {
    const herb = createCustomHerb(draft);
    const extraHerbs = [...get().extraHerbs, herb];
    const next = { extraHerbs, overrides: get().overrides };

    saveImportState(next);
    set(next);

    return herb;
  },

  // 审查勾完后入柜：新药进活页，撞名的教材则盖修订章
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

// 页面要看的完整货架：教材册先盖修订，再接药包和自添
export function useCabinetHerbs(): Herb[] {
  const extraHerbs = useHerbCabinetStore((state) => state.extraHerbs);
  const overrides = useHerbCabinetStore((state) => state.overrides);

  return useMemo(() => {
    const builtins = HERBS.map((herb) => overrides[herb.id] ?? herb);

    return [...builtins, ...extraHerbs];
  }, [extraHerbs, overrides]);
}
