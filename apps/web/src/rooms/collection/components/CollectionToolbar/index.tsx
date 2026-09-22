import { Search } from "lucide-react";
import type { ChangeEvent } from "react";

import { CollectionSelect } from "@/rooms/collection/components/CollectionSelect";
import { toolbar } from "./styles";
import { Input } from "@/components/ui/input";
import { ALL_CATEGORY_ID, type CategoryFilterId, type HerbCategory, type HerbSort } from "@/types/herb";

// 工具条要记住的两件事：搜什么、大屏怎么排队，分类标签交给柜体去吸顶
interface CollectionToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  categoryId: CategoryFilterId;
  onCategoryChange: (id: CategoryFilterId) => void;
  categories: HerbCategory[];
  sort: HerbSort;
  onSortChange: (sort: HerbSort) => void;
}

// 搜索条：打字找药；大屏再带分类和排序下拉
// 窄屏分类标签不放这里，好单独吸顶，像逛超市时货架分类条一直贴在脑门前
export function CollectionToolbar({
  keyword,
  onKeywordChange,
  categoryId,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
}: CollectionToolbarProps) {
  // 分类下拉的选项：先「显示全部」，再跟侧边栏同一套柜门，免得两套目录对不上
  const categoryItems = [
    { label: "显示全部", value: ALL_CATEGORY_ID },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  // 排序只有两种：按柜门逛，或按药名点名
  const sortItems = [
    { label: "默认排序", value: "default" as HerbSort },
    { label: "名称 A–Z", value: "name" as HerbSort },
  ];

  // 把输入框的字记到纸条上，后面过滤列表靠它
  function handleKeywordChange(event: ChangeEvent<HTMLInputElement>) {
    // 把输入框最新的字递出去，页面拿去筛列表
    onKeywordChange(event.target.value);
  }

  return (
    <div className={toolbar.row()}>
      {/* 搜药框占满一行；超宽屏加个上限，避免搜索框拉成跑道，下拉靠右站着 */}
      <div className={toolbar.search()}>
        <Search className={toolbar.searchIcon()} />

        <Input
          value={keyword}
          onChange={handleKeywordChange}
          placeholder="请输入想要查找的中药"
          className={toolbar.input()}
        />
      </div>

      {/* 大屏：分类下拉和排序跟搜索排成一排，跟左侧柜门同时在 */}
      <div className={toolbar.filters()}>
        <CollectionSelect
          value={categoryId}
          items={categoryItems}
          triggerClassName="h-8 min-w-36 rounded-sm bg-white/5"
          onChange={onCategoryChange}
        />

        <CollectionSelect
          value={sort}
          items={sortItems}
          triggerClassName="h-8 min-w-32 rounded-sm bg-white/5"
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}
