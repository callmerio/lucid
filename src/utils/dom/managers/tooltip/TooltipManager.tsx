/**
 * TooltipManager - 简化的 Tooltip 管理器
 * 支持 Tooltip 和 Toolfull 的统一管理
 */

import React from "react";
import { popupService } from "@services/PopupService";
import { Tooltip } from "@components/ui/Tooltip";
import { Toolfull } from "@components/ui/Toolfull";
import { TooltipStateManager } from "./TooltipStateManager";
import { dataService } from "@services/DataService";
import { WordDetails } from "@/types/services";

// 向后兼容的接口
export interface TooltipManagerOptions {
  onWordAction?: (action: string, word: string) => void;
  onExpand?: (word: string) => void;
  onCollapse?: (word: string) => void;
  onClose?: (word: string) => void;
}

// 导出向后兼容的类型
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
  private options: TooltipManagerOptions;
  private currentMode: "simple" | "detailed" = "simple";
  private currentDetailedData: WordDetails | null = null;

  private constructor(options: TooltipManagerOptions = {}) {
    this.options = options;
    this.stateManager = new TooltipStateManager();

    // 监听状态变化
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
   * 处理状态变化
   */
  private handleStateChange(event: any): void {
    console.log("[TooltipManager] State changed:", event.type);
  }

  /**
   * 显示简单模式的 tooltip
   */
  async showTooltip(options: ShowTooltipOptions): Promise<void> {
    const { word, translation, phonetic, partOfSpeech, targetElement } =
      options;

    try {
      // 更新状态
      this.stateManager.show(word, targetElement);
      this.currentMode = "simple";

      // 创建 Tooltip 组件
      const tooltipContent = (
        <Tooltip
          word={word}
          translation={translation}
          phonetic={phonetic}
          partOfSpeech={partOfSpeech}
          onExpand={() => this.handleExpand()}
          onCollapse={() => this.handleCollapse()}
          onClose={() => this.handleClose()}
        />
      );

      // 显示 tooltip
      popupService.show(`tooltip-${word}`, tooltipContent, {
        targetElement,
        position: options.preferredPosition,
      });

      // 设置 Shift 键监听器
      this.setupShiftKeyListener(word, targetElement);
    } catch (error) {
      console.error("[TooltipManager] Error showing tooltip:", error);
      this.stateManager.hide(true);
      throw error;
    }
  }

  /**
   * 切换到详细模式
   */
  async showDetailedView(
    word: string,
    targetElement: HTMLElement
  ): Promise<void> {
    try {
      this.currentMode = "detailed";

      // 获取详细数据
      const detailedData = await dataService.getWordDetails(word);
      if (!detailedData) {
        console.warn(`[TooltipManager] No detailed data found for: ${word}`);
        return;
      }

      this.currentDetailedData = detailedData;

      // 创建 Toolfull 组件
      const toolfullContent = (
        <Toolfull
          word={word}
          wordData={detailedData}
          onClose={() => this.handleClose()}
          onMinimize={() => this.handleMinimize(word, targetElement)}
        />
      );

      // 显示详细视图
      popupService.show(`tooltip-${word}`, toolfullContent, {
        targetElement,
      });
    } catch (error) {
      console.error("[TooltipManager] Error showing detailed view:", error);
    }
  }

  /**
   * 设置 Shift 键监听器
   */
  private setupShiftKeyListener(
    word: string,
    targetElement: HTMLElement
  ): void {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === "Shift" && this.stateManager.isVisible()) {
        // 不阻止事件传播，让 content.ts 中的高亮逻辑也能执行
        // event.preventDefault(); // 移除这行，允许事件继续传播

        console.log(
          "[TooltipManager] Shift key pressed, switching to detailed view"
        );

        // 切换到详细模式
        this.showDetailedView(word, targetElement);

        // 移除监听器
        document.removeEventListener("keydown", keyDownHandler);
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    // 在隐藏时自动清理监听器
    const originalHide = this.stateManager.hide.bind(this.stateManager);
    this.stateManager.hide = (immediate?: boolean) => {
      document.removeEventListener("keydown", keyDownHandler);
      originalHide(immediate);
    };
  }

  /**
   * 处理展开操作
   */
  private handleExpand(): void {
    this.stateManager.expand();
    if (this.options.onExpand) {
      this.options.onExpand(this.stateManager.getCurrentWord());
    }
  }

  /**
   * 处理收起操作
   */
  private handleCollapse(): void {
    this.stateManager.collapse();
    if (this.options.onCollapse) {
      this.options.onCollapse(this.stateManager.getCurrentWord());
    }
  }

  /**
   * 处理关闭操作
   */
  private handleClose(): void {
    const word = this.stateManager.getCurrentWord();
    this.hideTooltip(true);
    if (this.options.onClose) {
      this.options.onClose(word);
    }
  }

  /**
   * 处理最小化操作（从详细模式回到简单模式）
   */
  private handleMinimize(word: string, targetElement: HTMLElement): void {
    // 切换回简单模式
    this.showTooltip({
      word,
      translation: "Loading...", // 可以从缓存获取
      targetElement,
    });
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
   * 检查是否展开（向后兼容）
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
   * 获取当前模式
   */
  getCurrentMode(): string {
    return this.currentMode;
  }

  /**
   * 获取当前目标元素（向后兼容）
   */
  getCurrentTargetElement(): HTMLElement | null {
    return this.stateManager.getCurrentTargetElement();
  }

  /**
   * 检查是否正在加载详细数据
   */
  isLoadingDetailed(): boolean {
    return false; // 简化实现
  }

  /**
   * 获取详细数据
   */
  getDetailedData(): any {
    return this.currentDetailedData;
  }

  /**
   * 切换到简单模式
   */
  switchToSimple(): void {
    this.currentMode = "simple";
    // 可以在这里重新显示简单模式
  }

  /**
   * 添加缺失的方法以满足测试需求
   */

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
   * 切换展开状态（向后兼容）
   */
  toggleExpanded(): void {
    if (this.stateManager.isExpanded()) {
      this.stateManager.collapse();
    } else {
      this.stateManager.expand();
    }
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
  handleMouseEnter(_element: HTMLElement): void {
    this.stateManager.cancelHide();
  }

  /**
   * 处理鼠标离开事件
   */
  handleMouseLeave(_element: HTMLElement): void {
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
    } else if (event.key === "Shift") {
      // Shift 键切换到详细模式
      const word = this.getCurrentWord();
      const targetElement = this.getCurrentTargetElement();
      if (word && targetElement) {
        this.showDetailedView(word, targetElement);
      }
    }
  }

  /**
   * 取消隐藏
   */
  cancelHide(): void {
    this.stateManager.cancelHide();
  }

  /**
   * 获取当前状态（向后兼容）
   */
  getCurrentState(): any {
    const state = this.stateManager.getState();
    return {
      visible: state.visible,
      expanded: state.expanded,
      word: state.word,
      targetElement: state.targetElement,
      hideTimeout: state.hideTimeout,
    };
  }

  /**
   * 获取统计信息
   */
  getStats(): any {
    return this.stateManager.getStats();
  }

  /**
   * 获取数据管理器统计
   */
  getDataStats(): any {
    return { size: 0, hitRate: 0 }; // 简化实现
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stateManager.destroy();
    // 重置单例实例
    TooltipManager.instance = null as any;
  }
}
