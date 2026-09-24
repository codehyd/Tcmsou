import { useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Drawer } from "@base-ui/react/drawer";
import { Link } from "react-router";

import { HerbPickSheet } from "@/rooms/detail/components/HerbPickSheet";
import { detailDock } from "./styles";
import type { Herb } from "@/types/herb";

// 底栏要的是已经排好的货架。左边上一味，右边下一味，和全部药单同一条队伍
interface HerbDetailDockProps {
  herbs: Herb[];
  activeId: string;
}

// 手机详情脚下的换药条：左右是邻居，中间拉开全部药单
// 有了它，窄屏就不必再在正文下面堆一长条列表
export function HerbDetailDock({ herbs, activeId }: HerbDetailDockProps) {
  // 全部药单开没开。点到一味药就关上，免得挡住新打开的详情
  const [open, setOpen] = useState(false);

  // 每打开一次加一号，抽屉才知道要重新停到当前这味药
  const [locateEpoch, setLocateEpoch] = useState(0);

  // 在同一条货架上找邻居。不按这份顺序走，左右药名会和列表上下两张对不上
  const index = herbs.findIndex((herb) => herb.id === activeId);
  const previous = index > 0 ? herbs[index - 1] : null;
  const next = index >= 0 && index < herbs.length - 1 ? herbs[index + 1] : null;

  return (
    <Drawer.Root
      open={open}
      swipeDirection="down"
      onOpenChange={(opened) => {
        setOpen(opened);

        // 每次拉开抽屉都换一个号，药单才会重新停到正在看的这一味
        if (opened) {
          setLocateEpoch((epoch) => epoch + 1);
        }
      }}
    >
      <nav className={detailDock.bar()} aria-label="换一味药">
        <StepLink herb={previous} direction="previous" />

        {/* 中间这颗是抽屉的门把手，点开从脚下滑上来 */}
        <Drawer.Trigger className={detailDock.all()}>
          <LayoutGrid className="size-4" />
          <span className="text-[11px]">全部</span>
        </Drawer.Trigger>

        <StepLink herb={next} direction="next" />
      </nav>

      <HerbPickSheet
        herbs={herbs}
        activeId={activeId}
        locateEpoch={locateEpoch}
        onPicked={() => setOpen(false)}
      />
    </Drawer.Root>
  );
}

// 底栏一侧：左边箭头在前，右边箭头在后，药名跟在阅读的方向上
function StepLink({ herb, direction }: { herb: Herb | null; direction: "previous" | "next" }) {
  const idle = !herb;
  const arrow = direction === "previous" ? <ChevronLeft className="size-5 shrink-0" /> : <ChevronRight className="size-5 shrink-0" />;

  const inner = (
    <>
      {direction === "previous" ? arrow : null}

      <span className={detailDock.name()}>{herb?.name ?? "到头了"}</span>

      {direction === "next" ? arrow : null}
    </>
  );

  if (!herb) {
    return <span className={detailDock.step({ side: direction, idle })}>{inner}</span>;
  }

  return (
    <Link to={`/collection/${herb.id}`} className={detailDock.step({ side: direction, idle })}>
      {inner}
    </Link>
  );
}
