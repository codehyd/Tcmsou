import { useState } from "react";

import { HerbSwitchTile } from "@/rooms/detail/components/HerbSwitchTile";
import { VirtualHerbRows } from "@/rooms/collection/components/VirtualHerbRows";
import { useMatchCount } from "@/lib/use-match-count";
import type { Herb } from "@/types/herb";

// 手机一列，稍宽就两列，和原来的格子同一档宽度
const SWITCH_COLUMNS = [{ query: "(min-width: 40rem)", count: 2 }];

// 右边展柜要的账本：整柜药，以及灯现在打在哪一味
interface HerbSwitchCabinetProps {
  herbs: Herb[];
  activeId: string;
}

// 宽屏右侧换药柜。窄屏改走页面底下那条，这里就先收起来
export function HerbSwitchCabinet({ herbs, activeId }: HerbSwitchCabinetProps) {
  // 等右边这截槽挂上再画小牌。槽还没进页面时去量高度，第一屏会是空的
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const columns = useMatchCount(SWITCH_COLUMNS, 1);

  return (
    <aside className="hidden min-h-0 min-w-0 w-full shrink-0 flex-col border-t border-white/8 bg-dock lg:flex lg:h-full lg:w-[min(42%,34rem)] lg:shrink-0 lg:border-t-0 lg:border-l 3xl:w-[36rem]">
      <div className="flex items-center justify-between gap-3 px-3 py-3 lg:px-4">
        {/* 对标参考图「收藏柜摆放估值」那一行，我们只报本室现货几味 */}
        <h2 className="text-sm text-muted-foreground">本室展柜</h2>

        <p className="text-sm text-intel tabular-nums">{herbs.length} 味</p>
      </div>

      <div
        ref={setScroller}
        className="max-h-[70dvh] min-h-0 flex-1 overflow-y-auto px-3 pb-3 lg:max-h-none lg:px-4"
      >
        {scroller ? (
          <VirtualHerbRows
            items={herbs}
            columns={columns}
            estimateSize={96}
            gap={8}
            scrollElement={scroller}
            pinnedKey={activeId}
            getKey={(herb) => herb.id}
            renderItem={(herb) => (
              <HerbSwitchTile herb={herb} active={herb.id === activeId} />
            )}
          />
        ) : null}
      </div>

      {/* 底栏提醒：3D 还没到，先用 2D 换展；添药走左边那颗按钮 */}
      <p className="border-t border-white/8 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground lg:px-4">
        可在此切换展品。模型到位后，中央展位将换成 3D 陈列。
      </p>
    </aside>
  );
}
