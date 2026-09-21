import type { Herb, HerbCategory, HerbCategoryId, HerbSubclass } from "@/types/herb";

// 本地教材册默认亮着的柜门；药包里才出现的章，没货时不占侧边栏
export const CORE_CATEGORY_IDS: HerbCategoryId[] = [
  "jie_biao",
  "qing_re",
  "hua_shi",
  "li_shui",
  "wen_li",
  "li_qi",
  "xiao_shi",
  "huo_xue",
  "hua_tan",
  "an_shen",
  "bu_xu",
];

// 功效分类柜门：前面是本室默认章，后面是 SymMap 常见章，导入后有货才亮
export const HERB_CATEGORIES: HerbCategory[] = [
  { id: "jie_biao", name: "解表", tag: "解表药" },
  { id: "qing_re", name: "清热", tag: "清热药" },
  { id: "hua_shi", name: "化湿", tag: "化湿药" },
  { id: "li_shui", name: "利水渗湿", tag: "利水渗湿药" },
  { id: "wen_li", name: "温里", tag: "温里药" },
  { id: "li_qi", name: "理气", tag: "理气药" },
  { id: "xiao_shi", name: "消食", tag: "消食药" },
  { id: "huo_xue", name: "活血化瘀", tag: "活血化瘀药" },
  { id: "hua_tan", name: "化痰止咳", tag: "化痰止咳平喘药" },
  { id: "an_shen", name: "安神", tag: "安神药" },
  { id: "bu_xu", name: "补虚", tag: "补虚药" },

  // 下面这些章本室默认不占侧边栏，SymMap 药材表里有货才亮
  { id: "xie_xia", name: "泻下", tag: "泻下药" },
  { id: "qu_feng_shi", name: "祛风湿", tag: "祛风湿药" },
  { id: "zhi_xue", name: "止血", tag: "止血药" },
  { id: "ping_gan", name: "平肝息风", tag: "平肝息风药" },
  { id: "kai_qiao", name: "开窍", tag: "开窍药" },
  { id: "shou_se", name: "收涩", tag: "收涩药" },
  { id: "qu_chong", name: "驱虫", tag: "驱虫药" },
  { id: "yong_tu", name: "涌吐", tag: "涌吐药" },
  { id: "gong_du", name: "攻毒杀虫", tag: "攻毒杀虫止痒药" },
  { id: "ba_du", name: "拔毒化腐", tag: "拔毒化腐生肌药" },
  { id: "wei_fen_lei", name: "未分类", tag: "未分类" },
];

// 章下面的节：教材小节 + SymMap 常用别名，导入时对得上才不丢进未分类
export const HERB_SUBCLASSES: HerbSubclass[] = [
  { id: "fa_san_feng_han", categoryId: "jie_biao", name: "发散风寒", tag: "发散风寒药" },
  { id: "fa_san_feng_re", categoryId: "jie_biao", name: "发散风热", tag: "发散风热药" },
  { id: "qing_re_xie_huo", categoryId: "qing_re", name: "清热泻火", tag: "清热泻火药" },
  { id: "qing_re_zao_shi", categoryId: "qing_re", name: "清热燥湿", tag: "清热燥湿药" },
  { id: "qing_re_jie_du", categoryId: "qing_re", name: "清热解毒", tag: "清热解毒药" },
  { id: "qing_re_liang_xue", categoryId: "qing_re", name: "清热凉血", tag: "清热凉血药" },
  { id: "qing_xu_re", categoryId: "qing_re", name: "清虚热", tag: "清虚热药" },
  { id: "fang_xiang_hua_shi", categoryId: "hua_shi", name: "芳香化湿", tag: "芳香化湿药" },
  { id: "li_shui_xiao_zhong", categoryId: "li_shui", name: "利水消肿", tag: "利水消肿药" },
  { id: "tong_shui", categoryId: "li_shui", name: "利水通淋", tag: "利水通淋药" },
  { id: "wen_li_yao", categoryId: "wen_li", name: "温里", tag: "温里药" },
  { id: "li_qi_yao", categoryId: "li_qi", name: "理气", tag: "理气药" },
  { id: "xiao_shi_yao", categoryId: "xiao_shi", name: "消食", tag: "消食药" },
  { id: "huo_xue_zhi_tong", categoryId: "huo_xue", name: "活血止痛", tag: "活血止痛药" },
  { id: "huo_xue_tiao_jing", categoryId: "huo_xue", name: "活血调经", tag: "活血调经药" },
  { id: "huo_xue_qu_yu", categoryId: "huo_xue", name: "活血祛瘀", tag: "活血祛瘀药" },
  { id: "huo_xue_liao_shang", categoryId: "huo_xue", name: "活血疗伤", tag: "活血疗伤药" },
  { id: "wen_hua_han_tan", categoryId: "hua_tan", name: "温化寒痰", tag: "温化寒痰药" },
  { id: "qing_hua_re_tan", categoryId: "hua_tan", name: "清化热痰", tag: "清化热痰药" },
  { id: "hua_tan_yao", categoryId: "hua_tan", name: "化痰", tag: "化痰药" },
  { id: "zhi_ke_ping_chuan", categoryId: "hua_tan", name: "止咳平喘", tag: "止咳平喘药" },
  { id: "yang_xin_an_shen", categoryId: "an_shen", name: "养心安神", tag: "养心安神药" },
  { id: "bu_qi", categoryId: "bu_xu", name: "补气", tag: "补气药" },
  { id: "bu_xue", categoryId: "bu_xu", name: "补血", tag: "补血药" },
  { id: "bu_yin", categoryId: "bu_xu", name: "补阴", tag: "补阴药" },
  { id: "bu_yang", categoryId: "bu_xu", name: "补阳", tag: "补阳药" },
  { id: "gong_xia", categoryId: "xie_xia", name: "攻下", tag: "攻下药" },
  { id: "run_xia", categoryId: "xie_xia", name: "润下", tag: "润下药" },
  { id: "xie_xia_yao", categoryId: "xie_xia", name: "泻下", tag: "泻下药" },
  { id: "qu_feng_shi_san_han", categoryId: "qu_feng_shi", name: "祛风湿散寒", tag: "祛风湿散寒药" },
  { id: "qu_feng_shi_qing_re", categoryId: "qu_feng_shi", name: "祛风湿清热", tag: "祛风湿清热药" },
  { id: "qu_feng_shi_jin_gu", categoryId: "qu_feng_shi", name: "祛风湿强筋骨", tag: "祛风湿强筋骨药" },
  { id: "qu_feng_shi_yao", categoryId: "qu_feng_shi", name: "祛风湿", tag: "祛风湿药" },
  { id: "wen_jing_zhi_xue", categoryId: "zhi_xue", name: "温经止血", tag: "温经止血药" },
  { id: "shou_lian_zhi_xue", categoryId: "zhi_xue", name: "收敛止血", tag: "收敛止血药" },
  { id: "liang_xue_zhi_xue", categoryId: "zhi_xue", name: "凉血止血", tag: "凉血止血药" },
  { id: "hua_yu_zhi_xue", categoryId: "zhi_xue", name: "化瘀止血", tag: "化瘀止血药" },
  { id: "zhi_xue_yao", categoryId: "zhi_xue", name: "止血", tag: "止血药" },
  { id: "ping_gan_xi_feng", categoryId: "ping_gan", name: "平肝息风", tag: "平肝息风药" },
  { id: "kai_qiao_yao", categoryId: "kai_qiao", name: "开窍", tag: "开窍药" },
  { id: "shou_se_yao", categoryId: "shou_se", name: "收涩", tag: "收涩药" },
  { id: "qu_chong_yao", categoryId: "qu_chong", name: "驱虫", tag: "驱虫药" },
  { id: "yong_tu_yao", categoryId: "yong_tu", name: "涌吐", tag: "涌吐药" },
  { id: "gong_du_sha_chong", categoryId: "gong_du", name: "攻毒杀虫止痒", tag: "攻毒杀虫止痒药" },
  { id: "jie_du_sha_chong", categoryId: "gong_du", name: "解毒杀虫燥湿止痒", tag: "解毒杀虫燥湿止痒药" },
  { id: "ba_du_hua_fu", categoryId: "ba_du", name: "拔毒化腐生肌", tag: "拔毒化腐生肌药" },
  { id: "wei_fen_lei_yao", categoryId: "wei_fen_lei", name: "未分类", tag: "未分类" },
];

// SymMap 分类签对到本室章和节：辛温解表就是教材里的发散风寒
export const HERB_CLASS_ALIASES: Record<
  string,
  { categoryId: HerbCategoryId; subclassId: string }
> = {
  辛温解表: { categoryId: "jie_biao", subclassId: "fa_san_feng_han" },
  辛凉解表: { categoryId: "jie_biao", subclassId: "fa_san_feng_re" },
  解表: { categoryId: "jie_biao", subclassId: "fa_san_feng_han" },
  清热解毒: { categoryId: "qing_re", subclassId: "qing_re_jie_du" },
  清热燥湿: { categoryId: "qing_re", subclassId: "qing_re_zao_shi" },
  清热泻火: { categoryId: "qing_re", subclassId: "qing_re_xie_huo" },
  清热凉血: { categoryId: "qing_re", subclassId: "qing_re_liang_xue" },
  清虚热: { categoryId: "qing_re", subclassId: "qing_xu_re" },
  清热: { categoryId: "qing_re", subclassId: "qing_re_jie_du" },
  化湿: { categoryId: "hua_shi", subclassId: "fang_xiang_hua_shi" },
  芳香化湿: { categoryId: "hua_shi", subclassId: "fang_xiang_hua_shi" },
  利水渗湿: { categoryId: "li_shui", subclassId: "li_shui_xiao_zhong" },
  利水消肿: { categoryId: "li_shui", subclassId: "li_shui_xiao_zhong" },
  通水: { categoryId: "li_shui", subclassId: "tong_shui" },
  温里: { categoryId: "wen_li", subclassId: "wen_li_yao" },
  理气: { categoryId: "li_qi", subclassId: "li_qi_yao" },
  消食: { categoryId: "xiao_shi", subclassId: "xiao_shi_yao" },
  活血化瘀: { categoryId: "huo_xue", subclassId: "huo_xue_qu_yu" },
  活血祛瘀: { categoryId: "huo_xue", subclassId: "huo_xue_qu_yu" },
  活血疗伤: { categoryId: "huo_xue", subclassId: "huo_xue_liao_shang" },
  活血止痛: { categoryId: "huo_xue", subclassId: "huo_xue_zhi_tong" },
  活血调经: { categoryId: "huo_xue", subclassId: "huo_xue_tiao_jing" },
  化痰: { categoryId: "hua_tan", subclassId: "hua_tan_yao" },
  清化热痰: { categoryId: "hua_tan", subclassId: "qing_hua_re_tan" },
  温化寒痰: { categoryId: "hua_tan", subclassId: "wen_hua_han_tan" },
  止咳平喘: { categoryId: "hua_tan", subclassId: "zhi_ke_ping_chuan" },
  化痰止咳平喘: { categoryId: "hua_tan", subclassId: "zhi_ke_ping_chuan" },
  化痰止咳: { categoryId: "hua_tan", subclassId: "hua_tan_yao" },
  安神: { categoryId: "an_shen", subclassId: "yang_xin_an_shen" },
  养心安神: { categoryId: "an_shen", subclassId: "yang_xin_an_shen" },
  补气: { categoryId: "bu_xu", subclassId: "bu_qi" },
  补血: { categoryId: "bu_xu", subclassId: "bu_xue" },
  补阴: { categoryId: "bu_xu", subclassId: "bu_yin" },
  补阳: { categoryId: "bu_xu", subclassId: "bu_yang" },
  补虚: { categoryId: "bu_xu", subclassId: "bu_qi" },
  攻下: { categoryId: "xie_xia", subclassId: "gong_xia" },
  润下: { categoryId: "xie_xia", subclassId: "run_xia" },
  泻下: { categoryId: "xie_xia", subclassId: "xie_xia_yao" },
  祛风湿散寒: { categoryId: "qu_feng_shi", subclassId: "qu_feng_shi_san_han" },
  祛风湿清热: { categoryId: "qu_feng_shi", subclassId: "qu_feng_shi_qing_re" },
  祛风湿筋骨: { categoryId: "qu_feng_shi", subclassId: "qu_feng_shi_jin_gu" },
  祛风湿强筋骨: { categoryId: "qu_feng_shi", subclassId: "qu_feng_shi_jin_gu" },
  祛风湿: { categoryId: "qu_feng_shi", subclassId: "qu_feng_shi_yao" },
  温经止血: { categoryId: "zhi_xue", subclassId: "wen_jing_zhi_xue" },
  收敛止血: { categoryId: "zhi_xue", subclassId: "shou_lian_zhi_xue" },
  凉血止血: { categoryId: "zhi_xue", subclassId: "liang_xue_zhi_xue" },
  化瘀止血: { categoryId: "zhi_xue", subclassId: "hua_yu_zhi_xue" },
  止血: { categoryId: "zhi_xue", subclassId: "zhi_xue_yao" },
  平肝熄风: { categoryId: "ping_gan", subclassId: "ping_gan_xi_feng" },
  平肝息风: { categoryId: "ping_gan", subclassId: "ping_gan_xi_feng" },
  开窍: { categoryId: "kai_qiao", subclassId: "kai_qiao_yao" },
  收涩: { categoryId: "shou_se", subclassId: "shou_se_yao" },
  驱虫: { categoryId: "qu_chong", subclassId: "qu_chong_yao" },
  涌吐: { categoryId: "yong_tu", subclassId: "yong_tu_yao" },
  攻毒杀虫止痒: { categoryId: "gong_du", subclassId: "gong_du_sha_chong" },
  解毒杀虫燥湿止痒: { categoryId: "gong_du", subclassId: "jie_du_sha_chong" },
  拔毒化腐生肌: { categoryId: "ba_du", subclassId: "ba_du_hua_fu" },
};

// 某扇柜门下面有哪些抽屉，导入对节、添药下拉都靠它
export function getSubclassesByCategory(categoryId: HerbCategoryId): HerbSubclass[] {
  return HERB_SUBCLASSES.filter((subclass) => subclass.categoryId === categoryId);
}

// 侧边栏只亮「有货或本来就在」的柜门，避免一排空的开窍药丢人
export function getVisibleHerbCategories(herbs: Herb[]): HerbCategory[] {
  const used = new Set(herbs.map((herb) => herb.categoryId));

  return HERB_CATEGORIES.filter((category) => {
    return CORE_CATEGORY_IDS.includes(category.id) || used.has(category.id);
  });
}
