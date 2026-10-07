import { Archive, ScrollText } from "lucide-react";
import { Link, useLocation } from "react-router";

import { navRail } from "./styles";

// 最左一列图标轨。收藏室和拟方从这里切换，窄屏这列会藏起来
const STATIONS = [
  { to: "/collection", label: "收藏", icon: Archive, match: "/collection" },
  { to: "/formulas", label: "拟方", icon: ScrollText, match: "/formulas" },
] as const;

export function CollectionNavRail() {
  const { pathname } = useLocation();

  return (
    <aside className={navRail.shell()}>
      {STATIONS.map((station) => {
        const active = pathname.startsWith(station.match);
        const Icon = station.icon;

        return (
          <Link key={station.to} to={station.to} className={navRail.station()}>
            <div className={navRail.mark({ active })}>
              <Icon className="size-4" />
            </div>

            <span className={navRail.label({ active })}>{station.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
