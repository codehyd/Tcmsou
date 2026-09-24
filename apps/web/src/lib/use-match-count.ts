import { useEffect, useState } from "react";

// 一条宽度规则：窗口够宽就用这个列数，像货架跟着店面加排
interface MatchCountRule {
  query: string;
  count: number;
}

// 按窗口宽度选列数。先写宽的，命中第一条就停，免得窄屏被宽规则抢走
export function useMatchCount(rules: MatchCountRule[], fallback: number) {
  function read() {
    for (const rule of rules) {
      if (window.matchMedia(rule.query).matches) {
        return rule.count;
      }
    }

    return fallback;
  }

  // 第一眼就量，避免先画成一列再跳成多列
  const [count, setCount] = useState(read);

  // 拉窗口或转屏时再量，货架列数跟着变
  useEffect(() => {
    const medias = rules.map((rule) => window.matchMedia(rule.query));

    function sync() {
      setCount(read());
    }

    sync();

    for (const media of medias) {
      media.addEventListener("change", sync);
    }

    return () => {
      for (const media of medias) {
        media.removeEventListener("change", sync);
      }
    };
  }, [rules, fallback]);

  return count;
}
