import { cva } from "class-variance-authority";

// 导入窗自己的样式：外壳是槽位，投放和对照是会亮会灭的脸

// 选文件这一步：整块高度都给投放台，领表不占上面
export const pickStep = cva("flex min-h-0 flex-1 flex-col");

// 投放台：平时虚线暗底，文件悬在上面就亮青边，像卸货口的灯。手机上让出高度给底栏，宽屏再把台子撑高
export const dropZone = cva(
  "flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-4 py-8 text-center transition-colors sm:min-h-96 sm:px-6 sm:py-10",
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

// 导入窗的外壳
export const importDialog = {
  // 贴在屏幕上的一层。手机从底下顶满，并躲开刘海和手势条；宽屏才在中间浮一张纸
  backdrop: cva(
    "fixed inset-0 z-50 flex flex-col justify-end px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-center sm:p-3",
  ),

  // 点暗处关掉
  scrim: cva("absolute inset-0 bg-black/65"),

  // 中间那张手续纸。手机跟着屏幕长高，底栏才不会被裁掉；宽屏最高不超过一屏
  sheet: cva(
    "relative z-10 flex w-full min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-2xl sm:flex-none",
    {
      variants: {
        wide: {
          true: "sm:h-[min(92dvh,46rem)] max-w-[min(96rem,calc(100vw-1.5rem))]",
          false: "sm:max-h-[min(92dvh,46rem)] max-w-3xl",
        },
      },
      defaultVariants: {
        wide: false,
      },
    },
  ),

  // 窗头。手机两侧少留一点，把宽度让给字
  header: cva("border-b border-white/8 px-3 py-3 sm:px-4"),

  // 窗头标题
  title: cva("text-sm font-medium"),

  // 窗头说明，行距松开一点，窄屏换行也好读
  hint: cva("mt-1 text-xs leading-relaxed text-muted-foreground"),

  // 中间可滚的正文；选文件时让投放台把这一截撑满
  body: cva("flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4"),

  // 底栏：手机上开源药库在左、取消在右；对照按钮另起一行。宽屏再收成一排靠右
  footer: cva(
    "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-white/8 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex sm:items-center sm:px-4 sm:py-3",
  ),

  // 取消贴在开源药库对面，不再拉成一整条空按钮，免得字飘在正中间
  cancelAction: cva("h-11 min-w-16 justify-self-end px-3 sm:order-1 sm:h-8 sm:min-w-0"),

  // 对照时的手续钮。手机占满底栏下一行；宽屏跟在取消右边
  footerActions: cva(
    "col-span-2 grid w-full min-w-0 grid-cols-2 gap-2 sm:order-2 sm:flex sm:w-auto sm:justify-end",
  ),

  // 底栏里的手续钮。手机加高、拉满格子；宽屏回到原来的小钮
  footerAction: cva("h-11 w-full sm:h-8 sm:w-auto", {
    variants: {
      span: {
        // 写入自己占一整行，两个「其余」并排
        full: "col-span-2",
        half: "col-span-1",
      },
    },
  }),
};

// 左下角的开源药库入口：字一直亮着；鼠标凑上去变成手型，像可以按的门把手
export const packShelfButton = cva(
  "inline-flex min-h-11 cursor-pointer items-center text-sm text-intel underline decoration-intel/80 underline-offset-2 sm:mr-auto sm:min-h-0 sm:text-xs",
);

// 点开后从底栏上方升起的名单，里面只放一份份药表，不再把「开源药库」自己排成第一条
export const packShelf = cva(
  "absolute inset-x-0 bottom-full z-20 mb-2 flex flex-col overflow-hidden rounded-sm border border-white/10 bg-background shadow-2xl sm:inset-x-auto sm:left-3 sm:w-[min(32rem,calc(100%-1.5rem))]",
);

// 名单上方只留一句说明和收起，字小，不像下面那一行药表
export const packShelfHeader = cva(
  "flex items-center justify-between gap-3 px-3 pt-2 pb-1 text-xs text-muted-foreground",
);

// 收起钮在手机上加高，手指才按得到；宽屏仍是一行小字
export const packShelfClose = cva(
  "inline-flex min-h-11 items-center px-2 hover:text-foreground sm:min-h-0 sm:px-0",
);

// 表太多时只在这一格里滚，不把导入窗撑出屏幕
export const packShelfList = cva(
  "max-h-[min(16rem,42dvh)] overflow-y-auto px-2 pb-2 sm:max-h-[min(24rem,calc(70dvh-10rem))]",
);

// 一份药表：手机上名字在上、两个钮在下，避免药名被挤没；宽屏再并排
export const packShelfRow = cva(
  "flex flex-col items-stretch gap-2 rounded-sm px-2 py-2 hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
);

// 两个钮在手机上各占一半，按得着；宽屏缩回字链
export const packShelfActions = cva("grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center sm:gap-3");

// 行尾的两个钮。手机做成一格一格的按钮，忙的时候变淡，避免连点两下
export const packShelfAction = cva(
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-white/15 px-2 text-sm text-intel underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60 sm:min-h-0 sm:justify-start sm:rounded-none sm:border-0 sm:px-0 sm:text-xs",
);
