import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// 虚拟货架要的账：整叠货、一排几张、往哪只滚筒里看
interface VirtualHerbRowsProps<T> {
  items: T[];
  columns: number;
  estimateSize: number;
  gap: number;
  // 滚筒本身。没挂上 DOM 之前不要开画，否则窗口高度是 0，第一屏会空着
  scrollElement: HTMLElement | null;
  // 当前亮着的那张。宽屏换展时把它滚进窗口；没传就只负责往下翻
  pinnedKey?: string;
  // 抽屉里也要滚到当前药。窄屏详情柜自己不滚，靠这面旗子单独放行
  pinAlways?: boolean;
  pinEpoch?: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

// 长货架只画眼前这几排，下面没滚到的先空着，像只打开这一页账
// 整柜都画出来时，几千张卡会把页面拖卡
export function VirtualHerbRows<T>({
  items,
  columns,
  estimateSize,
  gap,
  scrollElement,
  pinnedKey,
  pinAlways = false,
  pinEpoch = 0,
  getKey,
  renderItem,
}: VirtualHerbRowsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  // 货架不一定贴在滚筒顶上，上面还有搜索条。记下这段空当，滚动条才对得准
  const [scrollMargin, setScrollMargin] = useState(0);

  const safeColumns = Math.max(1, columns);
  const rowCount = Math.ceil(items.length / safeColumns);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !scrollElement) {
      return;
    }

    // 用滚筒里的真实起点，而不是离页面顶的距离，上面的搜索条才不会把排次算错
    const top =
      list.getBoundingClientRect().top -
      scrollElement.getBoundingClientRect().top +
      scrollElement.scrollTop;

    setScrollMargin(top);
  }, [scrollElement, safeColumns, items.length]);

  // 只准备窗口里看得到的排，多备几排免得快滑时露白
  // 开画那一下就用滚筒现在的高，别先按 0 算成「一排都看不见」
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan: 6,
    gap,
    scrollMargin,
    initialRect: {
      width: scrollElement?.clientWidth ?? 0,
      height: scrollElement?.clientHeight ?? 0,
    },
  });

  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  const pinnedIndex = pinnedKey ? items.findIndex((item) => getKey(item) === pinnedKey) : -1;

  // 抽屉每次打开都要把当前这味滚到窗口中间；详情右侧货架只在宽屏跟过去
  useEffect(() => {
    if (pinnedIndex < 0) {
      return;
    }

    if (!pinAlways && window.matchMedia("(max-width: 1023px)").matches) {
      return;
    }

    const rowIndex = Math.floor(pinnedIndex / safeColumns);
    const align = pinAlways ? "center" : "auto";

    virtualizerRef.current.scrollToIndex(rowIndex, { align });

    if (!pinAlways) {
      return;
    }

    // 抽屉刚滑上来时高度可能还没稳住，下一帧再对一次，像货架灯亮了再把那一格推到眼前
    const frame = requestAnimationFrame(() => {
      virtualizerRef.current.scrollToIndex(rowIndex, { align: "center" });
    });

    return () => cancelAnimationFrame(frame);
  }, [pinnedIndex, safeColumns, pinAlways, pinEpoch]);

  return (
    <div ref={listRef} className="w-full min-w-0">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * safeColumns;
          const rowItems = items.slice(start, start + safeColumns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 grid w-full"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
                columnGap: gap,
              }}
            >
              {rowItems.map((item) => (
                <div key={getKey(item)} className="min-w-0">
                  {renderItem(item)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
