import { useEffect, useState } from "react";

import { CategoryChipBar } from "@/rooms/collection/components/CategoryChipBar";
import { CollectionSelect } from "@/rooms/collection/components/CollectionSelect";
import { CollectionToolbar } from "@/rooms/collection/components/CollectionToolbar";
import { HerbGrid } from "@/rooms/collection/components/HerbGrid";
import { cabinet } from "./styles";
import type { CategoryFilterId, Herb, HerbCategory, HerbSort } from "@/types/herb";

// 右边收藏柜要的操作纸：搜什么、哪一类、怎么排，以及滤完后的药
interface CollectionCabinetProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  categoryId: CategoryFilterId;
  onCategoryChange: (id: CategoryFilterId) => void;
  categories: HerbCategory[];
  sort: HerbSort;
  onSortChange: (sort: HerbSort) => void;
  herbs: Herb[];
  allCount: number;
  countsByCategory: Record<string, number>;
}

// 右侧主舞台：搜索、分类签、收藏柜网格都在这一列里滚
// 分类签吸在滚动容器顶上，手指往下划时还能换柜门，不用先滑回楼顶
export function CollectionCabinet({
  keyword,
  onKeywordChange,
  categoryId,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
  herbs,
  allCount,
  countsByCategory,
}: CollectionCabinetProps) {
  // 柜体自己是滚动盒子。等这根滚筒挂上 DOM 再画药卡，否则虚拟列表会以为窗口高度是 0
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  // 窄屏把排序放在「收藏柜」标题右侧，避免和分类标签挤在同一行
  const sortItems = [
    { label: "默认排序", value: "default" as HerbSort },
    { label: "名称 A–Z", value: "name" as HerbSort },
  ];

  // 换分类就把列表拽回顶，免得还停在上一柜滚到一半的位置
  useEffect(() => {
    scroller?.scrollTo({ top: 0 });
  }, [categoryId, scroller]);

  return (
    <main ref={setScroller} className={cabinet.scroller()}>
      {/* 搜索先跟着列表走，窄屏划走后把屏幕留给药卡；大屏连同下拉一起钉住 */}
      <div className={cabinet.toolbarDock()}>
        <CollectionToolbar
          keyword={keyword}
          onKeywordChange={onKeywordChange}
          categoryId={categoryId}
          onCategoryChange={onCategoryChange}
          categories={categories}
          sort={sort}
          onSortChange={onSortChange}
        />
      </div>

      {/* 窄屏分类签吸顶：像奶茶店菜单条，划到一半换「果茶」不用先回到门口 */}
      <div className={cabinet.chipDock()}>
        <CategoryChipBar
          selectedId={categoryId}
          onSelect={onCategoryChange}
          categories={categories}
          allCount={allCount}
          countsByCategory={countsByCategory}
        />
      </div>

      <div className={cabinet.headingRow()}>
        {/* 柜区标题，对应参考图里的「收藏柜」三个字 */}
        <h2 className={cabinet.heading()}>收藏柜</h2>

        {/* 窄屏把排序放标题右侧，宽按字数自己长，避免固定宽把「默认排序」切成「默认」 */}
        <div className={cabinet.mobileSort()}>
          <CollectionSelect
            value={sort}
            items={sortItems}
            triggerClassName="h-8 w-auto max-w-[9rem] rounded-sm bg-white/5 text-xs"
            onChange={onSortChange}
          />
        </div>
      </div>

      {scroller ? <HerbGrid herbs={herbs} scrollElement={scroller} /> : null}
    </main>
  );
}
