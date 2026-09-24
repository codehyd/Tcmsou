import { getHerbCategory, getHerbSubclass } from "@/lib/herb-catalog";
import type { Herb } from "@/types/herb";

// 左边说明书只要认得当前这味药，添药入口先不放在这块牌子上
interface HerbDetailInfoProps {
  herb: Herb;
}

// 概述这一章：药名、分类、性味归经、功效主治，都用柜子里已经有的字
// 不在这里补课文。空着的栏藏起来，免得一排空白标题
export function HerbDetailInfo({ herb }: HerbDetailInfoProps) {
  // 一级是章、二级是节，麻黄要写成解表药下面的发散风寒药
  const category = getHerbCategory(herb.categoryId);
  const subclass = getHerbSubclass(herb.subclassId);

  // 节和章同名就只亮一行，免得温里药写两遍
  const showSubclass = Boolean(subclass && subclass.tag !== category?.tag);

  return (
    <section className="w-full min-w-0 text-foreground">
      {/* 药名在上、拼音在下，钉在这一栏顶上，往下翻时名字还在 */}
      <div className="sticky top-0 z-20 flex min-w-0 items-center gap-3 bg-background px-4 py-3 lg:px-8 lg:py-5">
        <span className="size-2.5 shrink-0 rotate-45 bg-intel" />

        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide lg:text-2xl">{herb.name}</h2>

          <p className="mt-1 truncate text-xs tracking-widest text-muted-foreground uppercase">
            {herb.pinyin}
          </p>
        </div>
      </div>

      {/* 短栏目并排，长的功效和主治自己占一整行，大屏才不会挤成一根细条 */}
      <div className="grid grid-cols-1 gap-5 px-4 pb-4 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6 lg:px-8 lg:pb-8">
        <InfoBlock title="功效分类" body={category?.tag ?? "未分类"} />

        {showSubclass ? <InfoBlock title="功用小类" body={subclass?.tag ?? ""} /> : null}

        <InfoBlock title="性味" body={herb.nature} />

        <InfoBlock title="归经" body={herb.meridians} />

        <InfoBlock title="功效" body={herb.functions} wide />

        <InfoBlock title="主治" body={herb.indications} wide />
      </div>
    </section>
  );
}

// 说明书上的一小段：标题像栏目，正文像展签说明，空着就藏起来免得空白栏吓人
function InfoBlock({
  title,
  body,
  // 功效、主治句子长，大屏横跨两列，短栏目才并排
  wide = false,
}: {
  title: string;
  body: string;
  wide?: boolean;
}) {
  // 用户自添时某栏可能空着，空栏不占地方
  if (!body) {
    return null;
  }

  return (
    <div className={wide ? "min-w-0 lg:col-span-2" : "min-w-0"}>
      {/* 栏目标题用青字、字距拉开，和下面的说明分开，扫的时候先看到题目 */}
      <p className="text-xs font-medium tracking-[0.22em] text-intel">{title}</p>

      <p className="mt-1.5 text-sm leading-relaxed break-words text-foreground/90">{body}</p>
    </div>
  );
}
