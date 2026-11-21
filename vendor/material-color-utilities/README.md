# 内置的 Material Color Utilities

本目录是 `@material/material-color-utilities@0.4.0`（Apache-2.0，见 `LICENSE`）的副本，
使构建流程无需安装依赖或联网即可运行。

## 本地改动

上游包采用 ESM，但相对 import 省略了 `.js` 后缀（如 `from './dynamiccolor/dynamic_color'`），
Node 的 ESM 解析器会报 `ERR_MODULE_NOT_FOUND`。本副本为每个相对路径补上显式 `.js` 后缀。
除此之外与上游一致，算法未作修改。

## 更新方式

`build/vendor-mcu.mjs` 可从一份已安装的包重建本目录。将包安装到任意可写路径后，显式传入
该路径：

```sh
cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
node build/verify.mjs
```

脚本为所有 `.js` 补齐后缀，并复制 `LICENSE` 与 `package.json`，输出复制与修改的文件数。
路径参数不可省略。

## 使用范围

仅用于构建。`build/generate-palettes.mjs` 导入 `vendor/material-color-utilities/index.js`，
将每个种子色转换为 M3 `DynamicScheme`，再摊平为
[`src/generated/palettes.js`](../../src/generated/palettes.js)。发布的插件不加载本目录，
只读取现成的十六进制字符串。

## 协议

Material Color Utilities 采用 Apache License 2.0，原始协议文本见 [`LICENSE`](LICENSE)。
本仓库自身代码采用 MIT，见根目录 [`LICENSE`](../../LICENSE)。
