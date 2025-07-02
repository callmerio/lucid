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
  public currentDetailedWord: string = ""; // 跟踪当前详细模式的单词（公开访问）
  private currentDetailedData: WordDetails | null = null;
  private detailedHideTimeout: number | null = null;
  private isTransitioning: boolean = false; // 防止转换过程中的重复调用

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

    // StateManager的状态变化只用于内部状态同步
    // 实际的弹窗隐藏应该由明确的用户操作或事件触发
    // 避免重复调用 popupService.hide()
    // 详细模式下完全忽略状态管理器的自动隐藏
    if (this.currentMode === "detailed" && event.type === "hide") {
      console.log("[TooltipManager] Ignoring auto-hide in detailed mode");
      return;
    }
  }

  /**
   * 显示简单模式的 tooltip
   */
  async showTooltip(options: ShowTooltipOptions): Promise<void> {
    const { word, translation, phonetic, partOfSpeech, targetElement } =
      options;

    try {
      // 如果当前是详细模式，避免重置状态，只更新状态管理器
      if (this.currentMode === "detailed") {
        console.log(
          `[TooltipManager] In detailed mode, updating state for word: "${word}" without mode reset`
        );
        // 只更新状态管理器，不重置模式，也不创建简单tooltip
        this.stateManager.show(word, targetElement);
        return;
      }

      // 正常的简单模式逻辑
      this.stateManager.show(word, targetElement);
      this.currentMode = "simple";
      console.log(
        `[TooltipManager] Switched to simple mode for word: "${word}"`
      );

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

      // 显示 tooltip - 使用简单模式专用ID
      await popupService.show(`tooltip-simple-${word}`, tooltipContent, {
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
      // 如果正在转换中，直接返回
      if (this.isTransitioning) {
        console.log(
          `[TooltipManager] Currently transitioning, ignoring request for word: "${word}"`
        );
        return;
      }

      // 在状态更新前获取当前单词状态，避免状态更新导致检查失效
      const previousWord = this.currentDetailedWord; // 使用专用的详细模式单词跟踪
      const wasInDetailedMode = this.currentMode === "detailed";

      console.log(`[TooltipManager] showDetailedView called:`, {
        requestedWord: word,
        currentDetailedWord: previousWord,
        stateManagerWord: this.stateManager.getCurrentWord(),
        wasInDetailedMode,
        currentMode: this.currentMode,
      });

      // 如果已经是详细模式且切换到不同单词，先关闭旧的详细弹窗
      if (wasInDetailedMode && previousWord && previousWord !== word) {
        console.log(
          `[TooltipManager] Switching from "${previousWord}" to "${word}" detailed view - closing old popup`
        );
        popupService.hide(`toolfull-detailed-${previousWord}`);
      } else if (wasInDetailedMode && previousWord === word) {
        console.log(
          `[TooltipManager] Already showing detailed view for word: "${word}"`
        );
        return;
      }

      console.log(
        `[TooltipManager] Switching to detailed mode for word: "${word}"`
      );
      this.isTransitioning = true;
      this.currentMode = "detailed";
      this.currentDetailedWord = word; // 更新详细模式单词跟踪

      // 更新状态管理器到新单词（在检查逻辑完成后）
      this.stateManager.show(word, targetElement);

      // 取消状态管理器的自动隐藏，详细模式由用户手动控制
      this.stateManager.cancelHide();

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
          onClose={() => this.handleDetailedClose(word)}
          onMinimize={() => this.handleMinimize(word, targetElement)}
        />
      );

      // 先隐藏简单模式弹窗
      popupService.hide(`tooltip-simple-${word}`);

      // 显示详细视图 - 使用详细模式专用ID
      await popupService.show(`toolfull-detailed-${word}`, toolfullContent, {
        targetElement,
      });

      console.log(
        `[TooltipManager] Successfully shown detailed popup for word: "${word}"`
      );

      // 详细模式使用 Popup 组件的外部点击检测，不需要鼠标事件监听
      // 设置详细模式专用的键盘监听器
      this.setupDetailedModeKeyboardListener(word, targetElement);

      // 完成转换
      this.isTransitioning = false;
      console.log(`[TooltipManager] Transition completed for word: "${word}"`);
    } catch (error) {
      console.error(
        `[TooltipManager] Error in showDetailedView for word "${word}":`,
        error
      );
      // 转换失败时也要重置标志
      this.isTransitioning = false;
      this.currentMode = "simple"; // 回退到简单模式
      throw error;
    }
  }

  /**
   * 为详细模式设置专用的键盘监听器
   */
  private setupDetailedModeKeyboardListener(
    word: string,
    targetElement: HTMLElement
  ): void {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === "Shift" && this.currentMode === "detailed") {
        // 详细模式下按 Shift 键切换回简单模式
        console.log(
          "[TooltipManager] Shift key pressed in detailed mode, switching to simple mode"
        );

        // 阻止事件传播，避免与其他 Shift 监听器冲突
        event.preventDefault();
        event.stopPropagation();

        // 切换回简单模式
        this.handleMinimize(word, targetElement);

        // 移除监听器
        document.removeEventListener("keydown", keyDownHandler);
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    // 在详细模式隐藏时自动清理监听器
    const originalHideTooltip = this.hideTooltip.bind(this);
    this.hideTooltip = (immediate?: boolean) => {
      document.removeEventListener("keydown", keyDownHandler);
      originalHideTooltip(immediate);
    };
  }

  /**
   * 取消详细模式延迟隐藏
   */
  private cancelDetailedHide(): void {
    if (this.detailedHideTimeout) {
      clearTimeout(this.detailedHideTimeout);
      this.detailedHideTimeout = null;
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
   * 处理详细模式弹窗关闭操作（包括外部点击关闭）
   */
  private handleDetailedClose(word: string): void {
    console.log(`[TooltipManager] Detailed popup closed for word: "${word}"`);
    
    // 清理详细模式状态
    this.currentDetailedWord = "";
    this.currentMode = "simple";
    this.cancelDetailedHide();
    
    // 更新状态管理器
    this.stateManager.hide(true);
    
    // 调用用户提供的关闭回调
    if (this.options.onClose) {
      this.options.onClose(word);
    }
    
    console.log(`[TooltipManager] Reset to simple mode after detailed popup close`);
  }

  /**
   * 处理最小化操作（从详细模式回到简单模式）
   */
  private handleMinimize(word: string, targetElement: HTMLElement): void {
    // 清理详细模式定时器
    this.cancelDetailedHide();

    // 先隐藏详细模式弹窗
    popupService.hide(`toolfull-detailed-${word}`);

    // 清理详细模式状态
    this.currentDetailedWord = "";
    this.currentMode = "simple";

    // 切换回简单模式
    this.showTooltip({
      word,
      translation: "Loading...", // 可以从缓存获取
      targetElement,
    }).catch((error) => {
      console.error(
        "[TooltipManager] Error showing tooltip after minimize:",
        error
      );
    });
  }

  /**
   * 隐藏 tooltip
   */
  hideTooltip(immediate: boolean = false): void {
    const word = this.stateManager.getCurrentWord();

    // 调试日志：记录隐藏原因
    console.log(`[TooltipManager] hideTooltip called:`, {
      word,
      currentMode: this.currentMode,
      currentDetailedWord: this.currentDetailedWord,
      immediate,
      stack: new Error().stack?.split("\n").slice(1, 4).join("\n"), // 调用堆栈前3行
    });

    if (word) {
      // 根据当前模式隐藏对应的弹窗
      if (this.currentMode === "simple") {
        console.log(`[TooltipManager] Hiding simple tooltip for: ${word}`);
        popupService.hide(`tooltip-simple-${word}`);
      } else if (this.currentMode === "detailed") {
        // 详细模式下，检查是否应该忽略某些自动隐藏调用
        console.log(
          `[TooltipManager] Attempting to hide detailed popup for: ${word}`
        );
        this.cancelDetailedHide();
        popupService.hide(`toolfull-detailed-${word}`);
        // 清理详细模式状态
        this.currentDetailedWord = "";
        this.currentMode = "simple";
        console.log(`[TooltipManager] Reset to simple mode after hiding detailed tooltip`);
      }
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
    // 详细模式下不自动隐藏，只有简单模式才自动隐藏
    if (this.currentMode !== "detailed") {
      this.stateManager.hide();
    }
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
      const word = this.getCurrentWord();
      const targetElement = this.getCurrentTargetElement();
      if (word && targetElement) {
        if (this.currentMode === "simple") {
          // 简单模式下切换到详细模式
          this.showDetailedView(word, targetElement);
        } else if (this.currentMode === "detailed") {
          // 详细模式下切换回简单模式
          this.handleMinimize(word, targetElement);
        }
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
    // 清理详细模式的延迟隐藏定时器
    this.cancelDetailedHide();
    this.stateManager.destroy();
    // 重置单例实例
    TooltipManager.instance = null as any;
  }
}
