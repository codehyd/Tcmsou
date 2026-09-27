import type { HerbCategoryId } from "@/types/herb/category/HerbCategoryId";
import type { HerbSubclassId } from "@/types/herb/category/HerbSubclassId";

// 手写添加一味药时要填的内容。编号和来源由药柜自己生成
export type CustomHerbDraft = {
  // name 是药名
  name: string;

  // pinyin 是拼音
  pinyin: string;

  // categoryId 是功效分类编号
  categoryId: HerbCategoryId;

  // subclassId 是更小一类的编号
  subclassId: HerbSubclassId;

  // functions 是功效
  functions: string;

  // nature 是性味
  nature: string;

  // meridians 是归经
  meridians: string;

  // indications 是主治
  indications: string;
};
