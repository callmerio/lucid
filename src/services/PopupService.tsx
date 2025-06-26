/**
 * @file PopupService.ts
 * @description 统一的弹窗服务，负责管理所有弹窗的显示、隐藏和状态。
 */

import { IPopupService, PopupOptions } from "@/types/services";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { Popup } from "@components/ui/common/Popup"; // 假设Popup组件已创建

interface PopupInstance {
  id: string;
  content: React.ReactNode;
  options: PopupOptions;
  container: HTMLElement;
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

  public show(
    id: string,
    content: React.ReactNode,
    options: PopupOptions = {}
  ): void {
    if (this.popups.has(id)) {
      console.warn(
        `[PopupService] Popup with id "${id}" is already shown. Use update() instead.`
      );
      this.update(id, content, options);
      return;
    }

    const container = document.createElement("div");
    container.id = `lucid-toolfull-container-${id}`;
    document.body.appendChild(container);

    const root = createRoot(container);

    const popupInstance: PopupInstance = {
      id,
      content,
      options,
      container,
      root,
    };

    this.popups.set(id, popupInstance);

    // 渲染Popup组件
    root.render(
      <Popup
        id={id}
        content={content}
        options={options}
        zIndex={this.zIndexCounter++}
        onClose={() => this.hide(id)}
      />
    );

    console.log(`[PopupService] Shown popup: "${id}"`);
  }

  public hide(id: string): void {
    const popupInstance = this.popups.get(id);
    if (!popupInstance) {
      console.warn(`[PopupService] Popup with id "${id}" not found.`);
      return;
    }

    popupInstance.root.unmount();
    popupInstance.container.remove();
    this.popups.delete(id);

    console.log(`[PopupService] Hidden popup: "${id}"`);
  }

  public update(
    id: string,
    content?: React.ReactNode,
    options?: PopupOptions
  ): void {
    const popupInstance = this.popups.get(id);
    if (!popupInstance) {
      console.warn(
        `[PopupService] Cannot update popup with id "${id}": not found.`
      );
      return;
    }

    const newContent = content !== undefined ? content : popupInstance.content;
    const newOptions =
      options !== undefined
        ? { ...popupInstance.options, ...options }
        : popupInstance.options;

    popupInstance.content = newContent;
    popupInstance.options = newOptions;

    // 重新渲染Popup组件
    popupInstance.root.render(
      <Popup
        id={id}
        content={newContent}
        options={newOptions}
        zIndex={popupInstance.root.render.length} // zIndex保持不变
        onClose={() => this.hide(id)}
      />
    );

    console.log(`[PopupService] Updated popup: "${id}"`);
  }
}

export const popupService = PopupService.getInstance();
