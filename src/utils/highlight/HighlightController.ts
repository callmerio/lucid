import { serviceContainer } from "@services/container/ServiceContainer";
import type { HighlightStorageService } from "@services/storage/highlightStorage";

// 导入工具模块
import {
  MAX_MARK_COUNT,
  DEFAULT_BASE_COLOR,
  calculateHighlight,
  getEffectiveTextColor,
  buildTextGradient
} from "./HighlightUtilities";

import {
  createHighlightElement,
  addHighlightInteractionEvents,
  highlightWordInContainer,
  highlightWordInContainerForceAll,
  getAncestorHighlight,
  removeEmptyHighlights,
  unwrapHighlight,
  unwrapHighlightsInRange,
  updateAllWordHighlights
} from "./HighlightDOM";

/**
 * HighlightController.ts - Business logic orchestrator for highlight functionality
 * 
 * This controller class provides a clean interface for highlight operations by coordinating:
 * - Storage services for persistence
 * - Pure utility functions for calculations
 * - DOM manipulation functions for visual updates
 * - Error handling and logging
 */

export interface ToggleHighlightContext {
  range?: Range;
  sourceElement?: HTMLElement;
}

/**
 * HighlightController - 高亮功能的业务逻辑控制器
 * 
 * 负责协调各个模块之间的交互：
 * - 存储服务 (HighlightStorageService)
 * - 纯工具函数 (HighlightUtilities)  
 * - DOM 操作 (HighlightDOM)
 */
export class HighlightController {
  private static instance: HighlightController;

  private constructor() {}

  /**
   * 获取控制器单例实例
   */
  public static getInstance(): HighlightController {
    if (!HighlightController.instance) {
      HighlightController.instance = new HighlightController();
    }
    return HighlightController.instance;
  }

  /**
   * 获取高亮存储服务实例
   */
  private getStorageService(): HighlightStorageService {
    return serviceContainer.resolve<HighlightStorageService>('HighlightStorageService');
  }

  /**
   * 完全移除页面上所有相同词汇的高亮，并更新storage
   * @param word 要移除高亮的词汇（小写）
   */
  public async removeWordHighlight(word: string): Promise<void> {
    try {
      // 使用服务移除单词标记
      const storageService = this.getStorageService();
      await storageService.removeWordMarking(word);

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
  public async decreaseWordHighlight(
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
        await this.removeWordHighlight(word);
        return;
      }

      // 使用服务更新存储
      const storageService = this.getStorageService();
      await storageService.updateWordMarking(word, newCount);

      // 更新页面上所有相同词汇的高亮元素
      updateAllWordHighlights(word, newCount, baseColor, isDarkText, calculateHighlight);

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
        updateAllWordHighlights(word, newCount, baseColor, isDarkText, calculateHighlight);
      }
    }
  }

  /**
   * 为指定词汇添加高亮（设置计数为1），并更新storage和样式
   * @param word 要添加高亮的词汇（小写）
   * @param targetElement 包含该词汇的元素（用于确定基础颜色）
   * @param isDarkText 是否为深色文本
   */
  public async addWordHighlight(
    word: string,
    targetElement: HTMLElement,
    isDarkText: boolean
  ): Promise<void> {
    try {
      // 获取基础颜色，优先使用目标元素的颜色，否则使用默认颜色
      const baseColor = targetElement.dataset.baseColor || DEFAULT_BASE_COLOR;
      const newCount = 1; // 新高亮设置为1

      // 使用服务更新存储
      const storageService = this.getStorageService();
      await storageService.updateWordMarking(word, newCount);

      // 使用改进的高亮方法来高亮页面上的所有匹配词汇
      const { className: highlightClassName, hex } = calculateHighlight(
        baseColor,
        newCount,
        isDarkText,
      );

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

  /**
   * 应用高亮到指定的 Range 对象
   * @param range 扩展后的选区 Range 对象
   * @param isDarkText 当前是否为暗黑模式
   */
  public async applyWordHighlight(
    range: Range,
    isDarkText: boolean,
  ): Promise<void> {
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
        const prev = Number(targetHighlight.dataset.markCount ?? 0);
        const newCount = Math.min(prev + 1, MAX_MARK_COUNT);

        // Diagnostic log to check counts during re-highlight
        console.log(`[Lucid] Re-highlighting. Word: "${word}", Prev DOM count: ${prev}, Calculated new count: ${newCount}, Max count: ${MAX_MARK_COUNT}`);

        // 使用服务更新存储
        const storageService = this.getStorageService();
        await storageService.updateWordMarking(word, newCount);

        // 更新页面上所有相同词汇的高亮元素
        const baseColor = targetHighlight.dataset.baseColor || DEFAULT_BASE_COLOR;
        updateAllWordHighlights(word, newCount, baseColor, isDarkText, calculateHighlight);

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
        updateAllWordHighlights(word, newCount, baseColor, isDarkText, calculateHighlight);

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
      const storageService = this.getStorageService();
      
      // 获取设置和当前计数
      const settings = await storageService.getSettings();
      const currentMarkCount = await storageService.getMarkCount(word);
      
      const baseColor = settings.highlightColor || DEFAULT_BASE_COLOR;
      const newMarkCount = Math.min(currentMarkCount + 1, MAX_MARK_COUNT); // 增加标记次数，但不超过上限

      // 更新存储
      await storageService.updateWordMarking(word, newMarkCount);

      const { className: highlightClassName, hex } = calculateHighlight(
        baseColor,
        newMarkCount,
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
        // 重新添加交互事件到新元素，因为 cloneNode(false) 不会复制事件监听器
        addHighlightInteractionEvents(newHighlight, word);
        newHighlight.dataset.interactionEventsAdded = "true";
        range.surroundContents(newHighlight);

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

  /**
   * Toggles the highlight state of a given word.
   * If the word is currently highlighted, all highlights for it will be removed.
   * If the word is not highlighted, it will be highlighted.
   *
   * @async
   * @param {string} word - The target word to toggle. Should be in lowercase.
   * @param {boolean} isDarkText - Indicates if the current theme uses dark text, affecting color calculation.
   * @param {ToggleHighlightContext} [context] - Optional context for the operation.
   * @param {Range} [context.range] - If adding highlight based on a user selection.
   * @param {HTMLElement} [context.sourceElement] - If action is triggered from a specific element (e.g., a tooltip button on a mark), used for color inference or context.
   * @returns {Promise<void>}
   * @throws {Error} Logs errors to the console if operations fail.
   */
  public async toggleWordHighlightState(
    word: string,
    isDarkText: boolean,
    context?: ToggleHighlightContext
  ): Promise<void> {
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
      const storageService = this.getStorageService();
      const currentMarkCount = await storageService.getMarkCount(cleanedWord);
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
        await this.removeWordHighlight(cleanedWord);
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
          await this.applyWordHighlight(context.range, isDarkText);
        } else if (context?.sourceElement) {
          // addWordHighlight sets count to 1 and highlights all instances.
          // sourceElement helps infer baseColor if the word is new.
          console.log(`[Lucid DEBUG] Adding highlight for "${cleanedWord}" using addWordHighlight (due to context.sourceElement).`);
          await this.addWordHighlight(cleanedWord, context.sourceElement, isDarkText);
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
          await this.addWordHighlight(cleanedWord, elementForColorInference, isDarkText);
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
}

// Export singleton instance for easier access
export const highlightController = HighlightController.getInstance();