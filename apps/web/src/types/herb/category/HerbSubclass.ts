import type { HerbCategoryId } from "@/types/herb/category/HerbCategoryId";
import type { HerbSubclassId } from "@/types/herb/category/HerbSubclassId";

// 分类下面更小的一类，比如解表下面的发散风寒
export interface HerbSubclass {
  // id 是小类编号
  id: HerbSubclassId;

  // categoryId 是它所属的功效分类编号
  categoryId: HerbCategoryId;

  // name 是短名
  name: string;

  // tag 是卡片上的全称，比如发散风寒药
  tag: string;
}
