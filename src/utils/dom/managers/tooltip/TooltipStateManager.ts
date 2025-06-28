/**
 * TooltipStateManager - Tooltip 状态管理器
 * 负责管理 tooltip 的显示/隐藏状态和生命周期
 * 支持统一的 Tooltip 和 Toolfull 管理
 */

import {
  TooltipState,
  StateChangeEvent
} from '../types';

// 向后兼容的类型定义
export type StateChangeHandler = (event: StateChangeEvent) => void;

export class TooltipStateManager {
  private state: TooltipState = {
    visible: false,
    expanded: false,
    word: '',
    targetElement: null,
    hideTimeout: null,
  };

  private listeners: StateChangeHandler[] = [];
  private readonly hideDelay = 300; // 默认隐藏延迟

  /**
   * 获取当前状态
   */
  getState(): Readonly<TooltipState> {
    return { ...this.state };
  }

  /**
   * 显示 tooltip
   */
  show(word: string, targetElement: HTMLElement): void {
    const previousState = { ...this.state };

    // 取消隐藏定时器
    this.cancelHide();

    // 更新状态
    this.state = {
      ...this.state,
      visible: true,
      word,
      targetElement,
    };

    this.notifyStateChange('show', previousState);
  }

  /**
   * 隐藏 tooltip
   */
  hide(immediate: boolean = false): void {
    if (!this.state.visible) {
      return;
    }

    if (immediate) {
      this.performHide();
    } else {
      this.scheduleHide();
    }
  }

  /**
   * 立即隐藏 tooltip
   */
  private performHide(): void {
    const previousState = { ...this.state };

    this.state = {
      ...this.state,
      visible: false,
      expanded: false,
      word: '',
      targetElement: null,
      hideTimeout: null,
    };

    this.notifyStateChange('hide', previousState);
  }

  /**
   * 安排延迟隐藏
   */
  private scheduleHide(): void {
    this.cancelHide();

    this.state.hideTimeout = window.setTimeout(() => {
      this.performHide();
    }, this.hideDelay);
  }

  /**
   * 取消隐藏
   */
  cancelHide(): void {
    if (this.state.hideTimeout) {
      clearTimeout(this.state.hideTimeout);
      this.state.hideTimeout = null;
    }
  }

  /**
   * 展开 tooltip
   */
  expand(): void {
    if (!this.state.visible || this.state.expanded) {
      return;
    }

    const previousState = { ...this.state };
    this.state.expanded = true;

    this.notifyStateChange('expand', previousState);
  }

  /**
   * 收起 tooltip
   */
  collapse(): void {
    if (!this.state.visible || !this.state.expanded) {
      return;
    }

    const previousState = { ...this.state };
    this.state.expanded = false;

    this.notifyStateChange('collapse', previousState);
  }

  /**
   * 切换展开状态
   */
  toggleExpanded(): void {
    if (this.state.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.state.visible;
  }

  /**
   * 检查是否展开
   */
  isExpanded(): boolean {
    return this.state.expanded;
  }

  /**
   * 获取当前单词
   */
  getCurrentWord(): string {
    return this.state.word;
  }

  /**
   * 获取当前目标元素
   */
  getCurrentTargetElement(): HTMLElement | null {
    return this.state.targetElement;
  }

  /**
   * 添加状态变化监听器
   */
  addStateChangeListener(handler: StateChangeHandler): () => void {
    this.listeners.push(handler);

    // 返回清理函数
    return () => {
      const index = this.listeners.indexOf(handler);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 移除状态变化监听器
   */
  removeStateChangeListener(handler: StateChangeHandler): void {
    const index = this.listeners.indexOf(handler);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(
    type: StateChangeEvent['type'],
    previousState: TooltipState
  ): void {
    const event: StateChangeEvent = {
      type,
      state: { ...this.state },
      previousState,
    };

    this.listeners.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[TooltipStateManager] Error in state change handler:', error);
      }
    });
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.cancelHide();

    const previousState = { ...this.state };
    this.state = {
      visible: false,
      expanded: false,
      word: '',
      targetElement: null,
      hideTimeout: null,
    };

    if (previousState.visible) {
      this.notifyStateChange('hide', previousState);
    }
  }

  /**
   * 销毁状态管理器
   */
  destroy(): void {
    this.cancelHide();
    this.listeners.length = 0;
    this.reset();
  }

  /**
   * 获取状态统计信息
   */
  getStats(): {
    listenersCount: number;
    hasActiveTimeout: boolean;
    currentWord: string;
    isVisible: boolean;
    isExpanded: boolean;
  } {
    return {
      listenersCount: this.listeners.length,
      hasActiveTimeout: this.state.hideTimeout !== null,
      currentWord: this.state.word,
      isVisible: this.state.visible,
      isExpanded: this.state.expanded,
    };
  }
}