import { cva } from "class-variance-authority";

export const formulaPage = {
  page: cva(
    "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground",
  ),

  stage: cva("flex min-h-0 min-w-0 w-full flex-1 overflow-hidden"),

  main: cva("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"),

  toolbar: cva(
    "flex shrink-0 flex-wrap items-end gap-3 border-b border-white/8 px-4 py-3",
  ),

  field: cva("flex min-w-36 flex-col gap-1 text-xs text-muted-foreground"),

  input: cva(
    "h-8 rounded-sm border border-white/15 bg-transparent px-2 text-sm text-foreground outline-none focus:border-intel/50",
  ),

  status: cva("text-xs text-intel"),

  body: cva("min-h-0 min-w-0 flex-1 overflow-auto px-4 py-3"),

  tableScroll: cva("overflow-x-auto"),

  actions: cva("mt-4 flex gap-2"),
};

export const formulaTable = {
  // 分开边框，拖动时整行的位移才不会被表格粘住
  table: cva("w-full min-w-[520px] border-separate border-spacing-0 text-sm"),

  head: cva("border-b border-white/10 text-left text-xs text-muted-foreground"),

  cell: cva("border-b border-white/6 px-2 py-2 align-middle"),

  name: cva("font-medium"),

  nameCell: cva("flex items-center gap-1.5"),

  // 只有这个把手能拖。按住后整行会抽出来，不拖输入框和删除
  dragHandle: cva(
    "flex size-7 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground hover:text-foreground active:cursor-grabbing",
  ),

  // 原位置留一层淡的，表示这一行已经被抽走
  rowDragging: cva("opacity-40"),

  // 跟着指针走的那一份。脱离表格，带上阴影，看起来是从表格里抽出来的
  overlay: cva(
    "flex min-w-[28rem] cursor-grabbing items-center gap-6 rounded-sm border border-intel/40 bg-background px-3 py-2 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.45)]",
  ),

  dose: cva(
    "h-8 w-20 rounded-sm border border-white/15 bg-transparent px-2 text-sm outline-none focus:border-intel/50",
  ),

  doseRow: cva("flex items-center gap-2"),

  unit: cva("text-muted-foreground"),

  // 脚注下拉。系统自带箭头贴边，这里改成自己画的箭头，右边留出空隙
  selectWrap: cva("relative inline-flex"),

  select: cva(
    "h-8 min-w-20 appearance-none rounded-sm border border-white/15 bg-background pr-9 pl-2.5 text-sm outline-none focus:border-intel/50",
  ),

  // 来源名字比炮制长，下拉宽一些才装得下蒙古黄芪这类
  sourceSelect: cva(
    "h-8 min-w-28 appearance-none rounded-sm border border-white/15 bg-background pr-9 pl-2.5 text-sm outline-none focus:border-intel/50",
  ),

  selectIcon: cva(
    "pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground",
  ),

  iconButton: cva(
    "rounded-sm border border-white/10 px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30",
  ),
};

export const formulaList = {
  main: cva("min-h-0 flex-1 overflow-auto px-4 py-4"),

  create: cva(
    "rounded-sm border border-white/15 px-3 py-1.5 text-sm hover:border-intel/40 hover:text-intel",
  ),

  grid: cva("mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"),

  card: cva(
    "flex flex-col gap-2 rounded-sm border border-white/10 bg-white/5 p-3 text-left hover:border-intel/30",
  ),

  title: cva("text-sm font-medium"),

  meta: cva("text-xs text-muted-foreground"),

  ready: cva("text-xs text-intel"),

  draft: cva("text-xs text-muted-foreground"),

  empty: cva("mt-8 text-sm text-muted-foreground"),
};
