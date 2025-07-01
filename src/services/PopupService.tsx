/**
 * @file PopupService.ts
 * @description 统一的弹窗服务，负责管理所有弹窗的显示、隐藏和状态。
 */

import { IPopupService, PopupOptions } from "@/types/services";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { Popup } from "@components/ui/common/Popup";
import { shadowDOMService, ShadowDOMContainer } from "./ShadowDOMService";
import { styleInjectionService } from "./StyleInjectionService";

interface PopupInstance {
  id: string;
  content: React.ReactNode;
  options: PopupOptions;
  shadowContainer: ShadowDOMContainer;
  root: Root;
}

class PopupService implements IPopupService {
  private static instance: PopupService;
  private popups: Map<string, PopupInstance> = new Map();
  private zIndexCounter = 10000;

  private constructor() {
    // 私有构造函数，确保单例
  }

  public static getInstance(): PopupService {
    if (!PopupService.instance) {
      PopupService.instance = new PopupService();
    }
    return PopupService.instance;
  }

  public async show(
    id: string,
    content: React.ReactNode,
    options: PopupOptions = {}
  ): Promise<void> {
    if (this.popups.has(id)) {
      console.warn(
        `[PopupService] Popup with id "${id}" is already shown. Use update() instead.`
      );
      await this.update(id, content, options);
      return;
    }

    try {
      // 创建 Shadow DOM 容器
      const shadowContainer = shadowDOMService.createShadowContainer({
        id: `popup-${id}`,
      });

      // === 新增：将定位逻辑移到此处 ===
      // 在注入内容前，设置宿主元素的基础样式
      const host = shadowContainer.hostElement;
      host.style.position = "absolute";
      host.style.zIndex = `${this.zIndexCounter++}`;
      host.style.visibility = "hidden"; // 先隐藏，计算完位置再显示

      // 将宿主元素添加到 DOM
      document.body.appendChild(host);

      // 注入组件样式
      const componentType = id.includes('toolfull') ? 'toolfull' : 'tooltip';
      await this.injectStyles(shadowContainer.shadowRoot, componentType);

      // 创建 React root
      const root = createRoot(shadowContainer.contentContainer);

      const popupInstance: PopupInstance = {
        id,
        content,
        options,
        shadowContainer,
        root,
      };

      this.popups.set(id, popupInstance);

      // 渲染 Popup 组件
      root.render(
        <Popup
          id={id}
          content={content}
          options={options}
          onClose={() => this.hide(id)}
        />
      );

      // === 新增：计算并应用位置 ===
      // 使用 requestAnimationFrame 确保内容已渲染，以便获取尺寸
      requestAnimationFrame(() => {
        const { x, y } = this.calculatePosition(host, options);
        host.style.left = `${x}px`;
        host.style.top = `${y}px`;
        host.style.visibility = "visible"; // 计算完毕，设为可见

        // 添加进入动画
        host.style.transition = "opacity 0.2s ease-in-out, transform 0.2s ease-in-out";
        host.style.opacity = '0';
        host.style.transform = 'scale(0.95)';
        requestAnimationFrame(() => {
          host.style.opacity = '1';
          host.style.transform = 'scale(1)';
        });
      });

      console.log(`[PopupService] Shown popup in Shadow DOM: "${id}"`);
    } catch (error) {
      console.error(`[PopupService] Failed to show popup "${id}":`, error);
      throw error;
    }
  }

  // === 新增：独立的定位计算方法 ===
  private calculatePosition(
    popupEl: HTMLElement,
    options: PopupOptions
  ): { x: number; y: number } {
    const { targetElement } = options;
    let newPos = { x: 0, y: 0 };

    if (targetElement) {
      const targetRect = targetElement.getBoundingClientRect();
      const popupRect = popupEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8; // 边距

      let top = targetRect.bottom + margin;
      let left = targetRect.left;

      // 垂直边界检查：如果下方空间不足，显示在上方
      if (top + popupRect.height > viewportHeight - margin) {
        top = targetRect.top - popupRect.height - margin;
        // 确保不会超出上边界
        if (top < margin) {
          top = margin;
        }
      }
      
      // 水平边界检查
      if (left + popupRect.width > viewportWidth - margin) {
        left = viewportWidth - popupRect.width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      newPos = { x: left + window.scrollX, y: top + window.scrollY };
      
      // 调试日志：记录位置计算
      console.log(`[PopupService] Calculated position for popup:`, {
        targetRect: { x: targetRect.left, y: targetRect.top, width: targetRect.width, height: targetRect.height },
        popupRect: { width: popupRect.width, height: popupRect.height },
        newPos,
        viewport: { width: viewportWidth, height: viewportHeight },
        scroll: { x: window.scrollX, y: window.scrollY }
      });
    } else {
      // 居中显示
      newPos = {
        x: (window.innerWidth - popupEl.offsetWidth) / 2 + window.scrollX,
        y: (window.innerHeight - popupEl.offsetHeight) / 2 + window.scrollY,
      };
      console.log(`[PopupService] Using centered position:`, newPos);
    }

    return newPos;
  }

  public hide(id: string): void {
    const popupInstance = this.popups.get(id);
    if (!popupInstance) {
      return;
    }

    const host = popupInstance.shadowContainer.hostElement;

    // 添加退出动画
    host.style.opacity = '0';
    host.style.transform = 'scale(0.95)';

    // 等待动画结束后再清理
    setTimeout(() => {
      popupInstance.root.unmount();
      shadowDOMService.destroyContainer(`popup-${id}`);
      this.popups.delete(id);
      console.log(`[PopupService] Hidden popup: "${id}"`);
    }, 200); // 匹配动画时间
  }

  public async update(
    id: string,
    content?: React.ReactNode,
    options?: PopupOptions
  ): Promise<void> {
    const popupInstance = this.popups.get(id);
    if (!popupInstance) {
      return;
    }

    const newContent = content !== undefined ? content : popupInstance.content;
    const newOptions =
      options !== undefined
        ? { ...popupInstance.options, ...options }
        : popupInstance.options;

    popupInstance.content = newContent;
    popupInstance.options = newOptions;

    popupInstance.root.render(
      <Popup
        id={id}
        content={newContent}
        options={newOptions}
        onClose={() => this.hide(id)}
      />
    );
    
    // 重新计算位置
    requestAnimationFrame(() => {
        const host = popupInstance.shadowContainer.hostElement;
        const { x, y } = this.calculatePosition(host, newOptions);
        host.style.left = `${x}px`;
        host.style.top = `${y}px`;
    });

    console.log(`[PopupService] Updated popup: "${id}"`);
  }

  /**
   * 向 Shadow DOM 注入样式
   */
  private async injectStyles(shadowRoot: ShadowRoot, componentType: 'tooltip' | 'toolfull'): Promise<void> {
    try {
      // 根据组件类型注入对应的样式
      await styleInjectionService.injectStyles(shadowRoot, {
        componentType: componentType as any
      });
    } catch (error) {
      console.warn('[PopupService] Failed to inject styles:', error);
      // 样式注入失败不应该阻止组件渲染
    }
  }
}

export const popupService = PopupService.getInstance();
