# 内置的 Material Color Utilities

本目录为 `@material/material-color-utilities@0.4.0`（Apache-2.0，见 [LICENSE](LICENSE)）的本地缓存副本，使构建与打包流程无需联网或额外安装依赖即可运行。

## 本地改动

上游包的 ESM 源码在相对 `import` 中省略了 `.js` 扩展名（如 `from './dynamiccolor/dynamic_color'`），会导致 Node 原生 ESM 加载报 `ERR_MODULE_NOT_FOUND`。本副本通过 `build/vendor-mcu.mjs` 为所有相对路径补齐了 `.js` 后缀，未修改任何算法逻辑。

## 更新方式

先将上游包安装到临时目录，再显式传入其路径重建本目录，最后运行校验脚本：

```sh
cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
node build/verify.mjs
```

## 使用范围

本目录同时服务于构建期与运行时：

- **构建期**：`build/generate-palettes.mjs` 导入本目录，将 8 套内置预设预计算为 [`src/generated/palettes.js`](../../src/generated/palettes.js)。
- **运行时**：`build/bundle-host.mjs` 将本目录完整复制到 `plugin/lib/mcu/`，供 Host 端入口（`plugin/index.js` 经 `plugin/lib/palette.js`）在运行时根据 Windows 系统强调色或自定义种子色动态推导配色。

## 协议

- Material Color Utilities 采用 Apache License 2.0，协议原文见 [LICENSE](LICENSE)。
- 本仓库自身代码采用 MIT 协议，见根目录 [LICENSE](../../LICENSE)。
