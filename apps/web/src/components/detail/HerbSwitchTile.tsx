import { Link } from "react-router";

import { HerbPlaceholder } from "@/components/collection/HerbPlaceholder";
import { getHerbClassTag } from "@/lib/herb-catalog";
import { cn } from "@/lib/utils";
import type { Herb } from "@/types/herb";

// 右边小卡要知道：这味药是谁、现在灯是不是打在它身上
interface HerbSwitchTileProps {
  herb: Herb;
  active: boolean;
}

// 详情右侧展柜里的一张小牌：点它就把灯换到另一味药
// 像游戏收藏室右边那排格子，换展品不用退出房间
export function HerbSwitchTile({ herb, active }: HerbSwitchTileProps) {
  // 没图时用药名首字撑场面
  const mark = herb.name.slice(0, 1);

  // 小牌上贴二级小类，换展时一眼能分出发散风寒和发散风热
  const classTag = getHerbClassTag(herb);

  return (
    // 整张小牌是门，data-herb-id 给货架用来把当前展品滚进视野
    <Link
      to={`/collection/${herb.id}`}
      data-herb-id={herb.id}
      className={cn(
        "flex min-h-[88px] min-w-0 overflow-hidden rounded-sm border bg-cabinet",
        active
          ? "border-intel/55 ring-1 ring-intel/30"
          : "border-cabinet-border hover:border-white/20",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 p-2.5">
        <h3 className="truncate text-sm text-foreground">{herb.name}</h3>

        <p className="truncate text-xs text-muted-foreground">{classTag}</p>
      </div>

      <div className="flex w-[4.5rem] shrink-0 items-center justify-center p-1.5">
        {herb.image ? (
          <img src={herb.image} alt="" className="h-full w-full object-contain" />
        ) : (
          <HerbPlaceholder mark={mark} />
        )}
      </div>
    </Link>
  );
}
