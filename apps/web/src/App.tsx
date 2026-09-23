import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { CollectionRoomPage } from "@/pages/CollectionRoomPage";
import { HerbDetailPage } from "@/pages/HerbDetailPage";

// 线上站点住在 /Tcmsou/ 这层楼里，路由要先认这扇门；本地是根路径。末尾斜杠去掉，React Router 才肯认
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

// 应用门口的指路牌：进来先送到收藏室，以后 3D 场景、AI 补药页再在这里加路
function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        {/* 根路径不单独做首页，直接领进收藏室，少一次空白门厅 */}
        <Route path="/" element={<Navigate to="/collection" replace />} />

        {/* 中药收藏室 2D 柜，点卡片进详情展厅 */}
        <Route path="/collection" element={<CollectionRoomPage />} />

        {/* 单味药的 2D 展厅：灯箱 + 说明书 + 右侧换展 */}
        <Route path="/collection/:herbId" element={<HerbDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
