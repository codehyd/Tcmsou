import { cva } from "class-variance-authority";

// 最左图标轨：窄屏藏起，大屏才亮出这一列
export const navRail = {
  // 底色跟房间同一套墨蓝灰，超宽略加宽
  shell: cva(
    "hidden h-full w-14 shrink-0 flex-col items-center border-r border-white/8 bg-rail py-3 lg:flex 3xl:w-16",
  ),

  // 选中站的青色底，跟功效分类的选中灯同一套
  mark: cva("flex size-9 items-center justify-center rounded-sm bg-intel/15 text-intel"),

  // 站名小字
  label: cva("mt-1 text-[10px] tracking-widest text-intel"),
};
