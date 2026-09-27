import type { HerbCategoryId } from "@/types/herb/category/HerbCategoryId";

// 功效分类，侧边栏上的一扇柜门
export interface HerbCategory {
  // id 是分类编号
  id: HerbCategoryId;

  // name 是短名，侧边栏上显示
  name: string;

  // tag 是卡片上的全称，比如解表药
  tag: string;
}
