import { Navigate } from "react-router";
import type { RouteObject } from "react-router";

// 路由根目录
// 将根目录 / 重定向(replace)为 /collection 页面 
export const rootRoutes: RouteObject[] = [
  {
    path: "/",
    Component: () => <Navigate to="/collection" replace />,
  },
];
