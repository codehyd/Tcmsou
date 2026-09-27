import { Base64 } from "js-base64";

// 把 JSON 和 Base64 文本互转。Base64 是编码，用来存成一段文本，不是加密
class Base64Codec {
  // 把一份数据写成 JSON，再编成 Base64。中文由 js-base64 处理，不会乱码
  jsonToBase64(value: unknown) {
    const json = JSON.stringify(value);

    return Base64.encode(json);
  }

  // 把 Base64 解回 JSON。解不开或不是 JSON 时返回 null
  base64ToJson(value: string): unknown | null {
    try {
      const json = Base64.decode(value);

      return JSON.parse(json) as unknown;
    } catch {
      return null;
    }
  }
}

// 全站共用这一份，调用时写 utils.base64.jsonToBase64
export const base64 = new Base64Codec();
