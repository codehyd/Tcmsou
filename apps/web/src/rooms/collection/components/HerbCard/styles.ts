import { cva } from "class-variance-authority";

// 一张药卡的分栏，悬停亮边写在卡壳上
export const herbCard = {
  // 整张卡是门
  link: cva("block min-w-0"),

  // 左字右图，悬停描边亮青
  article: cva(
    "flex min-h-[132px] min-w-0 max-w-full overflow-hidden rounded-sm border border-cabinet-border bg-cabinet transition-colors hover:border-intel/40 sm:min-h-[148px] 2xl:min-h-[160px]",
  ),

  // 左栏：名字、拼音、功效
  body: cva("flex min-w-0 flex-1 flex-col justify-between gap-2 overflow-hidden p-2.5 sm:p-3"),

  // 药名和分类签并排
  titleRow: cva("flex min-w-0 items-center gap-2"),

  // 药名略加大，暗底上才像货牌
  name: cva("truncate text-[15px] font-medium text-foreground"),

  // 拼音小字
  pinyin: cva("mt-1 truncate text-xs tracking-wide text-muted-foreground uppercase"),

  // 功效最多两行，中文没空格也要折行
  functions: cva("line-clamp-2 break-words text-[13px] leading-relaxed text-cabinet-muted"),

  // 右栏图位，窄屏用绝对宽度
  figure: cva(
    "flex w-[5.5rem] shrink-0 items-center justify-center p-2 sm:w-[38%] sm:max-w-40 sm:p-3 2xl:max-w-44",
  ),

  // 有照片时铺满这一格
  image: cva("h-full w-full object-contain"),
};
