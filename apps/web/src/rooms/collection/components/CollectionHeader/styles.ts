import { cva } from "class-variance-authority";

// 顶栏自己的样式：描边钮会亮青，横条负责安全区留白

// 来源说明不占按钮那么宽，窄屏顶栏才挤得下
export const roomQuietLink = cva(
  "shrink-0 text-xs text-intel underline decoration-intel/80 underline-offset-2 sm:text-sm",
);

// 导出、导入共用一张脸，悬停亮青，像柜门上的两只开关
export const roomAction = cva(
  "shrink-0 rounded-sm border border-white/15 px-2 py-1 text-xs text-foreground hover:border-intel/40 hover:text-intel sm:text-sm",
);

// 顶栏横条：安全区留白和高度断点都在槽位里
export const roomHeader = {
  // 左右按刘海留白，窄屏也不会顶到系统手势条
  bar: cva(
    "flex h-12 w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-white/8 bg-background pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:pl-[max(1rem,env(safe-area-inset-left))] md:pr-[max(1rem,env(safe-area-inset-right))] 2xl:h-14 2xl:pl-[max(1.5rem,env(safe-area-inset-left))] 2xl:pr-[max(1.5rem,env(safe-area-inset-right))] 3xl:pl-[max(2rem,env(safe-area-inset-left))] 3xl:pr-[max(2rem,env(safe-area-inset-right))]",
  ),

  // 房间名那一截，箭头和字排成一行
  titleRow: cva("flex min-w-0 items-center gap-2"),

  // 房间名，超宽屏略加大
  title: cva("truncate text-sm font-medium tracking-wide 2xl:text-base"),

  // 右边那排开关和库存牌
  actions: cva("ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"),

  // 「本室」钉在右边不换行，窄屏也不能被标题挤掉
  count: cva("shrink-0 text-xs whitespace-nowrap text-muted-foreground sm:text-sm 2xl:text-base"),

  // 现货数字亮青，像柜门上的库存灯
  countValue: cva("ml-1.5 font-medium text-intel sm:ml-2"),
};
