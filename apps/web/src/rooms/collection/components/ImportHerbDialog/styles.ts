import { cva } from "class-variance-authority";

// 导入窗自己的样式：外壳是槽位，投放和对照是会亮会灭的脸

// 选文件这一步：整块高度都给投放台，领表不占上面
export const pickStep = cva("flex min-h-0 flex-1 flex-col");

// 投放台：平时虚线暗底，文件悬在上面就亮青边，像卸货口的灯。高度尽量占满窗口
export const dropZone = cva(
  "flex min-h-96 flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-10 text-center transition-colors",
  {
    variants: {
      active: {
        true: "border-intel bg-intel/10 text-foreground",
        false:
          "border-white/20 bg-black/20 text-muted-foreground hover:border-white/35 hover:bg-black/30",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

// 对照表的一格：点中的那边亮青，没点的保持暗纸
export const fieldChoice = cva(
  "min-h-16 rounded-sm border px-2.5 py-2 text-left text-sm leading-relaxed break-words",
  {
    variants: {
      selected: {
        true: "border-intel/55 bg-intel/10 text-foreground",
        false: "border-white/10 bg-white/5 text-cabinet-muted hover:border-white/20",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

// 导入窗的外壳
export const importDialog = {
  // 贴在屏幕上的一层，窄屏从底下长出来
  backdrop: cva("fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"),

  // 点暗处关掉
  scrim: cva("absolute inset-0 bg-black/65"),

  // 中间那张手续纸，最高不超过一屏
  sheet: cva(
    "relative z-10 flex max-h-[min(92dvh,46rem)] w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-2xl",
  ),

  // 窗头
  header: cva("border-b border-white/8 px-4 py-3"),

  // 窗头标题
  title: cva("text-sm font-medium"),

  // 窗头说明
  hint: cva("mt-1 text-xs text-muted-foreground"),

  // 中间可滚的正文；选文件时让投放台把这一截撑满
  body: cva("flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3"),

  // 底栏左右分开：左边开源药库，右边是取消和写入
  footer: cva(
    "relative flex items-center justify-between gap-2 border-t border-white/8 px-4 py-3",
  ),

  // 右边那排手续按钮
  footerActions: cva("ml-auto flex flex-wrap items-center justify-end gap-2"),
};

// 左下角的开源药库入口，像柜门上的供货名录拉手
export const packShelfButton = cva("text-xs text-muted-foreground hover:text-intel");

// 点开后从底栏上方升起的开源药库，一行一个可直接导入的来源
export const packShelf = cva(
  "absolute bottom-full left-3 z-20 mb-2 flex w-[min(26rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-2xl",
);

// 清单头：标题和一句怎么用
export const packShelfHeader = cva("border-b border-white/8 px-3 py-2");

// 表太多时只在这一格里滚，不把导入窗撑出屏幕；尽量一次多露出几张
export const packShelfList = cva("max-h-[min(24rem,calc(70dvh-10rem))] overflow-y-auto");

// 一整行都能点：左边是哪份开源表，右边是导入，像按名录直接进货
export const packShelfRow = cva(
  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/5 disabled:cursor-wait disabled:opacity-60",
);
