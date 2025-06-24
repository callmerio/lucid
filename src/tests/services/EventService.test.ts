/**
 * EventService 单元测试
 * 测试事件服务的核心功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock 事件处理器类型
type EventHandler<T = any> = (payload: T) => void | Promise<void>;
type EventCleanup = () => void;

// Mock 事件服务实现
class MockEventService {
  private listeners = new Map<string, Set<EventHandler>>();
  private onceListeners = new Map<string, Set<EventHandler>>();

  async initialize(): Promise<void> {
    // 初始化逻辑
  }

  async destroy(): Promise<void> {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): EventCleanup {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(handler);
    
    // 返回清理函数
    return () => {
      this.unsubscribe(eventType, handler);
    };
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }

    // 同时从一次性监听器中移除
    const onceHandlers = this.onceListeners.get(eventType);
    if (onceHandlers) {
      onceHandlers.delete(handler);
      if (onceHandlers.size === 0) {
        this.onceListeners.delete(eventType);
      }
    }
  }

  emit<T>(eventType: string, payload: T): void {
    // 触发普通监听器
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          const result = handler(payload);
          // 处理异步处理器
          if (result instanceof Promise) {
            result.catch(error => {
              console.error(`Error in event handler for ${eventType}:`, error);
            });
          }
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }

    // 触发一次性监听器
    const onceHandlers = this.onceListeners.get(eventType);
    if (onceHandlers) {
      const handlersArray = Array.from(onceHandlers);
      onceHandlers.clear();
      this.onceListeners.delete(eventType);
      
      handlersArray.forEach(handler => {
        try {
          const result = handler(payload);
          if (result instanceof Promise) {
            result.catch(error => {
              console.error(`Error in once event handler for ${eventType}:`, error);
            });
          }
        } catch (error) {
          console.error(`Error in once event handler for ${eventType}:`, error);
        }
      });
    }
  }

  once<T>(eventType: string, handler: EventHandler<T>): EventCleanup {
    if (!this.onceListeners.has(eventType)) {
      this.onceListeners.set(eventType, new Set());
    }
    
    this.onceListeners.get(eventType)!.add(handler);
    
    // 返回清理函数
    return () => {
      this.unsubscribe(eventType, handler);
    };
  }

  // 测试辅助方法
  getListenerCount(eventType: string): number {
    const handlers = this.listeners.get(eventType);
    const onceHandlers = this.onceListeners.get(eventType);
    return (handlers?.size || 0) + (onceHandlers?.size || 0);
  }

  getAllEventTypes(): string[] {
    const types = new Set<string>();
    this.listeners.forEach((_, type) => types.add(type));
    this.onceListeners.forEach((_, type) => types.add(type));
    return Array.from(types);
  }
}

describe('EventService', () => {
  let eventService: MockEventService;

  beforeEach(() => {
    eventService = new MockEventService();
  });

  afterEach(async () => {
    await eventService.destroy();
  });

  describe('初始化和销毁', () => {
    it('应该正确初始化事件服务', async () => {
      await eventService.initialize();
      
      expect(eventService.getAllEventTypes()).toHaveLength(0);
    });

    it('应该正确销毁事件服务', async () => {
      const handler = vi.fn();
      eventService.subscribe('test', handler);
      
      expect(eventService.getListenerCount('test')).toBe(1);
      
      await eventService.destroy();
      
      expect(eventService.getListenerCount('test')).toBe(0);
    });
  });

  describe('事件订阅', () => {
    it('应该订阅事件处理器', () => {
      const handler = vi.fn();
      
      const cleanup = eventService.subscribe('test-event', handler);
      
      expect(eventService.getListenerCount('test-event')).toBe(1);
      expect(typeof cleanup).toBe('function');
    });

    it('应该支持多个处理器订阅同一事件', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventService.subscribe('test-event', handler1);
      eventService.subscribe('test-event', handler2);
      
      expect(eventService.getListenerCount('test-event')).toBe(2);
    });

    it('应该支持同一处理器订阅多个事件', () => {
      const handler = vi.fn();
      
      eventService.subscribe('event1', handler);
      eventService.subscribe('event2', handler);
      
      expect(eventService.getListenerCount('event1')).toBe(1);
      expect(eventService.getListenerCount('event2')).toBe(1);
    });

    it('应该防止重复订阅同一处理器', () => {
      const handler = vi.fn();
      
      eventService.subscribe('test-event', handler);
      eventService.subscribe('test-event', handler);
      
      expect(eventService.getListenerCount('test-event')).toBe(1);
    });
  });

  describe('事件取消订阅', () => {
    it('应该取消订阅事件处理器', () => {
      const handler = vi.fn();
      eventService.subscribe('test-event', handler);
      
      expect(eventService.getListenerCount('test-event')).toBe(1);
      
      eventService.unsubscribe('test-event', handler);
      
      expect(eventService.getListenerCount('test-event')).toBe(0);
    });

    it('应该通过清理函数取消订阅', () => {
      const handler = vi.fn();
      const cleanup = eventService.subscribe('test-event', handler);
      
      expect(eventService.getListenerCount('test-event')).toBe(1);
      
      cleanup();
      
      expect(eventService.getListenerCount('test-event')).toBe(0);
    });

    it('应该只取消指定的处理器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventService.subscribe('test-event', handler1);
      eventService.subscribe('test-event', handler2);
      
      eventService.unsubscribe('test-event', handler1);
      
      expect(eventService.getListenerCount('test-event')).toBe(1);
    });

    it('应该处理取消不存在的订阅', () => {
      const handler = vi.fn();
      
      expect(() => {
        eventService.unsubscribe('nonexistent', handler);
      }).not.toThrow();
    });
  });

  describe('事件发射', () => {
    it('应该触发事件处理器', () => {
      const handler = vi.fn();
      eventService.subscribe('test-event', handler);
      
      eventService.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('应该触发多个事件处理器', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventService.subscribe('test-event', handler1);
      eventService.subscribe('test-event', handler2);
      
      eventService.emit('test-event', 'payload');
      
      expect(handler1).toHaveBeenCalledWith('payload');
      expect(handler2).toHaveBeenCalledWith('payload');
    });

    it('应该处理不存在的事件类型', () => {
      expect(() => {
        eventService.emit('nonexistent', 'data');
      }).not.toThrow();
    });

    it('应该处理处理器中的错误', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventService.subscribe('test-event', errorHandler);
      eventService.subscribe('test-event', normalHandler);
      
      eventService.emit('test-event', 'data');
      
      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event handler for test-event:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('一次性事件监听', () => {
    it('应该只触发一次处理器', () => {
      const handler = vi.fn();
      
      eventService.once('test-event', handler);
      
      eventService.emit('test-event', 'data1');
      eventService.emit('test-event', 'data2');
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('data1');
    });

    it('应该在触发后自动清理', () => {
      const handler = vi.fn();
      
      eventService.once('test-event', handler);
      expect(eventService.getListenerCount('test-event')).toBe(1);
      
      eventService.emit('test-event', 'data');
      expect(eventService.getListenerCount('test-event')).toBe(0);
    });

    it('应该支持手动清理一次性监听器', () => {
      const handler = vi.fn();
      
      const cleanup = eventService.once('test-event', handler);
      expect(eventService.getListenerCount('test-event')).toBe(1);
      
      cleanup();
      expect(eventService.getListenerCount('test-event')).toBe(0);
      
      eventService.emit('test-event', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    it('应该处理一次性监听器中的错误', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Once handler error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventService.once('test-event', errorHandler);
      eventService.emit('test-event', 'data');
      
      expect(errorHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in once event handler for test-event:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('异步事件处理', () => {
    it('应该处理异步事件处理器', async () => {
      const asyncHandler = vi.fn(async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return data;
      });
      
      eventService.subscribe('async-event', asyncHandler);
      
      eventService.emit('async-event', 'async-data');
      
      expect(asyncHandler).toHaveBeenCalledWith('async-data');
    });

    it('应该处理异步处理器中的错误', async () => {
      const asyncErrorHandler = vi.fn(async () => {
        throw new Error('Async handler error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventService.subscribe('async-event', asyncErrorHandler);
      eventService.emit('async-event', 'data');
      
      // 等待异步错误处理
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(asyncErrorHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event handler for async-event:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('事件类型管理', () => {
    it('应该跟踪所有事件类型', () => {
      const handler = vi.fn();
      
      eventService.subscribe('event1', handler);
      eventService.subscribe('event2', handler);
      eventService.once('event3', handler);
      
      const eventTypes = eventService.getAllEventTypes();
      expect(eventTypes).toContain('event1');
      expect(eventTypes).toContain('event2');
      expect(eventTypes).toContain('event3');
    });

    it('应该在没有监听器时清理事件类型', () => {
      const handler = vi.fn();
      
      eventService.subscribe('test-event', handler);
      expect(eventService.getAllEventTypes()).toContain('test-event');
      
      eventService.unsubscribe('test-event', handler);
      expect(eventService.getAllEventTypes()).not.toContain('test-event');
    });
  });

  describe('内存管理', () => {
    it('应该防止内存泄漏', () => {
      const handler = vi.fn();
      
      // 大量订阅和取消订阅
      for (let i = 0; i < 1000; i++) {
        const cleanup = eventService.subscribe(`event-${i}`, handler);
        cleanup();
      }
      
      expect(eventService.getAllEventTypes()).toHaveLength(0);
    });

    it('应该正确处理大量事件发射', () => {
      const handler = vi.fn();
      eventService.subscribe('bulk-event', handler);
      
      // 大量事件发射
      for (let i = 0; i < 1000; i++) {
        eventService.emit('bulk-event', i);
      }
      
      expect(handler).toHaveBeenCalledTimes(1000);
    });
  });
});
