import { herbPlaceholder } from "./styles";

// 没图时用药名首字撑场面，免得格子空得像拆了包装的盒子
interface HerbPlaceholderProps {
  mark: string;
}

// empty 展位：虚线框 + 首字 + EMPTY
// 3D 模型还没到货时先占着位子，以后有图就把这一块换成真照片
export function HerbPlaceholder({ mark }: HerbPlaceholderProps) {
  return (
    // empty 格用浅雾面而不是纯黑坑，字也跟正文同一档亮度，免得像褪色标签
    <div className={herbPlaceholder.frame()}>
      {/* 药名第一个字当临时展签，陈皮就写「陈」 */}
      <span className={herbPlaceholder.mark()}>{mark}</span>

      <span className={herbPlaceholder.caption()}>empty</span>
    </div>
  );
}