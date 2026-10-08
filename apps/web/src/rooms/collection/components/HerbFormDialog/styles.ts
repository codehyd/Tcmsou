import { cva } from "class-variance-authority";

// 新增和编辑共用的窗：暗底挡住货架，中间一张表

export const herbForm = {
  // 贴在屏幕上。手机从底下顶上来，宽屏浮在中间
  backdrop: cva(
    "fixed inset-0 z-50 flex flex-col justify-end px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:justify-center sm:p-3",
  ),

  // 点暗处关掉
  scrim: cva("absolute inset-0 bg-black/65"),

  // 中间这张表。手机跟着屏幕长，宽屏不超过一屏
  sheet: cva(
    "relative z-10 flex max-h-[min(92dvh,40rem)] w-full min-h-0 flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-2xl sm:max-w-lg",
  ),

  // 窗头
  header: cva("border-b border-white/8 px-4 py-3"),

  title: cva("text-sm font-medium"),

  hint: cva("mt-1 text-xs leading-relaxed text-muted-foreground"),

  // 表单自己滚，底栏钉在下面
  body: cva("min-h-0 flex-1 overflow-y-auto px-4 py-3"),

  fields: cva("grid grid-cols-1 gap-3 sm:grid-cols-2"),

  field: cva("flex min-w-0 flex-col gap-1"),

  // 功效和主治句子长，横跨两列
  wide: cva("sm:col-span-2"),

  label: cva("text-xs text-muted-foreground"),

  control: cva(
    "h-8 w-full rounded-sm border border-white/15 bg-transparent px-2 text-sm outline-none focus:border-intel/50",
  ),

  area: cva(
    "min-h-20 w-full rounded-sm border border-white/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-intel/50",
  ),

  error: cva("mt-3 text-xs text-red-300"),

  footer: cva("flex items-center justify-end gap-2 border-t border-white/8 px-4 py-3"),
};
