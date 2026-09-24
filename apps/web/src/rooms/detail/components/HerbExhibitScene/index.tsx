import { HerbExhibitProp } from "@/rooms/detail/components/HerbExhibitProp";
import type { Herb } from "@/types/herb";

// 顶上灯箱要摆哪味药。scale 只缩模型，背景始终铺满，免得缩小后两边露出另一层颜色
interface HerbExhibitSceneProps {
  herb: Herb;
  scale?: number;
}

// 详情中间那间展厅：暖色灯箱当背景，药悬浮在灯下
// 3D 场景没到货前先用 2D 灯箱顶着，像装修没完先挂布景板
export function HerbExhibitScene({ herb, scale = 1 }: HerbExhibitSceneProps) {
  return (
    <div className="relative h-full min-w-0 overflow-hidden bg-exhibit">
      {/* 顶灯洒下来的一圈光，铺满整条灯箱，缩小后颜色还是这一块 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.9_0.045_95),transparent_72%)]"
      />

      {/* 只缩中间的模型，背景不跟着缩，左右才不会露出深色边 */}
      <div
        className="relative flex h-full items-center justify-center px-4"
        style={{ transform: `scale(${scale})` }}
      >
        <HerbExhibitProp herb={herb} />
      </div>
    </div>
  );
}
