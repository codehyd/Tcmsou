import type { HerbCategoryId } from "@/types/herb/category/HerbCategoryId";

// 侧边栏里的「全部」，不是某一类药
export const ALL_CATEGORY_ID = "all" as const;

// 当前选中的分类。可以是全部，也可以是某一个功效分类
export type CategoryFilterId = typeof ALL_CATEGORY_ID | HerbCategoryId;
