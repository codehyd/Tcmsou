import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

// 页面上那个空盒子，React 整棵树都挂在这里，找不到就说明 HTML 根节点丢了
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("找不到 #root，页面没法开工");
}

// 把 React 树挂到页面根节点，像把整栋楼的电接到总闸
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
