import { TooltipManager } from "../dom/tooltipManager";

/**
 * 扩展程序在 `browser.storage.local` 中保存的数据结构。
 * @property settings     用户设置
 * @property wordMarkings 已标记单词次数的映射表
 */
export interface ExtensionStorage {
  settings?: {
    highlightBaseColor?: string; // 高亮基础颜色，例如 'orange', 'blue', 'green'
    // maxMarkCount?: number; // 未来可以定义最大标记次数
  };
  wordMarkings?: {
    [word: string]: number; // key 是小写单词，value 是标记次数
  };
}

/**
 * @interface ToggleHighlightContext
 * @description Provides context for the toggleWordHighlightState function.
 * @property {Range} [range] - The user's selection range, if the action is based on a new selection.
 * @property {HTMLElement} [sourceElement] - The HTML element that triggered the action or from which context can be derived (e.g., a <mark> element or a button within a tooltip).
 */
export interface ToggleHighlightContext {
  range?: Range;
  sourceElement?: HTMLElement;
}

/**
 * 在给定 `container` 中的文本节点里查找首个匹配 `word` 的片段，
 * 将其拆分并用 `<mark>` 包裹实现高亮。
 *
 * @param container           要遍历的容器元素
 * @param startNode           选区起始节点；遍历时会跳过其之前的文本
 * @param word                待匹配的单词（已统一转为小写）
 * @param count               当前单词累计标记次数
 * @param highlightClassName  Tailwind 风格类名，便于 DevTools 查看
 * @param hex                 文字主色的十六进制值
 * @param baseColor           调色盘基色，例如 'orange'
 * @param split               主色占比百分比（0‑100），用于生成渐变
 * @returns 是否成功包裹并插入高亮节点
 */
// ---------- utility helpers (extracted for clarity) ----------
const isBoundaryChar = (ch: string) => !/[a-z0-9]/i.test(ch);

/**
 * Check if the substring starting at `idx` is surrounded by word‑boundaries.
 */
function hasWordBoundary(lower: string, idx: number, wordLen: number): boolean {
  const before = idx === 0 ? "" : lower[idx - 1];
  const after = idx + wordLen >= lower.length ? "" : lower[idx + wordLen];
  const boundaryBefore = before === "" || isBoundaryChar(before);
  const boundaryAfter = after === "" || isBoundaryChar(after);
  return boundaryBefore && boundaryAfter;
}

/**
 * Construct a <mark> element carrying Lucid highlight data & gradient style.
 */
function createHighlightElement(
  word: string,
  count: number,
  highlightClassName: string,
  primaryHex: string,
  baseColor: string,
  originHex: string,
): HTMLElement {
  const el = document.createElement("mark");
  el.classList.add("lucid-highlight", highlightClassName);
  el.dataset.word = word;
  el.dataset.markCount = count.toString();
  el.dataset.baseColor = baseColor;
  el.dataset.appliedTimestamp = Date.now().toString();
  el.textContent = word;

  const gradient = buildTextGradient(primaryHex, baseColor, originHex);
  el.style.background = gradient;
  el.style.webkitBackgroundClip = "text";
  el.style.backgroundClip = "text";
  el.style.color = "transparent";

  // 添加tooltip功能
  addTooltipEvents(el, word);
  el.dataset.tooltipEventsAdded = "true";

  return el;
}

/**
 * 为高亮元素添加tooltip事件监听
 */
function addTooltipEvents(element: HTMLElement, word: string): void {
  const tooltipManager = TooltipManager.getInstance();

  element.addEventListener('mouseenter', async () => {
    // 鼠标进入高亮元素时，取消任何隐藏操作并显示tooltip
    tooltipManager.cancelHide();
    try {
      await tooltipManager.showTooltip(element, word);
    } catch (error) {
      console.error('[Lucid] Error showing tooltip:', error);
    }
  });

  element.addEventListener('mouseleave', () => {
    // 只有鼠标真正离开高亮元素时才隐藏tooltip
    tooltipManager.hideTooltip(300);
  });
}
// ---------- end helpers ----------
function highlightWordInContainer(
  container: Element,
  startNode: Node, // reference node: ignore text before it
  word: string,
  count: number,
  highlightClassName: string,
  hex: string,
  baseColor: string,
): boolean {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  const wordLower = word.toLowerCase();
  const wordLen = wordLower.length;
  let highlightedAny = false;
  while ((node = walker.nextNode() as Text | null)) {
    // Skip nodes already wrapped in a highlight
    if (getAncestorHighlight(node)) {
      continue;
    }
    // Skip text nodes that appear before the selection start
    if (
      startNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING
    ) {
      continue;
    }
    if (!node.nodeValue) {
      continue;
    }

    let text = node.nodeValue;
    let lower = text.toLowerCase();
    let searchFrom = 0;

    while (true) {
      const idx = lower.indexOf(wordLower, searchFrom);
      if (idx === -1) {
        break;
      }

      // strict word‑boundary check
      if (!hasWordBoundary(lower, idx, wordLen)) {
        searchFrom = idx + wordLen; // substring of a larger word – keep searching
        continue;
      }

      /* ----- wrap the matched word ----- */
      const beforeText = text.slice(0, idx);
      const matchText = text.slice(idx, idx + word.length);
      const afterText = text.slice(idx + word.length);

      const parent = node.parentNode;
      if (!parent) {
        break;
      }

      const beforeNode = document.createTextNode(beforeText);
      const originHex = getEffectiveTextColor(parent);
      const matchNode = createHighlightElement(
        word,
        count,
        highlightClassName,
        hex,
        baseColor,
        originHex,
      );
      matchNode.textContent = matchText; // preserve original casing

      const afterNode = document.createTextNode(afterText);

      parent.insertBefore(beforeNode, node);
      parent.insertBefore(matchNode, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);

      highlightedAny = true;

      /* Continue scanning the remainder of this text node */
      node = afterNode;
      text = afterText;
      lower = afterText.toLowerCase();
      searchFrom = 0;
      walker.currentNode = afterNode;
    }
  }
  return highlightedAny;
}

// 一个 shade 等级对应 3 次标记，因此允许到 5 * 3 = 15 次
const MAX_MARK_COUNT = 10;
const LEVEL_STEP = 2;
const DEFAULT_BASE_COLOR = "orange"; // 默认高亮基础颜色

// Pre‑computed shade mappings and palettes to avoid re‑creating them on every call
const DARK_SHADES: Record<number, number> = { 1: 700, 2: 600, 3: 500, 4: 400, 5: 300 };
const LIGHT_SHADES: Record<number, number> = { 1: 400, 2: 500, 3: 600, 4: 700, 5: 800 };

const COLOR_PALETTE: Record<string, Record<number, string>> = {
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#C10007",
    900: "#7c2d12",
    950: "#431407",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
} as const;

/**
 * 构造"由左向右"的文本渐变字符串。
 *
 * @param primaryHex 首颜色的十六进制值
 * @param baseColor  调色盘基色，用于取得 500 阶的终止色
 * @param split      主色在渐变中的占比百分比 (0‑100)，默认 60
 * @returns   可直接赋给 `style.background` 的 `linear-gradient(...)` 字符串
 */
const GRADIENT_SPLIT = 60; // percentage where the gradient switches colour
const BLEND_WEIGHT = 0.7; // 9 : 1 blend with original text colour

function mixHexColors(hexA: string, hexB: string, weight = 0.5): string {
  const a = parseInt(hexA.replace("#", ""), 16);
  const b = parseInt(hexB.replace("#", ""), 16);
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar * weight + br * (1 - weight));
  const g = Math.round(ag * weight + bg * (1 - weight));
  const bl = Math.round(ab * weight + bb * (1 - weight));
  return "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function getEffectiveTextColor(node: Node | null): string {
  let cur: Node | null =
    node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (cur && cur !== document) {
    if (cur instanceof HTMLElement) {
      const col = window.getComputedStyle(cur).color;
      if (col && col !== "transparent" && !col.startsWith("rgba(0, 0, 0, 0")) {
        const m = col.match(/\d+/g);
        if (m && m.length >= 3) {
          const [r, g, b] = m.map(Number);
          return (
            "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
          );
        }
      }
    }
    cur = cur?.parentNode || null;
  }
  const [r, g, b] = (
    window.getComputedStyle(document.body).color.match(/\d+/g) || [
      "0",
      "0",
      "0",
    ]
  ).map(Number);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function buildTextGradient(
  primaryHex: string,
  baseColor: string,
  originHex: string,
): string {
  const endHex = COLOR_PALETTE[baseColor]?.[500] ?? COLOR_PALETTE.orange[500];
  const fromMix = mixHexColors(primaryHex, originHex, BLEND_WEIGHT);
  const toMix = mixHexColors(endHex, originHex, BLEND_WEIGHT);
  return `linear-gradient(to right, ${fromMix} 0%, ${fromMix} ${GRADIENT_SPLIT}%, ${toMix} 100%)`;
}

/**
 * 负责把一次性的全局样式插入到 <head> 或 ShadowRoot。
 */
const StyleManager = {
  STYLE_ID: "lucid-highlight-styles",
  HIGHLIGHT_STYLES: `
.lucid-highlight {
  transition: color 500ms ease-in-out;
  cursor: pointer;
  position: relative;
}
/* background intentionally left to inline style */

.lucid-highlight.flash {
  animation: lucid-flash 200ms ease-in-out;
}

@keyframes lucid-flash {
  0%,100% { color:inherit!important; }
  50%     { background-color:currentColor!important; color:#ffffff!important; }
}

/* ===== TOOLTIP STYLES (使用设计系统) ===== */
.lucid-tooltip {
  /* 继承基础弹窗样式 */
  position: absolute;
  z-index: var(--lucid-z-tooltip);
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity var(--lucid-transition-fast), transform var(--lucid-transition-fast);
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

.lucid-tooltip-content {
  /* 使用设计系统的毛玻璃效果 */
  background: var(--lucid-bg-glass-primary);
  backdrop-filter: var(--lucid-blur-md);
  -webkit-backdrop-filter: var(--lucid-blur-md);
  border-radius: var(--lucid-radius-md);
  border: 1px solid var(--lucid-border-subtle);
  /* padding 由 JavaScript 动态设置 */
  box-shadow: var(--lucid-shadow-md);
  color: var(--lucid-text-primary);
  position: relative;
  font-size: var(--lucid-font-size-md); /* 默认大小，会被JavaScript动态覆盖 */
  white-space: nowrap;
  text-align: left;
  font-weight: var(--lucid-font-weight-normal);
  letter-spacing: var(--lucid-letter-spacing-wide);
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 确保内容左对齐 */
  transition: width var(--lucid-transition-normal), padding-right var(--lucid-transition-normal);
  height: auto;
  /* min-height 由 JavaScript 动态设置 */
}

.lucid-tooltip-main {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  /* min-height 由 JavaScript 动态设置 */
}

.lucid-tooltip-text {
  flex: 1;
  /* line-height 和 min-height 由 JavaScript 动态设置 */
  display: flex;
  align-items: center; /* 确保文本垂直居中 */
}

.lucid-tooltip-hover-zone {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40%; /* 调整为2/5区域 */
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
  /* height 由 JavaScript 动态设置 */
}

.lucid-tooltip-expanded .lucid-tooltip-content {
  padding-right: var(--lucid-spacing-3);
}

.lucid-tooltip-expanded .lucid-tooltip-actions {
  /* display: flex; will be set by JS in expandTooltip */
  /* opacity: 1; will be set by JS in expandTooltip */
  /* transform: translateX(0) scale(1); will be set by JS in expandTooltip */
  max-width: 60px; /* Adjust this value based on actual content width. This triggers the transition. */
  margin-left: var(--lucid-spacing-4); /* ADDED/ENSURED: Source value for margin-left transition */
}

.lucid-tooltip-btn {
  /* 使用设计系统的按钮样式 */
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
 
  flex-shrink: 0;  /* 防止SVG被压缩 */
}

.lucid-tooltip-btn-like svg {
  transform: scale(0.7); /* 爱心图标缩小到70% */
}

.lucid-tooltip-btn-liked {
  background: var(--lucid-accent-primary) !important;
  color: white !important;
}

.lucid-tooltip-btn-liked:hover {
  background: var(--lucid-accent-primary-hover) !important;
  animation: lucid-heartbeat 4.2s ease-in-out infinite;
}

/* 心跳动画已移至 animations.css 统一管理 */



/* ===== TOOLPOPUP STYLES (使用设计系统) ===== */

.lucid-tooltip-detail {
  position: absolute;
  z-index: var(--lucid-z-toolpopup);
  /* 使用设计系统的毛玻璃效果 */
  background: var(--lucid-bg-glass-primary);
  backdrop-filter: var(--lucid-blur-md);
  -webkit-backdrop-filter: var(--lucid-blur-md);
  border-radius: var(--lucid-radius-xl);
  border: 1px solid var(--lucid-border-subtle);
  padding: var(--lucid-spacing-8);
  width: var(--lucid-width-toolpopup);
  box-shadow: var(--lucid-shadow-lg);
  user-select: none;
  font-family: var(--lucid-font-family);
  color: var(--lucid-text-primary);
  /* 初始状态为隐藏，用于动画 */
  opacity: 0;
  transform: scaleY(0) translateY(-10px);
  transform-origin: top center;
  transition: all var(--lucid-transition-normal) var(--lucid-ease-bounce);
}

.lucid-tooltip-detail.lucid-toolpopup-visible {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

/* 动画关键帧已移至 animations.css 统一管理 */

/* 当toolpopup显示在目标元素上方时的样式 */
.lucid-tooltip-detail.lucid-toolpopup-above {
  /* 可以添加特殊样式，比如阴影方向调整等 */
}

.lucid-toolpopup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--lucid-spacing-6);
}

.lucid-toolpopup-word {
  /* font-size 由 JavaScript 动态设置为 tooltip 字体的2倍 */
  font-weight: var(--lucid-font-weight-semibold);
  color: var(--lucid-text-primary);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.lucid-toolpopup-syllable {
  display: inline;
}

.lucid-toolpopup-syllable-separator {
  color: var(--lucid-text-tertiary);
  font-weight: var(--lucid-font-weight-normal);
  margin: 0 1px;
}

.lucid-toolpopup-header-icons {
  display: flex;
  align-items: center;
}

.lucid-toolpopup-header-icons svg {
  width: var(--lucid-height-button-md);
  height: var(--lucid-height-button-md);
  margin-left: var(--lucid-spacing-5);
  cursor: pointer;
  fill: var(--lucid-text-tertiary);
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
  transition: all var(--lucid-transition-normal);
}

/* 呼吸动画已移至 animations.css 统一管理 */

/* Checkmark图标hover效果 */
.lucid-toolpopup-header-icons svg.icon:hover {
  animation: lucid-breathe 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));
}

/* Heart图标样式 */
.lucid-toolpopup-header-icons svg.icon-heart {
  fill: var(--lucid-accent-primary);
}

/* Heart图标hover效果 */
.lucid-toolpopup-header-icons svg.icon-heart:hover {
  animation: lucid-breathe 1.5s ease-in-out infinite;
  fill: var(--lucid-accent-primary-hover);
  filter: drop-shadow(0 0 8px var(--lucid-accent-primary));
}

.lucid-toolpopup-header-icons svg.icon {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 8;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
}

.lucid-toolpopup-phonetic {
  font-size: var(--lucid-font-size-md);
  color: var(--lucid-text-muted);
  margin-bottom: var(--lucid-spacing-8);
  display: flex;
  align-items: center;
  position: relative;
  width: fit-content;
  transition: all var(--lucid-transition-normal);
}

.lucid-toolpopup-phonetic-group {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all var(--lucid-transition-normal);
  white-space: nowrap;
}

.lucid-toolpopup-phonetic-region {
  background-color: var(--lucid-accent-secondary);
  padding: var(--lucid-spacing-1) var(--lucid-spacing-3);
  border-radius: var(--lucid-radius-sm);
  font-size: var(--lucid-font-size-sm);
  margin-right: var(--lucid-spacing-4);
  color: var(--lucid-text-disabled);
  transition: all var(--lucid-transition-normal);
}

.lucid-toolpopup-phonetic-text {
  cursor: pointer;
  transition: all var(--lucid-transition-normal);
}

.lucid-toolpopup-phonetic-text:hover {
  color: var(--lucid-text-primary);
}

/* 默认只显示US音标，UK音标隐藏在右侧 */
.lucid-toolpopup-phonetic-group.uk-phonetic {
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  margin-left: 0;
}

/* 悬浮时扩展显示UK音标 */
.lucid-toolpopup-phonetic:hover .lucid-toolpopup-phonetic-group.uk-phonetic {
  opacity: 1;
  max-width: 200px;
  margin-left: 15px;
}

.lucid-toolpopup-explain-group {
  margin-bottom: 15px;
}

.lucid-toolpopup-pos {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
  color: #ccc;
  display: inline-block;
  transition: all 0.3s ease;
  align-items: center;
  position: relative;
}

.lucid-toolpopup-definition {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.lucid-toolpopup-definition-text-chinese {
  /* font-size 和 line-height 由 JavaScript 动态设置，与 tooltip 字体大小保持一致 */
  color: #ddd;
  position: relative;
}

/* English tooltip with smart sliding */
.lucid-toolpopup-definition-text-english-tooltip {
  position: absolute;
  bottom: 20%;
  left: 0;
  margin-bottom: 5px;
  background-color: transparent;
  border: none;
  padding: 8px 0;
  color: #fff;
  font-size: 13px;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.3s ease, visibility 0.3s ease, max-width 0.3s ease, padding 0.3s ease;
  pointer-events: auto;
  box-shadow: none;
  border-radius: 4px;
  color: #aaa;
}

/* Container for smart sliding text */
.lucid-tooltip-text-container {
  position: relative;
  overflow: hidden;
  width: 100%;
}

/* Sliding text content */
.lucid-tooltip-text-content {
  transition: transform 1s ease-out;
  white-space: nowrap;
  display: inline-block;
  position: relative;
  z-index: 100;
}

/* Hover zones for triggering slide */
.lucid-tooltip-hover-zone {
  position: absolute;
  top: 0;
  width: 10%;
  height: 100%;
  z-index: 102;
  cursor: pointer;
  transition: opacity 0.2s ease;
  pointer-events: auto;
}

/* Right hover zone (initial state) */
.lucid-tooltip-hover-zone.right {
  right: 0;
}

/* Left hover zone (after sliding) */
.lucid-tooltip-hover-zone.left {
  left: 0;
  opacity: 0;
  pointer-events: none;
}

/* Show left zone when content is slid */
.lucid-tooltip-text-container.slid .lucid-tooltip-hover-zone.left {
  opacity: 1;
  pointer-events: auto;
}

/* Hide right zone when content is slid */
.lucid-tooltip-text-container.slid .lucid-tooltip-hover-zone.right {
  opacity: 0;
  pointer-events: none;
}

/* Visual hint for scrollable content */
.lucid-tooltip-scroll-hint {
  position: absolute;
  top: 50%;
  right: 2px;
  transform: translateY(-50%);
  opacity: 0.4;
  font-size: 10px;
  color: #888;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

/* Show hint when tooltip is visible and content is scrollable */
.lucid-toolpopup-definition-text-english-tooltip.scrollable .lucid-tooltip-scroll-hint {
  opacity: 0.6;
}

/* Hide hint when hovering over scroll zone */
.lucid-tooltip-hover-zone:hover + .lucid-tooltip-scroll-hint {
  opacity: 0.2;
}

/* Show tooltip when hovering over Chinese text */
.lucid-toolpopup-definition-text-chinese:hover .lucid-toolpopup-definition-text-english-tooltip {
  opacity: 1;
  visibility: visible;
  max-width: calc(var(--lucid-width-toolpopup) - 60px); /* 动态计算：popup宽度减去40px边距 */
  padding: 8px;
  /* 保持 white-space: nowrap 以支持滑动逻辑 */
}

/* Keep tooltip visible when hovering over the tooltip itself */
.lucid-toolpopup-definition-text-english-tooltip:hover {
  opacity: 1;
  visibility: visible;
  max-width: calc(var(--lucid-width-toolpopup) - 60px); /* 动态计算：popup宽度减去40px边距 */
  padding: 8px;
  /* 保持 white-space: nowrap 以支持滑动逻辑 */
}

/* Styles for individual words in English tooltip */
.lucid-toolpopup-definition-word {
  cursor: pointer;
  transition: all 0.3s ease;
  color: inherit;
  display: inline;
  margin-right: 0.2em;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.lucid-toolpopup-definition-word:hover {
  color: #fff;
}

.lucid-toolpopup-definition-word:active {
  color: #ccc;
}

.lucid-toolpopup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.lucid-toolpopup-history {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
}

.lucid-toolpopup-history svg {
  width: 16px;
  height: 16px;
  fill: rgba(255, 255, 255, 0.7);
  margin-right: 6px;
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
}

.lucid-toolpopup-history-count {
  font-size: 13px;
  color: #aaa;
}

.lucid-toolpopup-actions svg {
  width: 18px;
  height: 18px;
  margin-left: 15px;
  cursor: pointer;
  fill: rgba(255, 255, 255, 0.7);
  filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.3));
}

/* Light theme toolpopup - 与tooltip保持一致 */
@media (prefers-color-scheme: light) {
  .lucid-tooltip-detail {
    /* 亮色主题的毛玻璃效果 - 与tooltip相同 */
    background: rgba(240, 240, 240, 0.4);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: rgba(20, 20, 20, 0.9);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .lucid-toolpopup-word {
    color: #333;
  }

  .lucid-toolpopup-header-icons svg {
    fill: rgba(0, 0, 0, 0.7);
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
  }

  .lucid-toolpopup-phonetic {
    color: #666;
  }

  .lucid-toolpopup-phonetic-region {
    background-color: rgba(0, 0, 0, 0.1);
    color: #666;
  }

  .lucid-toolpopup-pos {
    background-color: rgba(0, 0, 0, 0.1);
    color: #666;
  }

  .lucid-toolpopup-definition-text-chinese {
    color: #333;
  }

  .lucid-toolpopup-definition-text-english-tooltip {
    color: #666;
  }

  .lucid-toolpopup-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .lucid-toolpopup-history {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .lucid-toolpopup-history svg {
    fill: rgba(0, 0, 0, 0.7);
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
  }

  .lucid-toolpopup-history-count {
    color: #666;
  }

  .lucid-toolpopup-actions svg {
    fill: rgba(0, 0, 0, 0.7);
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
  }
}
  `,
  ensureStyles(root: Node): void {
    // 仅在 Document 或 ShadowRoot 上注入
    if (!(root === document || root instanceof ShadowRoot)) {
      return;
    }

    // 使用类型断言确保类型安全
    const container = root === document ? document : (root as ShadowRoot);

    // 检查是否已经注入过样式
    const existingStyle = container.querySelector(`#${this.STYLE_ID}`);
    if (existingStyle) {
      return;
    }

    const styleEl = document.createElement("style");
    styleEl.id = this.STYLE_ID;
    styleEl.textContent = this.HIGHLIGHT_STYLES.trim();

    // 将样式添加到文档的头部或Shadow DOM中
    if (root === document) {
      document.head.appendChild(styleEl);
    } else {
      (root as ShadowRoot).prepend(styleEl);
    }
  },
};

/**
 * 根据标记次数与主题色计算应使用的色阶。
 *
 * @param baseColor   高亮基色，例如 'orange'
 * @param queryCount  当前单词的累计标记次数
 * @param isDarkText  文本是否处于深色背景（影响取深/浅色阶）
 * @returns  结果对象：
 *  - `className`：Tailwind 风格类名，便于调试
 *  - `hex`      ：实际用于行内样式的十六进制颜色
 */
export function calculateHighlight(
  baseColor: string,
  queryCount: number,
  isDarkText: boolean,
): { className: string; hex: string } {
  // 1-3 次 = level 1, 4-6 次 = level 2, 最多 level 5
  const level = Math.min(5, Math.ceil(queryCount / LEVEL_STEP));

  const shade = isDarkText ? DARK_SHADES[level] : LIGHT_SHADES[level];

  const className = `text-${baseColor}-${shade}`;

  const hex = COLOR_PALETTE[baseColor]?.[shade] ?? COLOR_PALETTE.orange[shade];
  return { className, hex };
}

/**
 * 若给定节点处于 <mark.lucid-highlight> 内，返回该高亮元素，否则返回 null
 */
function getAncestorHighlight(node: Node | null): HTMLElement | null {
  while (node && node !== document) {
    if (
      node instanceof HTMLElement &&
      node.classList.contains("lucid-highlight")
    ) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

/** 删除文档中 textContent 为空的高亮元素（防止嵌套操作留下空壳） */
function removeEmptyHighlights() {
  document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
    if (!el.textContent?.trim()) {
      el.remove();
    }
  });
}

/**
 * 更新页面上所有相同词汇的高亮元素的data-mark-count和样式
 * @param word 要更新的词汇（小写）
 * @param newCount 新的标记次数
 * @param baseColor 基础颜色
 * @param isDarkText 是否为深色文本
 */
export function updateAllWordHighlights(
  word: string,
  newCount: number,
  baseColor: string,
  isDarkText: boolean,
): void {
  const { className: highlightClassName, hex } = calculateHighlight(
    baseColor,
    newCount,
    isDarkText,
  );

  // 查找页面上所有相同词汇的高亮元素
  document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
    if (el.dataset.word === word) {
      // 更新data-mark-count属性
      el.dataset.markCount = newCount.toString();

      // 更新CSS类名（移除旧的，添加新的）
      const oldClassName = Array.from(el.classList).find(cls =>
        cls.startsWith(`text-${baseColor}-`)
      );
      if (oldClassName) {
        el.classList.remove(oldClassName);
      }
      el.classList.add(highlightClassName);

      // 更新渐变样式
      const originHex = getEffectiveTextColor(el.parentNode);
      const gradient = buildTextGradient(hex, baseColor, originHex);
      el.style.background = gradient;
      el.style.webkitBackgroundClip = "text";
      el.style.backgroundClip = "text";
      el.style.color = "transparent";

      // 确保tooltip事件已添加（防止某些元素缺少事件监听）
      if (!el.dataset.tooltipEventsAdded) {
        addTooltipEvents(el, word);
        el.dataset.tooltipEventsAdded = "true";
      }
    }
  });
}

/**
 * 完全移除页面上所有相同词汇的高亮，并更新storage
 * @param word 要移除高亮的词汇（小写）
 */
export async function removeWordHighlight(word: string): Promise<void> {
  try {
    // 更新storage，将计数设为0
    const data: ExtensionStorage = (await browser.storage.local.get([
      "wordMarkings",
    ])) as ExtensionStorage;
    const wordMarkings = data.wordMarkings || {};

    // 从storage中删除该词汇的记录
    delete wordMarkings[word];
    await browser.storage.local.set({ wordMarkings });

    // 移除页面上所有相同词汇的高亮元素
    document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
      if (el.dataset.word === word) {
        unwrapHighlight(el);
      }
    });

    console.log(`[Lucid] Removed all highlights for word: "${word}"`);
  } catch (error) {
    console.error(`[Lucid] Error removing word highlights for "${word}":`, error);
    // 如果storage更新失败，仍然尝试移除DOM中的高亮
    document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
      if (el.dataset.word === word) {
        unwrapHighlight(el);
      }
    });
  }
}

/**
 * 减少页面上所有相同词汇的高亮计数，并更新storage和样式
 * @param word 要减少计数的词汇（小写）
 * @param targetElement 触发操作的高亮元素
 * @param isDarkText 是否为深色文本
 */
export async function decreaseWordHighlight(
  word: string,
  targetElement: HTMLElement,
  isDarkText: boolean
): Promise<void> {
  try {
    // 获取当前计数和基础颜色
    const currentCount = parseInt(targetElement.dataset.markCount || '0');
    const baseColor = targetElement.dataset.baseColor || DEFAULT_BASE_COLOR;
    const newCount = Math.max(0, currentCount - 1);

    if (newCount === 0) {
      // 如果计数减到0，完全移除高亮
      await removeWordHighlight(word);
      return;
    }

    // 更新storage
    const data: ExtensionStorage = (await browser.storage.local.get([
      "wordMarkings",
    ])) as ExtensionStorage;
    const wordMarkings = data.wordMarkings || {};
    wordMarkings[word] = newCount;
    await browser.storage.local.set({ wordMarkings });

    // 更新页面上所有相同词汇的高亮元素
    updateAllWordHighlights(word, newCount, baseColor, isDarkText);

    console.log(`[Lucid] Decreased highlight count for word: "${word}" to ${newCount}`);
  } catch (error) {
    console.error(`[Lucid] Error decreasing word highlight for "${word}":`, error);
    // 如果storage更新失败，仍然尝试更新DOM
    const currentCount = parseInt(targetElement.dataset.markCount || '0');
    const baseColor = targetElement.dataset.baseColor || DEFAULT_BASE_COLOR;
    const newCount = Math.max(0, currentCount - 1);

    if (newCount === 0) {
      document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
        if (el.dataset.word === word) {
          unwrapHighlight(el);
        }
      });
    } else {
      updateAllWordHighlights(word, newCount, baseColor, isDarkText);
    }
  }
}

/**
 * 专门用于高亮纯文本的函数，不跳过任何文本节点
 * @param container 要搜索的容器元素
 * @param word 要高亮的词汇
 * @param count 高亮计数
 * @param highlightClassName CSS类名
 * @param hex 颜色值
 * @param baseColor 基础颜色
 * @returns 是否成功高亮了任何文本
 */
function highlightWordInContainerForceAll(
  container: Element,
  word: string,
  count: number,
  highlightClassName: string,
  hex: string,
  baseColor: string,
): boolean {
  // {{CHENGQI:
  // Action: Added
  // Timestamp: [2025-01-28 12:50:30 +08:00]
  // Reason: 创建专门的纯文本高亮函数，解决addWordHighlight无法重新高亮被移除词汇的问题
  // Principle_Applied: KISS - 简单直接的解决方案；单一职责 - 专门处理纯文本高亮
  // Optimization: 移除了跳过已高亮节点的逻辑，确保能够高亮所有匹配的文本
  // }}
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  const wordLower = word.toLowerCase();
  const wordLen = wordLower.length;
  let highlightedAny = false;

  while ((node = walker.nextNode() as Text | null)) {
    // 注意：这里不跳过已在高亮元素内的节点，因为我们要处理的是被移除高亮后的纯文本
    if (!node.nodeValue) {
      continue;
    }

    let text = node.nodeValue;
    let lower = text.toLowerCase();
    let searchFrom = 0;

    while (true) {
      const idx = lower.indexOf(wordLower, searchFrom);
      if (idx === -1) {
        break;
      }

      // strict word‑boundary check
      if (!hasWordBoundary(lower, idx, wordLen)) {
        searchFrom = idx + wordLen; // substring of a larger word – keep searching
        continue;
      }

      /* ----- wrap the matched word ----- */
      const beforeText = text.slice(0, idx);
      const matchText = text.slice(idx, idx + word.length);
      const afterText = text.slice(idx + word.length);

      const parent = node.parentNode;
      if (!parent) {
        break;
      }

      const beforeNode = document.createTextNode(beforeText);
      const originHex = getEffectiveTextColor(parent);
      const matchNode = createHighlightElement(
        word,
        count,
        highlightClassName,
        hex,
        baseColor,
        originHex,
      );
      matchNode.textContent = matchText; // preserve original casing

      const afterNode = document.createTextNode(afterText);

      parent.insertBefore(beforeNode, node);
      parent.insertBefore(matchNode, node);
      parent.insertBefore(afterNode, node);
      parent.removeChild(node);

      highlightedAny = true;

      /* Continue scanning the remainder of this text node */
      node = afterNode;
      text = afterText;
      lower = afterText.toLowerCase();
      searchFrom = 0;
      walker.currentNode = afterNode;
    }
  }
  return highlightedAny;
}

/**
 * 为指定词汇添加高亮（设置计数为1），并更新storage和样式
 * @param word 要添加高亮的词汇（小写）
 * @param targetElement 包含该词汇的元素（用于确定基础颜色）
 * @param isDarkText 是否为深色文本
 */
export async function addWordHighlight(
  word: string,
  targetElement: HTMLElement,
  isDarkText: boolean
): Promise<void> {
  try {
    // 获取基础颜色，优先使用目标元素的颜色，否则使用默认颜色
    const baseColor = targetElement.dataset.baseColor || DEFAULT_BASE_COLOR;
    const newCount = 1; // 新高亮设置为1

    // 更新storage
    const data: ExtensionStorage = (await browser.storage.local.get([
      "wordMarkings",
    ])) as ExtensionStorage;
    const wordMarkings = data.wordMarkings || {};
    wordMarkings[word] = newCount;
    await browser.storage.local.set({ wordMarkings });

    // 使用改进的高亮方法来高亮页面上的所有匹配词汇
    const { className: highlightClassName, hex } = calculateHighlight(
      baseColor,
      newCount,
      isDarkText,
    );

    // {{CHENGQI:
    // Action: Modified
    // Timestamp: [2025-01-28 12:50:30 +08:00]
    // Reason: 使用新的highlightWordInContainerForceAll函数替代原有的highlightWordInContainer，确保能够高亮被移除高亮后的纯文本
    // Principle_Applied: DRY - 复用高亮逻辑但改进实现；SOLID - 依赖于更适合的抽象
    // Optimization: 解决了智能切换中无法重新高亮的核心问题
    // }}
    // 使用强制高亮所有匹配文本的方法
    const highlighted = highlightWordInContainerForceAll(
      document.body, // 搜索整个文档
      word,
      newCount,
      highlightClassName,
      hex,
      baseColor,
    );

    if (highlighted) {
      console.log(`[Lucid] Added highlight for word: "${word}" with count ${newCount}`);
    } else {
      console.warn(`[Lucid] No instances of word "${word}" found to highlight`);
    }
  } catch (error) {
    console.error(`[Lucid] Error adding word highlight for "${word}":`, error);
    // 如果storage更新失败，仍然尝试更新DOM
    const baseColor = targetElement.dataset.baseColor || DEFAULT_BASE_COLOR;
    const newCount = 1;
    const { className: highlightClassName, hex } = calculateHighlight(
      baseColor,
      newCount,
      isDarkText,
    );

    highlightWordInContainerForceAll(
      document.body,
      word,
      newCount,
      highlightClassName,
      hex,
      baseColor,
    );
  }
}

/** 把单个 <mark.lucid-highlight> 展开成纯文本内容 */
function unwrapHighlight(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) {
    return;
  }
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

/** 在给定 Range 内部移除所有已有高亮，避免再次 wrap 产生嵌套 */
function unwrapHighlightsInRange(rng: Range) {
  const walker = document.createTreeWalker(
    rng.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) =>
        node instanceof HTMLElement &&
          node.classList.contains("lucid-highlight") &&
          rng.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    },
  );

  const toUnwrap: HTMLElement[] = [];
  while (walker.nextNode()) {
    toUnwrap.push(walker.currentNode as HTMLElement);
  }
  toUnwrap.forEach(unwrapHighlight);
}

/**
 * 应用高亮到指定的 Range 对象
 * @param range 扩展后的选区 Range 对象
 * @param isDarkText 当前是否为暗黑模式
 */
export async function applyWordHighlight(
  range: Range,
  isDarkText: boolean,
): Promise<void> {
  // 确保 flash 动效等全局样式已注入
  StyleManager.ensureStyles(document);

  // 检查选区是否与现有高亮相关 - 使用更全面的检测方法
  let targetHighlight: HTMLElement | null = null;
  let selectedWord = "";

  // 方法1: 检查选区起始点是否在高亮元素内
  const ancestorMark = getAncestorHighlight(range.startContainer);

  // 方法2: 检查选区范围内是否包含高亮元素
  const selectedText = range.toString().trim().toLowerCase();
  if (selectedText) {
    // 查找页面上是否已有相同词汇的高亮
    const existingHighlights = document.querySelectorAll<HTMLElement>(".lucid-highlight");
    for (const highlight of Array.from(existingHighlights)) {
      const highlightWord = highlight.dataset.word || "";
      if (highlightWord === selectedText) {
        targetHighlight = highlight;
        selectedWord = highlightWord;
        break;
      }
    }
  }

  // 方法3: 如果选区与高亮元素有交集
  if (!targetHighlight && ancestorMark) {
    targetHighlight = ancestorMark;
    selectedWord = ancestorMark.dataset.word || "";
  }

  // 如果找到了相关的高亮元素，进行重新高亮处理
  if (targetHighlight && selectedWord) {
    const word = selectedWord;

    // 更新storage中的计数
    try {
      const data: ExtensionStorage = (await browser.storage.local.get([
        "settings",
        "wordMarkings",
      ])) as ExtensionStorage;
      const wordMarkings = data.wordMarkings || {};

      const prev = Number(targetHighlight.dataset.markCount ?? 0);
      const newCount = Math.min(prev + 1, MAX_MARK_COUNT);

      // Diagnostic log to check counts during re-highlight
      console.log(`[Lucid] Re-highlighting. Word: "${word}", Prev DOM count: ${prev}, Calculated new count: ${newCount}, Max count: ${MAX_MARK_COUNT}`);

      // 更新storage
      wordMarkings[word] = newCount;
      await browser.storage.local.set({ wordMarkings });

      // 更新页面上所有相同词汇的高亮元素
      const baseColor = targetHighlight.dataset.baseColor || DEFAULT_BASE_COLOR;
      updateAllWordHighlights(word, newCount, baseColor, isDarkText);

      // 闪烁提示当前选中的元素
      targetHighlight.classList.add("flash");
      setTimeout(() => targetHighlight.classList.remove("flash"), 500);

      console.log(`[Lucid] Updated all "${word}" highlights to count ${newCount}`);
      return;
    } catch (error) {
      console.error(`[Lucid] Error updating word markings for "${word}":`, error);
      // 如果storage更新失败，仍然尝试更新DOM
      const prev = Number(targetHighlight.dataset.markCount ?? 0);
      const newCount = Math.min(prev + 1, MAX_MARK_COUNT);
      const baseColor = targetHighlight.dataset.baseColor || DEFAULT_BASE_COLOR;
      updateAllWordHighlights(word, newCount, baseColor, isDarkText);

      targetHighlight.classList.add("flash");
      setTimeout(() => targetHighlight.classList.remove("flash"), 500);
      return;
    }
  }

  if (!range || range.collapsed) {
    console.warn(
      "[Lucid] applyWordHighlight: Range is null or collapsed. Skipping.",
    );
    return;
  }

  // Use original user selection for word matching to avoid expansions pulling in page-inserted text
  const rawSelection = window.getSelection()?.toString().trim() || "";
  const word = rawSelection.toLowerCase();
  if (!word) {
    console.warn("[Lucid] applyWordHighlight: Word is empty. Skipping.");
    return;
  }

  try {
    const data: ExtensionStorage = (await browser.storage.local.get([
      "settings",
      "wordMarkings",
    ])) as ExtensionStorage;
    const settings = data.settings || {};
    const wordMarkings = data.wordMarkings || {};

    const baseColor = settings.highlightBaseColor || DEFAULT_BASE_COLOR;
    let currentMarkCount = wordMarkings[word] || 0;
    currentMarkCount = Math.min(currentMarkCount + 1, MAX_MARK_COUNT); // 增加标记次数，但不超过上限

    wordMarkings[word] = currentMarkCount;
    await browser.storage.local.set({ wordMarkings });

    const { className: highlightClassName, hex } = calculateHighlight(
      baseColor,
      currentMarkCount,
      isDarkText,
    );

    // 先展开选区内已有的高亮，避免嵌套
    unwrapHighlightsInRange(range);

    // 使用 surroundContents 包裹选区
    // 注意: surroundContents 对跨多个块级元素或复杂结构的选区可能失败
    try {
      // Smooth highlight: animate text color via transition.
      const highlightElement = document.createElement("mark");
      highlightElement.classList.add("lucid-highlight");
      // Apply the Tailwind‑style class so DevTools shows the exact shade
      highlightElement.classList.add(highlightClassName);
      // preserve data attributes but DO NOT set color or highlightClassName yet
      if (hex) {
        highlightElement.dataset.baseColor = baseColor;
      }
      highlightElement.dataset.word = word;
      highlightElement.dataset.markCount = currentMarkCount.toString();
      highlightElement.dataset.appliedTimestamp = Date.now().toString();

      const originHex = getEffectiveTextColor(range.startContainer);
      const gradient = buildTextGradient(hex, baseColor, originHex);
      highlightElement.style.background = gradient;
      highlightElement.style.webkitBackgroundClip = "text";
      highlightElement.style.backgroundClip = "text";
      highlightElement.style.color = "transparent";

      const newHighlight = highlightElement.cloneNode(false) as HTMLElement;
      range.surroundContents(newHighlight);

      // 为新创建的高亮元素添加tooltip事件
      addTooltipEvents(newHighlight, word);
      newHighlight.dataset.tooltipEventsAdded = "true";

      console.log(
        `[Lucid] Word "${word}" highlighted with smooth transition to color ${hex}`,
      );

      // Highlight all remaining occurrences of the same word across the entire page
      highlightWordInContainer(
        document.body, // search the full document
        document.body, // do not skip any preceding text nodes
        word,
        currentMarkCount,
        highlightClassName,
        hex,
        baseColor,
      );

      // No need for delayed color transition; text color is now handled by gradient background-clip.
      // Optionally, could still trigger a transition if desired.
      // Immediately set the same gradient on newHighlight as well:
      const originHex2 = getEffectiveTextColor(range.startContainer);
      const gradient2 = buildTextGradient(hex, baseColor, originHex2);
      newHighlight.style.background = gradient2;
      newHighlight.style.webkitBackgroundClip = "text";
      newHighlight.style.backgroundClip = "text";
      newHighlight.style.color = "transparent";
    } catch (e) {
      if (e instanceof DOMException && e.name === "InvalidStateError") {
        // Progressive fallback: start from the element that directly contains the selection,
        // walk up DOM ancestors until highlight succeeds or <body> is reached.
        let containerEl: Element | null =
          range.startContainer.nodeType === Node.TEXT_NODE
            ? range.startContainer.parentElement
            : (range.startContainer as Element);

        let highlighted = false;
        while (containerEl && !highlighted) {
          highlighted = highlightWordInContainer(
            containerEl,
            range.startContainer,
            word,
            currentMarkCount,
            highlightClassName,
            hex,
            baseColor,
          );
          if (!highlighted) {
            containerEl = containerEl.parentElement;
          }
        }

        if (highlighted) {
          console.log(
            `[Lucid] Word "${word}" highlighted via progressive container-based fallback`,
          );
          // Highlight any remaining occurrences across the full document (including before the original selection)
          highlightWordInContainer(
            document.body,
            document.body,
            word,
            currentMarkCount,
            highlightClassName,
            hex,
            baseColor,
          );
          return;
        } else {
          console.warn(
            "[Lucid] Progressive fallback failed to highlight the word.",
          );
        }
      } else {
        // If it's not an InvalidStateError, or some other error, re-throw it.
        console.error(
          `[Lucid] Error during surroundContents (not InvalidStateError) for word "${word}":`,
          e,
        );
        throw e;
      }
    }

    // 移除 flash 类，避免反复触发动画
    setTimeout(() => {
      document
        .querySelectorAll(".lucid-highlight.flash")
        .forEach((el) => el.classList.remove("flash"));
    }, 500);

    // 清除空壳高亮（例如嵌套操作后遗留）
    removeEmptyHighlights();

    // 清除浏览器自身的选择，让自定义高亮成为唯一视觉反馈
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  } catch (error) {
    console.error(
      '[Lucid] General error in applyWordHighlight for word "' + word + '":',
      error,
    );
    // Handle other potential errors from storage access, etc.
  }
}

// {{CHENGQI:
// Action: Added
// Timestamp: [2024-07-30 10:45:00 +08:00]
// Reason: Per P3-DEV-002 to implement the smart toggle logic for highlights, and P3-DOC-001 for JSDoc.
// Principle_Applied: SRP - This function orchestrates highlight state changes. KISS - Clear conditional logic. DRY - Reuses existing highlight functions.
// Optimization: Includes a fallback for color inference if primary context is missing.
// Architectural_Note (AR): Implements the core toggle logic as per design.
// Documentation_Note (DW): JSDoc added as per plan.
// }}
/**
 * Toggles the highlight state of a given word.
 * If the word is currently highlighted, all highlights for it will be removed.
 * If the word is not highlighted, it will be highlighted.
 *
 * @async
 * @export
 * @param {string} word - The target word to toggle. Should be in lowercase.
 * @param {boolean} isDarkText - Indicates if the current theme uses dark text, affecting color calculation.
 * @param {ToggleHighlightContext} [context] - Optional context for the operation.
 * @param {Range} [context.range] - If adding highlight based on a user selection.
 * @param {HTMLElement} [context.sourceElement] - If action is triggered from a specific element (e.g., a tooltip button on a mark), used for color inference or context.
 * @returns {Promise<void>}
 * @throws {Error} Logs errors to the console if operations fail.
 */
export async function toggleWordHighlightState(
  word: string,
  isDarkText: boolean,
  context?: ToggleHighlightContext
): Promise<void> {
  // {{CHENGQI:
  // Action: Modified
  // Timestamp: [2024-07-30 12:00:00 +08:00]
  // Reason: Per P3-LOG-001 to add detailed debugging logs.
  // Principle_Applied: Observability - Enhanced logging for better diagnostics.
  // Optimization: None
  // Architectural_Note (AR): Logs added to trace state and decisions within the function.
  // Documentation_Note (DW): Logging points implemented as per plan.
  // }}
  // {{START MODIFICATIONS}}
  const cleanedWord = word ? word.toLowerCase().trim() : ""; // Ensure lowercase and trimmed

  let contextLog = "undefined";
  if (context) {
    const rangeStr = context.range ? `Range: "${context.range.toString().substring(0, 50)}..."` : "";
    const elementStr = context.sourceElement ? `SourceElement: ${context.sourceElement.tagName}${context.sourceElement.id ? '#' + context.sourceElement.id : ''}${context.sourceElement.className ? '.' + context.sourceElement.className.trim().replace(/\s+/g, '.') : ''}` : "";
    contextLog = `{ ${[rangeStr, elementStr].filter(Boolean).join(', ')} }`;
  }
  console.log(
    `[Lucid DEBUG] toggleWordHighlightState called with: word="${word}", cleanedWord="${cleanedWord}", isDarkText=${isDarkText}, context=${contextLog}`
  );

  if (!cleanedWord) {
    console.warn("[Lucid] toggleWordHighlightState: word is empty. Skipping.");
    return;
  }

  try {
    const data: ExtensionStorage = (await browser.storage.local.get([
      "wordMarkings",
    ])) as ExtensionStorage;
    const wordMarkings = data.wordMarkings || {};
    // Avoid logging the entire wordMarkings if it's huge. Log specific entry or a copy.
    const wordMarkingsCopyForLog = wordMarkings ? { [cleanedWord]: wordMarkings[cleanedWord] } : {};
    console.log(`[Lucid DEBUG] For word "${cleanedWord}" right after storage.get:`);
    console.log(`[Lucid DEBUG] Relevant wordMarkings entry:`, JSON.parse(JSON.stringify(wordMarkingsCopyForLog)));
    console.log(
      `[Lucid DEBUG] Raw value for wordMarkings["${cleanedWord}"]:`,
      wordMarkings ? wordMarkings[cleanedWord] : "wordMarkings is undefined"
    );
    const currentMarkCount = wordMarkings[cleanedWord] || 0;
    console.log(
      `[Lucid DEBUG] Calculated currentMarkCount for "${cleanedWord}": ${currentMarkCount}`
    );

    if (currentMarkCount > 0) {
      // State: Highlighted -> Remove highlight
      console.log(
        `[Lucid DEBUG] Condition (currentMarkCount > 0) is TRUE for "${cleanedWord}" (count: ${currentMarkCount}). Preparing to remove highlight.`
      );
      console.log(
        `[Lucid DEBUG] Word "${cleanedWord}" is highlighted (count: ${currentMarkCount}). Removing highlight.`
      );
      await removeWordHighlight(cleanedWord);
    } else {
      // State: Not highlighted (or count is 0) -> Add highlight
      console.log(
        `[Lucid DEBUG] Condition (currentMarkCount > 0) is FALSE for "${cleanedWord}" (count: ${currentMarkCount}). Preparing to add highlight.`
      );
      console.log(
        `[Lucid DEBUG] Word "${cleanedWord}" is not highlighted (count: ${currentMarkCount}). Adding highlight.`
      );
      if (context?.range) {
        // applyWordHighlight handles storage updates and applies to the specific range first, then others.
        console.log(`[Lucid DEBUG] Adding highlight for "${cleanedWord}" using applyWordHighlight (due to context.range).`);
        await applyWordHighlight(context.range, isDarkText);
      } else if (context?.sourceElement) {
        // addWordHighlight sets count to 1 and highlights all instances.
        // sourceElement helps infer baseColor if the word is new.
        console.log(`[Lucid DEBUG] Adding highlight for "${cleanedWord}" using addWordHighlight (due to context.sourceElement).`);
        await addWordHighlight(cleanedWord, context.sourceElement, isDarkText);
      } else {
        // Fallback if no specific context (range or sourceElement) is provided
        console.log(`[Lucid DEBUG] Adding highlight for "${cleanedWord}" using addWordHighlight (fallback logic).`);
        console.warn(
          `[Lucid] toggleWordHighlightState: Adding highlight for "${cleanedWord}" without specific range or sourceElement. Attempting with best guess for color context.`
        );
        // Try to find an existing highlight of the same word to infer color,
        // otherwise, document.body will be used by addWordHighlight, which might not be ideal for color.
        let elementForColorInference = document.querySelector<HTMLElement>(
          `.lucid-highlight[data-word="${cleanedWord}"]`
        );
        if (!elementForColorInference) {
          // If no existing highlight of this word, use document.body as a last resort.
          // addWordHighlight's internal getEffectiveTextColor will try to get a sensible default.
          elementForColorInference = document.body;
        }
        await addWordHighlight(cleanedWord, elementForColorInference, isDarkText);
      }
    }
  } catch (error) {
    console.error(
      `[Lucid] Error in toggleWordHighlightState for word "${cleanedWord}":`,
      error
    );
    // Depending on the error, specific recovery or UI feedback might be needed here.
  }
}

// {{CHENGQI:
// Action: Added
// Timestamp: [2024-07-30 12:00:00 +08:00]
// Reason: Per P3-GUID-001 to provide UI integration guidance for preventing race conditions.
// Principle_Applied: Documentation - Providing clear instructions for consumers of the function.
// Optimization: None
// Architectural_Note (AR): Promotes correct usage of the async function from UI event handlers.
// Documentation_Note (DW): Guidance added as planned.
// }}
// {{START MODIFICATIONS}}
// ----- UI Integration Guidance for toggleWordHighlightState -----
// To prevent race conditions from rapid user clicks on UI elements (e.g., a like button)
// that trigger this function, it is crucial to manage the UI element's state (e.g., disabled state).
//
// Example for an event listener on a button:
//
// async function handleLikeButtonClick(event) {
//   const button = event.currentTarget as HTMLButtonElement;
//   const word = button.dataset.word; // Or however the word is obtained
//   const isDarkText = /* ... determine theme ... */;
//   const sourceElementForContext = /* ... determine source element, could be the button itself or the related mark ... */;
//
//   if (!word || button.disabled) {
//     return;
//   }
//
//   button.disabled = true; // Disable button immediately
//   // Consider adding a visual "loading" state to the button here
//
//   try {
//     await toggleWordHighlightState(word, isDarkText, { sourceElement: sourceElementForContext });
//     // Optionally, refresh UI elements that depend on the highlight state here
//   } catch (error) {
//     console.error("Error toggling highlight state:", error);
//     // Handle error in UI if necessary
//   } finally {
//     button.disabled = false; // Re-enable button in all cases
//     // Remove "loading" state here
//   }
// }
//
// Make sure to adapt this logic to your specific UI framework and event handling.
// The key is to disable the interactive element before the await call and re-enable it in a finally block.
// ----- End of UI Integration Guidance -----
// {{END MODIFICATIONS}}
