import { cva } from "class-variance-authority";

// 来源说明页：顶栏下面是一篇能滚的说明，不像收藏柜那样锁死三列

export const dataSources = {
  // 整页仍锁在一屏里，正文自己滚，手机上才不会把顶栏顶出屏幕
  page: cva("flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground"),

  // 正文可滚，左右留出刘海
  body: cva(
    "min-h-0 flex-1 overflow-y-auto px-[max(1rem,env(safe-area-inset-left))] py-6 pr-[max(1rem,env(safe-area-inset-right))] sm:px-8",
  ),

  // 文章宽度收一收，像一页说明书，不要拉成货架那么宽
  article: cva("mx-auto flex w-full max-w-2xl flex-col gap-8 pb-16"),

  // 开篇那一段
  lead: cva("text-sm leading-relaxed text-muted-foreground"),

  // 每一节的标题
  heading: cva("text-sm font-medium text-foreground"),

  // 节与节之间拉开，扫的时候不粘成一块
  section: cva("flex flex-col gap-3"),

  // 一条来源：名字、一句说明、能点的官网
  card: cva("rounded-sm border border-white/10 bg-black/20 px-3 py-3"),

  // 卡片里的来源名
  cardTitle: cva("text-sm text-foreground"),

  // 卡片里的说明
  cardBody: cva("mt-1 text-sm leading-relaxed text-muted-foreground"),

  // 官网链接用青色，点开就离开本室去对方站点
  link: cva("text-intel underline decoration-intel/80 underline-offset-2"),
};
