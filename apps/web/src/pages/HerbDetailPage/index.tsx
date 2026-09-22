import { Navigate, useParams } from "react-router";

import { herbDetail } from "./styles";
import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { HerbDetailInfo } from "@/rooms/detail/components/HerbDetailInfo";
import { HerbExhibitScene } from "@/rooms/detail/components/HerbExhibitScene";
import { HerbSwitchCabinet } from "@/rooms/detail/components/HerbSwitchCabinet";
import { countAllHerbs, getHerbById } from "@/lib/herb-catalog";
import { useCabinetHerbs } from "@/store/herb-cabinet";

// 点开一味药后来到的展厅：中间灯箱、左边说明书、右边换展柜
// 3D 模型没到货，先用 2D 悬浮顶着；添药入口先收起来，免得空按钮占着说明书
export function HerbDetailPage() {
  const { herbId = "" } = useParams();

  // 教材册加自添药，详情和右边展柜都看这一份
  const herbs = useCabinetHerbs();

  // 按门牌找出当前这味药，找不到就说明地址写错了
  const herb = getHerbById(herbs, herbId);

  // 本室现货数，顶栏和列表页同一口径
  const herbCount = countAllHerbs(herbs);

  // 门牌对不上就领回列表，免得空展厅让人以为坏了
  if (!herb) {
    return <Navigate to="/collection" replace />;
  }

  return (
    <div className={herbDetail.page()}>
      <CollectionHeader title="收藏柜" herbCount={herbCount} backTo="/collection" />

      <div className={herbDetail.stage()}>
        {/* 灯箱在中，说明书叠在左边；窄屏改成先看灯箱再看说明书，免得字把药挡住 */}
        <div className={herbDetail.exhibitColumn()}>
          <div className={herbDetail.exhibitFrame()}>
            <HerbExhibitScene key={herb.id} herb={herb} />
          </div>

          <div className={herbDetail.infoLayer()}>
            <div className={herbDetail.infoPanel()}>
              <HerbDetailInfo herb={herb} />
            </div>
          </div>
        </div>

        <HerbSwitchCabinet herbs={herbs} activeId={herb.id} />
      </div>
    </div>
  );
}
