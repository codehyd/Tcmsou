// 开源药库清单：导入窗左下角点开就列这些表，可以只下载，也可以下载后直接导入
// 像柜台上的供货名录，名字是货，旁边两个钮才是领法

export interface OpenHerbSource {
  id: string;
  name: string;
  detail: string;
  href: string;
  filename: string;
}

// 站点自己带着这份表。线上没有开发服务转发，指回 /symmap-static 会在 GitHub 上 404
const packFile = `${import.meta.env.BASE_URL}packs/SymMap-v2.0-SMHB.xlsx`;

// 目前能直接拆进本室的开源药材表，文件躺在 public/packs，本地和 Pages 都从同一扇门取
export const OPEN_HERB_SOURCES: OpenHerbSource[] = [
  {
    id: "symmap-smhb-v2",
    name: "SymMap 药材表（SMHB）",
    detail: "698 味。含性味、归经、功效；主治是关联的中医症状。",
    href: packFile,
    filename: "SymMap-v2.0-SMHB.xlsx",
  },
];
