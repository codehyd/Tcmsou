import { cva } from "class-variance-authority";

// 右侧主舞台：搜索、分类签、药卡都在这一列里滚
export const cabinet = {
  // 柜体自己滚动，左右按安全区留白
  scroller: cva(
    "min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto bg-background pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] md:pr-[max(1.25rem,env(safe-area-inset-right))] md:pl-[max(1.25rem,env(safe-area-inset-left))] 2xl:pr-[max(2rem,env(safe-area-inset-right))] 2xl:pl-[max(2rem,env(safe-area-inset-left))] 3xl:pr-[max(2.5rem,env(safe-area-inset-right))] 3xl:pl-[max(2.5rem,env(safe-area-inset-left))]",
  ),

  // 大屏把搜索连同下拉钉在滚动顶上
  toolbarDock: cva("pt-3 md:pt-4 lg:sticky lg:top-0 lg:z-20 lg:bg-background lg:pb-1 2xl:pt-5"),

  // 窄屏分类签吸顶，划到一半还能换柜门
  chipDock: cva(
    "sticky top-0 z-20 border-b border-white/8 bg-background pt-2 pb-2 shadow-[0_10px_16px_-12px_oklch(0_0_0_/_0.55)] lg:hidden",
  ),

  // 「收藏柜」标题和窄屏排序并排
  headingRow: cva("mt-3 mb-3 flex min-w-0 items-center justify-between gap-2 lg:mt-4 2xl:mt-5 2xl:mb-4"),

  // 柜区标题
  heading: cva("min-w-0 shrink-0 text-sm text-muted-foreground"),

  // 窄屏排序贴在标题右侧，大屏藏起
  mobileSort: cva("min-w-0 shrink-0 lg:hidden"),
};
