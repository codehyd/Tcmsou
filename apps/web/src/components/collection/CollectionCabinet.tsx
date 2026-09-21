import { useEffect, useRef } from "react";

import { CategoryChipBar } from "@/components/collection/CategoryChipBar";
import { CollectionSelect } from "@/components/collection/CollectionSelect";
import { CollectionToolbar } from "@/components/collection/CollectionToolbar";
import { HerbGrid } from "@/components/collection/HerbGrid";
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
  // 柜体自己是滚动盒子，换柜门时要回到顶，像翻到新抽屉先从第一格看
  const scrollerRef = useRef<HTMLElement>(null);

  // 窄屏把排序放在「收藏柜」标题右侧，避免和分类标签挤在同一行
  const sortItems = [
    { label: "默认排序", value: "default" as HerbSort },
    { label: "名称 A–Z", value: "name" as HerbSort },
  ];

  // 换分类就把列表拽回顶，免得还停在上一柜滚到一半的位置
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [categoryId]);

  return (
    <main
      ref={scrollerRef}
      className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto bg-background pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] md:pr-[max(1.25rem,env(safe-area-inset-right))] md:pl-[max(1.25rem,env(safe-area-inset-left))] 2xl:pr-[max(2rem,env(safe-area-inset-right))] 2xl:pl-[max(2rem,env(safe-area-inset-left))] 3xl:pr-[max(2.5rem,env(safe-area-inset-right))] 3xl:pl-[max(2.5rem,env(safe-area-inset-left))]"
    >
      {/* 搜索先跟着列表走，窄屏划走后把屏幕留给药卡；大屏连同下拉一起钉住 */}
      <div className="pt-3 md:pt-4 lg:sticky lg:top-0 lg:z-20 lg:bg-background lg:pb-1 2xl:pt-5">
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
      <div className="sticky top-0 z-20 border-b border-white/8 bg-background pt-2 pb-2 shadow-[0_10px_16px_-12px_oklch(0_0_0_/_0.55)] lg:hidden">
        <CategoryChipBar
          selectedId={categoryId}
          onSelect={onCategoryChange}
          categories={categories}
          allCount={allCount}
          countsByCategory={countsByCategory}
        />
      </div>

      <div className="mt-3 mb-3 flex min-w-0 items-center justify-between gap-2 lg:mt-4 2xl:mt-5 2xl:mb-4">
        {/* 柜区标题，对应参考图里的「收藏柜」三个字 */}
        <h2 className="min-w-0 shrink-0 text-sm text-muted-foreground">收藏柜</h2>

        {/* 窄屏把排序放标题右侧，宽按字数自己长，避免固定宽把「默认排序」切成「默认」 */}
        <div className="min-w-0 shrink-0 lg:hidden">
          <CollectionSelect
            value={sort}
            items={sortItems}
            triggerClassName="h-8 w-auto max-w-[9rem] rounded-sm bg-white/5 text-xs"
            onChange={onSortChange}
          />
        </div>
      </div>

      <HerbGrid herbs={herbs} />
    </main>
  );
}
