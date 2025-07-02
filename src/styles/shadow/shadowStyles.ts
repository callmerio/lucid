/**
 * @file shadowStyles.ts
 * @description Shadow DOM 样式字符串集合
 * 将 CSS 内容作为字符串导出，用于动态注入到 Shadow DOM 中
 */

// 设计令牌样式
export const designTokensCSS = `
/**
 * Lucid Extension Design Tokens
 * 统一的设计变量系统，支持主题切换和组件复用
 */

:root {
  /* ===== 颜色系统 ===== */

  /* 毛玻璃背景色 */
  --lucid-bg-glass-primary: rgba(40, 40, 40, 0.7);
  --lucid-bg-glass-secondary: rgba(30, 30, 30, 0.8);
  --lucid-bg-glass-light: rgba(255, 255, 255, 0.1);

  /* 文字颜色 */
  --lucid-text-primary: rgba(255, 255, 255, 0.95);
  --lucid-text-secondary: rgba(255, 255, 255, 0.8);
  --lucid-text-tertiary: rgba(255, 255, 255, 0.7);
  --lucid-text-muted: #aaa;
  --lucid-text-disabled: #ccc;

  /* 边框颜色 */
  --lucid-border-subtle: rgba(255, 255, 255, 0.0);
  --lucid-border-light: rgba(255, 255, 255, 0.1);
  --lucid-border-medium: rgba(255, 255, 255, 0.2);

  /* 交互颜色 */
  --lucid-accent-primary: #ff6b6b;
  --lucid-accent-primary-hover: #ff4757;
  --lucid-accent-secondary: rgba(255, 255, 255, 0.1);
  --lucid-accent-secondary-hover: rgba(255, 255, 255, 0.2);

  /* 状态颜色 */
  --lucid-success: #4caf50;
  --lucid-warning: #ff9800;
  --lucid-error: #f44336;
  --lucid-info: #2196f3;

  /* ===== 字体系统 ===== */

  /* 字体栈 */
  --lucid-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;

  /* 字体大小 */
  --lucid-font-size-xs: 10px;
  --lucid-font-size-sm: 12px;
  --lucid-font-size-base: 13px;
  --lucid-font-size-md: 14px;
  --lucid-font-size-lg: 16px;
  --lucid-font-size-xl: 18px;
  --lucid-font-size-2xl: 24px;

  /* 行高 */
  --lucid-line-height-tight: 1.2;
  --lucid-line-height-normal: 1.3;
  --lucid-line-height-relaxed: 1.6;

  /* 字重 */
  --lucid-font-weight-normal: 400;
  --lucid-font-weight-medium: 500;
  --lucid-font-weight-semibold: 600;

  /* 字间距 */
  --lucid-letter-spacing-tight: -0.025em;
  --lucid-letter-spacing-normal: 0;
  --lucid-letter-spacing-wide: 0.2px;

  /* ===== 间距系统 ===== */

  --lucid-spacing-0: 0;
  --lucid-spacing-1: 2px;
  --lucid-spacing-2: 4px;
  --lucid-spacing-3: 6px;
  --lucid-spacing-4: 8px;
  --lucid-spacing-5: 12px;
  --lucid-spacing-6: 15px;
  --lucid-spacing-8: 20px;
  --lucid-spacing-10: 24px;
  --lucid-spacing-12: 32px;

  /* ===== 圆角系统 ===== */

  --lucid-radius-none: 0;
  --lucid-radius-sm: 4px;
  --lucid-radius-md: 6px;
  --lucid-radius-lg: 8px;
  --lucid-radius-xl: 12px;
  --lucid-radius-full: 9999px;
  --lucid-radius-xs: 2px;

  /* ===== 阴影系统 ===== */

  --lucid-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --lucid-shadow-md: 0 4px 20px rgba(0, 0, 0, 0.3);
  --lucid-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
  --lucid-shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.4);

  /* ===== 模糊效果 ===== */

  --lucid-blur-sm: blur(4px);
  --lucid-blur-md: blur(10px);
  --lucid-blur-lg: blur(20px);

  /* ===== 过渡动画 ===== */

  --lucid-transition-fast: 150ms ease-out;
  --lucid-transition-normal: 300ms ease-out;
  --lucid-transition-slow: 400ms ease-out;

  /* 缓动函数 */
  --lucid-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --lucid-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --lucid-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --lucid-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ===== Z-Index 层级 ===== */

  --lucid-z-dropdown: 1000;
  --lucid-z-sticky: 1020;
  --lucid-z-fixed: 1030;
  --lucid-z-modal-backdrop: 1040;
  --lucid-z-modal: 1050;
  --lucid-z-popover: 1060;
  --lucid-z-tooltip: 2147483646;
  --lucid-z-toolpopup: 2147483647;

  /* ===== 尺寸系统 ===== */

  /* 组件最小/最大宽度 */
  --lucid-width-tooltip-min: 120px;
  --lucid-width-tooltip-max: 280px;
  --lucid-width-toolpopup: 320px;

  /* 组件高度 */
  --lucid-height-button-sm: 20px;
  --lucid-height-button-md: 24px;
  --lucid-height-button-lg: 32px;
}

/* ===== 暗色主题变量 (默认) ===== */
[data-theme="dark"], :root {
  /* 继承上面的默认值 */
}

/* ===== 亮色主题变量 ===== */
[data-theme="light"] {
  /* 毛玻璃背景色 - 亮色主题 */
  --lucid-bg-glass-primary: rgba(255, 255, 255, 0.8);
  --lucid-bg-glass-secondary: rgba(248, 248, 248, 0.9);
  --lucid-bg-glass-light: rgba(0, 0, 0, 0.05);

  /* 文字颜色 - 亮色主题 */
  --lucid-text-primary: rgba(0, 0, 0, 0.9);
  --lucid-text-secondary: rgba(0, 0, 0, 0.7);
  --lucid-text-tertiary: rgba(0, 0, 0, 0.6);
  --lucid-text-muted: #666;
  --lucid-text-disabled: #999;

  /* 边框颜色 - 亮色主题 */
  --lucid-border-subtle: rgba(0, 0, 0, 0.1);
  --lucid-border-light: rgba(0, 0, 0, 0.15);
  --lucid-border-medium: rgba(0, 0, 0, 0.2);

  /* 交互颜色 - 亮色主题 */
  --lucid-accent-secondary: rgba(0, 0, 0, 0.05);
  --lucid-accent-secondary-hover: rgba(0, 0, 0, 0.1);
}
`;

// Tooltip 组件样式
export const tooltipCSS = `
/* ===== Base Tooltip Styles ===== */
.lucid-tooltip {
  position: absolute;
  z-index: var(--lucid-z-tooltip);
  opacity: 0;
  transform: translateY(-2px);
  transition:
    opacity var(--lucid-transition-fast),
    transform var(--lucid-transition-fast);
  pointer-events: none;
  font-family: var(--lucid-font-family);
  font-size: var(--lucid-font-size-base);
  line-height: var(--lucid-line-height-normal);
  max-width: var(--lucid-width-tooltip-max);
  min-width: var(--lucid-width-tooltip-min);
}

.lucid-tooltip-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* ===== Content Styles ===== */
.lucid-tooltip-content {
  background: var(--lucid-bg-glass-primary);
  backdrop-filter: var(--lucid-blur-md);
  -webkit-backdrop-filter: var(--lucid-blur-md);
  border-radius: var(--lucid-radius-md);
  border: 1px solid var(--lucid-border-subtle);
  box-shadow: var(--lucid-shadow-md);
  color: var(--lucid-text-primary);
  position: relative;
  font-size: var(--lucid-font-size-md);
  white-space: nowrap;
  text-align: left;
  font-weight: var(--lucid-font-weight-normal);
  letter-spacing: var(--lucid-letter-spacing-wide);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition:
    width var(--lucid-transition-normal),
    padding-right var(--lucid-transition-normal);
  height: auto;
  padding: var(--lucid-spacing-3) var(--lucid-spacing-4);
}

.lucid-tooltip-main {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
}

.lucid-tooltip-text {
  flex: 1;
  display: flex;
  align-items: center;
}

.lucid-tooltip-phonetic {
  color: var(--lucid-text-secondary);
  margin-left: var(--lucid-spacing-2);
}

.lucid-tooltip-pos {
  color: var(--lucid-text-tertiary);
  margin-left: var(--lucid-spacing-2);
}

.lucid-tooltip-hover-zone {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40%;
  pointer-events: none;
}

.lucid-tooltip-actions {
  display: none;
  align-items: center;
  gap: var(--lucid-spacing-2);
  margin-left: 0px;
  opacity: 0;
  transform: translateX(15px) scale(0.8);
  max-width: 0;
  overflow-x: visible;
  overflow-y: visible;
  transition: opacity 400ms var(--lucid-ease-bounce), transform 400ms var(--lucid-ease-bounce), max-width var(--lucid-transition-normal), margin-left var(--lucid-transition-normal);
}

/* Tooltip 展开状态样式 */
.lucid-tooltip-expanded .lucid-tooltip-content {
  padding-right: var(--lucid-spacing-3);
}

.lucid-tooltip-expanded .lucid-tooltip-actions {
  max-width: 60px;
  margin-left: var(--lucid-spacing-4);
}

.lucid-tooltip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--lucid-height-button-sm);
  height: var(--lucid-height-button-sm);
  border: none;
  border-radius: var(--lucid-radius-sm);
  background: var(--lucid-accent-secondary);
  color: var(--lucid-text-secondary);
  cursor: pointer;
  transition: all var(--lucid-transition-fast);
  padding: 0;
  font-family: var(--lucid-font-family);
  user-select: none;
}

.lucid-tooltip-btn:hover {
  background: var(--lucid-accent-secondary-hover);
  color: var(--lucid-text-primary);
  animation: lucid-heartbeat 4.2s ease-in-out infinite;
}

.lucid-tooltip-btn:active {
  transform: scale(0.95);
}

.lucid-tooltip-btn svg {
  flex-shrink: 0;
}

.lucid-tooltip-btn-like svg {
  transform: scale(0.7);
}

.lucid-tooltip-btn-liked {
  background: var(--lucid-accent-primary) !important;
  color: white !important;
}

.lucid-tooltip-btn-liked:hover {
  background: var(--lucid-accent-primary-hover) !important;
  animation: lucid-heartbeat 4.2s ease-in-out infinite;
}
`;

// Toolfull 组件样式
export const toolfullCSS = `
/* ===== Toolfull Component Styles ===== */
.lucid-toolfull {
  position: relative;
  max-width: var(--lucid-width-toolpopup);
  min-width: 280px;
  background: var(--lucid-bg-glass-primary);
  backdrop-filter: var(--lucid-blur-md);
  -webkit-backdrop-filter: var(--lucid-blur-md);
  border-radius: var(--lucid-radius-lg);
  border: 1px solid var(--lucid-border-light);
  box-shadow: var(--lucid-shadow-lg);
  color: var(--lucid-text-primary);
  font-family: var(--lucid-font-family);
  font-size: var(--lucid-font-size-md);
  line-height: var(--lucid-line-height-normal);
  overflow: hidden;
}

.lucid-toolfull-visible {
  opacity: 1;
  transform: scale(1);
}

.lucid-toolfull-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lucid-spacing-5) var(--lucid-spacing-6);
  border-bottom: 1px solid var(--lucid-border-light);
  background: var(--lucid-bg-glass-light);
}

.lucid-toolfull-title {
  display: flex;
  align-items: center;
  gap: var(--lucid-spacing-3);
}

.lucid-toolfull-word {
  font-size: var(--lucid-font-size-lg);
  font-weight: var(--lucid-font-weight-semibold);
  color: var(--lucid-text-primary);
}

.lucid-toolfull-actions {
  display: flex;
  align-items: center;
  gap: var(--lucid-spacing-2);
}

.lucid-toolfull-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--lucid-height-button-md);
  height: var(--lucid-height-button-md);
  border: none;
  border-radius: var(--lucid-radius-sm);
  background: var(--lucid-accent-secondary);
  color: var(--lucid-text-secondary);
  cursor: pointer;
  transition: all var(--lucid-transition-fast);
  font-size: var(--lucid-font-size-sm);
}

.lucid-toolfull-actions button:hover {
  background: var(--lucid-accent-secondary-hover);
  color: var(--lucid-text-primary);
}

.lucid-toolfull-phonetic {
  padding: var(--lucid-spacing-4) var(--lucid-spacing-6);
  border-bottom: 1px solid var(--lucid-border-light);
  display: flex;
  gap: var(--lucid-spacing-5);
}

.lucid-toolfull-phonetic-group {
  display: flex;
  align-items: center;
  gap: var(--lucid-spacing-2);
}

.lucid-toolfull-phonetic-region {
  font-size: var(--lucid-font-size-xs);
  font-weight: var(--lucid-font-weight-medium);
  color: var(--lucid-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--lucid-letter-spacing-wide);
}

.lucid-toolfull-phonetic-text {
  font-size: var(--lucid-font-size-sm);
  color: var(--lucid-text-secondary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.lucid-toolfull-definitions-area {
  padding: var(--lucid-spacing-5) var(--lucid-spacing-6);
  max-height: 300px;
  overflow-y: auto;
}

.lucid-toolfull-explain-group {
  margin-bottom: var(--lucid-spacing-4);
}

.lucid-toolfull-explain-group:last-child {
  margin-bottom: 0;
}

.lucid-toolfull-definition {
  display: flex;
  flex-direction: column;
  gap: var(--lucid-spacing-2);
}

.lucid-toolfull-pos {
  display: inline-block;
  padding: var(--lucid-spacing-1) var(--lucid-spacing-3);
  border-radius: var(--lucid-radius-sm);
  background: var(--lucid-accent-secondary);
  color: var(--lucid-text-secondary);
  font-size: var(--lucid-font-size-xs);
  font-weight: var(--lucid-font-weight-medium);
  text-transform: lowercase;
  margin-bottom: var(--lucid-spacing-2);
}

.lucid-toolfull-definition-text-chinese {
  color: var(--lucid-text-primary);
  font-size: var(--lucid-font-size-md);
  line-height: var(--lucid-line-height-relaxed);
  position: relative;
}

.lucid-toolfull-definition-text-english-tooltip {
  display: block;
  color: var(--lucid-text-tertiary);
  font-size: var(--lucid-font-size-sm);
  line-height: var(--lucid-line-height-normal);
  margin-top: var(--lucid-spacing-1);
  font-style: italic;
}
`;

// 高亮组件样式
export const highlightCSS = `
/* ===== 高亮元素基础样式 ===== */
.lucid-highlight {
  transition: color 500ms ease-in-out;
  cursor: pointer;
  position: relative;
  /* 移除 padding, margin, border-radius 以避免影响原始文本的布局和间距 */
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
/* background intentionally left to inline style */

/* ===== 高亮闪烁动画 ===== */
@keyframes lucid-flash {
  0%, 100% { 
    color: inherit !important; 
  }
  50% { 
    background-color: currentColor !important; 
    color: #ffffff !important; 
  }
}

/* 应用闪烁动画的类 */
.lucid-highlight.flash {
  animation: lucid-flash 200ms ease-in-out;
}
`;

// 动画样式
export const animationsCSS = `
/* ===== Lucid Extension Animations ===== */

/* 心跳动画 */
@keyframes lucid-heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
}

/* 淡入动画 */
@keyframes lucid-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 滑入动画 */
@keyframes lucid-slide-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 弹跳进入动画 */
@keyframes lucid-bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 动画工具类 */
.lucid-animate-fade-in {
  animation: lucid-fade-in 0.3s ease-out;
}

.lucid-animate-slide-in-up {
  animation: lucid-slide-in-up 0.3s ease-out;
}

.lucid-animate-bounce-in {
  animation: lucid-bounce-in 0.5s ease-out;
}
`;

// Shadow DOM 重置样式
export const shadowResetCSS = `
/* Shadow DOM 样式重置和基础设置 */
:host {
  display: block;
  contain: style layout;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

/* 重置关键样式 */
* {
  box-sizing: border-box;
}

/* 确保字体和基础样式 */
.lucid-shadow-content {
  position: relative;
  display: block;
}

/* 按钮重置 */
button {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  cursor: pointer;
  outline: none;
}

/* 确保 SVG 正确显示 */
svg {
  display: block;
  fill: currentColor;
}
`;

// 导出所有样式的组合
export const getAllShadowStyles = (): string => {
  return [
    shadowResetCSS,
    designTokensCSS,
    animationsCSS,
    highlightCSS,
    tooltipCSS,
    toolfullCSS
  ].join('\n\n');
};

// 按组件分类的样式
export const getTooltipStyles = (): string => {
  return [
    shadowResetCSS,
    designTokensCSS,
    animationsCSS,
    tooltipCSS
  ].join('\n\n');
};

export const getToolfullStyles = (): string => {
  return [
    shadowResetCSS,
    designTokensCSS,
    animationsCSS,
    toolfullCSS
  ].join('\n\n');
};

export const getHighlightStyles = (): string => {
  return [
    shadowResetCSS,
    designTokensCSS,
    animationsCSS,
    highlightCSS
  ].join('\n\n');
};