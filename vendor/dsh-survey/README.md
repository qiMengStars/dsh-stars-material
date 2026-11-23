# 从 DeepSeek Harness 提取的参考样式表

以下文件从已安装的 DeepSeek Harness `app.asar` 中原样提取，用于离线校验 CSS 变量覆盖率。重新提取时运行：

```
node build/vendor-survey.mjs <path-to-app.asar>
```

| 文件 | 字节 | 说明 |
| --- | --- | --- |
| `design-platform.css` | 29861 | 定义浅色与深色两套完整的 `--dsw-*` 颜色变量，是变量覆盖检查的基准集合。 |
| `base.css` | 1933 | 定义圆角刻度与默认字体栈，形状映射与本表保持一致。 |
| `focus.css` | 1018 | 定义 `--dsw-focus-ring-width: 2px`，用于对齐焦点环规格。 |
| `gradient-shadow-text.css` | 15273 | 定义 `--dsw-shadow-lv*` 与 `--dsw-elevation-*` 阴影及高程变量。 |

`build/validate-coverage.mjs` 会读取全部四份样式表：`design-platform.css` 定义必须全覆盖的颜色变量集合，四份样式表的并集则用于校验 `src/parts/token-map.js` 中不存在无效变量名。

## 许可协议

这些样式表来自 DeepSeek Harness（MIT 协议，`Copyright (c) 2026 DeepSeek`），协议原文保存在同目录的 [LICENSE](LICENSE) 中。每次运行提取脚本都会同步重写该文件。

## 宿主样式变更后的同步流程

1. `node build/vendor-survey.mjs <path-to-app.asar>`
2. `node build/validate-coverage.mjs`（若宿主新增或重命名了变量，校验会以非零码退出）
3. 根据校验结果更新 `src/parts/token-map.js`
4. `node build/verify.mjs`，然后重新安装插件

编译后的前端聚合样式（`dist/assets/index-*.css`，约 92 KB）仅引用上述四份源码样式表中声明的变量，因此无需提取。
