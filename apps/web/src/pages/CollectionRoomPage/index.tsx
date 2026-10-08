import { useMemo, useState } from "react";

import { collectionRoom } from "./styles";
import { CategorySidebar } from "@/rooms/collection/components/CategorySidebar";
import { CollectionCabinet } from "@/rooms/collection/components/CollectionCabinet";
import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { CollectionNavRail } from "@/rooms/collection/components/CollectionNavRail";
import { HerbDeleteDialog, HerbFormDialog } from "@/rooms/collection/components/HerbFormDialog";
import { ImportHerbDialog } from "@/rooms/collection/components/ImportHerbDialog";
import {
  countAllHerbs,
  countHerbsByCategory,
  filterHerbs,
  getVisibleHerbCategories,
} from "@/lib/herb-catalog";
import { HERBS } from "@/data/catalog/herbs";
import {
  buildHerbPackFromCabinet,
  downloadHerbPackFile,
} from "@/lib/herb-import";
import { useCabinetHerbs, useHerbCabinetStore } from "@/store/herb-cabinet";
import {
  ALL_CATEGORY_ID,
  type CategoryFilterId,
  type Herb,
  type HerbSort,
} from "@/types/herb";

// 收藏室的首页
export function CollectionRoomPage() {
  // 中药药材列表
  const herbs = useCabinetHerbs();

  // 中药功效分类 比如解表 补益等
  const categories = useMemo(() => getVisibleHerbCategories(herbs), [herbs]);
  const addCustomHerb = useHerbCabinetStore((state) => state.addCustomHerb);
  const updateHerb = useHerbCabinetStore((state) => state.updateHerb);
  const removeHerb = useHerbCabinetStore((state) => state.removeHerb);

  // 记下用户点了哪一类，没点就当逛全部，像先站在库房门口
  const [categoryId, setCategoryId] =
    useState<CategoryFilterId>(ALL_CATEGORY_ID);

  // 记下搜索框里的字，列表靠它筛，空着就不过滤
  const [keyword, setKeyword] = useState("");

  // 记下排队方式：默认按柜门，名称则按药名点名·
  const [sort, setSort] = useState<HerbSort>("default");

  // 药包窗开没开，像库房侧门的插销；关掉就不挡货架
  const [importOpen, setImportOpen] = useState(false);

  // 新增窗开着时是空。编辑窗开着时记下正在改的那一味
  const [formHerb, setFormHerb] = useState<Herb | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // 删除前先问一句。空着表示确认窗关着
  const [pendingDelete, setPendingDelete] = useState<Herb | null>(null);

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
    <div className={collectionRoom.page()}>
      <CollectionHeader
        herbCount={allCount}
        onCreateClick={() => {
          setFormHerb(null);
          setFormOpen(true);
        }}
        onImportClick={() => setImportOpen(true)}
        onExportClick={handleExport}
      />

      {/* 大屏三列起：图标轨 / 功效分类 / 收藏柜；越宽货架列数越多 */}
      <div className={collectionRoom.stage()}>
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
          onEdit={(herb) => {
            // 柜上看到的是归并后的卡片。表单改库存里的原条，避免把子项功效写成空白
            const { extraHerbs, overrides } = useHerbCabinetStore.getState();
            const stored =
              extraHerbs.find((item) => item.id === herb.id) ??
              overrides[herb.id] ??
              HERBS.find((item) => item.id === herb.id) ??
              herb;

            setFormHerb(stored);
            setFormOpen(true);
          }}
          onDelete={setPendingDelete}
        />
      </div>

      {/* 药包从门口进，撞名的在窗里对照，不直接改货架 */}
      <ImportHerbDialog
        open={importOpen}
        herbs={herbs}
        onClose={() => setImportOpen(false)}
      />

      <HerbFormDialog
        open={formOpen}
        herb={formHerb}
        herbs={herbs}
        onClose={() => setFormOpen(false)}
        onSubmit={(draft) => {
          if (formHerb) {
            updateHerb(formHerb.id, draft);
          } else {
            addCustomHerb(draft);
          }

          setFormOpen(false);
        }}
      />

      <HerbDeleteDialog
        herb={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={(herb) => {
          removeHerb(herb);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
