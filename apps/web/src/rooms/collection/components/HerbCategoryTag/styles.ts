import { cva } from "class-variance-authority";

// 药名旁边那枚小标签，像货架价签
export const categoryTag = cva(
  "shrink-0 rounded-sm border border-intel/35 bg-intel/10 px-1.5 py-0.5 text-[10px] leading-none text-intel",
);
