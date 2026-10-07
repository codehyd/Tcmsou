import type { RouteObject } from "react-router";

import { FormulaEditorPage, FormulaListPage } from "@/pages/formula";

// 拟方：列表，以及打开其中一张继续改
export const formulaRoutes: RouteObject[] = [
  {
    path: "/formulas",
    Component: FormulaListPage,
  },
  {
    path: "/formulas/:formulaId",
    Component: FormulaEditorPage,
  },
];
