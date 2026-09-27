import { createBrowserRouter } from "react-router";

import { routes } from "@/router/routes";

// 站点前缀 线上和本地环境不一 线上环境在Github中 需要添加前缀：/Tcmsou/
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");


// 创建路由对象 给页面提供路由服务
export const router = createBrowserRouter(routes, {
  basename: routerBasename,
});
 