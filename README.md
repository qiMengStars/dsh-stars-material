# dsh-stars-material

> [!IMPORTANT]
> made by pure vibe coding

适用于 DeepSeek Harness 的 Material 3（Material You）界面主题插件，使用表面色调阶梯替代传统边框，并以状态层替代投影效果。

安装后，前往 **设置 → Material 3** 即可启用主题并配置配色。

## 功能特性

- 基于 Material 3 色彩角色重绘界面，由同一种子色同步生成浅色与深色两套配色方案
- 移除传统边框与投影，改用多级表面色调区分层级，并通过状态层呈现悬停、按压与选中反馈
- 支持自动读取 Windows 系统主题色动态生成配色（读取失败时回退至默认预设），同时内置 8 种预设方案
- 配置自动保存在本地，刷新页面即可生效

## 目录结构

```
LICENSE                   本项目 MIT 协议全文
plugin/                   构建后的插件产物
  package.json            插件清单（dsh.client、dsh.bundle.patch、files）
  cordis.patch.yml        插件注入补丁配置
  index.js                Host 端入口：读取系统主题色并提供调色板接口
  client.js               Client 端入口：打包后的主题脚本
  LICENSE                 随包分发的 MIT 协议全文
  icon.svg, locale/*.json 插件图标与中/英多语言文案
  lib/palette.js          供 Host 端使用的调色板生成引擎
  lib/mcu/**              内置的 Material Color Utilities 0.4.0 依赖
src/                      插件源码
  parts/palette-spec.js   色彩角色顺序、预设定义及桥接角色配置
  parts/palette-engine.js 种子色生成色彩角色、数据打包与对比度校验
  parts/token-map.js      产品级样式变量映射表
  client/main.js          变量应用、主题层管理、设置页面与重试逻辑
  client/stylesheet.js    补充 CSS 样式规则（圆角、动效与状态覆盖）
  generated/palettes.js   内置预设的预计算调色板数据
build/                    构建与校验脚本
vendor/                   上游依赖源码及宿主原始样式参考
  dsh-survey/LICENSE      摘录样式表的 MIT 协议全文
  material-color-utilities/LICENSE
                          Material Color Utilities 的 Apache-2.0 协议全文
```

## 开发与构建

运行以下命令生成产物并执行校验：

```powershell
node build/verify.mjs
```

`plugin/client.js`、`plugin/lib/**` 与 `src/generated/palettes.js` 均为脚本自动生成的文件，请勿手动修改。

## 已知问题

- 深色模式及部分浮层组件（菜单、对话框、提示框）在去除阴影后的视觉表现仍在持续完善中。
- 受宿主原生控件结构与无边框样式限制，以下细节暂未完全对齐 Material 3 规范：
  - 开关（Switch）组件尺寸与原生复选框（Checkbox）样式
  - 部分按钮圆角及标签页（Tab）指示器样式
  - 默认字体栈配置
  - 两处 SVG 环形进度条轨道颜色
  - 原生依赖边框实现的细微分割线在去边框后不再显示

## 开源协议

- 本项目代码基于 MIT 协议开源，协议全文见 [LICENSE](LICENSE)。
- `plugin/lib/mcu/**` 与 `vendor/material-color-utilities/**` 遵循 Apache-2.0 协议（Material Color Utilities），协议全文随源码一并保留。
- `vendor/dsh-survey/**` 的四份样式表摘自 DeepSeek Harness，遵循 MIT 协议（Copyright (c) 2026 DeepSeek），协议全文见 [vendor/dsh-survey/LICENSE](vendor/dsh-survey/LICENSE)。