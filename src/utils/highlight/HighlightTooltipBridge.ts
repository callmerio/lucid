/**
 * HighlightTooltipBridge.ts - 高亮与提示框之间的事件桥接器
 * 
 * 这个模块负责监听高亮事件并与 tooltip 系统进行交互，
 * 实现了解耦架构下的功能集成。
 */

import { eventManager } from "../core/eventManager";
import { UI_EVENTS, type EventPayloads } from "../../constants/uiEvents";

/**
 * 高亮-提示框桥接器类
 * 
 * 职责：
 * 1. 订阅高亮系统的鼠标事件
 * 2. 将事件转换为 tooltip 系统可理解的格式
 * 3. 处理错误和异常情况
 * 4. 提供启用/禁用功能
 */
export class HighlightTooltipBridge {
  private static instance: HighlightTooltipBridge;
  private cleanupFunctions: Array<() => void> = [];
  private isEnabled: boolean = true;
  private tooltipManager: any = null; // 延迟加载

  private constructor() {
    this.initializeEventSubscriptions();
  }

  /**
   * 获取桥接器单例实例
   */
  public static getInstance(): HighlightTooltipBridge {
    if (!HighlightTooltipBridge.instance) {
      HighlightTooltipBridge.instance = new HighlightTooltipBridge();
    }
    return HighlightTooltipBridge.instance;
  }

  /**
   * 初始化事件订阅
   */
  private initializeEventSubscriptions(): void {
    // 订阅高亮悬停进入事件
    const hoverEnterCleanup = eventManager.subscribe<EventPayloads[typeof UI_EVENTS.HIGHLIGHT.HOVER_ENTER]>(
      UI_EVENTS.HIGHLIGHT.HOVER_ENTER,
      this.handleHighlightHoverEnter.bind(this),
      'HighlightTooltipBridge'
    );

    // 订阅高亮悬停离开事件
    const hoverLeaveCleanup = eventManager.subscribe<EventPayloads[typeof UI_EVENTS.HIGHLIGHT.HOVER_LEAVE]>(
      UI_EVENTS.HIGHLIGHT.HOVER_LEAVE,
      this.handleHighlightHoverLeave.bind(this),
      'HighlightTooltipBridge'
    );

    this.cleanupFunctions.push(hoverEnterCleanup, hoverLeaveCleanup);
  }

  /**
   * 获取 TooltipManager 实例（延迟加载）
   */
  private async getTooltipManager(): Promise<any> {
    if (!this.tooltipManager) {
      try {
        // 动态导入 TooltipManager，避免循环依赖
        const { TooltipManager } = await import("../dom/managers/tooltip/TooltipManager");
        this.tooltipManager = TooltipManager.getInstance();
      } catch (error) {
        console.warn('[Lucid] TooltipManager not available:', error);
        return null;
      }
    }
    return this.tooltipManager;
  }

  /**
   * 处理高亮悬停进入事件
   */
  private async handleHighlightHoverEnter(payload: EventPayloads[typeof UI_EVENTS.HIGHLIGHT.HOVER_ENTER]): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const tooltipManager = await this.getTooltipManager();
      if (!tooltipManager) {
        console.debug('[Lucid] TooltipManager not available, skipping tooltip display');
        return;
      }

      // 取消任何隐藏操作并显示tooltip
      if (typeof tooltipManager.cancelHide === 'function') {
        tooltipManager.cancelHide();
      }

      // 显示 tooltip
      await tooltipManager.showTooltip({
        word: payload.word,
        translation: payload.translation || `Loading translation for "${payload.word}"...`,
        targetElement: payload.element,
        preferredPosition: 'auto'
      });

      console.debug(`[Lucid] Tooltip shown for word: "${payload.word}"`);
    } catch (error) {
      console.error('[Lucid] Error handling highlight hover enter:', error);
    }
  }

  /**
   * 处理高亮悬停离开事件
   */
  private async handleHighlightHoverLeave(payload: EventPayloads[typeof UI_EVENTS.HIGHLIGHT.HOVER_LEAVE]): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const tooltipManager = await this.getTooltipManager();
      if (!tooltipManager) {
        return;
      }

      // 获取当前模式和详细模式单词状态
      const currentMode = typeof tooltipManager.getCurrentMode === 'function' ? 
        tooltipManager.getCurrentMode() : 'simple';
      const currentDetailedWord = typeof tooltipManager.currentDetailedWord === 'string' ? 
        tooltipManager.currentDetailedWord : '';

      console.debug(`[Lucid] HandleHighlightHoverLeave:`, {
        word: payload.word,
        currentMode,
        currentDetailedWord,
        shouldIgnore: currentMode === "detailed"
      });

      // 检查当前模式，只有非详细模式才自动隐藏
      if (currentMode === "detailed") {
        console.debug(`[Lucid] Ignoring auto-hide in detailed mode for word: "${payload.word}"`);
        return;
      }

      // 延迟隐藏 tooltip（仅简单模式）
      if (typeof tooltipManager.hideTooltip === 'function') {
        console.debug(`[Lucid] Hiding simple tooltip for word: "${payload.word}"`);
        tooltipManager.hideTooltip(false); // false 表示延迟隐藏
      }

      console.debug(`[Lucid] Tooltip hide requested for word: "${payload.word}"`);
    } catch (error) {
      console.error('[Lucid] Error handling highlight hover leave:', error);
    }
  }

  /**
   * 启用桥接器
   */
  public enable(): void {
    this.isEnabled = true;
    console.debug('[Lucid] HighlightTooltipBridge enabled');
  }

  /**
   * 禁用桥接器
   */
  public disable(): void {
    this.isEnabled = false;
    console.debug('[Lucid] HighlightTooltipBridge disabled');
  }

  /**
   * 检查桥接器是否启用
   */
  public isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * 清理所有事件监听器
   */
  public cleanup(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    this.tooltipManager = null;
    console.debug('[Lucid] HighlightTooltipBridge cleaned up');
  }
}

// 导出单例实例
export const highlightTooltipBridge = HighlightTooltipBridge.getInstance();

// 自动启动桥接器（可选）
if (typeof window !== 'undefined') {
  // 确保在 DOM 加载后启动桥接器
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      highlightTooltipBridge.enable();
    });
  } else {
    highlightTooltipBridge.enable();
  }
}