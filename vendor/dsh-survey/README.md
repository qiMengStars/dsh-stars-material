# 从 DSH 抽取的令牌样式表

以下文件从已安装的 DeepSeek Harness `app.asar` 中原样抽取。重新生成时执行：

```
node build/vendor-survey.mjs <path-to-app.asar>
```

| 文件 | 字节 | 保留依据 |
| --- | --- | --- |
| `design-platform.css` | 29861 | 颜色令牌的权威定义：包含明暗两套的全部 --dsw-* 颜色令牌。 |
| `base.css` | 1933 | 定义圆角刻度与字体族，形状映射须与此保持一致。 |
| `focus.css` | 1018 | 定义 --dsw-focus-ring-width 为 2px，与 Material 3 一致。 |
| `gradient-shadow-text.css` | 15273 | 定义 --dsw-shadow-lv* 与 --dsw-elevation-*，其余样式表未定义这些属性。 |

`build/validate-coverage.mjs` 读取全部四份样式表。`design-platform.css` 定义产品使用的
颜色令牌集合，其中令牌不得缺失；四份样式表的并集定义实际存在的令牌名称集合，
不得凭空编造名称。

## 许可协议

这些样式表抽取自 DeepSeek Harness 的包，其许可协议为 MIT（`Copyright (c) 2026 DeepSeek`）。
协议要求的声明保存在同目录的 [LICENSE](LICENSE) 中，每次运行本脚本都会重写该文件。

## DSH 前端构建变更后

1. `node build/vendor-survey.mjs <path-to-app.asar>`
2. `node build/validate-coverage.mjs`：令牌被重命名、新增或删除时以非零状态退出。
3. 依据校验结果更新 `src/parts/token-map.js`。
4. `node build/verify.mjs`，随后重新安装插件。

编译后的前端包（`dist/assets/index-*.css`，约 92 KB）不予抽取：该文件为构建产物，
其引用的令牌均在以上四份样式表中声明。
