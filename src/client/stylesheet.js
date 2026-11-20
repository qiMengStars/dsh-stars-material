/**
 * 主题的样式表那一半。
 *
 * 覆盖令牌能给任何通过自定义属性取色的东西换色，但它删不掉一条声明，也重画不了
 * 那些"颜料本身来自被本主题透明化的令牌"的规则。这张表正好补这三类缺口：
 *
 *   1. 原本拿边框色当颜料的地方。有几条分隔线、进度条轨道和表格行分隔是用
 *      --dsw-alias-border-l1 / l2 / l3 / l4 上色的。这些令牌现在透明了，所以其中
 *      选择器稳定的那几处改用表面阶梯重绘。
 *   2. 必须消失的声明。Material 3 不在输入框或错误徽标外面画描边，所以这些边框声
 *      明归零。只动 border*，绝不动 outline，那是焦点系统的地盘。
 *   3. 令牌装不下的值。圆角刻度、缓动曲线和交互转场。
 *
 * 其余都交给令牌层。下面没有任何一条规则写到 CSS Module 哈希类名、产品类名或布局
 * 的一角：选择器只有标签名、ARIA 角色和 data 属性，这正是它能在 DSH 升级后继续管
 * 用的原因。
 */

import { MOTION_TOKENS, SHAPE_TOKENS } from '../parts/token-map.js';

const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => '  ' + name + ': ' + value + ';')
    .join('\n');

/**
 * 只在主题开启时才有意义的规则。
 *
 * 桥接变量（--dsh-m3-*）由主题令牌层写入，所以下面每个值都会自动跟着当前配色走。
 */
export const THEME_RULES = `
:root {
${declarations(SHAPE_TOKENS)}
${declarations(MOTION_TOKENS)}
}

/* ---------------------------------------------------------------------------
 * 1. 原来拿边框令牌当颜料的地方
 * ------------------------------------------------------------------------- */

/* Markdown 与通用分隔线：改成 outline-variant 色调的 1dp 细线，而不是 10% 黑
 * 的 0.5dp 发丝线。 */
hr {
  border: 0;
  height: 1px;
  background: var(--dsh-m3-outline-variant);
}

/* 菜单和列表里的分组分隔。 */
[role="separator"] {
  border: 0;
  background: var(--dsh-m3-outline-variant);
}

/* 上传/任务进度条轨道：用容器色调，这样压在上面的主色进度条才是这一行里唯一
 * 饱和的东西。 */
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

/* 开关轨道原本用 border-l3 上色，而那个令牌在本主题里是透明的，所以改由
 * outline-variant 色调重绘：够看得出是个轨道，又不至于变成一条分割线。 */
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
 * 1b. 选中的行用容器色调
 * ------------------------------------------------------------------------- */

/* 产品给选中的会话行和悬停的行用的是同一个令牌，两个状态因此分不出来，而且悬停看
 * 起来比选中还重（8% 状态层叠在侧栏色上，比这一行的静息填充还深）。Material 3 用
 * 角色区分：悬停是表面上的状态层，选中是容器色调。 */
[role="treeitem"][aria-selected="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* ---------------------------------------------------------------------------
 * 2. Material 3 不画的描边
 * ------------------------------------------------------------------------- */

/* 填充式输入框：由容器色调托着输入区，聚焦靠下面这圈环表示，而不是把边框染成主
 * 色。这会盖掉那些"把 outline 设成 none、改用 border 表示聚焦"的组件规则——它只
 * 加环，从不删环。 */
input:focus,
textarea:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--dsh-m3-primary);
  outline-offset: 1px;
  outline-style: solid;
}

/* 错误、警告、成功徽标靠填充色和文字色传达语义，围在外面的那圈轮廓去掉。
 * box-shadow 不动，差分行的内嵌竖条才能继续工作。 */
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

/* Material 3 用标准曲线做颜色过渡，强调曲线留给位移。 */
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
