/**
 * 事件系统测试 - 验证全局事件总线功能
 */

import { EventPriority, UI_EVENTS } from '../constants/uiEvents';
import { SimpleEventManager } from '../utils/dom/simpleEventManager';

describe('EventSystem', () => {
  let eventManager: SimpleEventManager;

  beforeEach(() => {
    eventManager = SimpleEventManager.getInstance();
    // 清理之前的事件监听器
    eventManager.cleanupGlobalEvents();
  });

  afterEach(() => {
    eventManager.cleanupGlobalEvents();
  });

  describe('全局事件订阅和分发', () => {
    test('应该能够订阅和分发事件', (done) => {
      const testPayload = { word: 'test', targetElement: document.createElement('div') };

      // 订阅事件
      const unsubscribe = eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLTIP.SHOW,
        (event) => {
          expect(event.type).toBe(UI_EVENTS.TOOLTIP.SHOW);
          expect(event.payload).toEqual(testPayload);
          expect(event.source).toBe('TestSource');
          expect(event.timestamp).toBeGreaterThan(0);
          expect(event.id).toBeDefined();
          done();
        },
        {},
        'TestListener'
      );

      // 分发事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.SHOW, testPayload, 'TestSource');

      // 清理
      unsubscribe();
    });

    test('应该支持多个监听器', () => {
      const testPayload = { word: 'test' };
      let callCount = 0;

      // 订阅多个监听器
      const unsubscribe1 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLTIP.HIDE,
        () => { callCount++; },
        {},
        'Listener1'
      );

      const unsubscribe2 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLTIP.HIDE,
        () => { callCount++; },
        {},
        'Listener2'
      );

      // 分发事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.HIDE, testPayload, 'TestSource');

      expect(callCount).toBe(2);

      // 清理
      unsubscribe1();
      unsubscribe2();
    });

    test('应该支持优先级排序', () => {
      const callOrder: string[] = [];

      // 订阅不同优先级的监听器
      const unsubscribe1 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.UI_STATE.HIDE_ALL,
        () => { callOrder.push('low'); },
        { priority: EventPriority.LOW },
        'LowPriority'
      );

      const unsubscribe2 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.UI_STATE.HIDE_ALL,
        () => { callOrder.push('high'); },
        { priority: EventPriority.HIGH },
        'HighPriority'
      );

      const unsubscribe3 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.UI_STATE.HIDE_ALL,
        () => { callOrder.push('normal'); },
        { priority: EventPriority.NORMAL },
        'NormalPriority'
      );

      // 分发事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.UI_STATE.HIDE_ALL, {}, 'TestSource');

      // 验证调用顺序（高优先级先执行）
      expect(callOrder).toEqual(['high', 'normal', 'low']);

      // 清理
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });

    test('应该支持一次性监听器', () => {
      let callCount = 0;

      // 订阅一次性监听器
      eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLPOPUP.SHOWN,
        () => { callCount++; },
        { once: true },
        'OnceListener'
      );

      // 多次分发事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLPOPUP.SHOWN, {}, 'TestSource');
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLPOPUP.SHOWN, {}, 'TestSource');
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLPOPUP.SHOWN, {}, 'TestSource');

      // 应该只被调用一次
      expect(callCount).toBe(1);
    });

    test('应该能够取消订阅', () => {
      let callCount = 0;

      // 订阅事件
      const unsubscribe = eventManager.subscribeGlobalEvent(
        UI_EVENTS.HIGHLIGHT.WORD_HIGHLIGHTED,
        () => { callCount++; },
        {},
        'TestListener'
      );

      // 分发事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.HIGHLIGHT.WORD_HIGHLIGHTED, {}, 'TestSource');
      expect(callCount).toBe(1);

      // 取消订阅
      unsubscribe();

      // 再次分发事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.HIGHLIGHT.WORD_HIGHLIGHTED, {}, 'TestSource');
      expect(callCount).toBe(1); // 不应该增加
    });
  });

  describe('事件统计', () => {
    test('应该正确统计事件', () => {
      // 订阅一些监听器
      const unsubscribe1 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLTIP.SHOW,
        () => { },
        {},
        'Listener1'
      );

      const unsubscribe2 = eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLTIP.HIDE,
        () => { },
        {},
        'Listener2'
      );

      // 分发一些事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.SHOW, {}, 'TestSource');
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.SHOW, {}, 'TestSource');
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.HIDE, {}, 'TestSource');

      const stats = eventManager.getEventStats();

      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType[UI_EVENTS.TOOLTIP.SHOW]).toBe(2);
      expect(stats.eventsByType[UI_EVENTS.TOOLTIP.HIDE]).toBe(1);
      expect(stats.activeListeners).toBe(2);
      expect(stats.averageProcessingTime).toBeGreaterThanOrEqual(0);

      // 清理
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('错误处理', () => {
    test('应该处理监听器中的错误', () => {
      const originalError = console.error;
      let errorCalled = false;
      console.error = () => { errorCalled = true; };

      // 订阅一个会抛出错误的监听器
      const unsubscribe = eventManager.subscribeGlobalEvent(
        UI_EVENTS.INTERACTION.SHIFT_KEY_PRESSED,
        () => {
          throw new Error('Test error');
        },
        {},
        'ErrorListener'
      );

      // 分发事件不应该抛出错误
      expect(() => {
        eventManager.dispatchGlobalEvent(UI_EVENTS.INTERACTION.SHIFT_KEY_PRESSED, {}, 'TestSource');
      }).not.toThrow();

      // 应该记录错误
      expect(errorCalled).toBe(true);

      // 清理
      unsubscribe();
      console.error = originalError;
    });

    test('应该处理没有监听器的事件', () => {
      const originalLog = console.log;
      let logMessage = '';
      console.log = (message: string) => { logMessage = message; };

      // 分发没有监听器的事件
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLPOPUP.WORD_CLICK, {}, 'TestSource');

      // 应该记录日志
      expect(logMessage).toContain('分发事件但无监听器');

      console.log = originalLog;
    });
  });

  describe('清理功能', () => {
    test('应该能够清理所有全局事件', () => {
      // 订阅一些监听器
      eventManager.subscribeGlobalEvent(UI_EVENTS.TOOLTIP.SHOW, () => { }, {}, 'Listener1');
      eventManager.subscribeGlobalEvent(UI_EVENTS.TOOLTIP.HIDE, () => { }, {}, 'Listener2');

      let stats = eventManager.getEventStats();
      expect(stats.activeListeners).toBe(2);

      // 清理所有事件
      eventManager.cleanupGlobalEvents();

      stats = eventManager.getEventStats();
      expect(stats.activeListeners).toBe(0);
      expect(stats.totalEvents).toBe(0);
    });
  });
});
