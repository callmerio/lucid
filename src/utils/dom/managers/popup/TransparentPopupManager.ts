/**
 * TransparentPopupManager - 透明弹窗管理器
 * 负责透明弹窗的生命周期管理，包括创建、显示、隐藏、定位等功能
 * 复用现有的定位算法和事件管理模式
 */

/// <reference lib="dom" />

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Toolfull } from '@components/ui/Toolfull';
import { SimpleEventManager } from '../../simpleEventManager';
import { UI_EVENTS } from '@constants/uiEvents';

export interface TransparentPopupOptions {
  position?: { x: number; y: number };
  referenceElement?: HTMLElement;
  word?: string;
  wordData?: any; // 临时使用 any，稍后可以改为具体类型
}

export class TransparentPopupManager {
  private static instance: TransparentPopupManager;

  // 弹窗相关
  private currentPopup: HTMLElement | null = null;
  private reactRoot: Root | null = null;
  private isVisible = false;
  private currentOptions: TransparentPopupOptions | null = null;

  // 事件管理
  private eventManager: SimpleEventManager;
  private eventCleanups: (() => void)[] = [];

  // 配置
  private readonly POPUP_WIDTH = 380;
  private readonly POPUP_MIN_HEIGHT = 450;
  private readonly MARGIN = 20;
  private readonly POPUP_ID = 'lucid-transparent-popup';

  private constructor() {
    this.eventManager = SimpleEventManager.getInstance();
    console.log('[TransparentPopupManager] 初始化完成');
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TransparentPopupManager {
    if (!TransparentPopupManager.instance) {
      TransparentPopupManager.instance = new TransparentPopupManager();
    }
    return TransparentPopupManager.instance;
  }

  /**
   * 切换弹窗显示状态
   */
  public toggle(options?: TransparentPopupOptions): void {
    console.log('[TransparentPopupManager] 切换弹窗状态，当前可见:', this.isVisible);
    console.log('[TransparentPopupManager] 当前弹窗元素:', this.currentPopup);
    console.log('[TransparentPopupManager] 页面URL:', window.location.href);

    if (this.isVisible) {
      this.hide();
    } else {
      this.show(options);
    }
  }

  /**
   * 显示透明弹窗
   */
  public show(options?: TransparentPopupOptions): void {
    try {
      console.log('[TransparentPopupManager] 显示弹窗');

      // 存储当前选项
      this.currentOptions = options || {};

      // 如果已经显示，先隐藏
      if (this.isVisible) {
        this.hide();
      }

      // 创建弹窗元素
      this.createPopupElement();

      // 设置位置
      this.updatePosition(options?.position);

      // 渲染React内容
      this.renderContent();

      // 设置事件监听器
      this.setupEventListeners();

      // 显示弹窗
      this.showPopup();

      // 更新状态
      this.isVisible = true;

      // 发送显示事件
      this.eventManager.dispatchGlobalEvent(UI_EVENTS.TRANSPARENT_POPUP.SHOWN, {
        position: this.calculatePosition(options?.position),
        element: this.currentPopup!
      }, 'TransparentPopupManager');

      console.log('[TransparentPopupManager] 弹窗显示完成');
    } catch (error) {
      console.error('[TransparentPopupManager] 显示弹窗失败:', error);
    }
  }

  /**
   * 隐藏透明弹窗
   */
  public hide(reason?: string): void {
    try {
      console.log('[TransparentPopupManager] 隐藏弹窗，原因:', reason || '用户操作');

      if (!this.isVisible || !this.currentPopup) {
        return;
      }

      // 隐藏弹窗
      this.hidePopup();

      // 清理事件监听器
      this.cleanupEventListeners();

      // 清理React根节点
      this.cleanupReactRoot();

      // 移除DOM元素
      this.removePopupElement();

      // 更新状态
      this.isVisible = false;

      // 发送隐藏事件
      this.eventManager.dispatchGlobalEvent(UI_EVENTS.TRANSPARENT_POPUP.HIDDEN, {
        reason: reason || '用户操作'
      }, 'TransparentPopupManager');

      console.log('[TransparentPopupManager] 弹窗隐藏完成');
    } catch (error) {
      console.error('[TransparentPopupManager] 隐藏弹窗失败:', error);
    }
  }

  /**
   * 检查弹窗是否可见
   */
  public isPopupVisible(): boolean {
    return this.isVisible;
  }

  /**
   * 创建弹窗DOM元素
   */
  private createPopupElement(): void {
    // 移除已存在的弹窗
    const existingPopup = document.getElementById(this.POPUP_ID);
    if (existingPopup) {
      existingPopup.remove();
    }

    // 创建新的弹窗元素
    this.currentPopup = document.createElement('div');
    this.currentPopup.id = this.POPUP_ID;
    this.currentPopup.className = 'lucid-transparent-popup';

    // 添加到页面
    document.body.appendChild(this.currentPopup);

    console.log('[TransparentPopupManager] 弹窗元素创建完成');
  }

  /**
   * 渲染React内容
   */
  private renderContent(): void {
    if (!this.currentPopup) {
      throw new Error('弹窗元素不存在');
    }

    // 创建React根节点
    this.reactRoot = createRoot(this.currentPopup);

    // 渲染Toolfull组件
    const defaultWordData = {
      word: this.currentOptions?.word || 'example',
      phonetic: { us: '/ɪɡˈzæmpəl/', uk: '/ɪɡˈzɑːmpəl/' },
      explain: [{
        pos: 'noun',
        definitions: [{ chinese: '示例，例子', chinese_short: '示例' }]
      }]
    };

    this.reactRoot.render(
      React.createElement(Toolfull, {
        word: this.currentOptions?.word || 'example',
        wordData: this.currentOptions?.wordData || defaultWordData,
        className: 'lucid-transparent-full-content',
        onClose: () => this.hide('用户关闭')
      })
    );

    console.log('[TransparentPopupManager] React内容渲染完成');
  }

  /**
   * 计算弹窗位置 - 智能定位算法
   */
  private calculatePosition(customPosition?: { x: number; y: number }): { x: number; y: number } {
    if (customPosition) {
      return this.validateAndAdjustPosition(customPosition);
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // 响应式设计：根据屏幕尺寸调整策略
    const isSmallScreen = viewportWidth < 768; // 移动设备
    const isMediumScreen = viewportWidth >= 768 && viewportWidth < 1024; // 平板

    let x: number;
    let y: number;

    if (isSmallScreen) {
      // 小屏幕：居中显示，适当缩小边距
      const smallMargin = Math.min(this.MARGIN, 10);
      x = (viewportWidth - this.POPUP_WIDTH) / 2;
      y = smallMargin + scrollY;

      // 确保在小屏幕上完全可见
      x = Math.max(smallMargin, Math.min(x, viewportWidth - this.POPUP_WIDTH - smallMargin));
    } else if (isMediumScreen) {
      // 中等屏幕：右上角，但留更多空间
      const mediumMargin = this.MARGIN * 1.5;
      x = viewportWidth - this.POPUP_WIDTH - mediumMargin;
      y = mediumMargin + scrollY;
    } else {
      // 大屏幕：默认右上角位置
      x = viewportWidth - this.POPUP_WIDTH - this.MARGIN;
      y = this.MARGIN + scrollY;
    }

    // 最终边界检查和调整
    return this.validateAndAdjustPosition({ x, y });
  }

  /**
   * 验证并调整位置以确保在视口内
   */
  private validateAndAdjustPosition(position: { x: number; y: number }): { x: number; y: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let { x, y } = position;

    // 水平边界检查
    const minX = this.MARGIN + scrollX;
    const maxX = viewportWidth + scrollX - this.POPUP_WIDTH - this.MARGIN;
    x = Math.max(minX, Math.min(x, maxX));

    // 垂直边界检查
    const minY = this.MARGIN + scrollY;
    const maxY = viewportHeight + scrollY - this.POPUP_MIN_HEIGHT - this.MARGIN;
    y = Math.max(minY, Math.min(y, maxY));

    // 特殊情况：如果弹窗比视口还大，确保至少顶部可见
    if (this.POPUP_WIDTH > viewportWidth - 2 * this.MARGIN) {
      x = scrollX + this.MARGIN;
    }

    if (this.POPUP_MIN_HEIGHT > viewportHeight - 2 * this.MARGIN) {
      y = scrollY + this.MARGIN;
    }

    return { x, y };
  }

  /**
   * 更新弹窗位置
   */
  private updatePosition(customPosition?: { x: number; y: number }): void {
    if (!this.currentPopup) {
      return;
    }

    const position = this.calculatePosition(customPosition);

    // 使用fixed定位，相对于视口
    this.currentPopup.style.position = 'fixed';
    this.currentPopup.style.left = `${position.x - (window.scrollX || window.pageXOffset)}px`;
    this.currentPopup.style.top = `${position.y - (window.scrollY || window.pageYOffset)}px`;

    console.log('[TransparentPopupManager] 弹窗位置更新:', {
      calculated: position,
      final: {
        left: position.x - (window.scrollX || window.pageXOffset),
        top: position.y - (window.scrollY || window.pageYOffset)
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      scroll: {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset
      }
    });
  }

  /**
   * 显示弹窗（添加visible类）
   */
  private showPopup(): void {
    if (!this.currentPopup) {
      return;
    }

    // 使用requestAnimationFrame确保DOM更新后再添加visible类
    requestAnimationFrame(() => {
      if (this.currentPopup) {
        this.currentPopup.classList.add('visible');
      }
    });
  }

  /**
   * 隐藏弹窗（移除visible类）
   */
  private hidePopup(): void {
    if (!this.currentPopup) {
      return;
    }

    this.currentPopup.classList.remove('visible');
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 点击外部关闭
    const handleClickOutside = (event: MouseEvent) => {
      if (this.currentPopup && !this.currentPopup.contains(event.target as Node)) {
        this.hide('点击外部');
      }
    };

    // ESC键关闭
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide('ESC键');
      }
    };

    // 窗口大小变化时重新定位
    const handleResize = () => {
      if (this.isVisible) {
        this.updatePosition();
      }
    };

    // 页面滚动时重新定位（使用节流避免性能问题）
    let scrollTimeout: number | null = null;
    const handleScroll = () => {
      if (!this.isVisible) return;

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = window.setTimeout(() => {
        if (this.isVisible) {
          this.updatePosition();
        }
        scrollTimeout = null;
      }, 16); // 约60fps的更新频率
    };

    // 添加事件监听器
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleEscKey);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 保存清理函数
    this.eventCleanups.push(
      () => document.removeEventListener('click', handleClickOutside, true),
      () => document.removeEventListener('keydown', handleEscKey),
      () => window.removeEventListener('resize', handleResize),
      () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
      }
    );

    console.log('[TransparentPopupManager] 事件监听器设置完成');
  }

  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];
    console.log('[TransparentPopupManager] 事件监听器清理完成');
  }

  /**
   * 清理React根节点
   */
  private cleanupReactRoot(): void {
    if (this.reactRoot) {
      // 使用setTimeout确保在下一个事件循环中清理，避免React警告
      setTimeout(() => {
        if (this.reactRoot) {
          this.reactRoot.unmount();
          this.reactRoot = null;
        }
      }, 0);
    }
  }

  /**
   * 移除弹窗DOM元素
   */
  private removePopupElement(): void {
    if (this.currentPopup) {
      // 等待动画完成后再移除元素
      setTimeout(() => {
        if (this.currentPopup && this.currentPopup.parentNode) {
          this.currentPopup.parentNode.removeChild(this.currentPopup);
          this.currentPopup = null;
        }
      }, 300); // 与CSS动画时间匹配
    }
  }

  /**
   * 销毁管理器（用于清理）
   */
  public destroy(): void {
    console.log('[TransparentPopupManager] 开始销毁');

    if (this.isVisible) {
      this.hide('管理器销毁');
    }

    this.cleanupEventListeners();
    this.cleanupReactRoot();

    if (this.currentPopup) {
      this.removePopupElement();
    }

    console.log('[TransparentPopupManager] 销毁完成');
  }
}
