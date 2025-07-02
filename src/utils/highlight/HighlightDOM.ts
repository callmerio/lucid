import { 
  getEffectiveTextColor, 
  buildTextGradient, 
  isBoundaryChar, 
  hasWordBoundary 
} from "./HighlightUtilities";
import { eventManager } from "../core/eventManager";
import { UI_EVENTS } from "../../constants/uiEvents";

/**
 * HighlightDOM.ts - DOM manipulation utilities for highlight functionality
 * 
 * This module contains all DOM-related operations for highlight management:
 * - Creating and manipulating highlight elements
 * - DOM tree traversal and text node processing
 * - Event handling for tooltip integration
 * - Range and selection operations
 */

/**
 * Construct a <mark> element carrying Lucid highlight data & gradient style.
 */
export function createHighlightElement(
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

  // 添加交互事件（解耦版本）
  addHighlightInteractionEvents(el, word);
  el.dataset.interactionEventsAdded = "true";

  return el;
}

/**
 * 为高亮元素添加交互事件监听（解耦版本）
 * 使用事件系统而不是直接依赖 TooltipManager
 */
export function addHighlightInteractionEvents(element: HTMLElement, word: string): void {
  element.addEventListener('mouseenter', async () => {
    try {
      // 发布高亮悬停进入事件
      eventManager.dispatch(UI_EVENTS.HIGHLIGHT.HOVER_ENTER, {
        word: word,
        element: element,
        translation: `Loading translation for "${word}"...` // 临时占位符
      });
    } catch (error) {
      console.error('[Lucid] Error dispatching highlight hover enter event:', error);
    }
  });

  element.addEventListener('mouseleave', () => {
    try {
      // 发布高亮悬停离开事件
      eventManager.dispatch(UI_EVENTS.HIGHLIGHT.HOVER_LEAVE, {
        word: word,
        element: element
      });
    } catch (error) {
      console.error('[Lucid] Error dispatching highlight hover leave event:', error);
    }
  });
}

/**
 * 向后兼容函数：保持现有API
 * @deprecated 使用 addHighlightInteractionEvents 代替
 */
export function addTooltipEvents(element: HTMLElement, word: string): void {
  console.warn('[Lucid] addTooltipEvents is deprecated, use addHighlightInteractionEvents instead');
  addHighlightInteractionEvents(element, word);
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
 * @returns 是否成功包裹并插入高亮节点
 */
export function highlightWordInContainer(
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
export function highlightWordInContainerForceAll(
  container: Element,
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
 * 若给定节点处于 <mark.lucid-highlight> 内，返回该高亮元素，否则返回 null
 */
export function getAncestorHighlight(node: Node | null): HTMLElement | null {
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
export function removeEmptyHighlights(): void {
  document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
    if (!el.textContent?.trim()) {
      el.remove();
    }
  });
}

/** 把单个 <mark.lucid-highlight> 展开成纯文本内容 */
export function unwrapHighlight(el: HTMLElement): void {
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
export function unwrapHighlightsInRange(rng: Range): void {
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
 * 更新页面上所有相同词汇的高亮元素的data-mark-count和样式
 * @param word 要更新的词汇（小写）
 * @param newCount 新的标记次数
 * @param baseColor 基础颜色
 * @param isDarkText 是否为深色文本
 * @param calculateHighlight 计算高亮颜色的函数
 */
export function updateAllWordHighlights(
  word: string,
  newCount: number,
  baseColor: string,
  isDarkText: boolean,
  calculateHighlight: (baseColor: string, queryCount: number, isDarkText: boolean) => { className: string; hex: string }
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

      // 确保交互事件已添加（防止某些元素缺少事件监听）
      if (!el.dataset.interactionEventsAdded) {
        addHighlightInteractionEvents(el, word);
        el.dataset.interactionEventsAdded = "true";
      }
    }
  });
}