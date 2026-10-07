import type { Herb } from "@/types/herb";

import { CABINET_IMPORT_KEY } from "@/constants/herb-cabinet";
import {
  EMPTY_IMPORT_STATE,
  type CabinetImportState,
} from "@/data/cabinet/defaults";
import { utils } from "@/utils";
import {
  isHerbRecord,
  normalizeStoredHerb,
} from "@/store/herb-cabinet/normalize";

// 打开药柜存档。没有或读坏了就用空数据，自带药不受影响
export function loadImportState(): CabinetImportState {
  try {
    const parsed = utils.cache.get<CabinetImportState>(
      CABINET_IMPORT_KEY,
      "json",
    );

    if (!parsed || typeof parsed !== "object") {
      return EMPTY_IMPORT_STATE;
    }

    const record = parsed as Partial<CabinetImportState>;
    const extraHerbs = Array.isArray(record.extraHerbs)
      ? record.extraHerbs
          .filter(isHerbRecord)
          .map((herb) =>
            normalizeStoredHerb(
              herb,
              herb.origin === "custom" ? "custom" : "imported",
            ),
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

    return { extraHerbs, overrides };
  } catch {
    return EMPTY_IMPORT_STATE;
  }
}

// 把新药和修订写回浏览器，刷新后还在
export function saveImportState(state: CabinetImportState) {
  utils.cache.set(CABINET_IMPORT_KEY, state, "json");
}
