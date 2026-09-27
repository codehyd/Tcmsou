import { useMemo } from "react";

import { HERBS } from "@/data/catalog/herbs";
import type { Herb } from "@/types/herb";

import { useHerbCabinetStore } from "@/store/herb-cabinet/store";

// [状态管理] 药材柜数据源
export function useCabinetHerbs(): Herb[] {
  // 记录默认药材 需要与新导入的药材做区分
  const overrides = useHerbCabinetStore((state) => state.overrides);

  // 导入的药材
  const extraHerbs = useHerbCabinetStore((state) => state.extraHerbs);

  // 合并药材数据 默认药材 + 导入的药材
  return useMemo(() => {
    const builtins = HERBS.map((herb) => overrides[herb.id] ?? herb);

    return [...builtins, ...extraHerbs];
  }, [extraHerbs, overrides]);
}

export { useHerbCabinetStore };
