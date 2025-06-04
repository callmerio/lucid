/**
 * SimpleEventManager - 轻量级事件管理器
 * 专为浏览器插件设计，简单高效的事件监听器管理
 */

interface EventCleanup {
  element: Element;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

/**
 * 轻量级事件管理器
 * 使用简单的Set管理事件监听器，在组件销毁时批量清理
 */
export class SimpleEventManager {
  private static instance: SimpleEventManager;
  private activeListeners = new Set<EventCleanup>();

  private constructor() {}

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
}

// 导出单例实例
export const simpleEventManager = SimpleEventManager.getInstance();
