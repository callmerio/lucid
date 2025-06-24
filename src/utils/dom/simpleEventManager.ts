/**
 * SimpleEventManager - 轻量级事件管理器
 * 专为浏览器插件设计，简单高效的事件监听器管理
 * 支持全局事件总线，解决组件间循环依赖问题
 */

import {
  ComponentInfo,
  EventOptions,
  EventPriority,
  EventStats,
  LucidEventHandler,
  LucidUIEvent
} from '@constants/uiEvents';

interface EventCleanup {
  element: Element;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

/**
 * 全局事件监听器信息
 */
interface GlobalEventListener<T = any> {
  id: string;
  eventType: string;
  handler: LucidEventHandler<T>;
  options: EventOptions;
  source: string;
  registeredAt: number;
}

/**
 * 事件处理统计
 */
interface EventProcessingStats {
  count: number;
  totalTime: number;
  lastProcessed: number;
}

/**
 * 轻量级事件管理器
 * 使用简单的Set管理事件监听器，在组件销毁时批量清理
 * 支持全局事件总线功能
 */
export class SimpleEventManager {
  private static instance: SimpleEventManager;
  private activeListeners = new Set<EventCleanup>();

  // 全局事件总线相关属性
  private globalEventListeners = new Map<string, Set<GlobalEventListener>>();
  private eventStats = new Map<string, EventProcessingStats>();
  private registeredComponents = new Map<string, ComponentInfo>();
  private eventQueue: Array<{ event: LucidUIEvent; listeners: GlobalEventListener[] }> = [];
  private isProcessingQueue = false;
  private nextListenerId = 1;

  private constructor() { }

  public static getInstance(): SimpleEventManager {
    if (!SimpleEventManager.instance) {
      SimpleEventManager.instance = new SimpleEventManager();
    }
    return SimpleEventManager.instance;
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(
    element: Element,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    // 添加实际的事件监听器
    element.addEventListener(type, listener, options);

    // 创建清理函数
    const cleanup: EventCleanup = {
      element,
      type,
      listener,
      options
    };

    // 存储到活跃监听器集合
    this.activeListeners.add(cleanup);

    // 返回清理函数
    return () => {
      element.removeEventListener(type, listener, options);
      this.activeListeners.delete(cleanup);
    };
  }

  /**
   * 移除特定元素的所有监听器
   */
  public removeElementListeners(element: Element): void {
    const toRemove: EventCleanup[] = [];

    this.activeListeners.forEach(cleanup => {
      if (cleanup.element === element) {
        cleanup.element.removeEventListener(
          cleanup.type,
          cleanup.listener,
          cleanup.options
        );
        toRemove.push(cleanup);
      }
    });

    toRemove.forEach(cleanup => this.activeListeners.delete(cleanup));
  }

  /**
   * 清理所有监听器
   */
  public cleanup(): void {
    this.activeListeners.forEach(cleanup => {
      try {
        cleanup.element.removeEventListener(
          cleanup.type,
          cleanup.listener,
          cleanup.options
        );
      } catch (error) {
        // 忽略清理时的错误，元素可能已被移除
        console.warn('[SimpleEventManager] Error during cleanup:', error);
      }
    });

    this.activeListeners.clear();
  }

  /**
   * 获取当前活跃监听器数量
   */
  public getActiveListenerCount(): number {
    return this.activeListeners.size;
  }

  /**
   * 防抖工具函数
   */
  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;

    return (...args: Parameters<T>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }

      timeout = window.setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    };
  }

  /**
   * 节流工具函数
   */
  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastTime = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        func(...args);
      }
    };
  }

  /**
   * 安全执行函数，包含错误处理
   */
  public static safeExecute<T>(
    func: () => T,
    errorMessage: string = 'Error in safe execution'
  ): T | null {
    try {
      return func();
    } catch (error) {
      console.error(`[SimpleEventManager] ${errorMessage}:`, error);
      return null;
    }
  }

  // ==================== 全局事件总线功能 ====================

  /**
   * 生成唯一的监听器ID
   */
  private generateListenerId(): string {
    return `listener_${this.nextListenerId++}_${Date.now()}`;
  }

  /**
   * 创建 Lucid UI 事件对象
   */
  private createLucidEvent<T>(eventType: string, payload: T, source: string): LucidUIEvent<T> {
    return {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * 订阅全局事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   * @param options 事件选项
   * @param source 事件源标识
   * @returns 取消订阅的函数
   */
  public subscribeGlobalEvent<T = any>(
    eventType: string,
    handler: LucidEventHandler<T>,
    options: EventOptions = {},
    source: string = 'unknown'
  ): () => void {
    const listenerId = this.generateListenerId();

    const listener: GlobalEventListener<T> = {
      id: listenerId,
      eventType,
      handler,
      options: {
        priority: EventPriority.NORMAL,
        once: false,
        ...options
      },
      source,
      registeredAt: Date.now()
    };

    // 获取或创建事件类型的监听器集合
    if (!this.globalEventListeners.has(eventType)) {
      this.globalEventListeners.set(eventType, new Set());
    }

    this.globalEventListeners.get(eventType)!.add(listener);

    console.log(`[SimpleEventManager] 🎧 订阅全局事件: ${eventType} (来源: ${source})`);

    // 返回取消订阅函数
    return () => {
      const listeners = this.globalEventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.globalEventListeners.delete(eventType);
        }
      }
      console.log(`[SimpleEventManager] 🔇 取消订阅全局事件: ${eventType} (来源: ${source})`);
    };
  }

  /**
   * 分发全局事件
   * @param eventType 事件类型
   * @param payload 事件载荷
   * @param source 事件源标识
   */
  public dispatchGlobalEvent<T = any>(
    eventType: string,
    payload: T,
    source: string = 'unknown'
  ): void {
    const event = this.createLucidEvent(eventType, payload, source);
    const listeners = this.globalEventListeners.get(eventType);

    if (!listeners || listeners.size === 0) {
      console.log(`[SimpleEventManager] 📢 分发事件但无监听器: ${eventType} (来源: ${source})`);
      return;
    }

    console.log(`[SimpleEventManager] 📢 分发全局事件: ${eventType} (来源: ${source}, 监听器: ${listeners.size})`);

    // 按优先级排序监听器
    const sortedListeners = Array.from(listeners).sort((a, b) =>
      (b.options.priority || 0) - (a.options.priority || 0)
    );

    // 记录事件处理开始时间
    const startTime = performance.now();

    // 处理事件
    this.processEventListeners(event, sortedListeners);

    // 更新统计信息
    this.updateEventStats(eventType, performance.now() - startTime);
  }

  /**
   * 处理事件监听器
   */
  private processEventListeners<T>(event: LucidUIEvent<T>, listeners: GlobalEventListener[]): void {
    const listenersToRemove: GlobalEventListener[] = [];

    for (const listener of listeners) {
      try {
        // 应用防抖或节流
        if (listener.options.debounce || listener.options.throttle) {
          this.applyRateLimit(listener, event);
        } else {
          listener.handler(event);
        }

        // 如果是一次性监听器，标记为移除
        if (listener.options.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        console.error(`[SimpleEventManager] 事件处理器错误 (${listener.source}):`, error);
      }
    }

    // 移除一次性监听器
    listenersToRemove.forEach(listener => {
      const listeners = this.globalEventListeners.get(listener.eventType);
      if (listeners) {
        listeners.delete(listener);
      }
    });
  }

  /**
   * 应用速率限制（防抖/节流）
   */
  private applyRateLimit<T>(listener: GlobalEventListener, event: LucidUIEvent<T>): void {
    // 简化实现，实际项目中可以使用更复杂的防抖/节流逻辑
    if (listener.options.debounce) {
      // 防抖逻辑
      setTimeout(() => listener.handler(event), listener.options.debounce);
    } else if (listener.options.throttle) {
      // 节流逻辑 - 简化版本
      const now = Date.now();
      const lastCall = (listener as any).lastCall || 0;
      if (now - lastCall >= listener.options.throttle) {
        (listener as any).lastCall = now;
        listener.handler(event);
      }
    }
  }

  /**
   * 更新事件统计信息
   */
  private updateEventStats(eventType: string, processingTime: number): void {
    if (!this.eventStats.has(eventType)) {
      this.eventStats.set(eventType, {
        count: 0,
        totalTime: 0,
        lastProcessed: 0
      });
    }

    const stats = this.eventStats.get(eventType)!;
    stats.count++;
    stats.totalTime += processingTime;
    stats.lastProcessed = Date.now();
  }

  /**
   * 获取事件统计信息
   */
  public getEventStats(): EventStats {
    const totalEvents = Array.from(this.eventStats.values()).reduce((sum, stats) => sum + stats.count, 0);
    const eventsByType: Record<string, number> = {};
    let totalTime = 0;

    this.eventStats.forEach((stats, eventType) => {
      eventsByType[eventType] = stats.count;
      totalTime += stats.totalTime;
    });

    return {
      totalEvents,
      eventsByType,
      activeListeners: Array.from(this.globalEventListeners.values()).reduce((sum, listeners) => sum + listeners.size, 0),
      averageProcessingTime: totalEvents > 0 ? totalTime / totalEvents : 0
    };
  }

  /**
   * 清理全局事件监听器
   */
  public cleanupGlobalEvents(): void {
    this.globalEventListeners.clear();
    this.eventStats.clear();
    this.registeredComponents.clear();
    console.log('[SimpleEventManager] 🧹 已清理所有全局事件监听器');
  }
}

// 导出单例实例
export const simpleEventManager = SimpleEventManager.getInstance();
