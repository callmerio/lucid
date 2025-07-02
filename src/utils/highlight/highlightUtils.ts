// 导入控制器和相关类型
import { highlightController } from "./HighlightController";
import type { ToggleHighlightContext } from "./HighlightController";
// 初始化桥接器（确保事件订阅正常工作）
import "./HighlightTooltipBridge";

/**
 * highlightUtils.ts - Compatibility layer for highlight functionality
 * 
 * This module provides backward compatibility by delegating to the new HighlightController:
 * - Maintains existing API surface
 * - Delegates to modular controller architecture  
 * - Provides re-exports for external consumers
 */

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

// Re-export ToggleHighlightContext from controller for backward compatibility
export type { ToggleHighlightContext };

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
 * 完全移除页面上所有相同词汇的高亮，并更新storage
 * @param word 要移除高亮的词汇（小写）
 */
export async function removeWordHighlight(word: string): Promise<void> {
  return highlightController.removeWordHighlight(word);
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
  return highlightController.decreaseWordHighlight(word, targetElement, isDarkText);
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
  return highlightController.addWordHighlight(word, targetElement, isDarkText);
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
  
  return highlightController.applyWordHighlight(range, isDarkText);
}

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
  return highlightController.toggleWordHighlightState(word, isDarkText, context);
}

// Re-export utilities and types for backward compatibility
export { 
  calculateHighlight,
  MAX_MARK_COUNT,
  DEFAULT_BASE_COLOR 
} from "./HighlightUtilities";

export {
  updateAllWordHighlights
} from "./HighlightDOM";