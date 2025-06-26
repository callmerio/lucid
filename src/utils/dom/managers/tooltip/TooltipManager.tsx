/**
 * TooltipManager - Tooltip 管理器 (重构版)
 * 作为协调器，整合各个专职管理器的功能
 */

import { popupService } from "@services/PopupService";
import { Tooltip } from "@components/ui/Tooltip";
import { TooltipStateManager } from "./TooltipStateManager";

export interface TooltipManagerOptions {
  onWordAction?: (action: string, word: string) => void;
  onExpand?: (word: string) => void;
  onCollapse?: (word: string) => void;
  onClose?: (word: string) => void;
}

export interface ShowTooltipOptions {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  targetElement: HTMLElement;
  preferredPosition?: "top" | "bottom" | "left" | "right" | "auto";
}

export class TooltipManager {
  private static instance: TooltipManager;

  private stateManager: TooltipStateManager;

  private constructor(options: TooltipManagerOptions = {}) {
    // 初始化状态管理器
    this.stateManager = new TooltipStateManager();

    // 监听状态变化以同步渲染
    this.stateManager.addStateChangeListener((event) => {
      this.handleStateChange(event);
    });
  }

  /**
   * 获取单例实例
   */
  static getInstance(options?: TooltipManagerOptions): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager(options);
    }
    return TooltipManager.instance;
  }

  /**
   * 显示 tooltip
   */
  async showTooltip(options: ShowTooltipOptions): Promise<void> {
    const {
      word,
      translation,
      phonetic,
      partOfSpeech,
      targetElement,
      preferredPosition = "auto",
    } = options;

    try {
      this.stateManager.show(word, targetElement);

      const tooltipContent = (
        <Tooltip
          word={word}
          translation={translation}
          phonetic={phonetic}
          partOfSpeech={partOfSpeech}
          onExpand={() => this.stateManager.expand()}
          onCollapse={() => this.stateManager.collapse()}
          onClose={() => this.stateManager.hide(true)}
        />
      );

      popupService.show(`tooltip-${word}`, tooltipContent, {
        targetElement,
        position: preferredPosition,
      });
    } catch (error) {
      console.error("[TooltipManager] Error showing tooltip:", error);
      this.stateManager.hide(true);
      throw error;
    }
  }

  /**
   * 隐藏 tooltip
   */
  hideTooltip(immediate: boolean = false): void {
    const word = this.stateManager.getCurrentWord();
    if (word) {
      popupService.hide(`tooltip-${word}`);
    }
    this.stateManager.hide(immediate);
  }

  /**
   * 检查是否展开
   */
  isExpanded(): boolean {
    return this.stateManager.isExpanded();
  }

  /**
   * 获取当前单词
   */
  getCurrentWord(): string {
    return this.stateManager.getCurrentWord();
  }

  /**
   * 获取当前目标元素
   */
  getCurrentTargetElement(): HTMLElement | null {
    return this.stateManager.getCurrentTargetElement();
  }

  /**
   * 添加缺失的方法以满足测试需求
   */

  /**
   * 处理状态变化
   */
  private handleStateChange(event: any): void {
    // 处理状态变化逻辑
    console.log("[TooltipManager] State changed:", event);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stateManager.destroy();
    // 重置单例实例
    TooltipManager.instance = null as any;
  }

  /**
   * 展开 tooltip
   */
  expandTooltip(): void {
    this.stateManager.expand();
  }

  /**
   * 收起 tooltip
   */
  collapseTooltip(): void {
    this.stateManager.collapse();
  }

  /**
   * 切换展开状态
   */
  toggleExpanded(): void {
    this.stateManager.toggleExpanded();
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.stateManager.isVisible();
  }

  /**
   * 处理鼠标进入事件
   */
  handleMouseEnter(element: HTMLElement): void {
    this.stateManager.cancelHide();
  }

  /**
   * 处理鼠标离开事件
   */
  handleMouseLeave(element: HTMLElement): void {
    this.stateManager.hide();
  }

  /**
   * 处理键盘事件
   */
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.hideTooltip(true);
    } else if (event.key === "Enter" || event.key === " ") {
      this.toggleExpanded();
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): any {
    return this.stateManager.getState();
  }

  /**
   * 获取统计信息
   */
  getStats(): any {
    return this.stateManager.getStats();
  }
}
