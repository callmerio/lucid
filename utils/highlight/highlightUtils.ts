import { TooltipManager } from "../tooltip/tooltipManager";

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

  element.addEventListener('mouseenter', () => {
    // 鼠标进入高亮元素时，取消任何隐藏操作并显示tooltip
    tooltipManager.cancelHide();
    tooltipManager.showTooltip(element, word);
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
 * 构造“由左向右”的文本渐变字符串。
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

/* Tooltip Styles */
.lucid-tooltip {
  position: absolute;
  z-index: 10000;
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 150ms ease-out, transform 150ms ease-out;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  line-height: 1.3;
  max-width: 320px;
  min-width: 120px;
}

.lucid-tooltip-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.lucid-tooltip-content {
  /* 简洁的毛玻璃效果 - 灰黑色 */
  background: rgba(40, 40, 40, 0.4);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  /* padding 由 JavaScript 动态设置 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.95);
  position: relative;
  font-size: 14px; /* 默认大小，会被JavaScript动态覆盖 */
  white-space: nowrap;
  text-align: left;
  font-weight: 400;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 确保内容左对齐 */
  transition: all 400ms ease-out;
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
  gap: 4px;
  margin-left: 8px;
  opacity: 0;
  transform: translateX(15px) scale(0.8);
  transition: all 400ms cubic-bezier(0.34, 1.56, 0.64, 1); /* 更流畅的弹性缓动 */
  /* height 由 JavaScript 动态设置 */
}

.lucid-tooltip-expanded .lucid-tooltip-content {
  padding-right: 6px;
}

.lucid-tooltip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 150ms ease-out;
  padding: 0;
}

.lucid-tooltip-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 1);
  animation: heartbeat 4.2s ease-in-out infinite;
}

.lucid-tooltip-btn:active {
  transform: scale(0.95);
}

.lucid-tooltip-btn-like svg {
  transform: scale(0.7); /* 爱心图标缩小到70% */
}

.lucid-tooltip-btn-liked {
  background: rgba(255, 107, 107, 0.8) !important;
  color: white !important;
}

.lucid-tooltip-btn-liked:hover {
  background: rgba(255, 107, 107, 1) !important;
  animation: heartbeat 1.2s ease-in-out infinite;
}

/* 心跳动画 */
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.15);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.15);
  }
  70% {
    transform: scale(1);
  }
}

/* Light theme tooltip */
@media (prefers-color-scheme: light) {
  .lucid-tooltip-content {
    /* 亮色主题的毛玻璃效果 */
    background: rgba(240, 240, 240, 0.4);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: rgba(20, 20, 20, 0.9);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .lucid-tooltip-btn {
    background: rgba(0, 0, 0, 0.1);
    color: rgba(20, 20, 20, 0.8);
  }

  .lucid-tooltip-btn:hover {
    background: rgba(0, 0, 0, 0.2);
    color: rgba(20, 20, 20, 1);
  }

  .lucid-tooltip-btn-liked {
    background: rgba(255, 107, 107, 0.8) !important;
    color: white !important;
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
function updateAllWordHighlights(
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
    for (const highlight of existingHighlights) {
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
