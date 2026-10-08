import { useMemo } from "react";

import { HERBS } from "@/data/catalog/herbs";
import { groupCabinetHerbs } from "@/lib/herb-identity";
import type { Herb } from "@/types/herb";

import { useHerbCabinetStore } from "@/store/herb-cabinet/store";

// [状态管理] 药材柜数据源
export function useCabinetHerbs(): Herb[] {
  // 记录默认药材 需要与新导入的药材做区分
  const overrides = useHerbCabinetStore((state) => state.overrides);

  // 导入的药材和手写添加的药材
  const extraHerbs = useHerbCabinetStore((state) => state.extraHerbs);

  // 已经从柜里拿走的自带药编号
  const removedIds = useHerbCabinetStore((state) => state.removedIds);

  // 合并药材数据：还留着的自带药 + 后加的药
  return useMemo(() => {
    const removed = new Set(removedIds ?? []);
    const builtins = HERBS.filter((herb) => !removed.has(herb.id)).map(
      (herb) => overrides[herb.id] ?? herb,
    );

    // 炙黄芪挂在黄芪的炮制子项下，蒙古黄芪挂在来源子项下。列表只看到黄芪
    return groupCabinetHerbs([...builtins, ...extraHerbs]);
  }, [extraHerbs, overrides, removedIds]);
}

export { useHerbCabinetStore };
