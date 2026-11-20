# vendored 的 Material Color Utilities

这里是 `@material/material-color-utilities@0.4.0`（Apache-2.0，见 `LICENSE`），抄进来是
为了让 `build/generate-palettes.mjs` 那条流水线不装任何东西、也不联网就能跑。

## 为什么要一份改过的副本

上游包是 ESM，但相对 import 不带 `.js` 后缀（`import { ... } from './dynamiccolor/dynamic_color'`），
Node 的 ESM 解析器会直接报 `ERR_MODULE_NOT_FOUND`，所以每个相对路径都补上了显式的 `.js`。
这就是**唯一**的改动，算法一行都没动。

## 怎么更新

`build/vendor-mcu.mjs` 能从一份刚装好的包复现这个目录。把包装到任意可写的地方（仓库外的
临时目录就行），把路径传进去：

```sh
cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
node build/verify.mjs
```

脚本会把每个 `.js` 都过一遍补后缀，再抄上 `LICENSE` 和 `package.json`，最后打印
`已复制 N 个文件，改了 M 个`。路径必须显式给。

## 谁在用

只有构建在用。`build/generate-palettes.mjs` 导入 `vendor/material-color-utilities/index.js`，
把每个种子色变成一个 M3 `DynamicScheme`，再把结果摊平成
[`src/generated/palettes.js`](../../src/generated/palettes.js)。发出去的插件完全不加载这些
东西，它只切现成的十六进制字符串。

## 协议

Material Color Utilities 用 Apache License 2.0。原始协议文本逐字保留在 [`LICENSE`](LICENSE)。
本仓库自己的代码是 MIT（见根目录的 [`LICENSE`](../../LICENSE)）。
