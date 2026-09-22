import { cva } from "class-variance-authority";

// 展厅这一页：顶上是门牌，下面灯箱、说明书、换展柜

export const herbDetail = {
  // 整页锁在一屏里，跟收藏室同一扇大门的尺寸
  page: cva(
    "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground",
  ),

  // 窄屏上下叠，大屏左右排：灯箱在中，换展柜在右
  stage: cva("flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden"),

  // 灯箱和说明书叠在同一列
  exhibitColumn: cva("relative flex min-w-0 flex-col lg:min-h-0 lg:flex-1"),

  // 窄屏灯箱先给一块固定高，大屏再把剩下的高度都给它
  exhibitFrame: cva("h-64 shrink-0 lg:h-auto lg:min-h-0 lg:flex-1"),

  // 说明书浮在灯箱左边；窄屏改成跟在灯箱下面，免得字把药挡住
  infoLayer: cva(
    "relative z-10 lg:pointer-events-none lg:absolute lg:inset-0 lg:flex lg:items-start",
  ),

  // 大屏说明书背后渐暗，字才压得住灯
  infoPanel: cva(
    "bg-background lg:pointer-events-auto lg:w-auto lg:bg-gradient-to-r lg:from-black/60 lg:via-black/35 lg:to-transparent",
  ),
};
