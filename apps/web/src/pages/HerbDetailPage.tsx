import { Navigate, useParams } from "react-router";

import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { HerbDetailInfo } from "@/components/detail/HerbDetailInfo";
import { HerbExhibitScene } from "@/components/detail/HerbExhibitScene";
import { HerbSwitchCabinet } from "@/components/detail/HerbSwitchCabinet";
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
    <div className="flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <CollectionHeader title="收藏柜" herbCount={herbCount} backTo="/collection" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* 灯箱在中，说明书叠在左边；窄屏改成先看灯箱再看说明书，免得字把药挡住 */}
        <div className="relative flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
          <div className="h-64 shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
            <HerbExhibitScene key={herb.id} herb={herb} />
          </div>

          <div className="relative z-10 lg:pointer-events-none lg:absolute lg:inset-0 lg:flex lg:items-start">
            <div className="bg-background lg:pointer-events-auto lg:w-auto lg:bg-gradient-to-r lg:from-black/60 lg:via-black/35 lg:to-transparent">
              <HerbDetailInfo herb={herb} />
            </div>
          </div>
        </div>

        <HerbSwitchCabinet herbs={herbs} activeId={herb.id} />
      </div>
    </div>
  );
}
