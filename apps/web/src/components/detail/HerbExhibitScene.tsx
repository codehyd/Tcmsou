import { Link } from "react-router";

import { HerbExhibitProp } from "@/components/detail/HerbExhibitProp";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Herb } from "@/types/herb";

// 展厅中央要摆哪味药，卸下按钮把人领回列表
interface HerbExhibitSceneProps {
  herb: Herb;
}

// 详情中间那间展厅：暖色灯箱当背景，药悬浮在灯下
// 3D 场景没到货前先用 2D 灯箱顶着，像装修没完先挂布景板
export function HerbExhibitScene({ herb }: HerbExhibitSceneProps) {
  return (
    <div className="relative h-full min-w-0 overflow-hidden bg-exhibit">
      {/* 顶灯洒下来的一圈光，把展品从墙里托出来 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.04_95_/_0.9),transparent_70%)]"
      />

      {/* 四边暗一点，像库房门框，中间留出暖黄展位 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,oklch(0.16_0.02_250_/_0.55)_0%,transparent_18%,transparent_82%,oklch(0.16_0.02_250_/_0.45)_100%)]"
      />

      <div className="relative flex h-full items-center justify-center px-4 py-8 lg:pl-80">
        <HerbExhibitProp herb={herb} />
      </div>

      {/* 对标参考图里的「卸下」：看完这味就回列表，像把展品从灯下拿走 */}
      <div className="absolute inset-x-0 bottom-4 hidden justify-center lg:bottom-6 lg:flex">
        <Link
          to="/collection"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "min-w-28 rounded-sm bg-black/55 text-foreground hover:bg-black/70",
          )}
        >
          返回展柜
        </Link>
      </div>
    </div>
  );
}
