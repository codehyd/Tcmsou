// 卡片上那枚小标签要写的字，比如「解表药」
interface HerbCategoryTagProps {
  label: string;
}

// 功效分类小徽章：贴在药名旁边，优先写二级小类，麻黄一眼能看成发散风寒药
export function HerbCategoryTag({ label }: HerbCategoryTagProps) {
  return (
    <span className="shrink-0 rounded-sm border border-intel/35 bg-intel/10 px-1.5 py-0.5 text-[10px] leading-none text-intel">
      {label}
    </span>
  );
}