/**
 * 主题启用时注入的补充 CSS 规则。
 *
 * 变量覆盖层无法修改样式声明本身，也无法为依赖已透明化边框变量的组件重新着色，本表补充以下四类规则：
 *   1. 将圆角刻度（SHAPE_TOKENS）与动效变量（MOTION_TOKENS）注入 `:root`。
 *   2. 重绘原本依赖边框变量作背景或分隔线的组件，以及选中列表项与设置面板内的局部轮廓。
 *   3. 为聚焦输入框补充焦点环，并清除状态徽标的外边框。
 *   4. 统一交互控件的颜色过渡动效，并响应 `prefers-reduced-motion`。
 *
 * 选择器仅使用标签名、ARIA 属性与 `data-*` 属性，不依赖 CSS Modules 哈希类名，避免随宿主更新失效。
 */

import { MOTION_TOKENS, SHAPE_TOKENS } from '../parts/token-map.js';

const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => '  ' + name + ': ' + value + ';')
    .join('\n');

/** 主题启用时注入的补充样式规则；引用的 --dsh-m3-* 变量由主题覆盖层写入并随配色同步更新。 */
export const THEME_RULES = `
:root {
 ${declarations(SHAPE_TOKENS)}
 ${declarations(MOTION_TOKENS)}
}

/* ---------------------------------------------------------------------------
 * 1. 重绘原本依赖边框变量的组件
 * ------------------------------------------------------------------------- */

/* 常规边框变量已透明，改用 outline-variant 绘制分隔线。 */
hr {
  border: 0;
  height: 1px;
  background: var(--dsh-m3-outline-variant);
}

/* 菜单与列表分组分隔线。 */
[role="separator"] {
  border: 0;
  background: var(--dsh-m3-outline-variant);
}

/* 进度条轨道改用最高档容器色，突出主色前景。 */
progress {
  border: 0;
  background: var(--dsh-m3-surface-container-highest);
  border-radius: 999px;
  overflow: hidden;
}

progress::-webkit-progress-bar {
  background: var(--dsh-m3-surface-container-highest);
  border-radius: 999px;
}

/* 开关轨道原使用 border-l3，现已透明，按开关状态重绘。 */
[role="switch"][aria-checked="false"] {
  background: var(--dsh-m3-outline-variant);
}

[role="switch"][aria-checked="true"] {
  background: var(--dsh-m3-primary);
}

/* 表格行分隔改用内阴影绘制。 */
tr[data-turn-start="true"]:not(:first-child) > td {
  box-shadow: inset 0 1px 0 var(--dsh-m3-outline-variant);
}

/* 对话右侧轮次导航刻度：伪元素依赖 border-l4 上色，在按钮上重绑变量可恢复常规刻度，同时不覆盖活动、预览与聚焦状态对伪元素背景色的优先级。 */
nav button[data-index] {
  --dsw-alias-border-l4: var(--dsh-m3-outline-variant);
}

/* ---------------------------------------------------------------------------
 * 2. 选中状态与设置面板局部轮廓
 * ------------------------------------------------------------------------- */

/* 宿主默认将选中会话行与悬停行共用同一背景变量，改用 secondary-container 区分选中态。 */
[role="treeitem"][aria-selected="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* 设置面板内局部重绑边框变量，维持卡片、按钮与输入框的边界清晰；面板外保持无边框风格。[data-shortcut-modal="settings"] 仅匹配设置窗口。 */
[data-shortcut-modal="settings"] {
  --dsw-alias-border-l3: var(--dsh-m3-outline-variant);
  --dsw-alias-border-l4: var(--dsh-m3-outline-variant);
  --dsw-alias-settings-card-stroke: var(--dsh-m3-outline-variant);
}

/* 设置页「外观」分段按钮：使用 1px outline 与 secondary-container 明确边界及选中态（仅外观行使用 aria-pressed）。 */
[data-shortcut-modal="settings"] [data-slot="settings.general.item"] button[aria-pressed] {
  border: 1px solid var(--dsh-m3-outline);
}

[data-shortcut-modal="settings"] [data-slot="settings.general.item"] button[aria-pressed="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* ---------------------------------------------------------------------------
 * 3. 聚焦环与状态徽标
 * ------------------------------------------------------------------------- */

/* 为隐藏默认 outline、依赖边框提示聚焦的输入控件补充焦点环。 */
input:focus,
textarea:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--dsh-m3-primary);
  outline-offset: 1px;
  outline-style: solid;
}

/* 清除错误、警告、成功等状态徽标的外边框；保留 box-shadow 以免影响代码差异行的内嵌竖条。 */
[aria-invalid="true"],
[data-state="error"],
[data-state="failed"],
[data-state="done"],
[data-state="warning"],
[data-failed="true"],
[data-tone="error"],
[data-tone="warn"],
[role="alert"] {
  border-color: transparent;
}

/* ---------------------------------------------------------------------------
 * 4. 交互过渡与减弱动效
 * ------------------------------------------------------------------------- */

button,
[role="button"],
[role="switch"],
[role="radio"],
[role="checkbox"],
[role="tab"],
[role="option"] {
  transition:
    background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    border-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    box-shadow var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
`;
