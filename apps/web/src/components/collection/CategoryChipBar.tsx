import { cn } from "@/lib/utils";
import { ALL_CATEGORY_ID, type CategoryFilterId, type HerbCategory } from "@/types/herb";

// 窄屏分类条要的账本：当前点了哪一类、每类几味，点一下就换货架
interface CategoryChipBarProps {
  selectedId: CategoryFilterId;
  onSelect: (id: CategoryFilterId) => void;
  categories: HerbCategory[];
  allCount: number;
  countsByCategory: Record<string, number>;
}

// 窄屏用的横滑分类签：侧栏收起来后，用一排小标签代替柜门
// 像奶茶店菜单顶部的「热销 / 果茶」，手指一滑就能换类
export function CategoryChipBar({
  selectedId,
  onSelect,
  categories,
  allCount,
  countsByCategory,
}: CategoryChipBarProps) {
  return (
    <div className="relative w-full min-w-0 max-w-full">
      {/* 标签比屏幕宽时只在这一行里横滑，像奶茶店顶部菜单，不把整张桌子拽歪 */}
      <div className="flex w-full min-w-0 max-w-full snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [-ms-overflow-style:none] touch-pan-x [&::-webkit-scrollbar]:hidden">
        <CategoryChip
          label="全部"
          count={allCount}
          active={selectedId === ALL_CATEGORY_ID}
          onClick={() => onSelect(ALL_CATEGORY_ID)}
        />

        {categories.map((category) => {
          // 字典里万一缺钥匙就当 0，避免窄屏标签直接崩
          const count = countsByCategory[category.id] ?? 0;

          return (
            <CategoryChip
              key={category.id}
              label={category.name}
              count={count}
              active={selectedId === category.id}
              onClick={() => onSelect(category.id)}
            />
          );
        })}
      </div>

      {/* 右边淡一层，提示后面还有柜门，像菜单被纸边挡住一角 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
      />
    </div>
  );
}

// 单个横滑标签：名字 + 现货数，选中亮青，像灯牌被点亮
// snap-start 让松手后停在标签开头，避免停在两个柜门中间看不清字
function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 snap-start rounded-sm border px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors",
        active
          ? "border-intel/50 bg-intel/15 text-intel"
          : "border-white/12 bg-white/5 text-foreground/80",
      )}
    >
      {label}

      <span className="ml-1.5 tabular-nums opacity-80">{count}</span>
    </button>
  );
}