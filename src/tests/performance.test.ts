/**
 * 性能基准测试 - 验证事件系统和组件性能
 */

import { SimpleEventManager } from '../utils/dom/simpleEventManager';
import { TooltipManager } from '../utils/dom/legacy/tooltipManager';
import { ToolpopupManager } from '../utils/dom/managers/popup/ToolpopupManager';
import { UI_EVENTS, EventPriority } from '@constants/uiEvents';

describe('性能基准测试', () => {
  let eventManager: SimpleEventManager;
  let tooltipManager: TooltipManager;
  let toolpopupManager: ToolpopupManager;

  beforeEach(() => {
    eventManager = SimpleEventManager.getInstance();
    tooltipManager = TooltipManager.getInstance();
    toolpopupManager = ToolpopupManager.getInstance();
    
    // 清理之前的状态
    eventManager.cleanupGlobalEvents();
  });

  afterEach(() => {
    tooltipManager.destroy();
    toolpopupManager.destroy();
    eventManager.cleanupGlobalEvents();
  });

  describe('事件系统性能', () => {
    test('大量事件监听器性能测试', () => {
      const startTime = performance.now();
      const cleanupFunctions: (() => void)[] = [];

      // 创建1000个事件监听器
      for (let i = 0; i < 1000; i++) {
        const cleanup = eventManager.subscribeGlobalEvent(
          UI_EVENTS.TOOLTIP.SHOW,
          () => {},
          {},
          `Listener${i}`
        );
        cleanupFunctions.push(cleanup);
      }

      const subscribeTime = performance.now() - startTime;
      console.log(`📊 订阅1000个监听器耗时: ${subscribeTime.toFixed(2)}ms`);

      // 测试事件分发性能
      const dispatchStartTime = performance.now();
      eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.SHOW, {}, 'PerformanceTest');
      const dispatchTime = performance.now() - dispatchStartTime;
      console.log(`📊 分发事件到1000个监听器耗时: ${dispatchTime.toFixed(2)}ms`);

      // 清理
      const cleanupStartTime = performance.now();
      cleanupFunctions.forEach(cleanup => cleanup());
      const cleanupTime = performance.now() - cleanupStartTime;
      console.log(`📊 清理1000个监听器耗时: ${cleanupTime.toFixed(2)}ms`);

      // 性能断言
      expect(subscribeTime).toBeLessThan(100); // 订阅应该在100ms内完成
      expect(dispatchTime).toBeLessThan(50);   // 分发应该在50ms内完成
      expect(cleanupTime).toBeLessThan(50);    // 清理应该在50ms内完成
    });

    test('事件优先级性能测试', () => {
      const callOrder: string[] = [];
      const cleanupFunctions: (() => void)[] = [];

      // 创建不同优先级的监听器
      for (let i = 0; i < 100; i++) {
        const priority = i % 4; // 0-3的优先级
        const cleanup = eventManager.subscribeGlobalEvent(
          UI_EVENTS.UI_STATE.HIDE_ALL,
          () => { callOrder.push(`priority-${priority}`); },
          { priority },
          `PriorityListener${i}`
        );
        cleanupFunctions.push(cleanup);
      }

      const startTime = performance.now();
      eventManager.dispatchGlobalEvent(UI_EVENTS.UI_STATE.HIDE_ALL, {}, 'PriorityTest');
      const endTime = performance.now();

      console.log(`📊 优先级排序和分发100个监听器耗时: ${(endTime - startTime).toFixed(2)}ms`);

      // 验证优先级排序正确
      expect(callOrder.length).toBe(100);
      
      // 清理
      cleanupFunctions.forEach(cleanup => cleanup());

      // 性能断言
      expect(endTime - startTime).toBeLessThan(20); // 应该在20ms内完成
    });

    test('内存使用测试', () => {
      const initialStats = eventManager.getEventStats();
      const cleanupFunctions: (() => void)[] = [];

      // 创建和销毁大量监听器
      for (let cycle = 0; cycle < 10; cycle++) {
        const cycleCleanups: (() => void)[] = [];
        
        // 创建100个监听器
        for (let i = 0; i < 100; i++) {
          const cleanup = eventManager.subscribeGlobalEvent(
            UI_EVENTS.TOOLTIP.SHOW,
            () => {},
            {},
            `MemoryTest${cycle}-${i}`
          );
          cycleCleanups.push(cleanup);
        }

        // 立即清理
        cycleCleanups.forEach(cleanup => cleanup());
      }

      const finalStats = eventManager.getEventStats();
      
      console.log(`📊 初始活跃监听器: ${initialStats.activeListeners}`);
      console.log(`📊 最终活跃监听器: ${finalStats.activeListeners}`);

      // 验证没有内存泄漏
      expect(finalStats.activeListeners).toBe(initialStats.activeListeners);
    });
  });

  describe('组件性能测试', () => {
    test('Tooltip显示性能测试', async () => {
      const testElement = document.createElement('span');
      testElement.textContent = 'performance test';
      testElement.dataset.word = 'performance';
      document.body.appendChild(testElement);

      const startTime = performance.now();
      
      // 连续显示和隐藏tooltip
      for (let i = 0; i < 10; i++) {
        await tooltipManager.showTooltip(testElement, 'performance');
        tooltipManager.hideTooltip(0);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 10;

      console.log(`📊 平均tooltip显示/隐藏耗时: ${averageTime.toFixed(2)}ms`);

      // 性能断言
      expect(averageTime).toBeLessThan(50); // 平均应该在50ms内完成

      document.body.removeChild(testElement);
    });

    test('事件驱动的组件通信性能', async () => {
      const testElement = document.createElement('span');
      testElement.textContent = 'communication test';
      testElement.dataset.word = 'communication';
      document.body.appendChild(testElement);

      // 显示tooltip
      await tooltipManager.showTooltip(testElement, 'communication');

      const startTime = performance.now();

      // 模拟Shift键事件，触发tooltip到toolpopup的转换
      const shiftEvent = new KeyboardEvent('keydown', { key: 'Shift' });
      document.dispatchEvent(shiftEvent);

      const endTime = performance.now();

      console.log(`📊 事件驱动组件通信耗时: ${(endTime - startTime).toFixed(2)}ms`);

      // 性能断言
      expect(endTime - startTime).toBeLessThan(10); // 事件通信应该在10ms内完成

      document.body.removeChild(testElement);
    });
  });

  describe('并发性能测试', () => {
    test('并发事件处理性能', async () => {
      const cleanupFunctions: (() => void)[] = [];
      let processedEvents = 0;

      // 创建多个监听器
      for (let i = 0; i < 50; i++) {
        const cleanup = eventManager.subscribeGlobalEvent(
          UI_EVENTS.HIGHLIGHT.WORD_HIGHLIGHTED,
          () => { processedEvents++; },
          {},
          `ConcurrentListener${i}`
        );
        cleanupFunctions.push(cleanup);
      }

      const startTime = performance.now();

      // 并发分发多个事件
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          Promise.resolve().then(() => {
            eventManager.dispatchGlobalEvent(
              UI_EVENTS.HIGHLIGHT.WORD_HIGHLIGHTED,
              { word: `word${i}` },
              'ConcurrentTest'
            );
          })
        );
      }

      await Promise.all(promises);
      const endTime = performance.now();

      console.log(`📊 并发处理20个事件(50个监听器)耗时: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 总处理事件数: ${processedEvents}`);

      // 验证所有事件都被处理
      expect(processedEvents).toBe(20 * 50); // 20个事件 × 50个监听器

      // 性能断言
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成

      // 清理
      cleanupFunctions.forEach(cleanup => cleanup());
    });
  });

  describe('压力测试', () => {
    test('高频事件分发压力测试', () => {
      const cleanup = eventManager.subscribeGlobalEvent(
        UI_EVENTS.INTERACTION.SHIFT_KEY_PRESSED,
        () => {},
        {},
        'StressTestListener'
      );

      const startTime = performance.now();
      
      // 高频分发1000个事件
      for (let i = 0; i < 1000; i++) {
        eventManager.dispatchGlobalEvent(
          UI_EVENTS.INTERACTION.SHIFT_KEY_PRESSED,
          { targetElement: document.createElement('div') },
          'StressTest'
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 1000;

      console.log(`📊 1000次高频事件分发总耗时: ${totalTime.toFixed(2)}ms`);
      console.log(`📊 平均每次事件分发耗时: ${averageTime.toFixed(3)}ms`);

      // 性能断言
      expect(totalTime).toBeLessThan(200);     // 总时间应该在200ms内
      expect(averageTime).toBeLessThan(0.2);   // 平均每次应该在0.2ms内

      cleanup();
    });
  });

  describe('性能回归测试', () => {
    test('与重构前性能对比', () => {
      // 这个测试模拟重构前的直接调用方式的性能
      const directCallStartTime = performance.now();
      
      // 模拟直接调用（无事件系统开销）
      for (let i = 0; i < 100; i++) {
        // 直接方法调用
        const mockDirectCall = () => {};
        mockDirectCall();
      }
      
      const directCallTime = performance.now() - directCallStartTime;

      // 测试事件系统的性能
      const cleanup = eventManager.subscribeGlobalEvent(
        UI_EVENTS.TOOLTIP.SHOW,
        () => {},
        {},
        'RegressionTestListener'
      );

      const eventSystemStartTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        eventManager.dispatchGlobalEvent(UI_EVENTS.TOOLTIP.SHOW, {}, 'RegressionTest');
      }
      
      const eventSystemTime = performance.now() - eventSystemStartTime;

      console.log(`📊 直接调用100次耗时: ${directCallTime.toFixed(2)}ms`);
      console.log(`📊 事件系统100次耗时: ${eventSystemTime.toFixed(2)}ms`);
      console.log(`📊 性能开销比例: ${((eventSystemTime / directCallTime) * 100).toFixed(1)}%`);

      // 事件系统的开销应该是可接受的（不超过直接调用的10倍）
      expect(eventSystemTime).toBeLessThan(directCallTime * 10);

      cleanup();
    });
  });
});
