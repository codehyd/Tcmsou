// 公开药表的出处。名字给人看，网址点了去官网
export interface HerbSource {
  // label 是来源名称
  label: string;

  // url 是官网地址，没有就不显示链接
  url?: string;
}
