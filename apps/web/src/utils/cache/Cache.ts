import { base64 } from "@/utils/codec/Base64Codec";

// 浏览器缓存的存放格式。text 原样存，json 存成 JSON，base64 先转 JSON 再编码
type CacheFormat = "text" | "json" | "base64";

// 浏览器本地缓存。按钥匙读写，可以原样拿，也可以按 JSON 或 Base64 转换
class Cache {
  // 按钥匙读取。不传格式就返回原文；传 json 或 base64 时转成调用方声明的类型
  get(key: string): string | null;
  get<T>(key: string, format: "json" | "base64"): T | null;
  get<T>(key: string, format?: CacheFormat): string | T | null {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    if (!format || format === "text") {
      return raw;
    }

    if (format === "json") {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }

    return base64.base64ToJson(raw) as T | null;
  }

  // 按钥匙写入。不传格式就把字符串原样存；传 json 或 base64 时先转换再存
  set(key: string, value: string): void;
  set<T>(key: string, value: T, format: "json" | "base64"): void;
  set<T>(key: string, value: string | T, format?: CacheFormat) {
    if (!format || format === "text") {
      localStorage.setItem(key, String(value));

      return;
    }

    if (format === "json") {
      localStorage.setItem(key, JSON.stringify(value));

      return;
    }

    localStorage.setItem(key, base64.jsonToBase64(value));
  }

  // 删掉这一把钥匙下的缓存
  remove(key: string) {
    localStorage.removeItem(key);
  }
}

// 全站共用这一份，调用时写 utils.cache.get
export const cache = new Cache();
