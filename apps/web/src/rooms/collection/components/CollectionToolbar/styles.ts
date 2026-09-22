import { cva } from "class-variance-authority";

// 搜索条：窄屏一列，大屏跟下拉排成一排
export const toolbar = {
  // 整条工具，超宽时搜索不要拉成跑道
  row: cva(
    "flex w-full min-w-0 max-w-full flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-4",
  ),

  // 搜药框占满一行，超宽屏加个上限
  search: cva("relative w-full min-w-0 flex-1 lg:max-w-xl 3xl:max-w-2xl"),

  // 放大镜钉在输入框左边
  searchIcon: cva(
    "pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground",
  ),

  // 输入框比默认略高一档，左边给放大镜留空
  input: cva("h-9 rounded-sm bg-white/5 pl-8 text-base md:h-8"),

  // 大屏才把分类和排序跟搜索排成一排
  filters: cva("hidden lg:flex lg:items-center lg:gap-3"),
};
