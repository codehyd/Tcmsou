import {
  HERB_CATEGORIES,
  HERB_SUBCLASSES,
  getSubclassesByCategory,
  getVisibleHerbCategories,
} from "@/data/categories";
import { HERBS } from "@/data/herbs";
import {
  ALL_CATEGORY_ID,
  type CategoryFilterId,
  type Herb,
  type HerbCategory,
  type HerbCategoryId,
  type HerbSort,
  type HerbSubclass,
  type HerbSubclassId,
} from "@/types/herb";

export { getSubclassesByCategory, getVisibleHerbCategories };

// 以后接权威库或 AI 补药只改这里，像把菜市场采购换成配送中心，货架不用拆
export function getBuiltinHerbs(): Herb[] {
  return HERBS;
}

// 第一版给旧调用留个门：只读教材册。带自添的完整货架请用 useCabinetHerbs
export function getHerbs(): Herb[] {
  return HERBS;
}

// 侧边栏要哪些柜门，第一版直接读本地字典
export function getHerbCategories(): HerbCategory[] {
  return HERB_CATEGORIES;
}

// 按编号找出柜门，卡片上的「解表药」标签靠它；找不到就不当分类
export function getHerbCategory(categoryId: HerbCategoryId): HerbCategory | undefined {
  return HERB_CATEGORIES.find((category) => category.id === categoryId);
}

// 按编号找出二级小类，详情上的「发散风寒药」靠它
export function getHerbSubclass(subclassId: HerbSubclassId): HerbSubclass | undefined {
  return HERB_SUBCLASSES.find((subclass) => subclass.id === subclassId);
}

// 卡片上贴更细的那张签：麻黄贴发散风寒药，找不到节才退回解表药
export function getHerbClassTag(herb: Herb): string {
  const subclass = getHerbSubclass(herb.subclassId);
  const category = getHerbCategory(herb.categoryId);

  return subclass?.tag ?? category?.tag ?? "未分类";
}

// 详情页把章和节写成一条路径，节和章同名就只写一次，免得「温里药 · 温里药」
export function formatHerbClassPath(herb: Herb): string {
  const category = getHerbCategory(herb.categoryId);
  const subclass = getHerbSubclass(herb.subclassId);

  // 一级都没有，只能说未分类
  if (!category) {
    return "未分类";
  }

  // 二级缺失，或跟一级标签相同，就只亮章名
  if (!subclass || subclass.tag === category.tag) {
    return category.tag;
  }

  return `${category.tag} · ${subclass.tag}`;
}

// 本室现在摆了几味：只报现货，不报「总共就这么多」
// 避免 30/30 让人以为中药世界被我们收完了
export function countAllHerbs(herbs: Herb[]): number {
  return herbs.length;
}

// 每个功效柜门现有几味，侧边栏写成一个数字，不写分数
export function countHerbsByCategory(
  herbs: Herb[],
): Record<HerbCategoryId, number> {
  const counts = {} as Record<HerbCategoryId, number>;

  // 先给每个柜门垫零，免得没药的类直接缺钥匙
  for (const category of HERB_CATEGORIES) {
    counts[category.id] = 0;
  }

  // 把每味药丢进对应柜门，只计现货
  for (const herb of herbs) {
    // 药包可能带进新柜门，没有垫过零就先记 0 再加，避免变成 NaN
    if (counts[herb.categoryId] === undefined) {
      counts[herb.categoryId] = 0;
    }

    counts[herb.categoryId] += 1;
  }

  return counts;
}

// 某味药的柜门在字典里排第几，默认排序时用来「先按柜门再按药名」
function getCategoryOrder(categoryId: HerbCategoryId): number {
  return HERB_CATEGORIES.findIndex((category) => category.id === categoryId);
}

// 同一柜门里再按小节排队，发散风寒排在发散风热前面
function getSubclassOrder(subclassId: HerbSubclassId): number {
  return HERB_SUBCLASSES.findIndex((subclass) => subclass.id === subclassId);
}

// 按分类、关键字、排序从药柜里拣货：搜索框和侧边栏都会叫它
// 没有它，页面就只会把整柜原封不动摊开，像超市广播失灵
export function filterHerbs(options: {
  herbs: Herb[];
  categoryId: CategoryFilterId;
  keyword: string;
  sort: HerbSort;
}): Herb[] {
  let result = options.herbs;

  // 点了具体柜门就只留这一格，点「全部」则整间库房都逛
  if (options.categoryId !== ALL_CATEGORY_ID) {
    result = result.filter((herb) => herb.categoryId === options.categoryId);
  }

  // 忽略大小写和前后空格，避免「陈皮」和「 chenpi 」对不上
  const needle = options.keyword.trim().toLowerCase();

  // 有关键字才筛，空搜把原货架原样递回去
  if (needle) {
    result = result.filter((herb) => {
      const category = getHerbCategory(herb.categoryId);
      const subclass = getHerbSubclass(herb.subclassId);

      // 柜门和二级小类都纳入搜索，打「发散风寒」就能碰到麻黄
      const tag = category?.tag.toLowerCase() ?? "";
      const subclassTag = subclass?.tag.toLowerCase() ?? "";

      // 药名、拼音、功效、章签、节签任一命中都留下
      return (
        herb.name.toLowerCase().includes(needle) ||
        herb.pinyin.toLowerCase().includes(needle) ||
        herb.functions.toLowerCase().includes(needle) ||
        tag.includes(needle) ||
        subclassTag.includes(needle)
      );
    });
  }

  // 按名称排队，像点名簿从 A 到 Z，中文按拼音习惯比
  if (options.sort === "name") {
    return [...result].sort((left, right) =>
      left.name.localeCompare(right.name, "zh-CN"),
    );
  }

  // 默认：先按柜门，再按小节，最后按药名，免得薄荷和麻黄挤成一锅
  return [...result].sort((left, right) => {
    const categoryDelta =
      getCategoryOrder(left.categoryId) - getCategoryOrder(right.categoryId);

    // 同一柜门才比小节，不然会把清热药插到解表中间
    if (categoryDelta !== 0) {
      return categoryDelta;
    }

    const subclassDelta =
      getSubclassOrder(left.subclassId) - getSubclassOrder(right.subclassId);

    // 同一节才比药名
    if (subclassDelta !== 0) {
      return subclassDelta;
    }

    return left.name.localeCompare(right.name, "zh-CN");
  });
}

// 按编号从当前货架里取出一味药，详情页靠它认人；找不到就说明门牌写错了
export function getHerbById(herbs: Herb[], herbId: string): Herb | undefined {
  return herbs.find((herb) => herb.id === herbId);
}