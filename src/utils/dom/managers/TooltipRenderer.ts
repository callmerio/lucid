/**
 * TooltipRenderer - Tooltip 渲染器
 * 负责 tooltip 的创建、渲染和样式处理
 */

import { Tooltip } from '@components/ui/Tooltip';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';

export interface TooltipRenderOptions {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  position: { x: number; y: number };
  onExpand?: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
}

export class TooltipRenderer {
  private currentTooltip: HTMLElement | null = null;
  private reactRoot: Root | null = null;

  /**
   * 创建 tooltip 元素
   */
  createTooltipElement(options: TooltipRenderOptions): HTMLElement {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'lucid-tooltip';
    tooltipElement.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      pointer-events: auto;
    `;

    // 设置数据属性
    tooltipElement.setAttribute('data-word', options.word);
    if (options.phonetic) {
      tooltipElement.setAttribute('data-phonetic', options.phonetic);
    }
    if (options.partOfSpeech) {
      tooltipElement.setAttribute('data-part-of-speech', options.partOfSpeech);
    }

    // 使用 React 组件渲染
    this.reactRoot = createRoot(tooltipElement);
    this.reactRoot.render(
      React.createElement(Tooltip, {
        ...options,
        className: 'lucid-tooltip-rendered',
      })
    );

    return tooltipElement;
  }

  /**
   * 渲染 tooltip
   */
  render(options: TooltipRenderOptions): HTMLElement {
    // 如果已有 tooltip，更新而不是重新创建
    if (this.currentTooltip) {
      this.update(options);
      this.updatePosition(options.position);
      return this.currentTooltip;
    }

    // 创建新的 tooltip
    this.currentTooltip = this.createTooltipElement(options);

    // 设置位置
    this.updatePosition(options.position);

    // 添加到容器
    const container = this.getOrCreateContainer();
    container.appendChild(this.currentTooltip);

    return this.currentTooltip;
  }

  /**
   * 更新 tooltip 内容
   */
  update(options: Partial<TooltipRenderOptions>): void {
    if (!this.currentTooltip || !this.reactRoot) {
      return;
    }

    // 获取当前的 tooltip 属性
    const currentProps = this.getCurrentProps();
    const updatedProps = { ...currentProps, ...options };

    // 更新 DOM 属性
    if (options.word !== undefined) {
      this.currentTooltip.setAttribute('data-word', options.word);
    }
    if (options.phonetic !== undefined) {
      this.currentTooltip.setAttribute('data-phonetic', options.phonetic);
    }
    if (options.partOfSpeech !== undefined) {
      this.currentTooltip.setAttribute('data-part-of-speech', options.partOfSpeech);
    }

    // 更新位置
    if (options.position) {
      this.updatePosition(options.position);
    }

    // 重新渲染 React 组件
    this.reactRoot.render(
      React.createElement(Tooltip, {
        ...updatedProps,
        className: 'lucid-tooltip-rendered',
      })
    );
  }

  /**
   * 获取当前 tooltip 的属性
   */
  private getCurrentProps(): TooltipRenderOptions {
    if (!this.currentTooltip) {
      throw new Error('No active tooltip to get props from');
    }

    // 直接从 currentTooltip 获取属性，因为我们在创建时设置了这些属性
    const word = this.currentTooltip.getAttribute('data-word') || '';
    const phonetic = this.currentTooltip.getAttribute('data-phonetic') || undefined;
    const partOfSpeech = this.currentTooltip.getAttribute('data-part-of-speech') || undefined;

    // 从样式中提取位置
    const left = parseInt(this.currentTooltip.style.left) || 0;
    const top = parseInt(this.currentTooltip.style.top) || 0;

    return {
      word,
      translation: '', // 默认值，会在更新时被覆盖
      phonetic,
      partOfSpeech,
      position: { x: left, y: top },
    };
  }

  /**
   * 计算按钮颜色
   */
  calculateButtonColors(baseColor: string): {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  } {
    // 解析颜色值
    const rgb = this.parseColor(baseColor);
    if (!rgb) {
      return {
        backgroundColor: '#f0f0f0',
        borderColor: '#d0d0d0',
        textColor: '#333333',
      };
    }

    const { r, g, b } = rgb;

    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 根据亮度调整颜色
    const isDark = brightness < 128;

    return {
      backgroundColor: isDark ?
        `rgba(${r + 30}, ${g + 30}, ${b + 30}, 0.9)` :
        `rgba(${r - 30}, ${g - 30}, ${b - 30}, 0.9)`,
      borderColor: isDark ?
        `rgba(${r + 50}, ${g + 50}, ${b + 50}, 1)` :
        `rgba(${r - 50}, ${g - 50}, ${b - 50}, 1)`,
      textColor: isDark ? '#ffffff' : '#000000',
    };
  }

  /**
   * 解析颜色字符串
   */
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // 处理 hex 颜色
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }

    // 处理 rgb 颜色
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }

    return null;
  }

  /**
   * 获取当前 tooltip 元素
   */
  getCurrentTooltip(): HTMLElement | null {
    return this.currentTooltip;
  }

  /**
   * 显示 tooltip
   */
  show(): void {
    if (this.currentTooltip) {
      this.currentTooltip.style.display = '';
    }
  }

  /**
   * 隐藏 tooltip
   */
  hide(): void {
    if (this.currentTooltip) {
      this.currentTooltip.style.display = 'none';
    }
  }

  /**
   * 切换 tooltip 可见性
   */
  toggle(): void {
    if (this.currentTooltip) {
      const isVisible = this.currentTooltip.style.display !== 'none';
      this.currentTooltip.style.display = isVisible ? 'none' : '';
    }
  }

  /**
   * 更新 tooltip 位置
   */
  updatePosition(position: { x: number; y: number }): void {
    if (this.currentTooltip && position && typeof position.x === 'number' && typeof position.y === 'number') {
      this.currentTooltip.style.left = `${position.x}px`;
      this.currentTooltip.style.top = `${position.y}px`;
      this.currentTooltip.style.position = 'fixed';
    }
  }

  /**
   * 获取或创建容器
   */
  getOrCreateContainer(): HTMLElement {
    let container = document.getElementById('lucid-tooltip-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'lucid-tooltip-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2147483647;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * 检查是否有活动的 tooltip
   */
  hasActiveTooltip(): boolean {
    return this.currentTooltip !== null;
  }

  /**
   * 清理 tooltip
   */
  cleanup(): void {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }

    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.cleanup();
  }
}