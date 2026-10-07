import { cva } from "class-variance-authority";

// 最左图标轨：窄屏藏起，大屏才亮出这一列
export const navRail = {
  // 底色跟房间同一套墨蓝灰，超宽略加宽
  shell: cva(
    "hidden h-full w-14 shrink-0 flex-col items-center border-r border-white/8 bg-rail py-3 lg:flex 3xl:w-16",
  ),

  // 一站：图标在上，名字在下
  station: cva("mt-3 flex flex-col items-center first:mt-0"),

  // 选中站用青色底，没选中的只留灰字
  mark: cva("flex size-9 items-center justify-center rounded-sm", {
    variants: {
      active: {
        true: "bg-intel/15 text-intel",
        false: "text-muted-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }),

  // 站名小字
  label: cva("mt-1 text-[10px] tracking-widest", {
    variants: {
      active: {
        true: "text-intel",
        false: "text-muted-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }),
};
