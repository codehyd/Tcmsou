import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";

import { Button } from "@/components/ui/button";
import { HerbGrid } from "@/rooms/collection/components/HerbGrid";
import { pickSheet } from "./styles";
import type { Herb } from "@/types/herb";

// 抽屉要的账本：已经按收藏室货架排好的整柜药。点到药卡就先把抽屉收回去
interface HerbPickSheetProps {
  herbs: Herb[];
  activeId: string;
  locateEpoch: number;
  onPicked: () => void;
}

// 从底部升起的全部药单：不再按分类切开，格子和底栏左右是同一条队伍
// 遮罩淡入，抽屉滑上来，往下拨也能关上
export function HerbPickSheet({ herbs, activeId, locateEpoch, onPicked }: HerbPickSheetProps) {
  // 等抽屉里的滚筒挂上再画卡，否则虚拟列表会以为窗口高度是 0
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);

  return (
    <Drawer.Portal>
      <Drawer.Backdrop className={pickSheet.backdrop()} />

      <Drawer.Viewport className={pickSheet.viewport()}>
        <Drawer.Popup className={pickSheet.popup()}>
          <Drawer.Content className={pickSheet.panel()}>
            <div className={pickSheet.handle()} />

            <div className={pickSheet.head()}>
              <Drawer.Title className="text-sm text-foreground">全部药材</Drawer.Title>

              <Drawer.Close
                render={<Button variant="ghost" size="sm" />}
              >
                关闭
              </Drawer.Close>
            </div>

            <Drawer.Description className="sr-only">
              点一张药卡，就换到那味药的详情。
            </Drawer.Description>

            <div
              ref={setScroller}
              className={pickSheet.scroller()}
              onClick={(event) => {
                const target = event.target;

                // 点的是药卡才收抽屉。点空白或滚动条就让单子继续开着
                if (target instanceof Element && target.closest("a")) {
                  onPicked();
                }
              }}
            >
              {scroller ? (
                <HerbGrid
                  herbs={herbs}
                  scrollElement={scroller}
                  activeId={activeId}
                  locateActive
                  pinEpoch={locateEpoch}
                />
              ) : null}
            </div>
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}
