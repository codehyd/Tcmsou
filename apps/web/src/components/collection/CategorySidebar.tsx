import { CategoryRow } from "@/components/collection/CategoryRow";
import { ALL_CATEGORY_ID, type CategoryFilterId, type HerbCategory } from "@/types/herb";

// 侧边栏要的账本：当前点了哪一格、每格现货几味，点一下就换货架
interface CategorySidebarProps {
  selectedId: CategoryFilterId;
  onSelect: (id: CategoryFilterId) => void;
  categories: HerbCategory[];
  allCount: number;
  countsByCategory: Record<string, number>;
}

// 左侧功效分类列：上面写「功效分类」，下面一排柜门
// 跟游戏收藏室的「电子物品 / 医疗道具」同一位置，只是换成解表清热
export function CategorySidebar({
  selectedId,
  onSelect,
  categories,
  allCount,
  countsByCategory,
}: CategorySidebarProps) {
  return (
    // 窄屏改用顶部横滑标签，大屏才摆回左边这排柜门；超宽屏略加宽，字和数字才不挤
    <aside className="hidden h-full w-52 shrink-0 flex-col border-r border-white/8 bg-dock lg:flex 2xl:w-56 3xl:w-60">
      {/* 这一列是按功效分柜，不是按植物动物矿物分仓库 */}
      <div className="px-3 py-3 text-xs tracking-widest text-muted-foreground">
        功效分类
      </div>

      {/* 柜门清单可滚动，分类多了也不把右边收藏柜挤没 */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3">
        {/* 「全部」放最上头，像先站在库房门口再挑抽屉 */}
        <CategoryRow
          label="全部"
          count={allCount}
          active={selectedId === ALL_CATEGORY_ID}
          onClick={() => onSelect(ALL_CATEGORY_ID)}
        />

        {categories.map((category) => {
          // 字典里万一缺钥匙就当 0，避免侧边栏直接崩
          const count = countsByCategory[category.id] ?? 0;

          return (
            <CategoryRow
              key={category.id}
              label={category.name}
              count={count}
              active={selectedId === category.id}
              onClick={() => onSelect(category.id)}
            />
          );
        })}
      </nav>
    </aside>
  );
}