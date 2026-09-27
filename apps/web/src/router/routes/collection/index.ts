import type { RouteObject } from "react-router";

import { CollectionRoomPage } from "@/pages/CollectionRoomPage";
import { HerbDetailPage } from "@/pages/HerbDetailPage";

// 收藏室页面路由配置
export const collectionRoutes: RouteObject[] = [
  // 中药收藏室页面
  {
    path: "/collection",
    Component: CollectionRoomPage,
  },

  // 单味药详情页面
  {
    path: "/collection/:herbId",
    Component: HerbDetailPage,
  },
];
