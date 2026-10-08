import { Link } from "react-router";

import { HerbCategoryTag } from "@/rooms/collection/components/HerbCategoryTag";
import { HerbPlaceholder } from "@/rooms/collection/components/HerbPlaceholder";
import { herbCard } from "./styles";
import { getHerbClassTag, getProcessChildren } from "@/lib/herb-catalog";
import type { Herb } from "@/types/herb";

// 一张收藏卡要亮的身份：药名、分类签、功效短句、以及有没有图
interface HerbCardProps {
  herb: Herb;
  // 抽屉里当前正在看的那味，边框亮一圈，免得滚过去还认不出
  active?: boolean;
  // 收藏柜才传。详情里的换药架不放这两颗按钮
  onEdit?: (herb: Herb) => void;
  onDelete?: (herb: Herb) => void;
}

// 收藏柜里的一张药卡：左写名字和功效，右放 empty 图位
// 功效写出来才不像空盒子；「暂无模型」不再占地方，空图自己会说话
export function HerbCard({ herb, active = false, onEdit, onDelete }: HerbCardProps) {
  // 没图时用药名首字撑场面，陈皮显示「陈」
  const placeholderMark = herb.name.slice(0, 1);

  // 卡片贴二级小类：麻黄写发散风寒药，比只写解表药更贴教材
  const classTag = getHerbClassTag(herb);

  // 柜上不另开卡：炮制写原名，来源写可在拟方里再选的货品名
  const processNames = getProcessChildren(herb).map((child) => child.name);
  const sourceNames = herb.sources ?? [];

  return (
    <article className={herbCard.article({ active })}>
      {/* 点药名和图进详情。编辑、删除留在链接外面 */}
      <Link to={`/collection/${herb.id}`} className={herbCard.link()}>
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

          {processNames.length > 0 ? (
            <p className={herbCard.sources()}>炮制 {processNames.join("、")}</p>
          ) : null}

          {sourceNames.length > 0 ? (
            <p className={herbCard.sources()}>来源 {sourceNames.join("、")}</p>
          ) : null}
        </div>

        {/* 功效短句最多两行；中文没有空格，不折行就会把卡片撑出手机屏幕。字色跟柜体 token，比以前那档浅灰更像开了灯 */}
        {herb.functions.trim() ? (
          <p className={herbCard.functions()}>
            {herb.functions}
          </p>
        ) : null}
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
      </Link>

      {onEdit || onDelete ? (
        <div className={herbCard.actions()}>
          {onEdit ? (
            <button type="button" className={herbCard.edit()} onClick={() => onEdit(herb)}>
              编辑
            </button>
          ) : null}

          {onDelete ? (
            <button type="button" className={herbCard.remove()} onClick={() => onDelete(herb)}>
              删除
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}