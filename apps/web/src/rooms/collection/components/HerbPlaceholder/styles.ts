import { cva } from "class-variance-authority";

// 没图时的 empty 立牌
export const herbPlaceholder = {
  // 虚线浅雾面，字跟正文同一档亮度
  frame: cva(
    "flex h-full w-full flex-col items-center justify-center rounded-sm border border-dashed border-white/18 bg-white/5 text-muted-foreground",
  ),

  // 药名第一个字当临时展签
  mark: cva("text-2xl font-light tracking-widest"),

  // 底下那行 empty
  caption: cva("mt-1 text-[10px] tracking-[0.2em] uppercase"),
};
