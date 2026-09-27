import { RouterProvider } from "react-router/dom";

import { router } from "@/router";

// 使用 React Router 路由管理页面
function App() {
  return <RouterProvider router={router} />;
}

export default App;
