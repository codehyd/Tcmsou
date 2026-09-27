import type { RouteObject } from "react-router";

import { DataSourcesPage } from "@/pages/DataSourcesPage";

// 数据从哪来：本室典籍和各张公开药表，不跟收藏柜挤在一页
export const sourcesRoutes: RouteObject[] = [
  {
    path: "/sources",
    Component: DataSourcesPage,
  },
];
