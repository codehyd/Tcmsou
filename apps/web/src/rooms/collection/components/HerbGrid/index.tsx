import { HerbCard } from "@/rooms/collection/components/HerbCard";
import { VirtualHerbRows } from "@/rooms/collection/components/VirtualHerbRows";
import { herbGrid } from "./styles";
import { useMatchCount } from "@/lib/use-match-count";
import type { Herb } from "@/types/herb";

// 网格要展哪几味药，以及柜体那根已经挂上的滚筒
interface HerbGridProps {
  herbs: Herb[];
  scrollElement: HTMLElement | null;
  // 抽屉打开时要停在哪一张，并滚到它面前
  activeId?: string;
  locateActive?: boolean;
  pinEpoch?: number;
}

// 宽规则写在前面：2560 六列，窄到手机才剩一列，和样式表同一套门槛
const GRID_COLUMNS = [
  { query: "(min-width: 150rem)", count: 6 },
  { query: "(min-width: 120rem)", count: 5 },
  { query: "(min-width: 96rem)", count: 4 },
  { query: "(min-width: 80rem)", count: 3 },
  { query: "(min-width: 40rem)", count: 2 },
];

// 把拣出来的药摊成收藏柜；窄屏一列，越宽列越多
// 几千味不能一次全画，只画滚进眼前的那几排
export function HerbGrid({
  herbs,
  scrollElement,
  activeId,
  locateActive = false,
  pinEpoch = 0,
}: HerbGridProps) {
  const columns = useMatchCount(GRID_COLUMNS, 1);

  // 搜空了就别摆空柜，直接告诉人没这味药
  if (herbs.length === 0) {
    return <div className={herbGrid.empty()}>没有找到对应中药</div>;
  }

  return (
    <VirtualHerbRows
      items={herbs}
      columns={columns}
      estimateSize={176}
      gap={12}
      scrollElement={scrollElement}
      pinnedKey={locateActive ? activeId : undefined}
      pinAlways={locateActive}
      pinEpoch={pinEpoch}
      getKey={(herb) => herb.id}
      renderItem={(herb) => <HerbCard herb={herb} active={herb.id === activeId} />}
    />
  );
}
