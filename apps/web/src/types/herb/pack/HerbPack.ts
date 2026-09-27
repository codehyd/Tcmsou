import type { HerbPackHerb } from "@/types/herb/pack/HerbPackHerb";

// 一整包药：封面说明，加上里面的药
export type HerbPack = {
  // id 是药包编号，可以没有
  id?: string;

  // name 是药包名称
  name?: string;

  // source 是旧字段里的来源说明
  source?: string;

  // sourceName 是给人看的来源名
  sourceName?: string;

  // sourceUrl 是能点开的官网，没有就只显示名字
  sourceUrl?: string;

  // herbs 是这一包里的药
  herbs: HerbPackHerb[];
};
