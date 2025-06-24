/**
 * TooltipManager - Tooltip 管理器 (重构版)
 * 作为协调器，整合各个专职管理器的功能
 */

import { TooltipEventHandler } from './TooltipEventHandler';
import { PositionOptions, TooltipPositioner } from './TooltipPositioner';
import { TooltipRenderer, TooltipRenderOptions } from './TooltipRenderer';
import { TooltipStateManager } from './TooltipStateManager';

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
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export class TooltipManager {
  private static instance: TooltipManager;

  private renderer: TooltipRenderer;
  private positioner: TooltipPositioner;
  private stateManager: TooltipStateManager;
  private eventHandler: TooltipEventHandler;

  private constructor(options: TooltipManagerOptions = {}) {
    // 初始化各个管理器
    this.renderer = new TooltipRenderer();
    this.positioner = new TooltipPositioner();
    this.stateManager = new TooltipStateManager();
    this.eventHandler = new TooltipEventHandler({
      stateManager: this.stateManager,
      ...options,
    });

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
      preferredPosition = 'auto',
    } = options;

    try {
      // 更新状态
      this.stateManager.show(word, targetElement);

      // 创建渲染选项
      const renderOptions: TooltipRenderOptions = {
        word,
        translation,
        phonetic,
        partOfSpeech,
        position: { x: 0, y: 0 }, // 临时位置，稍后计算
        onExpand: () => this.stateManager.expand(),
        onCollapse: () => this.stateManager.collapse(),
        onClose: () => this.stateManager.hide(true),
      };

      // 渲染 tooltip
      const tooltipElement = this.renderer.render(renderOptions);

      // 计算并设置位置
      const positionOptions: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition,
      };
      const position = this.positioner.calculatePosition(positionOptions);
      this.positioner.updatePosition(tooltipElement, position);

      // 设置事件处理
      this.eventHandler.setupButtonEvents(tooltipElement);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TooltipManager] Error showing tooltip:', error);
      this.stateManager.hide(true);
      throw error; // 重新抛出错误以便测试能够捕获
    }
  }

  /**
   * 隐藏 tooltip
   */
  hideTooltip(immediate: boolean = false): void {
    this.stateManager.hide(immediate);
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
    if (this.stateManager.isExpanded()) {
      this.stateManager.collapse();
    } else {
      this.stateManager.expand();
    }
  }

  /**
   * 刷新 tooltip 位置
   */
  refreshTooltip(): void {
    const tooltipElement = this.renderer.getCurrentTooltip();
    const targetElement = this.stateManager.getCurrentTargetElement();

    if (!tooltipElement || !targetElement) {
      return;
    }

    const position = this.positioner.calculatePosition({
      targetElement,
      tooltipElement,
    });
    this.positioner.updatePosition(tooltipElement, position);
  }

  /**
   * 处理状态变化
   */
  private handleStateChange(event: { type: string; state: any }): void {
    const { type } = event;

    switch (type) {
      case 'hide':
        this.renderer.cleanup();
        break;

      case 'expand':
        // 可以在这里更新 tooltip 的展开状态
        break;

      case 'collapse':
        // 可以在这里更新 tooltip 的收起状态
        break;
    }
  }

  /**
   * 获取当前状态
   */
  getCurrentState() {
    return {
      tooltip: this.stateManager.getState(),
      renderer: {
        hasTooltip: this.renderer.getCurrentTooltip() !== null,
      },
      eventHandler: this.eventHandler.getStats(),
    };
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.stateManager.isVisible();
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
   * 处理鼠标事件
   */
  handleMouseEnter(element: HTMLElement): void {
    this.eventHandler.handleMouseEnter(element);
  }

  handleMouseLeave(element: HTMLElement): void {
    this.eventHandler.handleMouseLeave(element);
  }

  /**
   * 处理键盘事件
   */
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.eventHandler.handleKeyboardEvent(event);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.renderer.destroy();
    this.stateManager.destroy();
    this.eventHandler.destroy();

    // 重置单例
    TooltipManager.instance = null as any;
  }

  /**
   * 获取管理器统计信息
   */
  getStats() {
    return {
      state: this.stateManager.getStats(),
      events: this.eventHandler.getStats(),
      renderer: {
        hasActiveTooltip: this.renderer.getCurrentTooltip() !== null,
      },
    };
  }
}