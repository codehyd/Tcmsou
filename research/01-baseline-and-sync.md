# 现有实现与同步基线

核对日期：2026-11-13。

## 两份既有成果

- GitHub：https://github.com/codehyd/Tcmsou ，远端 main 起点 a27bbc7bd6e4df94f043b3c3c2143830a28b08c5。
- 本机用户目录：E:\自学中医\中医项目 。核对时没有 .git，属于独立的 tcm-pot-preview 原型，不是远端仓库的未提交版本。
- 远端包含 apps/web（React、Vite、Three.js/React Three Fiber、Zustand，药柜/药材详情/处方等模块）和 3D_modules（陈皮 Blender、GLB、纹理及预览）。仅从文件结构核实存在，未在本次启动/构建或验收这些功能。
- 本机原型包含 Three.js 场景、锅具、药材形态/材质实验、实拍图片预览；不是完整的远端 React 应用。

## 本次整合方式

保留远端 main 的所有原有文件与提交历史，将原本地原型按原样归档到 experiments/tcm-pot-preview/，不直接覆盖 apps/web 或已有陈皮资产。node_modules 是可再生的本机依赖，不提交。

本地目录作为完整仓库接入，使用独立分支 sync/local-3d-preview-20261113。该分支用于整合和第一阶段研究；未经单独授权不合并 main。GitHub 项目资源和本地目录均指向此项目，前者指定该分支，后者使用 in_place 串行执行。

本地原型的原始源文件另有同步前 ZIP 备份和 SHA256 清单，存放于本次配置助手的工作区。整合后按清单核对文件内容，排除 node_modules 和构建输出。

## 后续运行入口（本次未运行）

- 主应用：apps/web/，依其 package.json 与 pnpm-lock.yaml 使用匹配的包管理器。
- 旧三维实验：experiments/tcm-pot-preview/，保留其 package.json 与 package-lock.json。
- Blender 资产：3D_modules/；只读研究阶段不要执行其中的脚本。

## 素材与功能边界

原型 public/herbs/sources.txt 标注部分图片来自香港浸会大学相关数据库，且仅供学习预览、版权归原机构。原型的移动不构成新的商业使用授权；在发布、分发或衍生资产前需核实来源条款。

用户提出的 Leafer 自定义模板和 Minecraft 联动在本次只记为待研究方向，不能由存在处方模块或 Three.js 依赖推断已经实现。
