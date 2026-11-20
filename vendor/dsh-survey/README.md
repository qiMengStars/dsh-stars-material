# 从 DSH 抽出来的令牌样式表

从已安装的 DeepSeek Harness `app.asar` 里原样取出。要重新生成就跑：

```
node build/vendor-survey.mjs <path-to-app.asar>
```

| 文件 | 字节 | 为什么要留 |
| --- | --- | --- |
| `design-platform.css` | 29861 | 唯一的颜色权威：明暗两套的全部 --dsw-* 颜色令牌。 |
| `base.css` | 1933 | 圆角刻度和字体族，形状映射必须与它一致。 |
| `focus.css` | 1018 | 证明 --dsw-focus-ring-width 本来就是 2px，也就是本来就符合 M3。 |
| `gradient-shadow-text.css` | 15273 | 声明了 --dsw-shadow-lv* 和 --dsw-elevation-*，别的样式表都没定义它们。 |

`build/validate-coverage.mjs` 四份都读。`design-platform.css` 给出产品保证会读的颜色
令牌集合（所以一个都不能缺）；四份的并集给出真实存在的名字集合（所以一个都不能编）。

## 协议

这几份样式表抄自 DeepSeek Harness，它的包是 MIT（`Copyright (c) 2026 DeepSeek`）。
它要求的声明就在旁边的 [LICENSE](LICENSE) 里，每次运行这个脚本都会重写一遍。

## DSH 换了新的前端构建时

1. `node build/vendor-survey.mjs <path-to-app.asar>`
2. `node build/validate-coverage.mjs`——有令牌被改名、新增或删除就会以非零退出。
3. 按它报的东西更新 `src/parts/token-map.js`。
4. `node build/verify.mjs`，然后重装插件。

编译后的前端包（`dist/assets/index-*.css`，约 92 KB）是刻意不抄的：那是构建产物，而它
读到的每个令牌都在上面四份里声明过。
