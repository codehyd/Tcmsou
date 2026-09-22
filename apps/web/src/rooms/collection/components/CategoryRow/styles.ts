import { cva } from "class-variance-authority";

// 侧栏柜门：选中时左边亮青条，没选中是淡字，像灯管扫到这一格
export const categoryRow = cva(
  "flex w-full items-center justify-between rounded-sm border-l-2 px-3 py-2 text-left text-sm transition-colors",
  {
    variants: {
      active: {
        true: "border-intel bg-white/8 text-foreground",
        false: "border-transparent text-foreground/70 hover:bg-white/5 hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
