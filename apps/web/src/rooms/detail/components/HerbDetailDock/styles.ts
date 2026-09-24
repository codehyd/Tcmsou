import { cva } from "class-variance-authority";

// 手机详情脚下那条：左右换邻居，中间打开全部药单
export const detailDock = {
  // 贴在页面底，大屏换药柜还在右边，这条就收起来
  bar: cva(
    "flex shrink-0 items-stretch gap-1 border-t border-white/8 bg-dock px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] lg:hidden",
  ),

  // 左右两格横着排：箭头和药名同一行，没邻居时变淡
  step: cva(
    "flex min-w-0 flex-1 items-center gap-1 rounded-sm px-2 py-2.5 text-foreground",
    {
      variants: {
        side: {
          previous: "justify-start",
          next: "justify-end",
        },
        idle: {
          true: "pointer-events-none text-muted-foreground/35",
          false: "active:bg-white/5",
        },
      },
    },
  ),

  // 邻居的药名，太长就省略，别把底栏撑出屏幕
  name: cva("min-w-0 truncate text-sm"),

  // 中间「全部」，像拉开抽屉的把手
  all: cva(
    "flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1.5 text-foreground hover:bg-white/5",
  ),
};
