import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

// 顶栏要报的现货数：本室现在摆了几味，不写成分数
interface CollectionHeaderProps {
  herbCount: number;
  title?: string;
  backTo?: string;
  onImportClick?: () => void;
  onExportClick?: () => void;
}

// 收藏室门口的横条：左边是房间名，右边是本室现货
// 详情页把箭头接上返回，列表页仍当门牌装饰
export function CollectionHeader({
  herbCount,
  title = "收藏室",
  backTo,
  onImportClick,
  onExportClick,
}: CollectionHeaderProps) {
  // 有退路就把箭头做成门，没有就当装饰，像还没通电的电梯按钮
  const titleBlock = (
    <>
      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />

      <h1 className="truncate text-sm font-medium tracking-wide 2xl:text-base">{title}</h1>
    </>
  );

  return (
    // 左右按刘海安全区留白，窄屏也不会顶到系统手势条
    <header className="flex h-12 w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-white/8 bg-background pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:pl-[max(1rem,env(safe-area-inset-left))] md:pr-[max(1rem,env(safe-area-inset-right))] 2xl:h-14 2xl:pl-[max(1.5rem,env(safe-area-inset-left))] 2xl:pr-[max(1.5rem,env(safe-area-inset-right))] 3xl:pl-[max(2rem,env(safe-area-inset-left))] 3xl:pr-[max(2rem,env(safe-area-inset-right))]">
      {backTo ? (
        <Link to={backTo} className="flex min-w-0 items-center gap-2">
          {titleBlock}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-2">{titleBlock}</div>
      )}

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        {/* 导出把本室账本复印走，导入再把外面的表搬进来，两件事分开免得按错门 */}
        {onExportClick ? (
          <button
            type="button"
            onClick={onExportClick}
            className="shrink-0 rounded-sm border border-white/15 px-2 py-1 text-xs text-foreground hover:border-intel/40 hover:text-intel sm:text-sm"
          >
            导出
          </button>
        ) : null}

        {onImportClick ? (
          <button
            type="button"
            onClick={onImportClick}
            className="shrink-0 rounded-sm border border-white/15 px-2 py-1 text-xs text-foreground hover:border-intel/40 hover:text-intel sm:text-sm"
          >
            导入
          </button>
        ) : null}

        {/* 「本室」钉在右边不换行，像柜门上的库存牌，窄屏也不能被标题挤掉 */}
        <p className="shrink-0 text-xs whitespace-nowrap text-muted-foreground sm:text-sm 2xl:text-base">
          本室
          <span className="ml-1.5 font-medium text-intel sm:ml-2">{herbCount} 味</span>
        </p>
      </div>
    </header>
  );
}
