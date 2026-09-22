import { Link } from "react-router";

import { HerbCategoryTag } from "@/rooms/collection/components/HerbCategoryTag";
import { HerbPlaceholder } from "@/rooms/collection/components/HerbPlaceholder";
import { herbCard } from "./styles";
import { getHerbClassTag } from "@/lib/herb-catalog";
import type { Herb } from "@/types/herb";

// 一张收藏卡要亮的身份：药名、分类签、功效短句、以及有没有图
interface HerbCardProps {
  herb: Herb;
}

// 收藏柜里的一张药卡：左写名字和功效，右放 empty 图位
// 功效写出来才不像空盒子；「暂无模型」不再占地方，空图自己会说话
export function HerbCard({ herb }: HerbCardProps) {
  // 没图时用药名首字撑场面，陈皮显示「陈」
  const placeholderMark = herb.name.slice(0, 1);

  // 卡片贴二级小类：麻黄写发散风寒药，比只写解表药更贴教材
  const classTag = getHerbClassTag(herb);

  return (
    // 整张卡是门：点一下就进这味药的展厅，像伸手把货从架子上取下来
    <Link to={`/collection/${herb.id}`} className={herbCard.link()}>
      <article className={herbCard.article()}>
      {/* 左栏：名字、分类签、拼音、这味药干什么 */}
      <div className={herbCard.body()}>
        <div className="min-w-0">
          <div className={herbCard.titleRow()}>
            {/* 药名略加大、走前景色，暗底上才像货牌而不是铅笔淡字 */}
            <h3 className={herbCard.name()}>
              {herb.name}
            </h3>

            {/* 有小类才贴标签，像货架价签不能空着贴 */}
            {classTag !== "未分类" ? <HerbCategoryTag label={classTag} /> : null}
          </div>

          <p className={herbCard.pinyin()}>
            {herb.pinyin}
          </p>
        </div>

        {/* 功效短句最多两行；中文没有空格，不折行就会把卡片撑出手机屏幕。字色跟柜体 token，比以前那档浅灰更像开了灯 */}
        <p className={herbCard.functions()}>
          {herb.functions}
        </p>
      </div>

      {/* 右栏固定一小块 empty 位，窄屏用绝对宽度，避免百分比跟着被撑宽的父级一起跑偏 */}
      <div className={herbCard.figure()}>
        {herb.image ? (
          <img
            src={herb.image}
            alt={herb.name}
            className={herbCard.image()}
          />
        ) : (
          <HerbPlaceholder mark={placeholderMark} />
        )}
      </div>
    </article>
    </Link>
  );
}