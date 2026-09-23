import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 算出配置文件自己在哪，后面 @ 别名才知道 src 的绝对位置
const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  // 正式构建挂在 GitHub Pages 的 /Tcmsou/ 门牌下；本地开发仍走根路径，免得每次都敲一长串
  base: command === "build" ? "/Tcmsou/" : "/",

  plugins: [
    // React 热更新 + Tailwind 扫 class，没有它们页面不会动、样式也不会生效
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // 把 @ 指到 src，像给房间起小名，shadcn 和业务代码都靠它少写一长串相对路径
      "@": path.resolve(configDir, "./src"),
    },
  },
}));
