import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// 下拉选项的形状：给人看的字，和程序认的编号
export interface CollectionSelectItem<Value extends string> {
  label: string;
  value: Value;
}

// 收藏室里分类、排序共用的下拉壳，抽出来免得工具条和柜区标题各写一坨
export function CollectionSelect<Value extends string>({
  value,
  items,
  triggerClassName,
  onChange,
}: {
  value: Value;
  items: CollectionSelectItem<Value>[];
  triggerClassName: string;
  onChange: (value: Value) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        // 下拉偶发空值，不当成合法选项，免得把货架刷成空白
        if (next) {
          // Base UI 给的是字符串，这里按当前下拉的编号类型收
          onChange(next as Value);
        }
      }}
      items={items}
    >
      {/* 触发器默认会按内容撑开，这里加上 min-w-0，窄屏才挤得进标题行 */}
      <SelectTrigger className={cn("min-w-0 max-w-full", triggerClassName)}>
        <SelectValue />
      </SelectTrigger>

      {/* 菜单贴按钮右缘打开，避免窄屏时飞到屏幕左上角，像抽屉要从把手那边拉开 */}
      <SelectContent align="end">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}