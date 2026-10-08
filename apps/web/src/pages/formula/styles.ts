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

  // 处方名比剂数、用法长，单独给宽一点
  nameField: cva("flex min-w-48 flex-1 flex-col gap-1 text-xs text-muted-foreground"),

  input: cva(
    "h-8 rounded-sm border border-white/15 bg-transparent px-2 text-sm text-foreground outline-none focus:border-intel/50",
  ),

  // 保存时必填的栏。星号标在名称后面，草稿可以先空着
  required: cva("ml-0.5 text-destructive"),

  // 共几付、一日几剂、一次几剂算出来的那一句，单独占工具条的下一行
  courseHint: cva("basis-full text-xs text-muted-foreground"),

  status: cva("text-xs text-intel"),

  // 状态和两个保存按钮靠工具条右侧，不跟剂数、用法挤在一起
  saveBar: cva("ml-auto flex items-center gap-2"),

  saveDraft: cva(
    "rounded-sm border border-white/15 px-3 py-1.5 text-sm hover:border-intel/40 hover:text-intel",
  ),

  save: cva("rounded-sm border border-intel/50 bg-intel/15 px-3 py-1.5 text-sm text-intel hover:bg-intel/25"),

  // 保存结果浮在页面中间。点暗处或「知道了」关掉
  dialogBackdrop: cva("fixed inset-0 z-50 flex items-center justify-center p-4"),

  dialogScrim: cva("absolute inset-0 bg-black/65"),

  dialog: cva(
    "relative z-10 w-full max-w-sm rounded-sm border border-white/10 bg-background px-4 py-4 shadow-2xl",
  ),

  dialogTitle: cva("text-sm font-medium"),

  dialogBody: cva("mt-2 text-sm leading-relaxed text-muted-foreground"),

  dialogFooter: cva("mt-4 flex justify-end"),

  body: cva("min-h-0 min-w-0 flex-1 overflow-auto px-4 py-3"),

  tableScroll: cva("overflow-x-auto"),

  actions: cva("mt-4 flex gap-2"),
};

export const formulaTable = {
  // 列宽按下面的 col 固定，边框分开。点药名打开下拉时，不再按输入框把表格撑开
  table: cva("w-full min-w-[520px] table-fixed border-separate border-spacing-0 text-sm"),

  colName: cva("w-[26%]"),

  colDose: cva("w-[16%]"),

  colSelect: cva("w-[16%]"),

  colAction: cva("w-[10%]"),

  head: cva("border-b border-white/10 text-left text-xs text-muted-foreground"),

  cell: cva("border-b border-white/6 px-2 py-2 align-middle"),

  // 药名列锁在 col 的宽度里。名字长了就省略，不把旁边的列挤开
  nameCellTd: cva("max-w-0 overflow-hidden border-b border-white/6 px-2 py-2 align-middle"),

  name: cva("font-medium"),

  // 药名可点。点开后下拉挂在按钮旁边，格子里仍是这一行的药名
  nameButton: cva("min-w-0 flex-1 truncate text-left font-medium hover:text-intel"),

  nameCell: cva("flex min-w-0 items-center gap-1.5"),

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
