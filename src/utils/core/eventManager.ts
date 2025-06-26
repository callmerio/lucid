/**
 * 统一事件管理器
 * 整合简化版事件管理功能，避免重复实现
 */

import { simpleEventManager } from '../dom/simpleEventManager';
import type { CleanupFunction, EventCallback } from './types';
import type { LucidEventHandler } from '@constants/uiEvents';

// 重新导出简化事件管理器实例
export { simpleEventManager };

// 提供统一的事件管理接口
export class UnifiedEventManager {
  private static instance: UnifiedEventManager;
  
  private constructor() {}
  
  public static getInstance(): UnifiedEventManager {
    if (!UnifiedEventManager.instance) {
      UnifiedEventManager.instance = new UnifiedEventManager();
    }
    return UnifiedEventManager.instance;
  }

  /**
   * 添加DOM事件监听器
   */
  public addDOMListener(
    element: Element,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): CleanupFunction {
    return simpleEventManager.addEventListener(element, type, listener, options);
  }

  /**
   * 订阅全局事件
   */
  public subscribe<T = any>(
    eventType: string,
    handler: EventCallback<T>,
    source: string = 'UnifiedEventManager'
  ): CleanupFunction {
    // 适配器：将EventCallback转换为LucidEventHandler
    const adaptedHandler: LucidEventHandler<T> = (event) => {
      handler(event.payload);
    };
    
    return simpleEventManager.subscribeGlobalEvent(
      eventType,
      adaptedHandler,
      {},
      source
    );
  }

  /**
   * 分发全局事件
   */
  public dispatch<T = any>(
    eventType: string,
    payload: T,
    source: string = 'UnifiedEventManager'
  ): void {
    simpleEventManager.dispatchGlobalEvent(eventType, payload, source);
  }

  /**
   * 清理所有事件监听器
   */
  public cleanup(): void {
    simpleEventManager.cleanup();
    simpleEventManager.cleanupGlobalEvents();
  }
}

// 导出单例实例
export const eventManager = UnifiedEventManager.getInstance();