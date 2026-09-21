import type { CustomHerbDraft, Herb, HerbCategoryId, HerbSubclassId } from "@/types/herb";

import { getSubclassesByCategory } from "@/data/categories";

// 把一味常见药登记进本地药柜：第一版没有照片，说明书先写全
// 像博物馆展签：名字、性味、归经、这味药干什么，模型以后再摆
function defineHerb(
  id: string,
  name: string,
  pinyin: string,
  categoryId: HerbCategoryId,
  subclassId: HerbSubclassId,
  nature: string,
  meridians: string,
  functions: string,
  indications: string,
): Herb {
  return {
    id,
    name,
    pinyin,
    categoryId,
    subclassId,
    nature,
    meridians,
    functions,
    indications,

    // 第一版没有照片，先空着，3D 模型和 AI 配图以后再填
    image: null,

    // 教材册里的药，跟用户后来自添的要分开记账
    origin: "builtin",
  };
}

// 约 30 味教材常见药，二级分类按中药学章节落格，麻黄进发散风寒而不是只写解表
export const HERBS: Herb[] = [
  // 解表：发散风寒 / 发散风热
  defineHerb("mahuang", "麻黄", "mahuang", "jie_biao", "fa_san_feng_han", "辛、微苦，温", "肺、膀胱经", "发汗解表，宣肺平喘，利水消肿。", "风寒表实证，胸闷喘咳，风水浮肿。"),
  defineHerb("guizhi", "桂枝", "guizhi", "jie_biao", "fa_san_feng_han", "辛、甘，温", "心、肺、膀胱经", "发汗解肌，温通经脉，助阳化气。", "风寒表虚，脘腹冷痛，经寒血滞。"),
  defineHerb("shengjiang", "生姜", "shengjiang", "jie_biao", "fa_san_feng_han", "辛，微温", "肺、脾、胃经", "解表散寒，温中止呕，化痰止咳。", "风寒感冒，胃寒呕吐，痰饮喘咳。"),
  defineHerb("bohe", "薄荷", "bohe", "jie_biao", "fa_san_feng_re", "辛，凉", "肺、肝经", "疏散风热，清利头目，利咽透疹。", "风热感冒，头痛目赤，咽喉肿痛。"),
  defineHerb("chaihu", "柴胡", "chaihu", "jie_biao", "fa_san_feng_re", "苦、辛，微寒", "肝、胆、肺经", "解表退热，疏肝解郁，升举阳气。", "少阳往来寒热，胸胁苦满，月经不调。"),

  // 清热：泻火 / 燥湿 / 解毒
  defineHerb("zhizi", "栀子", "zhizi", "qing_re", "qing_re_xie_huo", "苦，寒", "心、肺、三焦经", "泻火除烦，清热利湿，凉血解毒。", "热病心烦，湿热黄疸，血热出血。"),
  defineHerb("huanglian", "黄连", "huanglian", "qing_re", "qing_re_zao_shi", "苦，寒", "心、肝、胃、大肠经", "清热燥湿，泻火解毒。", "湿热泻痢，心烦不寐，痈肿疔疮。"),
  defineHerb("huangqin", "黄芩", "huangqin", "qing_re", "qing_re_zao_shi", "苦，寒", "肺、胆、脾、大肠、小肠经", "清热燥湿，泻火解毒，止血安胎。", "肺热咳嗽，湿热泻痢，血热妄行。"),
  defineHerb("jinyinhua", "金银花", "jinyinhua", "qing_re", "qing_re_jie_du", "甘，寒", "肺、心、胃经", "清热解毒，疏散风热。", "温病发热，痈肿疔疮，热毒血痢。"),

  // 化湿
  defineHerb("huoxiang", "藿香", "huoxiang", "hua_shi", "fang_xiang_hua_shi", "辛，微温", "脾、胃、肺经", "化湿和中，解暑发表。", "湿阻中焦，暑湿吐泻，恶寒发热。"),

  // 利水渗湿
  defineHerb("fuling", "茯苓", "fuling", "li_shui", "li_shui_xiao_zhong", "甘、淡，平", "心、肺、脾、肾经", "利水渗湿，健脾宁心。", "水肿尿少，痰饮眩悸，脾虚食少。"),

  // 温里
  defineHerb("fuzi", "附子", "fuzi", "wen_li", "wen_li_yao", "辛、甘，大热；有毒", "心、肾、脾经", "回阳救逆，补火助阳，散寒止痛。", "亡阳虚脱，肢冷脉微，阳虚水肿。"),
  defineHerb("ganjiang", "干姜", "ganjiang", "wen_li", "wen_li_yao", "辛，热", "脾、胃、肾、心、肺经", "温中散寒，回阳通脉，温肺化饮。", "脘腹冷痛，呕吐泄泻，亡阳厥逆。"),

  // 理气
  defineHerb("chenpi", "陈皮", "chenpi", "li_qi", "li_qi_yao", "苦、辛，温", "脾、肺经", "理气健脾，燥湿化痰。", "脘腹胀满，食少吐泻，咳嗽痰多。"),
  defineHerb("zhishi", "枳实", "zhishi", "li_qi", "li_qi_yao", "苦、辛、酸，微寒", "脾、胃经", "破气消积，化痰散痞。", "积滞内停，痞满胀痛，痰滞气阻。"),

  // 消食
  defineHerb("shanzha", "山楂", "shanzha", "xiao_shi", "xiao_shi_yao", "酸、甘，微温", "脾、胃、肝经", "消食化积，行气散瘀。", "肉食积滞，泻痢不爽，瘀血经闭。"),

  // 活血化瘀
  defineHerb("chuanxiong", "川芎", "chuanxiong", "huo_xue", "huo_xue_zhi_tong", "辛，温", "肝、胆、心包经", "活血行气，祛风止痛。", "胸痹心痛，月经不调，头痛风湿。"),
  defineHerb("danshen", "丹参", "danshen", "huo_xue", "huo_xue_tiao_jing", "苦，微寒", "心、肝经", "活血祛瘀，通经止痛，清心除烦。", "胸痹心痛，脘腹胁痛，热痹肿痛。"),

  // 化痰止咳平喘
  defineHerb("banxia", "半夏", "banxia", "hua_tan", "wen_hua_han_tan", "辛，温；有毒", "脾、胃、肺经", "燥湿化痰，降逆止呕，消痞散结。", "痰多咳喘，痰饮眩悸，风痰眩晕。"),
  defineHerb("jiegeng", "桔梗", "jiegeng", "hua_tan", "qing_hua_re_tan", "苦、辛，平", "肺经", "宣肺祛痰，利咽排脓。", "咳嗽痰多，胸闷不畅，咽痛音哑。"),

  // 安神
  defineHerb("suanzaoren", "酸枣仁", "suanzaoren", "an_shen", "yang_xin_an_shen", "甘、酸，平", "肝、胆、心经", "养心益肝，安神敛汗。", "虚烦不眠，惊悸多梦，体虚多汗。"),

  // 补虚：补气 / 补血 / 补阴
  defineHerb("renshen", "人参", "renshen", "bu_xu", "bu_qi", "甘、微苦，微温", "脾、肺、心、肾经", "大补元气，复脉固脱，补脾益肺。", "体虚欲脱，肢冷脉微，脾虚食少。"),
  defineHerb("huangqi", "黄芪", "huangqi", "bu_xu", "bu_qi", "甘，微温", "肺、脾经", "补气升阳，固表止汗，利水消肿。", "气虚乏力，食少便溏，中气下陷。"),
  defineHerb("gancao", "甘草", "gancao", "bu_xu", "bu_qi", "甘，平", "心、肺、脾、胃经", "补脾益气，清热解毒，调和诸药。", "脾胃虚弱，倦怠乏力，痈肿疮毒。"),
  defineHerb("baizhu", "白术", "baizhu", "bu_xu", "bu_qi", "苦、甘，温", "脾、胃经", "补气健脾，燥湿利水，止汗安胎。", "脾虚食少，腹胀泄泻，痰饮水肿。"),
  defineHerb("danggui", "当归", "danggui", "bu_xu", "bu_xue", "甘、辛，温", "肝、心、脾经", "补血活血，调经止痛，润肠通便。", "血虚萎黄，月经不调，虚寒腹痛。"),
  defineHerb("shudihuang", "熟地黄", "shudihuang", "bu_xu", "bu_xue", "甘，微温", "肝、肾经", "补血滋阴，益精填髓。", "血虚萎黄，肝肾阴虚，腰膝酸软。"),
  defineHerb("baishao", "白芍", "baishao", "bu_xu", "bu_xue", "苦、酸，微寒", "肝、脾经", "养血调经，敛阴止汗，柔肝止痛。", "血虚萎黄，月经不调，肝阳头痛。"),
  defineHerb("maidong", "麦冬", "maidong", "bu_xu", "bu_yin", "甘、微苦，微寒", "心、肺、胃经", "养阴生津，润肺清心。", "肺燥干咳，阴虚燥热，心烦失眠。"),
  defineHerb("gouqizi", "枸杞子", "gouqizi", "bu_xu", "bu_yin", "甘，平", "肝、肾经", "滋补肝肾，益精明目。", "虚劳精亏，腰膝酸痛，眩晕耳鸣。"),
];

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
    origin: "custom",
  };
}

