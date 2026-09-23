import { useEffect, useState } from "react";

// 手机宽度的门槛，和 Tailwind 的 md 对齐：比这窄就当手机柜，比这宽才摊大表
const NARROW_SCREEN = "(max-width: 767px)";

// 看现在是不是手机那么窄。导入窗靠它决定摊大表还是叠卡片，不看的话横滑会把字推出屏幕
export function useNarrowScreen() {
  // 第一眼就量窗口，避免先画成宽表再跳成卡片
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW_SCREEN).matches);

  // 转屏或拉窗口时再量一次，像柜门跟着房间宽度改摆法
  useEffect(() => {
    const media = window.matchMedia(NARROW_SCREEN);

    function sync() {
      setNarrow(media.matches);
    }

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  return narrow;
}
