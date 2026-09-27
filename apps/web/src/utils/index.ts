import { cache } from "@/utils/cache/Cache";
import { base64 } from "@/utils/codec/Base64Codec";

// 小工具入口。按组调用，比如 utils.cache.get。新组在这里加一行
export const utils = {
  cache,
  base64,
};
