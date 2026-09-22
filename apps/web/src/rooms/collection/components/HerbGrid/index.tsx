import { HerbCard } from "@/rooms/collection/components/HerbCard";
import { herbGrid } from "./styles";
import type { Herb } from "@/types/herb";

// 网格要展哪几味药，过滤后的清单从收藏柜递进来
interface HerbGridProps {
  herbs: Herb[];
}

// 把拣出来的药摊成收藏柜；窄屏一列，越宽列越多，2560 上六列才跟货牌差不多大
// 搜不到时给一句空话，免得空白墙让人以为坏了
export function HerbGrid({ herbs }: HerbGridProps) {
  // 搜空了就别摆空柜，直接告诉人没这味药
  if (herbs.length === 0) {
    return (
      <div className={herbGrid.empty()}>
        没有找到对应中药
      </div>
    );
  }

  return (
    <div className={herbGrid.grid()}>
      {herbs.map((herb) => (
        <HerbCard key={herb.id} herb={herb} />
      ))}
    </div>
  );
}