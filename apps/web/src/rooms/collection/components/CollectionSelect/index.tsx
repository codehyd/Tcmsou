import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// 下拉选项的形状：给人看的字，和程序认的编号
export interface CollectionSelectItem<Value extends string> {
  label: string;
  value: Value;
}

// 全站下拉都走这一层。菜单样式在 Select 组件里，不跟浏览器自带菜单走
export function CollectionSelect<Value extends string>({
  value,
  items,
  triggerClassName,
  align = "end",
  onChange,
}: {
  value: Value;
  items: CollectionSelectItem<Value>[];
  triggerClassName: string;
  // 菜单贴着按钮哪一侧。表格和表单贴左缘，工具条贴右缘
  align?: "start" | "center" | "end";
  onChange: (value: Value) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        // 关掉菜单时可能交来空值，不当成一次选择
        if (typeof next !== "string") {
          return;
        }

        // Base UI 给的是字符串，这里按当前下拉的编号类型收
        onChange(next as Value);
      }}
      items={items}
    >
      {/* 触发器默认会按内容撑开，这里加上 min-w-0，窄屏才挤得进标题行 */}
      <SelectTrigger className={cn("min-w-0 max-w-full", triggerClassName)}>
        <SelectValue />
      </SelectTrigger>

      {/* 菜单贴按钮右缘打开，避免窄屏时飞到屏幕左上角，像抽屉要从把手那边拉开 */}
      <SelectContent align={align}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}