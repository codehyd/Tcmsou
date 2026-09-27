import type { RouteObject } from "react-router";

import { rootRoutes } from "@/router/routes/root";
import { collectionRoutes } from "@/router/routes/collection";
import { sourcesRoutes } from "@/router/routes/sources";

// 路由配置
export const routes: RouteObject[] = [
  // 根目录
  ...rootRoutes,

  // 收藏室页面
  ...collectionRoutes,

  // 数据来源页面
  ...sourcesRoutes,
];
