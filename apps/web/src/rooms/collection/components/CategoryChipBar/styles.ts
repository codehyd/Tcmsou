import { cva } from "class-variance-authority";

// 窄屏横滑分类签：轨道管滑动，标签管亮不亮

// 选中亮青底，没选中是淡玻璃，像菜单上被点亮的那一格
export const categoryChip = cva(
  "shrink-0 snap-start rounded-sm border px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors",
  {
    variants: {
      active: {
        true: "border-intel/50 bg-intel/15 text-intel",
        false: "border-white/12 bg-white/5 text-foreground/80",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

// 整条标签的轨道和右边那层淡边
export const chipBar = {
  // 整条相对定位，好把右边的淡边盖上去
  frame: cva("relative w-full min-w-0 max-w-full"),

  // 只在这一行里横滑，不把整张桌子拽歪
  track: cva(
    "flex w-full min-w-0 max-w-full snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [-ms-overflow-style:none] touch-pan-x [&::-webkit-scrollbar]:hidden",
  ),

  // 右边淡一层，提示后面还有柜门
  fade: cva(
    "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent",
  ),

  // 标签上的现货数
  count: cva("ml-1.5 tabular-nums opacity-80"),
};
