import type { CustomHerbDraft, Herb, HerbCategoryId, HerbSubclassId } from "@/types/herb";

import { getSubclassesByCategory } from "@/data/catalog/categories";
import { BUILTIN_HERB_INPUTS, type BuiltinHerbInput } from "@/data/cabinet/builtin-herbs";

// 把一份字段收成自带药。照片默认空着，来源固定为 builtin
function defineHerb(input: BuiltinHerbInput): Herb {
  return {
    image: null,
    ...input,
    unit: input.unit?.trim() || "克",
    origin: "builtin",
  };
}

// 遍历自带药原文，补上照片和来源，得到页面使用的药柜
export const HERBS: Herb[] = BUILTIN_HERB_INPUTS.map(defineHerb);

// 某扇柜门默认落哪一节，添药时一级一变，二级跟着跳到第一格
export function getDefaultSubclassId(categoryId: HerbCategoryId): HerbSubclassId {
  // 找不到节就先记成补气，避免表格缺钥匙崩掉
  return getSubclassesByCategory(categoryId)[0]?.id ?? "bu_qi";
}

// 用户自添的药要有编号：拼音当门牌，再盖时间戳，避免两味「新药」撞号
export function createCustomHerb(draft: CustomHerbDraft): Herb {
  // 拼音里只留字母数字，空着就写 herb，免得编号变成一串符号
  const slug = draft.pinyin.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "herb";

  // 把纸条上的字收成一味药，图还没有，先记成自添，好跟教材册分开
  return {
    id: `custom-${slug}-${Date.now().toString(36)}`,
    name: draft.name.trim(),
    pinyin: draft.pinyin.trim() || slug,
    categoryId: draft.categoryId,
    subclassId: draft.subclassId,
    functions: draft.functions.trim(),
    nature: draft.nature.trim(),
    meridians: draft.meridians.trim(),
    indications: draft.indications.trim(),
    image: null,
    unit: "克",
    origin: "custom",
  };
}

