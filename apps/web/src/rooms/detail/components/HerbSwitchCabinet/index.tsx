import { useEffect, useRef } from "react";

import { HerbSwitchTile } from "@/rooms/detail/components/HerbSwitchTile";
import type { Herb } from "@/types/herb";

// 右边展柜要的账本：整柜药，以及灯现在打在哪一味
interface HerbSwitchCabinetProps {
  herbs: Herb[];
  activeId: string;
}

// 详情右侧中药展柜：用来换展品，不必退回列表再点一次
// 像参考图右边那排收集品格子，点另一格灯就换人
export function HerbSwitchCabinet({ herbs, activeId }: HerbSwitchCabinetProps) {
  // 记住右边货架那截可滚动的槽，换展品时要把亮着的卡滚进视野
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 灯打到哪一味，就把那张卡挪到看得见的地方，像转货架对准当前展品
  useEffect(() => {
    const tile = scrollerRef.current?.querySelector(`[data-herb-id="${activeId}"]`);

    // 找不到卡就不动，免得空滚一下吓人
    if (tile instanceof HTMLElement) {
      tile.scrollIntoView({ block: "nearest" });
    }
  }, [activeId]);

  return (
    <aside className="flex min-h-0 min-w-0 w-full shrink-0 flex-col border-t border-white/8 bg-dock lg:h-full lg:w-[min(42%,34rem)] lg:shrink-0 lg:border-t-0 lg:border-l 3xl:w-[36rem]">
      <div className="flex items-center justify-between gap-3 px-3 py-3 lg:px-4">
        {/* 对标参考图「收藏柜摆放估值」那一行，我们只报本室现货几味 */}
        <h2 className="text-sm text-muted-foreground">本室展柜</h2>

        <p className="text-sm text-intel tabular-nums">{herbs.length} 味</p>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 lg:px-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {herbs.map((herb) => (
            <HerbSwitchTile key={herb.id} herb={herb} active={herb.id === activeId} />
          ))}
        </div>
      </div>

      {/* 底栏提醒：3D 还没到，先用 2D 换展；添药走左边那颗按钮 */}
      <p className="border-t border-white/8 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground lg:px-4">
        可在此切换展品。模型到位后，中央展位将换成 3D 陈列。
      </p>
    </aside>
  );
}
