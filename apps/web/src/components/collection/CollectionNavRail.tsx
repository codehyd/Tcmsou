import { Archive } from "lucide-react";

// 最左一列图标轨：以后 3D 场景、AI 助手也可以在这里加站
// 第一版只有收藏室这一站是亮的，像地铁线路图先点亮起始站
export function CollectionNavRail() {
  return (
    // 窄屏藏起来，大屏才亮出这一列；底色跟房间同一套墨蓝灰，不再单独刷近黑
    <aside className="hidden h-full w-14 shrink-0 flex-col items-center border-r border-white/8 bg-rail py-3 lg:flex 3xl:w-16">
      {/* 选中态用青色底，跟功效分类的选中灯同一套语言 */}
      <div className="flex size-9 items-center justify-center rounded-sm bg-intel/15 text-intel">
        <Archive className="size-4" />
      </div>

      <span className="mt-1 text-[10px] tracking-widest text-intel">收藏</span>
    </aside>
  );
}