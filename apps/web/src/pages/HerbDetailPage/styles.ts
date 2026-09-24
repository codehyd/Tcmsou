import { cva } from "class-variance-authority";

// 详情页：顶上是门牌，下面是图位和章节，右边仍是换展柜

export const herbDetail = {
  // 整页锁在一屏里，跟收藏室同一扇大门的尺寸
  page: cva(
    "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground",
  ),

  // 窄屏上下叠。大屏左边阅读，右边换药柜
  stage: cva("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row"),

  // 窄屏上下叠。大屏改成左右：灯箱占左半间，说明书在旁边，免得一条矮灯箱下面空一大块
  reader: cva("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row"),

  // 窄屏灯箱高度跟着手指收。大屏拉成一整面墙，模型才不会缩在屏幕顶上一条里
  exhibitFrame: cva(
    "h-96 shrink-0 overflow-hidden bg-exhibit lg:h-full lg:w-[min(48%,40rem)]",
  ),

  // 字在这一栏里滚。大屏灯箱钉在左边，不再跟着整列一起往下掉
  chapters: cva("min-h-0 min-w-0 flex-1 overflow-y-auto"),
};
