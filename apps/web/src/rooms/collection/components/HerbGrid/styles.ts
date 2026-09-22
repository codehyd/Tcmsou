import { cva } from "class-variance-authority";

// 药卡网格：越宽列越多，2560 上六列
export const herbGrid = {
  // 搜空了别摆空柜
  empty: cva("flex h-48 items-center justify-center text-sm text-muted-foreground"),

  // 窄屏一列，断点往上加列、加间距
  grid: cva(
    "grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 2xl:gap-4 3xl:grid-cols-5 4xl:grid-cols-6 4xl:gap-5",
  ),
};
