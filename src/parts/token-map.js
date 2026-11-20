/**
 * 本插件接管的 DSH 令牌，按基础样式表的分层方式分组。这里出现的每个名称都由
 * DSH 随包样式表声明过，所以不会覆盖出一个产品从不读取的变量。
 *
 * 映射遵循 Material 3 的两条规则，而不是产品自己的分层模型：
 *
 *   1. 层级用表面容器色调阶梯表达，既不用描边，也不用投影。四个浅色边框令牌因此
 *      变成 `transparent`，高程组合值变成 `none`。
 *   2. 交互用 on-surface 状态层表达，不透明度按规范取（悬停 8%、按压 12%），不用
 *      阴影。
 */

/** 值就是一个 M3 角色的令牌。 */
export const ROLE_TOKENS = {
  '--dsw-alias-brand-primary': 'primary',
  '--dsw-alias-brand-primary-invert': 'inversePrimary',
  '--dsw-alias-label-primary': 'onSurface',
  '--dsw-alias-label-primary-dimmed': 'onSurface',
  '--dsw-alias-label-secondary': 'onSurfaceVariant',
  // 三级文字是产品里用得最多的次要墨色（430 条规则：时间戳、占位符、提示）。M3 给
  // 这种墨色配 on-surface-variant；`outline` 留给控件边界，12px 文字压在容器色上
  // 太浅了。
  '--dsw-alias-label-tertiary': 'onSurfaceVariant',
  '--dsw-alias-label-caption': 'onSurfaceVariant',
  '--dsw-alias-label-dimmed': 'outlineVariant',
  '--dsw-alias-menu-icon': 'onSurfaceVariant',

  // 表面阶梯：每一层比页面浅一档（浅色）或深一档（深色），于是嵌套本身就有高程
  // 感，一根描边都不用。
  '--dsw-alias-bg-base': 'surface',
  '--dsw-alias-bg-layer-1': 'surfaceContainerLow',
  '--dsw-alias-bg-layer-2': 'surfaceContainer',
  '--dsw-alias-bg-layer-3': 'surfaceContainerHigh',
  '--dsw-alias-bg-module-platform': 'surfaceContainer',
  '--dsw-alias-bg-multi-select': 'surfaceContainerHigh',
  '--dsw-alias-bg-overlay': 'surfaceContainerHighest',

  '--dsw-alias-button-info-fill': 'primary',
  '--dsw-alias-state-error-primary': 'error',
  '--dsw-alias-state-error-secondary': 'onErrorContainer',
  '--dsw-alias-state-success-primary': 'success',
  '--dsw-alias-state-success-secondary': 'onSuccessContainer',
  '--dsw-alias-state-success-tertiary': 'successContainer',
  '--dsw-alias-state-warn-primary': 'warning',
  '--dsw-alias-state-warn-secondary': 'onWarningContainer',
  '--dsw-alias-state-warn-tertiary': 'warningContainer',
  '--dsw-alias-state-warn-label': 'onWarningContainer',
  '--dsw-alias-state-idle-primary': 'outlineVariant',
  '--dsw-alias-switch-thumb': 'onPrimary',
  '--dsw-alias-link': 'primary',
  '--dsw-alias-markdown-code-block': 'surfaceContainerHigh',
  '--dsw-alias-markdown-code-block-banner': 'surfaceContainerHighest',
  '--dsw-alias-markdown-inline-code': 'surfaceContainerHigh',
  '--dsw-alias-markdown-citation': 'surfaceContainerHigh',
  '--dsw-alias-markdown-tag': 'surfaceContainerHighest',
  '--dsw-alias-markdown-placeholder': 'surfaceContainerHighest',
  '--dsw-alias-turn-trigger-bg': 'surfaceContainerHigh',
  '--dsw-alias-label-primary-foreground': 'onPrimary',
  '--dsw-alias-label-primary-inverted': 'inverseOnSurface',
  '--dsw-alias-toast-bg': 'inverseSurface',
  '--dsw-alias-toast-label': 'inverseOnSurface',
  '--dsw-alias-tooltip-bg': 'inverseSurface',
  '--dsw-alias-bg-document-preview': 'surfaceContainerHigh',
  '--dsw-alias-label-document-preview': 'onSurfaceVariant',
  '--dsw-alias-scrollbar-bg-l1': 'surfaceContainerHighest',
  '--dsw-alias-scrollbar-bg-l2': 'surfaceContainerHighest',
  '--dsw-alias-scrollbar-hover-l1': 'outlineVariant',
  '--dsw-alias-scrollbar-hover-l2': 'outlineVariant',
  '--dsw-alias-code-diff-added': 'successContainer',
  '--dsw-alias-code-diff-deleted': 'errorContainer',
  '--dsw-alias-menu-group-header-fill': 'surfaceContainerHighest',
  '--dsw-alias-button-ghost-active-fill': 'surfaceContainerHigh',
  '--dsw-alias-button-ghost-active-hover': 'surfaceContainerHighest',
  // 抬升按钮就是 M3 的实心色调按钮：用第二层容器色填充，才像是"容器页面上的一个
  // 控件"。它原先和侧栏共用填充，结果"新会话"和背后的表面同色，等于看不见。
  '--dsw-alias-button-elevated-fill': 'secondaryContainer',
  '--dsw-alias-button-floating-fill': 'surfaceContainer',
  '--dsw-alias-button-floating-hover': 'surfaceContainerHigh',
  '--dsw-alias-button-contrast-fill': 'inverseSurface',
  '--dsw-alias-state-business-primary': 'primary',
  '--dsw-alias-state-business-tertiary': 'primaryContainer',
  '--dsw-alias-state-done-primary': 'primary',
  '--dsw-alias-markdown-code-segment-selected': 'surfaceContainerHighest',
  '--dsw-alias-markdown-code-segment-unselected': 'surfaceContainerLow',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': 'primary',
  '--dsw-alias-brand-text': 'onSurface',
  '--dsw-alias-label-primary-bluish': 'primary',
  '--dsw-alias-label-on-color': 'onPrimary',

  // 卡片是表面而不是面板：比页面高一档，悬停时再高一档——M3 就是这样表示可悬停
  // 表面的。
  '--dsw-alias-card-fill': 'surfaceContainerLow',
  '--dsw-alias-card-fill-hover': 'surfaceContainer',
  '--dsw-alias-hovercard-bg': 'inverseSurface',
  '--dsw-alias-hovercard-label-primary': 'inverseOnSurface',
  '--dsw-alias-hovercard-label-secondary': 'inverseOnSurface',
  '--dsw-alias-hovercard-label-tertiary': 'inverseOnSurface',
  '--dsw-alias-hovercard-state-done': 'tertiary',
  '--dsw-alias-hovercard-state-error': 'error',
  '--dsw-alias-toast-action': 'inversePrimary',
  '--dsw-alias-tooltip-label': 'inverseOnSurface',

  // 图表系列与轨迹强调色是数据色：第一条系列用强调角色，于是它和别的东西一样跟着
  // 种子色走。
  '--dsw-alias-chart-messages': 'primary',
  '--dsw-alias-chart-system': 'outline',
  '--dsw-alias-chart-tools': 'tertiary',
  '--dsw-alias-trajectory-accent': 'primary',

  // JSON 查看器是个语法高亮器；键、值和标点各用不同角色，不再固定成蓝紫品红。
  '--dsw-alias-json-tree-icon': 'onSurfaceVariant',
  '--dsw-alias-json-tree-keyword': 'primary',
  '--dsw-alias-json-tree-number': 'primary',
  '--dsw-alias-json-tree-property': 'tertiary',
  '--dsw-alias-json-tree-punctuation': 'onSurface',
  '--dsw-alias-json-tree-string': 'error',

  '--dsw-specific-guide-hero': 'surfaceContainerHigh',
  '--dsw-specific-sidebar-right-flash': 'primary',

  // 没有描边做分隔之后，浮层改成实色：原先"半透明菜单叠在半透明菜单上"才是产品
  // 表达层级的方式，去了描边就撑不住了。
  '--dsw-menu-surface-fill': 'surfaceContainerHigh',
  '--dsw-specific-menu': 'surfaceContainerHigh',
  '--dsw-specific-selector': 'surfaceContainerHigh',
  '--dsw-specific-login-input': 'surfaceContainerHigh',
  // 输入框比菜单再高一档，浮层里的输入框才不会糊进背景。
  '--dsw-specific-input-major': 'surfaceContainerHighest',
  '--dsw-specific-tip': 'surfaceContainerHighest',
  '--dsw-specific-sidebar-fill': 'surfaceContainerLow',
  '--dsw-specific-bubble': 'secondaryContainer',
  '--dsw-specific-bubble-highlight': 'onSecondaryContainer',
  '--dsw-specific-sidebar-nav-item-active': 'secondaryContainer',
  '--dsw-specific-sidebar-nav-item-active-accent': 'onSecondaryContainer',
};

/**
 * 必须消失的令牌。
 *
 * `border-l1`/`l2`/`l4` 是产品的浅色分隔线（4%–16% 不透明度）。它们还被 14 条分隔
 * 线、开关轨道和高程组合值当作颜料使用，所以要紧的那几处改由样式表显式重绘，剩下
 * 的直接在这里变透明。
 */
export const CLEARED_TOKENS = [
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l2-darkmode-thin',
  // `border-l3` 是最后一处看得见的轮廓：「新会话」按钮、文件树面板边缘以及另外 68
  // 处边框都读它。还有四条规则拿它当填充（开关轨道、三条发丝分隔线），两个 SVG 环
  // 拿它当描边。清空它是做到零轮廓的唯一办法；那几处填充改由
  // src/client/stylesheet.js 用 `--dsh-m3-outline-variant` 重绘，两个仪表轨道靠自己
  // 的前景弧和文字标签保持可读。
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-settings-card-stroke',
  '--dsw-alias-button-ghost-active-border',
  '--dsw-alias-border-selected',
  '--dsw-alias-border-inverted',
  '--dsw-alias-border-inverted2',
  // 高程组合值用它来画描边，而每个重绑它的组件都指向上面的某个边框令牌。
  '--dsw-elevation-stroke-color',
];

/**
 * 状态层。
 *
 * Material 3 靠把内容色以固定不透明度叠在容器色上来表示交互，所以每一项都是一个角
 * 色混进 `transparent` 或另一个角色的 `color-mix`。权重取 M3 状态层的规范不透明度。
 */
export const STATE_LAYER_TOKENS = {
  '--dsw-alias-interactive-bg-hover': { role: 'onSurface', weight: 8, into: null },
  '--dsw-alias-interactive-bg-hover-solid': { role: 'onSurface', weight: 8, into: 'surface' },
  '--dsw-alias-interactive-bg-active': { role: 'onSurface', weight: 12, into: null },
  '--dsw-alias-interactive-bg-hover-accent': { role: 'primary', weight: 12, into: null },
  '--dsw-alias-interactive-bg-hover-danger': { role: 'error', weight: 12, into: null },
  '--dsw-alias-turn-trigger-bg-hover': { role: 'onSurface', weight: 8, into: 'surface' },
  '--dsw-alias-button-primary-fill': { role: 'primary' },
  // 实心按钮悬停是把 on-primary 叠到 primary 上，这样不用阴影也能看出悬停。
  '--dsw-alias-button-primary-hover': { role: 'onPrimary', weight: 8, into: 'primary' },
  '--dsw-alias-button-primary-dimmed': { role: 'onPrimary', weight: 12, into: 'primary' },
  '--dsw-alias-button-info-hover': { role: 'onPrimary', weight: 8, into: 'primary' },
};

/**
 * 保留 alpha 通道的令牌。M3 没有半透明表面角色，所以生成器按固定不透明度从对应角
 * 色推导——基础主题依赖它们做遮罩、选区填充和骨架微光。
 */
export const ALPHA_TOKENS = {
  '--dsw-alias-bg-mask-1': { role: 'scrim', alpha: 0.32 },
  '--dsw-alias-bg-mask-2': { role: 'scrim', alpha: 0.12 },
  '--dsw-alias-bg-mask-3': { role: 'scrim', alpha: 0.48 },
  '--dsw-alias-bg-skeleton': { role: 'onSurface', alpha: 0.06 },
  '--dsw-alias-bg-document-selection': { role: 'primary', alpha: 0.3 },
  // 卡片瓷片是页面色的一层薄雾：alpha 留着，颜色换成角色。
  '--dsw-alias-card-tile-fill': { role: 'onSurface', alpha: 0.04 },
  '--dsw-alias-json-tree-hover': { role: 'onSurface', alpha: 0.08 },
  '--dsw-specific-file-upload-track': { role: 'onSurface', alpha: 0.08 },
  // 毛玻璃侧栏保留自己表面色的一层半透明薄膜。
  '--dsw-specific-sidebar-glass-fill': { role: 'surfaceContainerLow', alpha: 0.55 },
  '--dsw-specific-sidebar-glass-hover': { role: 'surfaceContainerLow', alpha: 0.3 },
  '--dsw-specific-sidebar-glass-collapsed-fill': { role: 'surfaceContainerLow', alpha: 0.55 },
  '--dsw-specific-sidebar-glass-collapsed-hover': { role: 'surfaceContainerLow', alpha: 0.3 },
  '--dsw-specific-sidebar-tint': { role: 'primary', alpha: 0.06 },
  '--dsw-specific-sidebar-wash-top': { role: 'primary', alpha: 0.08 },
  '--dsw-specific-sidebar-wash-bottom': { role: 'tertiary', alpha: 0.06 },
  '--dsw-specific-sidebar-wash-top-clear': { role: 'primary', alpha: 0 },
  '--dsw-specific-sidebar-wash-bottom-clear': { role: 'tertiary', alpha: 0 },
};

/**
 * 基础值由两个角色混合而成的令牌。它们生成成 `color-mix` 表达式，让浏览器按当下
 * 的令牌值自己算。
 */
export const MIX_TOKENS = {
  '--dsw-alias-label-deep-diving': { role: 'primary', into: 'onSurface', weight: 70 },
  '--dsw-alias-label-deep-diving-shimmer': { role: 'primary', into: 'onSurface', weight: 30 },
  '--dsw-alias-tooltip-key-bg': { role: 'onSurface', into: 'inverseSurface', weight: 18 },
  '--dsw-alias-label-shimmer': { role: 'onSurface', into: 'surface', weight: 30 },
};

/** 保持字面量的令牌：它们描述的是插图，不是主题表面。 */
export const LITERAL_TOKENS = {
  '--dsw-alias-bg-mask-photo': '#000000e0',
  '--dsw-alias-bg-mask-drop': '#ffffffb3',
  '--dsw-alias-button-tool-bar-fill': '#54555780',
  '--dsw-alias-button-tool-bar-fill-invisible': '#1f1f1f5c',
  '--dsw-alias-button-tool-bar-hover': '#54555799',
};

/**
 * 差分令牌：M3 没有增删色对，所以把成功容器色和错误容器色往表面色方向兑出来。
 */
export const DIFF_TOKENS = {
  '--dsw-alias-file-diff-added-bg': { role: 'successContainer' },
  '--dsw-alias-file-diff-added-gutter': { role: 'successContainer', toward: 'surface', weight: 50 },
  '--dsw-alias-file-diff-added-marker': { role: 'success' },
  '--dsw-alias-file-diff-deleted-bg': { role: 'errorContainer' },
  '--dsw-alias-file-diff-deleted-gutter': { role: 'errorContainer', toward: 'surface', weight: 50 },
  '--dsw-alias-file-diff-deleted-marker': { role: 'error' },
};

/** 剩下的 M3 角色，对应到 DSH 的插画令牌。 */
export const ILLUSTRATION_TOKENS = {
  '--dsw-alias-illustration-background': 'surfaceContainerLow',
  '--dsw-alias-illustration-surface': 'surfaceContainerHighest',
  '--dsw-alias-illustration-backing': 'outlineVariant',
  '--dsw-alias-illustration-detail': 'outline',
  '--dsw-alias-illustration-inset': 'surfaceContainerHigh',
  '--dsw-alias-illustration-shadow': 'surfaceContainerHigh',
};

/**
 * 高程组合值与阴影档位。
 *
 * 这五个名称就是 DSH 里"深度"的全部视觉语言：一道 0.5dp 描边加两层极淡光晕。
 * Material 3 只靠色调表达深度，所以它们全部解析成 `none`。有两类组件会在自己的元
 * 素上重绑 `--dsw-elevation-stroke-color`，所以清的是组合值本身，不只是它的颜色。
 */
export const ELEVATION_TOKENS = [
  '--dsw-shadow-lv1',
  '--dsw-shadow-lv2',
  '--dsw-shadow-lv3',
  '--dsw-elevation-stroke',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-elevation-soft',
];

/** M3 的形状刻度，用 DSH 自带的六档圆角表达。 */
export const SHAPE_TOKENS = {
  '--dsw-radius-xs': '4px',
  '--dsw-radius-sm': '8px',
  '--dsw-radius-md': '12px',
  '--dsw-radius-lg': '16px',
  '--dsw-radius-xl': '20px',
  '--dsw-radius-panel': '28px',
};

/** 缓动与时长，作为 CSS 变量交给样式表那半边用。 */
export const MOTION_TOKENS = {
  '--dsw-m3-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  '--dsw-m3-ease-standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
  '--dsw-m3-ease-standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
  '--dsw-m3-ease-emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
  '--dsw-m3-ease-emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  '--dsw-m3-ease-emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  '--dsw-m3-duration-short': '150ms',
  '--dsw-m3-duration-medium': '300ms',
  '--dsw-m3-duration-long': '500ms',
};
