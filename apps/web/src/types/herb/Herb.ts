import type { HerbCategoryId } from "@/types/herb/category/HerbCategoryId";
import type { HerbSubclassId } from "@/types/herb/category/HerbSubclassId";
import type { HerbOrigin } from "@/types/herb/HerbOrigin";
import type { HerbSource } from "@/types/herb/HerbSource";

// 一味中药在页面上要显示的内容
export interface Herb {
  // id 是这味药的编号，用来区分每一味药
  id: string;

  // name 是药名，比如麻黄
  name: string;

  // pinyin 是药名拼音，比如 mahuang
  pinyin: string;

  // categoryId 是功效分类编号，比如解表
  categoryId: HerbCategoryId;

  // subclassId 是更小一类的编号，比如发散风寒
  subclassId: HerbSubclassId;

  // image 是药的图片地址，没有图片时是空的
  image: string | null;

  // functions 是功效，这味药用来做什么
  functions: string;

  // nature 是性味，比如辛、微苦，温
  nature: string;

  // meridians 是归经，比如肺、膀胱经
  meridians: string;

  // indications 是主治，适合用在什么情况
  indications: string;

  // unit 是这味药的剂量单位。没写时按克
  unit?: string;

  // aliases 是已经归进这一味的原名，比如炙黄芪。列表里不再单独占一条
  aliases?: string[];

  // sources 是可选的植物来源或货品名，比如蒙古黄芪。空着表示没单标来源
  sources?: string[];

  // mergedIds 是被并进这一条的原编号。旧链接还能打开归并后的这味药
  mergedIds?: string[];

  // origin 是这味药从哪来：自带、导入，或手写添加
  origin: HerbOrigin;

  // source 是公开药表的出处。自带药没有这项，详情页就不显示链接
  source?: HerbSource;
}
