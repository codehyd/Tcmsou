import type { HerbCategoryId } from "@/types/herb/category/HerbCategoryId";
import type { HerbSubclassId } from "@/types/herb/category/HerbSubclassId";

// 药包里的一味药。分类可以先写文字，导入时再对上编号
export type HerbPackHerb = {
  // name 是药名
  name: string;

  // pinyin 是拼音，药包里可以没有
  pinyin?: string;

  // categoryTag 是功效分类的文字，比如解表药
  categoryTag?: string;

  // subclassTag 是更小一类的文字，比如发散风寒药
  subclassTag?: string;

  // categoryId 是已经对上的功效分类编号
  categoryId?: HerbCategoryId;

  // subclassId 是已经对上的小类编号
  subclassId?: HerbSubclassId;

  // nature 是性味
  nature?: string;

  // meridians 是归经
  meridians?: string;

  // functions 是功效
  functions?: string;

  // indications 是主治
  indications?: string;

  // sourceLabel 是这味药自己的来源名称
  sourceLabel?: string;

  // sourceUrl 是这味药来源的官网
  sourceUrl?: string;
};
