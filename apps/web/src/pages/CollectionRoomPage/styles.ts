import { cva } from "class-variance-authority";

// 收藏室这一页怎么占满屏幕：上面门牌，下面三列货架

export const collectionRoom = {
  // 整页锁在一屏里，像库房大门关上后不再往外溢
  page: cva(
    "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background text-foreground",
  ),

  // 大屏三列起：图标轨、功效分类、收藏柜。min-w-0 防止横滑标签把整页撑出手机
  stage: cva("flex min-h-0 min-w-0 w-full flex-1 overflow-hidden"),
};
