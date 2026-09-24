import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";

import { roomAction, roomHeader, roomQuietLink } from "./styles";

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

      <h1 className={roomHeader.title()}>{title}</h1>
    </>
  );

  return (
    // 左右按刘海安全区留白，窄屏也不会顶到系统手势条
    <header className={roomHeader.bar()}>
      {backTo ? (
        <Link to={backTo} className={roomHeader.titleRow()}>
          {titleBlock}
        </Link>
      ) : (
        <div className={roomHeader.titleRow()}>{titleBlock}</div>
      )}

      <div className={roomHeader.actions()}>
        {/* 来源说明单独开门，顶栏一直在，列表和详情都能找到 */}
        <Link to="/sources" className={roomQuietLink()}>
          来源
        </Link>

        {/* 导出把本室账本复印走，导入再把外面的表搬进来，两件事分开免得按错门 */}
        {onExportClick ? (
          <button
            type="button"
            onClick={onExportClick}
            className={roomAction()}
          >
            导出
          </button>
        ) : null}

        {onImportClick ? (
          <button
            type="button"
            onClick={onImportClick}
            className={roomAction()}
          >
            导入
          </button>
        ) : null}

        {/* 「本室」钉在右边不换行，像柜门上的库存牌，窄屏也不能被标题挤掉 */}
        <p className={roomHeader.count()}>
          本室
          <span className={roomHeader.countValue()}>{herbCount} 味</span>
        </p>
      </div>
    </header>
  );
}
