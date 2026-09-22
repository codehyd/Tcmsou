import { getHerbCategory, getHerbSubclass } from "@/lib/herb-catalog";
import type { Herb } from "@/types/herb";

// 左边说明书只要认得当前这味药，添药入口先不放在这块牌子上
interface HerbDetailInfoProps {
  herb: Herb;
}

// 详情左侧资料板：药名、分类、性味归经、功效主治
// 添药按钮先撤掉，这块地方留给以后的图库和 3D，免得空按钮占着说明书
export function HerbDetailInfo({ herb }: HerbDetailInfoProps) {
  // 一级是章、二级是节，麻黄要写成解表药下面的发散风寒药
  const category = getHerbCategory(herb.categoryId);
  const subclass = getHerbSubclass(herb.subclassId);

  // 节和章同名就只亮一行，免得温里药写两遍
  const showSubclass = Boolean(subclass && subclass.tag !== category?.tag);

  // 药从哪来：药包导入、以前自添、还是印在教材册上
  const originLabel =
    herb.origin === "imported"
      ? "药包导入"
      : herb.origin === "custom"
        ? "自行添入"
        : "本室典籍";

  return (
    <section className="flex max-h-full min-w-0 flex-col gap-3 overflow-y-auto p-4 text-foreground lg:max-w-sm lg:p-5">
      <div className="flex min-w-0 items-center gap-2">
        {/* 参考图里药名前面那颗菱形灯，点亮才知道这是当前展品 */}
        <span className="size-2.5 shrink-0 rotate-45 bg-intel" />

        <h2 className="truncate text-xl font-medium tracking-wide">{herb.name}</h2>
      </div>

      <p className="text-xs tracking-widest text-muted-foreground uppercase">{herb.pinyin}</p>

      {/* 对标展位等级 / 拥有数量：我们改成分类和来源，数量以后接库存再填 */}
      <dl className="space-y-1 text-sm text-cabinet-muted">
        {/* 章名先写：解表、清热这些大柜门 */}
        <div>
          <dt className="inline text-muted-foreground">功效分类：</dt>
          <dd className="inline">{category?.tag ?? "未分类"}</dd>
        </div>

        {showSubclass ? (
          <div>
            {/* 节名后写：麻黄要落到发散风寒，不能停在解表一层 */}
            <dt className="inline text-muted-foreground">功用小类：</dt>
            <dd className="inline">{subclass?.tag}</dd>
          </div>
        ) : null}

        <div>
          <dt className="inline text-muted-foreground">收录来源：</dt>
          <dd className="inline">{originLabel}</dd>
        </div>
      </dl>

      <InfoBlock title="性味" body={herb.nature} />

      <InfoBlock title="归经" body={herb.meridians} />

      <InfoBlock title="功效" body={herb.functions} />

      <InfoBlock title="主治" body={herb.indications} />
    </section>
  );
}

// 说明书上的一小段：标题像栏目，正文像展签说明，空着就藏起来免得空白栏吓人
function InfoBlock({ title, body }: { title: string; body: string }) {
  // 用户自添时某栏可能空着，空栏不占地方
  if (!body) {
    return null;
  }

  return (
    <div className="min-w-0">
      <p className="text-xs tracking-widest text-muted-foreground">{title}</p>

      <p className="mt-1 text-sm leading-relaxed break-words text-cabinet-muted">{body}</p>
    </div>
  );
}
