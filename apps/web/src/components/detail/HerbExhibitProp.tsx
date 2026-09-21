import { HerbPlaceholder } from "@/components/collection/HerbPlaceholder";
import type { Herb } from "@/types/herb";

// 展台中央要亮的那味药：有图挂照片，没图用首字撑场面
interface HerbExhibitPropProps {
  herb: Herb;
}

// 2D 展品：先让药在灯下轻轻浮着，3D 模型到货再换这一块
// 像橱窗里的样品还没换成立体雕塑，先用立牌占着
export function HerbExhibitProp({ herb }: HerbExhibitPropProps) {
  // 没图时用药名首字当展签，陈皮就写「陈」
  const mark = herb.name.slice(0, 1);

  return (
    <div className="animate-exhibit-float flex flex-col items-center">
      {/* 灯下那块展品，有照片就挂真容，没有就用 empty 立牌 */}
      <div className="flex size-40 items-center justify-center rounded-sm bg-black/35 p-2 shadow-[0_22px_40px_oklch(0_0_0_/_0.35)] sm:size-48 lg:size-56">
        {herb.image ? (
          <img
            src={herb.image}
            alt={herb.name}
            className="h-full w-full object-contain drop-shadow-[0_18px_24px_oklch(0_0_0_/_0.35)]"
          />
        ) : (
          <HerbPlaceholder mark={mark} />
        )}
      </div>

      {/* 脚下那团影子，让它看起来是浮在展台中央，不是贴在墙上的贴纸 */}
      <div className="mt-6 h-3 w-28 rounded-full bg-black/25 blur-[2px] sm:w-36" />

      <p className="mt-4 text-sm tracking-[0.35em] text-black/45 uppercase">
        {herb.pinyin}
      </p>
    </div>
  );
}
