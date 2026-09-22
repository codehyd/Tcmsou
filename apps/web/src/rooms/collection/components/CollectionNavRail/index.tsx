import { Archive } from "lucide-react";

import { navRail } from "./styles";

// 最左一列图标轨：以后 3D 场景、AI 助手也可以在这里加站
// 第一版只有收藏室这一站是亮的，像地铁线路图先点亮起始站
export function CollectionNavRail() {
  return (
    // 窄屏藏起来，大屏才亮出这一列；底色跟房间同一套墨蓝灰，不再单独刷近黑
    <aside className={navRail.shell()}>
      {/* 选中态用青色底，跟功效分类的选中灯同一套语言 */}
      <div className={navRail.mark()}>
        <Archive className="size-4" />
      </div>

      <span className={navRail.label()}>收藏</span>
    </aside>
  );
}