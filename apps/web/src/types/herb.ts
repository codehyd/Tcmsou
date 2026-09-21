// 中药与功效分类的形状，像药柜格子的规格说明书
// 页面、侧边栏、搜索都按这套格子摆，以后接 AI 补信息也不用改展示层骨架

// 标记「看全库还是只看某一格」，像药店目录上的「全部」按钮
export const ALL_CATEGORY_ID = "all" as const;

// 教材一级功效分类：解表清热这些是章，下面还有节
// 用字符串而不写死联合，SymMap 里开窍、祛风湿这些柜门才能加进来
export type HerbCategoryId = string;

// 教材二级功效分类：麻黄落到发散风寒；药包里的辛温解表也会对到这一节
export type HerbSubclassId = string;

// 侧边栏当前点中的分类，全部也算一种选择
export type CategoryFilterId = typeof ALL_CATEGORY_ID | HerbCategoryId;

// 列表怎么排队：默认按柜门顺序，名称则像点名簿按药名排
export type HerbSort = "default" | "name";

// 一味药从哪来：典籍是本地教材册，药包是导入的，自添是以后手工登记的
export type HerbOrigin = "builtin" | "imported" | "custom";

// 一个功效分类柜门：侧边栏用短名，卡片标签用「解表药」这种全称
export interface HerbCategory {
  id: HerbCategoryId;
  name: string;
  tag: string;
}

// 章下面的节：发散风寒药挂在解表药下面，像柜子里再隔一层抽屉
export interface HerbSubclass {
  id: HerbSubclassId;
  categoryId: HerbCategoryId;
  name: string;
  tag: string;
}

// 一味中药在收藏室和详情展位上要亮的身份牌
// 图和 3D 可以后补；性味归经先写上，详情页才不像只有空名
export interface Herb {
  id: string;
  name: string;
  pinyin: string;
  categoryId: HerbCategoryId;
  subclassId: HerbSubclassId;
  image: string | null;
  functions: string;
  nature: string;
  meridians: string;
  indications: string;
  origin: HerbOrigin;
}

// 自添中药时要填的纸，编号和来源由药柜自己盖章
export type CustomHerbDraft = {
  name: string;
  pinyin: string;
  categoryId: HerbCategoryId;
  subclassId: HerbSubclassId;
  functions: string;
  nature: string;
  meridians: string;
  indications: string;
};

// 药包里一味药的纸条：允许写分类签，导入时再对上柜门编号
export type HerbPackHerb = {
  name: string;
  pinyin?: string;
  categoryTag?: string;
  subclassTag?: string;
  categoryId?: HerbCategoryId;
  subclassId?: HerbSubclassId;
  nature?: string;
  meridians?: string;
  functions?: string;
  indications?: string;
};

// 下载下来的整包：封面说明 + 一叠药牌
export type HerbPack = {
  id?: string;
  name?: string;
  source?: string;
  herbs: HerbPackHerb[];
};

// 审查时逐栏对照的栏目：分类把章和节合成一格，免得勾两次
export type ImportFieldKey =
  | "pinyin"
  | "class"
  | "nature"
  | "meridians"
  | "functions"
  | "indications";

// 这一栏用本室的还是药包的，像左右两份说明书里勾一张
export type ImportFieldPick = "local" | "incoming";
