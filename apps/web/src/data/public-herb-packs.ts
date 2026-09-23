// 开源药库清单：导入窗左下角点开就列这些表，可以只下载，也可以下载后直接导入
// 像柜台上的供货名录，名字是货，旁边两个钮才是领法

export interface OpenHerbSource {
  id: string;
  name: string;
  detail: string;
  href: string;
  filename: string;
}

// 目前能直接拆进本室的开源药材表。浏览器不能自己去 symmap.org 领，走开发服务转发
export const OPEN_HERB_SOURCES: OpenHerbSource[] = [
  {
    id: "symmap-smhb-v2",
    name: "SymMap 药材表（SMHB）",
    detail: "698 味。含性味、归经、功效；主治是关联的中医症状。",
    href: "/symmap-static/download/V2.0/SymMap v2.0, SMHB file.xlsx",
    filename: "SymMap-v2.0-SMHB.xlsx",
  },
];
