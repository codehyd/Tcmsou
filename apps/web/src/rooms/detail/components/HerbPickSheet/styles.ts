import { cva } from "class-variance-authority";

// 从脚底升上来的全部药单。开关动画跟在 Base UI 抽屉的状态上
export const pickSheet = {
  // 暗幕先淡入。正在用手拖的时候不要补过渡，免得拖动手感发黏
  backdrop: cva(
    "fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:transition-none",
  ),

  // 抽屉的定位层：贴在屏幕底边，弹出物从这里长出来
  viewport: cva("fixed inset-0 z-50 flex items-end justify-center"),

  // 整块抽屉上滑。起步和收起时先藏在屏幕外，拖动时跟上手指
  popup: cva(
    "w-full translate-y-[var(--drawer-snap-point-offset,0px)] outline-none transition-transform duration-300 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full data-swiping:transition-none",
  ),

  // 抽屉身子：最高大约七成屏，免得把顶栏也盖死
  panel: cva(
    "flex max-h-[min(72dvh,36rem)] min-h-0 flex-col rounded-t-sm border border-white/10 bg-background",
  ),

  // 顶上那条小把手，提示可以往下拨回去
  handle: cva("mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/25"),

  // 抽屉抬头：说明这是全部药，旁边一颗关上
  head: cva("flex shrink-0 items-center justify-between gap-3 px-4 py-3"),

  // 药卡在这里滚，和收藏室用同一套格子
  scroller: cva("min-h-0 flex-1 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"),
};
