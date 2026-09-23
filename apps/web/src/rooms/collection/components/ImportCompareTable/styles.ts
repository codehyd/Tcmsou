import { cva } from "class-variance-authority";

// 整包对照表的样式：上面是筛子，下面是能横竖滚的大表

// 表占满导入窗剩下的高度，像一张摊开的进货单
export const compareTable = {
  root: cva("flex min-h-0 flex-1 flex-col gap-3"),

  // 状态筛子和药名搜索并排，窄屏再换行
  toolbar: cva("flex flex-wrap items-center gap-2"),

  // 点哪个状态，就像把进货单翻到那一叠
  filter: cva("rounded-sm border px-2 py-1 text-xs", {
    variants: {
      active: {
        true: "border-intel/55 bg-intel/10 text-foreground",
        false: "border-white/10 text-muted-foreground hover:border-white/20",
      },
    },
    defaultVariants: {
      active: false,
    },
  }),

  // 横竖都在这一格里滚，虚拟行才知道窗口有多高
  scroller: cva("min-h-0 flex-1 overflow-auto rounded-sm border border-white/30"),

  // 列宽固定成一条轨道，表头和每一行都走同一条，免得字对不齐。列与列之间靠边框分开，不再挤在一起
  track: cva(
    "grid grid-cols-[2.75rem_13rem_5.5rem_minmax(11rem,1.15fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(14rem,1.45fr)_minmax(16rem,1.7fr)]",
  ),

  // 表头钉在滚动区顶部，往下翻时栏目名还在
  head: cva("sticky top-0 z-20 border-b border-white/25 bg-background text-xs text-muted-foreground"),

  // 每一格的框线，横竖都能对上，像账本上的格子
  cell: cva("border-r border-white/20 px-3 py-3 last:border-r-0"),

  // 一味药一行。无变化的淡一点，表示表里有它、柜不用改
  row: cva("border-b border-white/20 text-sm", {
    variants: {
      quiet: {
        true: "text-muted-foreground",
        false: "text-foreground",
      },
    },
    defaultVariants: {
      quiet: false,
    },
  }),

  // 药名钉在左边，横着滚时名字不跟着跑走。整格都能点，用来拨最左边的勾
  nameCell: cva("sticky left-0 z-10 border-r border-white/20 bg-background px-3 py-3", {
    variants: {
      clickable: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      clickable: false,
    },
  }),

  // 差异格里的一边：点中的亮，没点的暗，像两张纸条叠着选一张
  side: cva("rounded-sm border px-2 py-1.5 text-left text-xs leading-relaxed break-words", {
    variants: {
      selected: {
        true: "border-intel/55 bg-intel/10 text-foreground",
        false: "border-white/10 bg-white/5 text-cabinet-muted hover:border-white/20",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }),
};
