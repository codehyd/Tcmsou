import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router";

import { herbDetail } from "./styles";
import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { HerbDetailInfo } from "@/rooms/detail/components/HerbDetailInfo";
import { HerbDetailDock } from "@/rooms/detail/components/HerbDetailDock";
import { HerbExhibitScene } from "@/rooms/detail/components/HerbExhibitScene";
import { HerbSwitchCabinet } from "@/rooms/detail/components/HerbSwitchCabinet";
import { countAllHerbs, getHerbById, orderCabinetHerbs } from "@/lib/herb-catalog";
import { useCabinetHerbs } from "@/store/herb-cabinet";

// 窄屏灯箱展开时的高度，和样式里的 h-96 同一档
const EXHIBIT_MAX = 384;

// 再缩小就会把模型切掉，所以停在这里，整尊还看得全
const EXHIBIT_MIN = 200;

// 从展开收到最小，中间这段滚动先拿去缩小灯箱
const EXHIBIT_RANGE = EXHIBIT_MAX - EXHIBIT_MIN;

// 和右侧换药柜同一道门槛：比这窄就当手机，灯箱跟着手指缩
const STACKED_SCREEN = "(max-width: 1023px)";

// 看现在是不是手机那种上下叠。灯箱缩小只在这档发生
function useStackedScreen() {
  const [stacked, setStacked] = useState(() => window.matchMedia(STACKED_SCREEN).matches);

  useEffect(() => {
    const media = window.matchMedia(STACKED_SCREEN);

    function sync() {
      setStacked(media.matches);
    }

    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  return stacked;
}

// 点开一味药后来到的阅读页：上面是灯箱，下面是这味药的药牌，右边仍能换药
// 只放柜子里已有的性味、归经、功效、主治，不做教材分章
export function HerbDetailPage() {
  const { herbId = "" } = useParams();

  // 教材册加自添药，详情和右边展柜都看这一份
  const herbs = useCabinetHerbs();

  // 底栏左右、全部药单、右侧展柜共用这一条，和收藏室默认货架同一顺序
  const shelf = useMemo(() => orderCabinetHerbs(herbs), [herbs]);

  // 按门牌找出当前这味药，找不到就说明地址写错了
  const herb = getHerbById(herbs, herbId);

  // 本室现货数，顶栏和列表页同一口径
  const herbCount = countAllHerbs(herbs);

  // 窄屏整列阅读区。在模型上划也要能把灯箱收小
  const readerRef = useRef<HTMLDivElement>(null);

  // 章节自己的滚筒。灯箱收到最小之后，字才在这里往下走
  const chapterRef = useRef<HTMLDivElement>(null);

  // 灯箱已经收进去多少像素。手指还在收的时候，先别让下面的字跟着滚
  const collapsedRef = useRef(0);
  const [collapsed, setCollapsed] = useState(0);

  const stacked = useStackedScreen();

  function setCollapsedTo(next: number) {
    const clamped = Math.min(EXHIBIT_RANGE, Math.max(0, next));
    collapsedRef.current = clamped;
    setCollapsed(clamped);
  }

  // 手机上点了另一味药，章节回到开头，灯箱也重新张开
  useEffect(() => {
    if (!herb || !stacked) {
      return;
    }

    setCollapsedTo(0);
    chapterRef.current?.scrollTo({ top: 0 });
  }, [herb, stacked]);

  // 往下划先缩小灯箱，收到底之后才滚章节；回到顶再把灯箱张开
  useEffect(() => {
    const reader = readerRef.current;
    const chapter = chapterRef.current;

    if (!stacked || !reader || !chapter) {
      return;
    }

    const chapterScroller = chapter;

    function eat(delta: number) {
      const current = collapsedRef.current;
      const atTop = chapterScroller.scrollTop <= 0;

      // 往下：灯箱还没收到最小，这段距离用来缩小，字先不动
      if (delta > 0 && current < EXHIBIT_RANGE) {
        setCollapsedTo(current + delta);
        return true;
      }

      // 往上：字已经回到顶，再往上就把灯箱张开
      if (delta < 0 && atTop && current > 0) {
        setCollapsedTo(current + delta);
        return true;
      }

      return false;
    }

    function onWheel(event: WheelEvent) {
      if (eat(event.deltaY)) {
        event.preventDefault();
      }
    }

    let lastY = 0;

    function onTouchStart(event: TouchEvent) {
      lastY = event.touches[0]?.clientY ?? 0;
    }

    function onTouchMove(event: TouchEvent) {
      const y = event.touches[0]?.clientY ?? lastY;
      const delta = lastY - y;
      lastY = y;

      if (eat(delta)) {
        event.preventDefault();
      }
    }

    // 万一系统自己滚了章节，而灯箱还没收完，把那段滚动量补回灯箱
    function onScroll() {
      if (collapsedRef.current >= EXHIBIT_RANGE || chapterScroller.scrollTop <= 0) {
        return;
      }

      const eaten = chapterScroller.scrollTop;
      chapterScroller.scrollTop = 0;
      setCollapsedTo(collapsedRef.current + eaten);
    }

    reader.addEventListener("wheel", onWheel, { passive: false });
    reader.addEventListener("touchstart", onTouchStart, { passive: true });
    reader.addEventListener("touchmove", onTouchMove, { passive: false });
    chapterScroller.addEventListener("scroll", onScroll);

    return () => {
      reader.removeEventListener("wheel", onWheel);
      reader.removeEventListener("touchstart", onTouchStart);
      reader.removeEventListener("touchmove", onTouchMove);
      chapterScroller.removeEventListener("scroll", onScroll);
    };
  }, [stacked, herb]);

  // 门牌对不上就领回列表，免得空展厅让人以为坏了
  if (!herb) {
    return <Navigate to="/collection" replace />;
  }

  return (
    <div className={herbDetail.page()}>
      <CollectionHeader title="收藏柜" herbCount={herbCount} backTo="/collection" />

      <div className={herbDetail.stage()}>
        {/* 窄屏先看药再往下读。大屏灯箱占左墙，字在右边滚 */}
        <div ref={readerRef} className={herbDetail.reader()}>
          <div
            className={herbDetail.exhibitFrame()}
            style={stacked ? { height: EXHIBIT_MAX - collapsed } : undefined}
          >
            <HerbExhibitScene
              key={herb.id}
              herb={herb}
              scale={stacked ? (EXHIBIT_MAX - collapsed) / EXHIBIT_MAX : 1}
            />
          </div>

          <div ref={chapterRef} className={herbDetail.chapters()}>
            <HerbDetailInfo key={herb.id} herb={herb} />
          </div>
        </div>

        <HerbSwitchCabinet herbs={shelf} activeId={herb.id} />
      </div>

      {/* 窄屏用脚下这条换药，左右邻居和全部药单是同一条队伍 */}
      <HerbDetailDock herbs={shelf} activeId={herb.id} />
    </div>
  );
}
