import { useMemo, useState } from "react";

import { CategorySidebar } from "@/components/collection/CategorySidebar";
import { CollectionCabinet } from "@/components/collection/CollectionCabinet";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { CollectionNavRail } from "@/components/collection/CollectionNavRail";
import { ImportHerbDialog } from "@/components/collection/ImportHerbDialog";
import {
  countAllHerbs,
  countHerbsByCategory,
  filterHerbs,
  getVisibleHerbCategories,
} from "@/lib/herb-catalog";
import { buildHerbPackFromCabinet, downloadHerbPackFile } from "@/lib/herb-import";
import { useCabinetHerbs } from "@/store/herb-cabinet";
import { ALL_CATEGORY_ID, type CategoryFilterId, type HerbSort } from "@/types/herb";

// 收藏室首页：只负责记状态，把顶栏、导航、分类、柜体这些积木拼起来
// 具体长什么样交给各个组件，这里不堆大段 HTML，方便以后接 AI 补药也不改布局
export function CollectionRoomPage() {
  // 教材册加上用户自添的药，列表和计数都看这一份
  const herbs = useCabinetHerbs();

  // 功效分类柜门，侧边栏和下拉共用这一份，免得两套目录打架
  const categories = useMemo(() => getVisibleHerbCategories(herbs), [herbs]);

  // 记下用户点了哪一类，没点就当逛全部，像先站在库房门口
  const [categoryId, setCategoryId] = useState<CategoryFilterId>(ALL_CATEGORY_ID);

  // 记下搜索框里的字，列表靠它筛，空着就不过滤
  const [keyword, setKeyword] = useState("");

  // 记下排队方式：默认按柜门，名称则按药名点名
  const [sort, setSort] = useState<HerbSort>("default");

  // 药包窗开没开，像库房侧门的插销；关掉就不挡货架
  const [importOpen, setImportOpen] = useState(false);

  // 顶栏和「全部」那一行要报的现货数，不是「收齐了」的分数
  const allCount = useMemo(() => countAllHerbs(herbs), [herbs]);

  // 每个柜门现货几味，不受搜索影响，像库存标签钉在抽屉上
  const countsByCategory = useMemo(() => countHerbsByCategory(herbs), [herbs]);

  // 真正摆上收藏柜的药：分类 + 关键字 + 排序叠在一起滤
  const visibleHerbs = useMemo(() => {
    return filterHerbs({
      herbs,
      categoryId,
      keyword,
      sort,
    });
  }, [herbs, categoryId, keyword, sort]);

  // 把本室现货复印成 JSON 带走，以后还能再导入对照
  function handleExport() {
    downloadHerbPackFile(buildHerbPackFromCabinet(herbs), "本室药材.json");
  }

  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <CollectionHeader
        herbCount={allCount}
        onImportClick={() => setImportOpen(true)}
        onExportClick={handleExport}
      />

      {/* 大屏三列起：图标轨 / 功效分类 / 收藏柜；越宽货架列数越多。min-w-0 防止横滑标签把整页撑出手机，像抽屉不能比柜子还宽 */}
      <div className="flex min-h-0 min-w-0 w-full flex-1 overflow-hidden">
        <CollectionNavRail />

        <CategorySidebar
          selectedId={categoryId}
          onSelect={setCategoryId}
          categories={categories}
          allCount={allCount}
          countsByCategory={countsByCategory}
        />

        <CollectionCabinet
          keyword={keyword}
          onKeywordChange={setKeyword}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          categories={categories}
          sort={sort}
          onSortChange={setSort}
          herbs={visibleHerbs}
          allCount={allCount}
          countsByCategory={countsByCategory}
        />
      </div>

      {/* 药包从门口进，撞名的在窗里对照，不直接改货架 */}
      <ImportHerbDialog
        open={importOpen}
        herbs={herbs}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}