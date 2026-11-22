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
 *   4. 作用域内需要还原的轮廓。清零的描边令牌在个别子树里仍是唯一的结构载体
 *      （设置页的卡片与按钮、轮次导航的刻度），在这些子树里把令牌重绑为大纲色，
 *      子树之外维持零轮廓。
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

/* 对话右侧的轮次导航刻度：刻度线是该导航里唯一把 border-l4 当颜料用的位置（伪元素的
 * 背景色），令牌透明后只有活动刻度与预览刻度还看得见，其余刻度连同整条导航一起消失。
 * 每条刻度是按钮的伪元素，因此在按钮上重绑该令牌，伪元素继承到 outline-variant 色调，
 * 刻度按产品自己的规则继续分级（未加载更窄更淡、活动更宽更亮）。
 *
 * 用变量重绑而不是直接给伪元素写背景色：活动、预览与聚焦状态各自覆盖了伪元素的背景色，
 * 选择器若命中伪元素就会按特异性压过它们，刻度分级随之失效；变量只影响未被覆盖的分支。 */
nav button[data-index] {
  --dsw-alias-border-l4: var(--dsh-m3-outline-variant);
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

/* 设置面板内的轮廓。产品的设置页把正文写成一组控件与卡片：提供方卡片、编辑与删除
 * 按钮、输入框、模型条目、外观方块、添加按钮，轮廓一律取自 border-l3、border-l4 与
 * settings-card-stroke。这三条令牌为全应用零轮廓而清零，于是设置页失去全部边界——
 * 卡片与面板同色、按钮与正文同色，只剩孤立文字。
 *
 * 这里把三条令牌在设置面板作用域内重绑为 outline-variant：面板内恢复产品原本的 0.5dp
 * 轮廓，面板外仍保持 Material 3 的零轮廓。用令牌重绑而不是逐条选择器重画，是因为
 * 这些轮廓分布在六个设置分节、二十余条规则里，且都写成 border 简写；重画需要为每类
 * 控件单独挑锚点，而重绑一次即可覆盖全部，也不依赖任何 CSS Module 类名。
 *
 * [data-shortcut-modal] 的取值在全局互不相同（settings / shortcut-edit / sidebar），
 * 因此该作用域精确落在设置面板上。 */
[data-shortcut-modal="settings"] {
  --dsw-alias-border-l3: var(--dsh-m3-outline-variant);
  --dsw-alias-border-l4: var(--dsh-m3-outline-variant);
  --dsw-alias-settings-card-stroke: var(--dsh-m3-outline-variant);
}

/* 设置页外观三选一：产品的方块靠 border-l4 画出 0.5dp 轮廓、靠 bg-module-platform
 * 给选中项上色。三个方块只剩图标与文字时与页面上的普通文本无异，选中项虽有容器色调
 * 的填充，轮廓仍不可省，否则无从判断这是三个可点的方块。Material 3 的分段按钮比
 * 普通控件重一档：1dp outline 作容器轮廓、二级容器色作选中段的填充，这里照此加强。
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
