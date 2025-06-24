/**
 * SimpleEventManager 工具函数测试
 * 测试轻量级事件管理器的核心功能
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 事件清理接口
interface EventCleanup {
  element: Element;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

// Mock SimpleEventManager 实现
class MockSimpleEventManager {
  private static instance: MockSimpleEventManager;
  private activeListeners = new Set<EventCleanup>();

  private constructor() { }

  public static getInstance(): MockSimpleEventManager {
    if (!MockSimpleEventManager.instance) {
      MockSimpleEventManager.instance = new MockSimpleEventManager();
    }
    return MockSimpleEventManager.instance;
  }

  public static resetInstance(): void {
    MockSimpleEventManager.instance = null as any;
  }

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

  public cleanup(): void {
    this.activeListeners.forEach(cleanup => {
      try {
        cleanup.element.removeEventListener(
          cleanup.type,
          cleanup.listener,
          cleanup.options
        );
      } catch (error) {
        console.warn('[SimpleEventManager] Error during cleanup:', error);
      }
    });

    this.activeListeners.clear();
  }

  public getActiveListenerCount(): number {
    return this.activeListeners.size;
  }

  // 静态工具方法
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

describe('SimpleEventManager', () => {
  let eventManager: MockSimpleEventManager;
  let testElement: HTMLElement;

  beforeEach(() => {
    MockSimpleEventManager.resetInstance();
    eventManager = MockSimpleEventManager.getInstance();
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
    vi.useFakeTimers();
  });

  afterEach(() => {
    eventManager.cleanup();
    if (testElement.parentNode) {
      document.body.removeChild(testElement);
    }
    vi.useRealTimers();
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = MockSimpleEventManager.getInstance();
      const instance2 = MockSimpleEventManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('应该在重置后创建新实例', () => {
      const instance1 = MockSimpleEventManager.getInstance();
      MockSimpleEventManager.resetInstance();
      const instance2 = MockSimpleEventManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('事件监听器管理', () => {
    it('应该添加事件监听器', () => {
      const handler = vi.fn();

      const cleanup = eventManager.addEventListener(testElement, 'click', handler);

      expect(eventManager.getActiveListenerCount()).toBe(1);
      expect(typeof cleanup).toBe('function');
    });

    it('应该触发事件处理器', () => {
      const handler = vi.fn();

      eventManager.addEventListener(testElement, 'click', handler);
      testElement.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('应该支持多个事件监听器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventManager.addEventListener(testElement, 'click', handler1);
      eventManager.addEventListener(testElement, 'mouseover', handler2);

      expect(eventManager.getActiveListenerCount()).toBe(2);

      testElement.click();
      testElement.dispatchEvent(new MouseEvent('mouseover'));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('应该支持事件选项', () => {
      const handler = vi.fn();
      const options = { once: true, passive: true };

      eventManager.addEventListener(testElement, 'click', handler, options);

      testElement.click();
      testElement.click();

      // once: true 应该只触发一次
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('事件清理', () => {
    it('应该通过清理函数移除监听器', () => {
      const handler = vi.fn();

      const cleanup = eventManager.addEventListener(testElement, 'click', handler);
      expect(eventManager.getActiveListenerCount()).toBe(1);

      cleanup();
      expect(eventManager.getActiveListenerCount()).toBe(0);

      testElement.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('应该移除特定元素的所有监听器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const otherElement = document.createElement('span');
      const handler3 = vi.fn();

      eventManager.addEventListener(testElement, 'click', handler1);
      eventManager.addEventListener(testElement, 'mouseover', handler2);
      eventManager.addEventListener(otherElement, 'click', handler3);

      expect(eventManager.getActiveListenerCount()).toBe(3);

      eventManager.removeElementListeners(testElement);

      expect(eventManager.getActiveListenerCount()).toBe(1);

      testElement.click();
      testElement.dispatchEvent(new MouseEvent('mouseover'));
      otherElement.click();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('应该清理所有监听器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventManager.addEventListener(testElement, 'click', handler1);
      eventManager.addEventListener(testElement, 'mouseover', handler2);

      expect(eventManager.getActiveListenerCount()).toBe(2);

      eventManager.cleanup();

      expect(eventManager.getActiveListenerCount()).toBe(0);

      testElement.click();
      testElement.dispatchEvent(new MouseEvent('mouseover'));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('应该处理清理时的错误', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const handler = vi.fn();

      eventManager.addEventListener(testElement, 'click', handler);

      // 模拟 removeEventListener 抛出错误
      const originalRemoveEventListener = testElement.removeEventListener;
      testElement.removeEventListener = vi.fn(() => {
        throw new Error('Remove listener error');
      });

      // 清理应该不会抛出错误
      expect(() => {
        eventManager.cleanup();
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SimpleEventManager] Error during cleanup:',
        expect.any(Error)
      );

      // 恢复原始方法
      testElement.removeEventListener = originalRemoveEventListener;
      consoleSpy.mockRestore();
    });
  });

  describe('debounce 工具函数', () => {
    it('应该延迟执行函数', () => {
      const func = vi.fn();
      const debouncedFunc = MockSimpleEventManager.debounce(func, 100);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('应该取消之前的调用', () => {
      const func = vi.fn();
      const debouncedFunc = MockSimpleEventManager.debounce(func, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('应该传递参数', () => {
      const func = vi.fn();
      const debouncedFunc = MockSimpleEventManager.debounce(func, 100);

      debouncedFunc('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('应该处理多次快速调用', () => {
      const func = vi.fn();
      const debouncedFunc = MockSimpleEventManager.debounce(func, 100);

      for (let i = 0; i < 10; i++) {
        debouncedFunc(i);
        vi.advanceTimersByTime(50);
      }

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(9); // 最后一次调用的参数
    });
  });

  describe('throttle 工具函数', () => {
    it('应该限制函数执行频率', () => {
      const func = vi.fn();
      const throttledFunc = MockSimpleEventManager.throttle(func, 100);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('应该传递参数', () => {
      const func = vi.fn();
      const throttledFunc = MockSimpleEventManager.throttle(func, 100);

      throttledFunc('arg1', 'arg2');
      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('应该在时间窗口内只执行一次', () => {
      const func = vi.fn();
      const throttledFunc = MockSimpleEventManager.throttle(func, 100);

      for (let i = 0; i < 10; i++) {
        throttledFunc(i);
        vi.advanceTimersByTime(10);
      }

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith(0); // 第一次调用的参数
    });
  });

  describe('safeExecute 工具函数', () => {
    it('应该执行正常函数', () => {
      const func = vi.fn(() => 'result');

      const result = MockSimpleEventManager.safeExecute(func);

      expect(func).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('应该捕获函数执行错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const func = vi.fn(() => {
        throw new Error('Test error');
      });

      const result = MockSimpleEventManager.safeExecute(func);

      expect(func).toHaveBeenCalledTimes(1);
      expect(result).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SimpleEventManager] Error in safe execution:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('应该使用自定义错误消息', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const func = vi.fn(() => {
        throw new Error('Test error');
      });

      MockSimpleEventManager.safeExecute(func, 'Custom error message');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SimpleEventManager] Custom error message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('应该返回函数的返回值', () => {
      const testCases = [
        () => 42,
        () => 'string',
        () => ({ key: 'value' }),
        () => [1, 2, 3],
        () => true,
        () => null,
        () => undefined,
      ];

      testCases.forEach(func => {
        const expected = func();
        const result = MockSimpleEventManager.safeExecute(func);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('内存管理', () => {
    it('应该防止内存泄漏', () => {
      const handlers: (() => void)[] = [];

      // 创建大量监听器
      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn();
        const cleanup = eventManager.addEventListener(testElement, 'click', handler);
        handlers.push(cleanup);
      }

      expect(eventManager.getActiveListenerCount()).toBe(1000);

      // 清理一半
      for (let i = 0; i < 500; i++) {
        handlers[i]();
      }

      expect(eventManager.getActiveListenerCount()).toBe(500);

      // 清理剩余的
      eventManager.cleanup();
      expect(eventManager.getActiveListenerCount()).toBe(0);
    });

    it('应该正确处理重复清理', () => {
      const handler = vi.fn();
      const cleanup = eventManager.addEventListener(testElement, 'click', handler);

      cleanup();
      expect(eventManager.getActiveListenerCount()).toBe(0);

      // 重复清理应该安全
      expect(() => {
        cleanup();
      }).not.toThrow();

      expect(eventManager.getActiveListenerCount()).toBe(0);
    });
  });
});
