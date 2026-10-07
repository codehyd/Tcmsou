import { cva } from "class-variance-authority";

export const herbPicker = {
  wrap: cva("relative min-w-36"),

  input: cva(
    "h-8 w-full rounded-sm border border-white/15 bg-transparent px-2 text-sm outline-none focus:border-intel/50",
  ),

  // 挂在页面最外层，贴着输入框，不跟表格的滚动条一起被裁掉
  menu: cva(
    "fixed z-30 flex flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-lg",
  ),

  // 分类横滑。选中的用青色，和收藏室柜门同一套
  filters: cva("flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-2 py-1.5"),

  chip: cva("shrink-0 rounded-sm px-2 py-0.5 text-xs", {
    variants: {
      active: {
        true: "bg-intel/15 text-intel",
        false: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }),

  list: cva("min-h-0 overflow-y-auto py-1"),

  option: cva(
    "flex w-full flex-col items-start gap-0.5 px-2 py-1.5 text-left hover:bg-white/5",
  ),

  optionHead: cva("flex w-full items-center justify-between gap-3 text-sm"),

  // 分类、性味、功效，只在选药时用来认这味药
  optionMeta: cva("w-full truncate text-xs text-muted-foreground"),

  taken: cva("shrink-0 text-[10px] text-muted-foreground"),

  empty: cva("px-2 py-2 text-xs text-muted-foreground"),
};
