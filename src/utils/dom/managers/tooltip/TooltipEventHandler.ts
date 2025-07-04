/**
 * TooltipEventHandler - Tooltip 事件处理器
 * 负责处理 tooltip 相关的所有事件
 * 支持统一的 Tooltip 和 Toolfull 事件管理
 */

/// <reference lib="dom" />

import { TooltipStateManager, ExtendedTooltipStateManager } from './TooltipStateManager';
import { TooltipMode, UnifiedStateChangeEvent } from '../types';

export interface EventHandlerOptions {
  stateManager: TooltipStateManager;
  onWordAction?: (action: string, word: string) => void;
  onExpand?: (word: string) => void;
  onCollapse?: (word: string) => void;
  onClose?: (word: string) => void;
}

export class TooltipEventHandler {
  private stateManager: TooltipStateManager;
  private onWordAction?: (action: string, word: string) => void;
  private onExpand?: (word: string) => void;
  private onCollapse?: (word: string) => void;
  private onClose?: (word: string) => void;
  private eventCleanups: Array<() => void> = [];
  private shiftKeyCleanup: (() => void) | null = null;

  constructor(options: EventHandlerOptions) {
    this.stateManager = options.stateManager;
    this.onWordAction = options.onWordAction;
    this.onExpand = options.onExpand;
    this.onCollapse = options.onCollapse;
    this.onClose = options.onClose;

    this.setupGlobalEventListeners();
  }

  /**
   * 设置全局事件监听器
   */
  private setupGlobalEventListeners(): void {
    // 监听状态变化
    const stateCleanup = this.stateManager.addStateChangeListener((event) => {
      this.handleStateChange(event);
    });
    this.eventCleanups.push(stateCleanup);

    // 监听文档点击事件
    const documentClickHandler = (event: MouseEvent) => {
      this.handleDocumentClick(event);
    };
    document.addEventListener('click', documentClickHandler, true);
    this.eventCleanups.push(() => {
      document.removeEventListener('click', documentClickHandler, true);
    });

    // 监听滚动事件
    const scrollHandler = () => {
      if (this.stateManager.isVisible()) {
        this.stateManager.hide();
      }
    };
    window.addEventListener('scroll', scrollHandler, true);
    this.eventCleanups.push(() => {
      window.removeEventListener('scroll', scrollHandler, true);
    });

    // 监听窗口大小变化
    const resizeHandler = () => {
      if (this.stateManager.isVisible()) {
        this.stateManager.hide();
      }
    };
    window.addEventListener('resize', resizeHandler);
    this.eventCleanups.push(() => {
      window.removeEventListener('resize', resizeHandler);
    });
  }

  /**
   * 处理状态变化
   */
  private handleStateChange(event: { type: string; state: any; previousState: any }): void {
    const { type, state } = event;

    switch (type) {
      case 'expand':
        this.onExpand?.(state.word);
        this.addShiftKeyListener();
        break;

      case 'collapse':
        this.onCollapse?.(state.word);
        this.removeShiftKeyListener();
        break;

      case 'hide':
        this.onClose?.(event.previousState.word);
        this.removeShiftKeyListener();
        break;
    }
  }

  /**
   * 处理文档点击事件
   */
  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // 检查是否点击在 tooltip 内部
    if (this.isTooltipElement(target)) {
      return;
    }

    // 点击外部时隐藏 tooltip
    if (this.stateManager.isVisible()) {
      this.stateManager.hide(true);
    }
  }

  /**
   * 检查元素是否属于 tooltip
   */
  private isTooltipElement(element: HTMLElement): boolean {
    return element.closest('.lucid-tooltip, .lucid-tooltip-container') !== null;
  }

  /**
   * 设置 tooltip 按钮事件
   */
  setupButtonEvents(tooltipElement: HTMLElement): void {
    // 展开按钮
    const expandBtn = tooltipElement.querySelector('.lucid-tooltip-btn-like');
    if (expandBtn) {
      const expandHandler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        this.handleExpandClick();
      };
      expandBtn.addEventListener('click', expandHandler);

      // 添加清理函数
      this.eventCleanups.push(() => {
        expandBtn.removeEventListener('click', expandHandler);
      });
    }

    // 收起按钮
    const collapseBtn = tooltipElement.querySelector('.lucid-tooltip-btn-down');
    if (collapseBtn) {
      const collapseHandler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        this.handleCollapseClick();
      };
      collapseBtn.addEventListener('click', collapseHandler);

      // 添加清理函数
      this.eventCleanups.push(() => {
        collapseBtn.removeEventListener('click', collapseHandler);
      });
    }

    // 悬停区域事件
    const hoverZone = tooltipElement.querySelector('.lucid-tooltip-hover-zone');
    if (hoverZone) {
      const mouseEnterHandler = () => {
        this.stateManager.cancelHide();
      };

      const mouseLeaveHandler = () => {
        this.stateManager.hide();
      };

      hoverZone.addEventListener('mouseenter', mouseEnterHandler);
      hoverZone.addEventListener('mouseleave', mouseLeaveHandler);

      // 添加清理函数
      this.eventCleanups.push(() => {
        hoverZone.removeEventListener('mouseenter', mouseEnterHandler);
        hoverZone.removeEventListener('mouseleave', mouseLeaveHandler);
      });
    }
  }

  /**
   * 处理展开按钮点击
   */
  private handleExpandClick(): void {
    const word = this.stateManager.getCurrentWord();

    if (this.stateManager.isExpanded()) {
      // 如果已展开，触发单词操作
      this.onWordAction?.('toggle_favorite', word);
    } else {
      // 如果未展开，展开 tooltip
      this.stateManager.expand();
    }
  }

  /**
   * 处理收起按钮点击
   */
  private handleCollapseClick(): void {
    const word = this.stateManager.getCurrentWord();

    if (this.stateManager.isExpanded()) {
      this.stateManager.collapse();
    } else {
      // 减少高亮计数
      this.onWordAction?.('decrease_highlight', word);
    }
  }

  /**
   * 添加 Shift 键监听器
   */
  private addShiftKeyListener(): void {
    if (this.shiftKeyCleanup) {
      return; // 已经添加了监听器
    }

    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && this.stateManager.isVisible()) {
        // 不阻止事件传播，让 content.ts 中的高亮逻辑也能执行
        const word = this.stateManager.getCurrentWord();
        this.onWordAction?.('show_detailed_info', word);
      }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && this.stateManager.isVisible()) {
        // Shift 键释放时的处理
      }
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    this.shiftKeyCleanup = () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    };
  }

  /**
   * 移除 Shift 键监听器
   */
  private removeShiftKeyListener(): void {
    if (this.shiftKeyCleanup) {
      this.shiftKeyCleanup();
      this.shiftKeyCleanup = null;
    }
  }

  /**
   * 处理鼠标悬停事件
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
    if (!this.stateManager.isVisible()) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.stateManager.hide(true);
        break;

      case 'Enter':
        if (event.shiftKey) {
          event.preventDefault();
          this.stateManager.toggleExpanded();
        }
        break;
    }
  }

  /**
   * 清理所有事件监听器
   */
  cleanup(): void {
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];
    this.removeShiftKeyListener();
  }

  /**
   * 销毁事件处理器
   */
  destroy(): void {
    this.cleanup();
  }

  /**
   * 获取事件统计信息
   */
  getStats(): {
    activeListeners: number;
    hasShiftKeyListener: boolean;
  } {
    return {
      activeListeners: this.eventCleanups.length,
      hasShiftKeyListener: this.shiftKeyCleanup !== null,
    };
  }
}

/**
 * ExtendedTooltipEventHandler - 扩展的事件处理器
 * 支持统一的 Tooltip 和 Toolfull 事件管理
 */
export interface ExtendedEventHandlerOptions {
  stateManager: ExtendedTooltipStateManager;
  onWordAction?: (action: string, word: string) => void;
  onModeSwitch?: (from: TooltipMode, to: TooltipMode) => void;
  onExpand?: (word: string) => void;
  onCollapse?: (word: string) => void;
  onClose?: (word: string) => void;
  onTransitionToDetailed?: (word: string) => void;
}

export class ExtendedTooltipEventHandler {
  private stateManager: ExtendedTooltipStateManager;
  private onWordAction?: (action: string, word: string) => void;
  private onModeSwitch?: (from: TooltipMode, to: TooltipMode) => void;
  private onExpand?: (word: string) => void;
  private onCollapse?: (word: string) => void;
  private onClose?: (word: string) => void;
  private onTransitionToDetailed?: (word: string) => void;
  private eventCleanups: Array<() => void> = [];
  private shiftKeyCleanup: (() => void) | null = null;

  constructor(options: ExtendedEventHandlerOptions) {
    this.stateManager = options.stateManager;
    this.onWordAction = options.onWordAction;
    this.onModeSwitch = options.onModeSwitch;
    this.onExpand = options.onExpand;
    this.onCollapse = options.onCollapse;
    this.onClose = options.onClose;
    this.onTransitionToDetailed = options.onTransitionToDetailed;

    this.setupGlobalEventListeners();
  }

  /**
   * 设置全局事件监听器
   */
  private setupGlobalEventListeners(): void {
    // 监听统一状态变化
    const stateCleanup = this.stateManager.addUnifiedStateChangeListener((event) => {
      this.handleUnifiedStateChange(event);
    });
    this.eventCleanups.push(stateCleanup);

    // 监听文档点击事件
    const documentClickHandler = (event: MouseEvent) => {
      this.handleDocumentClick(event);
    };
    document.addEventListener('click', documentClickHandler, true);
    this.eventCleanups.push(() => {
      document.removeEventListener('click', documentClickHandler, true);
    });

    // 监听滚动事件
    const scrollHandler = () => {
      if (this.stateManager.isVisible()) {
        this.stateManager.hide();
      }
    };
    window.addEventListener('scroll', scrollHandler, true);
    this.eventCleanups.push(() => {
      window.removeEventListener('scroll', scrollHandler, true);
    });

    // 监听窗口大小变化
    const resizeHandler = () => {
      if (this.stateManager.isVisible()) {
        this.stateManager.hide();
      }
    };
    window.addEventListener('resize', resizeHandler);
    this.eventCleanups.push(() => {
      window.removeEventListener('resize', resizeHandler);
    });
  }

  /**
   * 处理统一状态变化
   */
  private handleUnifiedStateChange(event: UnifiedStateChangeEvent): void {
    const { type, state, previousState } = event;

    switch (type) {
      case 'expand':
        this.onExpand?.(state.word);
        this.addShiftKeyListener();
        break;

      case 'collapse':
        this.onCollapse?.(state.word);
        this.removeShiftKeyListener();
        break;

      case 'transition_to_detailed':
        this.onTransitionToDetailed?.(state.word);
        // 在详细模式下也保持 Shift 键监听
        this.addShiftKeyListener();
        break;

      case 'switch_to_simple':
        // 从详细模式切换回简单模式
        if (this.onModeSwitch) {
          this.onModeSwitch(previousState.mode, state.mode);
        }
        break;

      case 'hide':
        this.onClose?.(previousState.word);
        this.removeShiftKeyListener();
        break;

      case 'detailed_data_loaded':
        // 详细数据加载完成，可以进行相关处理
        console.log('[ExtendedTooltipEventHandler] Detailed data loaded for:', state.word);
        break;
    }
  }

  /**
   * 处理文档点击事件
   */
  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // 检查是否点击在 tooltip 或 toolfull 内部
    if (this.isPopupElement(target)) {
      return;
    }

    // 点击外部时隐藏弹窗
    if (this.stateManager.isVisible()) {
      this.stateManager.hide(true);
    }
  }

  /**
   * 检查元素是否属于弹窗
   */
  private isPopupElement(element: HTMLElement): boolean {
    return element.closest('.lucid-tooltip, .lucid-tooltip-container, .lucid-toolfull, .lucid-unified-popup') !== null;
  }

  /**
   * 添加 Shift 键监听器（支持模式切换）
   */
  private addShiftKeyListener(): void {
    if (this.shiftKeyCleanup) {
      return; // 已经添加了监听器
    }

    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && this.stateManager.isVisible()) {
        // 不阻止事件传播，让 content.ts 中的高亮逻辑也能执行
        const currentMode = this.stateManager.getCurrentMode();
        const word = this.stateManager.getCurrentWord();

        // 根据当前模式决定行为
        if (currentMode === TooltipMode.SIMPLE || currentMode === TooltipMode.SIMPLE_EXPANDED) {
          // 从简单模式切换到详细模式
          this.onTransitionToDetailed?.(word);
        } else if (currentMode === TooltipMode.DETAILED) {
          // 在详细模式下的 Shift 键行为（可以自定义）
          this.onWordAction?.('detailed_action', word);
        }
      }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
      if (event.key === 'Shift' && this.stateManager.isVisible()) {
        // Shift 键释放时的处理
      }
    };

    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    this.shiftKeyCleanup = () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    };
  }

  /**
   * 移除 Shift 键监听器
   */
  private removeShiftKeyListener(): void {
    if (this.shiftKeyCleanup) {
      this.shiftKeyCleanup();
      this.shiftKeyCleanup = null;
    }
  }

  /**
   * 处理键盘事件
   */
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.stateManager.isVisible()) {
      return;
    }

    const currentMode = this.stateManager.getCurrentMode();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.stateManager.hide(true);
        break;

      case 'Enter':
        if (event.shiftKey) {
          event.preventDefault();
          // Shift+Enter 切换模式
          if (currentMode === TooltipMode.SIMPLE) {
            this.stateManager.expand();
          } else if (currentMode === TooltipMode.SIMPLE_EXPANDED) {
            this.stateManager.collapse();
          }
        }
        break;

      case 'Tab':
        // Tab 键在详细模式下可以用于导航
        if (currentMode === TooltipMode.DETAILED) {
          // 可以添加详细模式下的 Tab 导航逻辑
        }
        break;
    }
  }

  /**
   * 处理鼠标悬停事件
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
   * 清理所有事件监听器
   */
  cleanup(): void {
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];
    this.removeShiftKeyListener();
  }

  /**
   * 销毁事件处理器
   */
  destroy(): void {
    this.cleanup();
  }

  /**
   * 获取扩展事件统计信息
   */
  getExtendedStats(): {
    activeListeners: number;
    hasShiftKeyListener: boolean;
    currentMode: TooltipMode;
    isVisible: boolean;
  } {
    return {
      activeListeners: this.eventCleanups.length,
      hasShiftKeyListener: this.shiftKeyCleanup !== null,
      currentMode: this.stateManager.getCurrentMode(),
      isVisible: this.stateManager.isVisible(),
    };
  }
}