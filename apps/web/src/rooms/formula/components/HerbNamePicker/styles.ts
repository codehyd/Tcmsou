import { cva } from "class-variance-authority";

export const herbPicker = {
  wrap: cva("relative min-w-36"),

  input: cva(
    "h-8 w-full rounded-sm border border-white/15 bg-transparent px-2 text-sm outline-none focus:border-intel/50",
  ),

  // 挂在页面最外层，贴着药名或输入框，不跟表格的滚动条一起被裁掉
  menu: cva(
    "fixed z-30 flex flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-lg",
  ),

  // 点表格里的药名时，搜索框放在下拉里，不占表格格子
  menuSearch: cva("shrink-0 border-b border-white/10 p-2"),

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

  // 有子项时整组框在本尊下面。边框把这一味和下一味切开，不跟本尊贴成一块
  childGroup: cva("mx-2 mb-1.5 overflow-hidden rounded-sm border border-white/15 bg-white/3"),

  // 子项横着两栏：左边药名和功效，右边固定写炮制或来源。点它选的是子项，不是本尊
  child: cva(
    "grid w-full grid-cols-[minmax(0,1fr)_4.25rem] border-b border-white/10 text-left last:border-b-0 hover:bg-white/5",
  ),

  // 左栏：子项药名，下面是它自己的功效
  childBody: cva("flex min-w-0 flex-col items-start gap-0.5 px-2 py-1.5"),

  childName: cva("w-full truncate text-sm"),

  // 右栏和药名用竖线隔开，两个字居中，扫列表时能对上是炮制还是来源
  childRail: cva("flex flex-col items-center justify-center gap-0.5 border-l border-white/15 px-1"),

  // 子项右栏的「炮制」「来源」。字号跟本尊药名一样，加粗，两个字才看得清
  childKind: cva("text-sm font-medium text-intel"),

  // 这味药或这个子项已经写进方子。本尊标在药名右侧，子项标在右栏「炮制 / 来源」下面
  taken: cva("shrink-0 text-xs text-muted-foreground"),

  empty: cva("px-2 py-2 text-xs text-muted-foreground"),
};
