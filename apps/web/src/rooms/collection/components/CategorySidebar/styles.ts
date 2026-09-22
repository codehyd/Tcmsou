import { cva } from "class-variance-authority";

// 左侧功效列：窄屏改横滑，大屏才摆回这排柜门
export const categorySidebar = {
  // 超宽屏略加宽，字和数字才不挤
  shell: cva(
    "hidden h-full w-52 shrink-0 flex-col border-r border-white/8 bg-dock lg:flex 2xl:w-56 3xl:w-60",
  ),

  // 列头，标明这排抽屉按功效分
  title: cva("px-3 py-3 text-xs tracking-widest text-muted-foreground"),

  // 柜门清单可滚动，分类多了也不把右边收藏柜挤没
  list: cva("flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3"),
};
