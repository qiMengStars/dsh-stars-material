/**
 * 主题的样式表部分。
 *
 * 覆盖令牌可为任何通过自定义属性取色的元素换色，但无法删除声明，也无法重绘那些
 * 颜料来自本主题透明化令牌的规则。本表补足三类缺口：
 *
 *   1. 原本以边框色作为颜料的位置。部分分隔线、进度条轨道与表格行分隔使用
 *      --dsw-alias-border-l1 / l2 / l3 / l4 上色。这些令牌现已透明，选择器能命中
 *      的位置改用表面阶梯重绘。
 *   2. 必须消失的声明。Material 3 不在输入框或错误徽标外绘制描边，相应边框声明
 *      归零。仅调整 border*，不调整 outline。
 *   3. 令牌无法承载的值。包括圆角刻度、缓动曲线与交互转场。
 *
 * 其余部分交给令牌层。下列规则不针对 CSS Module 哈希类名、产品类名或布局细节：
 * 选择器仅使用标签名、ARIA 角色与 data 属性，DSH 升级后仍然适用。
 */

import { MOTION_TOKENS, SHAPE_TOKENS } from '../parts/token-map.js';

const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => '  ' + name + ': ' + value + ';')
    .join('\n');

/**
 * 仅在主题开启时生效的规则。
 *
 * 桥接变量（--dsh-m3-*）由主题令牌层写入，下列值随当前配色自动变化。
 */
export const THEME_RULES = `
:root {
 ${declarations(SHAPE_TOKENS)}
 ${declarations(MOTION_TOKENS)}
}

/* ---------------------------------------------------------------------------
 * 1. 原来以边框令牌作为颜料的位置
 * ------------------------------------------------------------------------- */

/* Markdown 与通用分隔线：1dp、outline-variant 色调。产品原本使用 10% 黑的
 * 0.5dp 发丝线，该两个令牌在本主题中为透明。 */
hr {
  border: 0;
  height: 1px;
  background: var(--dsh-m3-outline-variant);
}

/* 菜单和列表中的分组分隔。 */
[role="separator"] {
  border: 0;
  background: var(--dsh-m3-outline-variant);
}

/* 上传与任务进度条轨道：使用容器色调，使压在其上的主色进度条成为该行唯一的
 * 饱和色。 */
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

/* 开关轨道：产品以 border-l3 上色，该令牌在本主题中为透明，改用
 * outline-variant 重绘，轨道保持可辨。 */
[role="switch"][aria-checked="false"] {
  background: var(--dsh-m3-outline-variant);
}

[role="switch"][aria-checked="true"] {
  background: var(--dsh-m3-primary);
}

/* 原先靠 1dp 发丝线分隔的表格行。 */
tr[data-turn-start="true"]:not(:first-child) > td {
  box-shadow: inset 0 1px 0 var(--dsh-m3-outline-variant);
}

/* ---------------------------------------------------------------------------
 * 1b. 选中行使用容器色调
 * ------------------------------------------------------------------------- */

/* 产品为选中的会话行与悬停的行使用同一令牌，两种状态因此无法区分，且悬停较选中
 * 更重（8% 状态层叠在侧栏色上，深于该行的静息填充）。Material 3 以角色区分：
 * 悬停是表面上的状态层，选中是容器色调。 */
[role="treeitem"][aria-selected="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* 设置页外观三选一：产品的方块靠 border-l4 画出 0.5dp 轮廓、靠 bg-module-platform
 * 给选中项上色。border-l4 在本主题中被清零，三个方块于是只剩图标与文字，与页面上
 * 的普通文本无异——选中项虽有容器色调的填充，轮廓仍不可省，否则无从判断这是三个
 * 可点的方块。Material 3 的分段按钮用 1dp outline 作容器轮廓、二级容器色作选中段
 * 的填充，这里照此重绘：轮廓三项都有，填充只给选中项。
 *
 * [data-slot] 是本产品为插槽预留的锚点，settings.general.item 内只有外观行会渲染
 * aria-pressed，其余各行不使用该属性，因此不会波及其它设置项。 */
[data-shortcut-modal="settings"] [data-slot="settings.general.item"] button[aria-pressed] {
  border: 1px solid var(--dsh-m3-outline);
}

[data-shortcut-modal="settings"] [data-slot="settings.general.item"] button[aria-pressed="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* ---------------------------------------------------------------------------
 * 2. Material 3 不绘制的描边
 * ------------------------------------------------------------------------- */

/* 填充式输入框：输入区由容器色调承载，聚焦状态以下方聚焦环表示。产品中有部分
 * 组件把 outline 设为 none、以 border 颜色表示聚焦，本规则为这些元素补上聚焦环；
 * 不删除任何既有聚焦环。 */
input:focus,
textarea:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--dsh-m3-primary);
  outline-offset: 1px;
  outline-style: solid;
}

/* 错误、警告、成功徽标靠填充色与文字色传达语义，外层轮廓被去除。
 * box-shadow 保持不变，差分行的内嵌竖条因而继续生效。 */
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
 * 3. 交互与动效
 * ------------------------------------------------------------------------- */

/* Material 3 用标准曲线处理颜色过渡，强调曲线留给位移。 */
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
