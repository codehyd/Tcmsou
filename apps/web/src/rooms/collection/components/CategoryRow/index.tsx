import { categoryRow } from "./styles";

// 单个柜门要知道：叫什么、现货几味、亮不亮、点了告诉谁
interface CategoryRowProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

// 功效分类里的一行：左边药类名，右边现货数
// 选中时亮青边，像灯管扫到这一格；不写 5/5，免得像「这类药就五种」
export function CategoryRow({
  label,
  count,
  active,
  onClick,
}: CategoryRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={categoryRow({ active })}
    >
      {/* 柜门名字，点它等于只打开这一只抽屉 */}
      <span>{label}</span>

      {/* 只报本室现货，不报天花板 */}
      <span className="tabular-nums text-xs text-muted-foreground">{count}</span>
    </button>
  );
}