import { CollectionHeader } from "@/rooms/collection/components/CollectionHeader";
import { countAllHerbs } from "@/lib/herb-catalog";
import { useCabinetHerbs } from "@/store/herb-cabinet";

import { dataSources } from "./styles";

// 一条能点开的公开出处：名字给人看，网址跳到对方站点
type SourceLink = {
  label: string;
  href: string;
};

// 本室真正用上的一架：说明它补了哪几栏，没有的栏写清楚，免得当成全套教材
type RoomSource = {
  title: string;
  body: string;
  links: SourceLink[];
};

// 收藏室实际摆出来的来源。只写本室用到的，不把别人的书目整页搬过来
const ROOM_SOURCES: RoomSource[] = [
  {
    title: "本室典籍",
    body: "软件自带的一小架，用来先把柜子摆开、和导入的表对照。这些条目没有单独官网。",
    links: [],
  },
  {
    title: "SymMap 药材表（SMHB）",
    body: "698 味。性味、归经和功效分类来自 SymMap 公布的药材表；功效和主治用的是该库整理的中文说明，以及表上关联的中医症状。",
    links: [
      { label: "SymMap 首页", href: "http://symmap.org/" },
      { label: "SymMap 下载页", href: "http://symmap.org/download/" },
    ],
  },
];

// 这些库自己注明过的上游，只留入口，不转抄工具书正文
const UPSTREAM_LINKS: SourceLink[] = [
  { label: "中国药典委员会", href: "https://www.chp.org.cn/" },
  { label: "中国中医科学院", href: "https://www.cacms.ac.cn/" },
  { label: "国家中医药管理局", href: "https://www.natcm.gov.cn/" },
  { label: "HERB 本草组鉴", href: "http://herb.ac.cn/" },
];

// 数据从哪来：顶栏「来源」进来。结构参考常见的来源说明，文字只写本室实际用到的表
export function DataSourcesPage() {
  const herbs = useCabinetHerbs();

  // 顶栏库存和收藏室同一口径，换页时数字不要忽然变一套
  const herbCount = countAllHerbs(herbs);

  return (
    <div className={dataSources.page()}>
      <CollectionHeader title="数据来源" herbCount={herbCount} backTo="/collection" />

      <div className={dataSources.body()}>
        <article className={dataSources.article()}>
          <p className={dataSources.lead()}>
            收藏室里的药，一部分是本室自带的典籍条目，其余是你从公开药表导入的。下面只说明这些字从哪张表来、点开到哪。本室不做诊疗。表上的性味、归经、功效和主治，是来源库的整理，不能代替教材和医师。
          </p>

          <section className={dataSources.section()}>
            <h2 className={dataSources.heading()}>本室用到的表</h2>

            {ROOM_SOURCES.map((source) => (
              <SourceCard key={source.title} source={source} />
            ))}
          </section>

          <section className={dataSources.section()}>
            <h2 className={dataSources.heading()}>可以接着查阅的公开入口</h2>

            <p className={dataSources.lead()}>
              SymMap 的下载页写明，药材资料对照过中国药典和几部中药工具书。原文以对方页面为准。HERB 也提供药材表，它的文件接口目前打不开，所以还没有放进一键导入。
            </p>

            <p className="text-sm leading-relaxed">
              {UPSTREAM_LINKS.map((link, index) => (
                <span key={link.href}>
                  {index > 0 ? " · " : null}
                  <ExternalLink link={link} />
                </span>
              ))}
            </p>
          </section>

          <section className={dataSources.section()}>
            <h2 className={dataSources.heading()}>导入时怎么算</h2>

            <p className={dataSources.lead()}>
              药名和本室一样、字也一样的，不会再写一遍。字不一样的会先摊开对照。本室典籍那一架，即使用外来的表盖了部分栏目，仍算本室自带的条目。
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

// 一张来源卡片：上面是名字和说明，下面是能跳出去的官网
function SourceCard({ source }: { source: RoomSource }) {
  return (
    <div className={dataSources.card()}>
      <h3 className={dataSources.cardTitle()}>{source.title}</h3>

      <p className={dataSources.cardBody()}>{source.body}</p>

      {source.links.length > 0 ? (
        <p className="mt-2 text-sm">
          {source.links.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <ExternalLink link={link} />
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

// 站外链接新开一页，免得把收藏室本身盖住
function ExternalLink({ link }: { link: SourceLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={dataSources.link()}
    >
      {link.label}
    </a>
  );
}
