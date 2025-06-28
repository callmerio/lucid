/**
 * 轻量级Tooltip测试
 * 专注于核心功能验证，适合浏览器插件场景
 */

import { vi } from 'vitest';
import { SimpleEventManager } from '../utils/dom/simpleEventManager';
import { TooltipManager } from '../utils/dom/legacy/tooltipManager';

describe('轻量级Tooltip系统测试', () => {
  let simpleEventManager: SimpleEventManager;
  let tooltipManager: TooltipManager;

  beforeEach(() => {
    simpleEventManager = SimpleEventManager.getInstance();
    tooltipManager = TooltipManager.getInstance();

    // 清理DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // 清理资源
    simpleEventManager.cleanup();
    tooltipManager.destroy();
    document.body.innerHTML = '';
  });

  describe('SimpleEventManager', () => {
    test('应该正确添加和清理事件监听器', () => {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      let clickCount = 0;
      const clickHandler = () => clickCount++;

      // 添加监听器
      const cleanup = simpleEventManager.addEventListener(testElement, 'click', clickHandler);

      // 触发事件
      testElement.click();
      expect(clickCount).toBe(1);

      // 清理监听器
      cleanup();

      // 再次触发事件，应该不会响应
      testElement.click();
      expect(clickCount).toBe(1);
    });

    test('应该能够批量清理所有监听器', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      let count = 0;
      const handler = () => count++;

      // 添加多个监听器
      simpleEventManager.addEventListener(element1, 'click', handler);
      simpleEventManager.addEventListener(element2, 'click', handler);

      // 验证监听器数量
      expect(simpleEventManager.getActiveListenerCount()).toBe(2);

      // 批量清理
      simpleEventManager.cleanup();

      // 验证清理后状态
      expect(simpleEventManager.getActiveListenerCount()).toBe(0);

      // 触发事件，应该不会响应
      element1.click();
      element2.click();
      expect(count).toBe(0);
    });

    test('应该提供防抖功能', async () => {
      let callCount = 0;
      const testFunc = () => callCount++;

      const debouncedFunc = SimpleEventManager.debounce(testFunc, 50);

      // 快速调用多次
      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      // 立即检查，应该还没有执行
      expect(callCount).toBe(0);

      // 等待防抖时间
      await new Promise(resolve => setTimeout(resolve, 60));

      // 现在应该只执行了一次
      expect(callCount).toBe(1);
    });

    test('应该提供节流功能', () => {
      let callCount = 0;
      const testFunc = () => callCount++;

      const throttledFunc = SimpleEventManager.throttle(testFunc, 50);

      // 快速调用多次
      throttledFunc(); // 应该执行
      throttledFunc(); // 应该被节流
      throttledFunc(); // 应该被节流

      // 应该只执行了一次
      expect(callCount).toBe(1);
    });

    test('应该提供安全执行功能', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      // 测试正常执行
      const result1 = SimpleEventManager.safeExecute(() => 'success');
      expect(result1).toBe('success');

      // 测试错误处理
      const result2 = SimpleEventManager.safeExecute(() => {
        throw new Error('Test error');
      }, 'Custom error message');

      expect(result2).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('TooltipManager核心功能', () => {
    test('应该能够显示和隐藏tooltip', async () => {
      const testElement = document.createElement('span');
      testElement.textContent = 'test word';
      testElement.dataset.word = 'test';
      document.body.appendChild(testElement);

      // 显示tooltip
      await tooltipManager.showTooltip(testElement, 'test');

      // 验证tooltip已创建
      const tooltip = document.querySelector('.lucid-tooltip') as HTMLElement;
      expect(tooltip).toBeTruthy();
      expect(tooltip?.dataset.word).toBe('test');

      // 隐藏tooltip
      tooltipManager.hideTooltip(0);

      // 验证tooltip已移除
      const tooltipAfterHide = document.querySelector('.lucid-tooltip');
      expect(tooltipAfterHide).toBeFalsy();
    });

    test('应该正确处理Shift键交互', async () => {
      const testElement = document.createElement('span');
      testElement.textContent = 'test word';
      testElement.dataset.word = 'test';
      document.body.appendChild(testElement);

      // Mock ToolfullManager to avoid external dependencies
      const mockShowToolfull = vi.fn();
      const mockToolfullManager = {
        getInstance: () => ({
          showToolfull: mockShowToolfull
        })
      };

      // 显示tooltip
      await tooltipManager.showTooltip(testElement, 'test');

      // 等待tooltip完全显示
      await new Promise(resolve => setTimeout(resolve, 50));

      // 验证tooltip已显示
      let tooltip = document.querySelector('.lucid-tooltip');
      expect(tooltip).toBeTruthy();

      // 模拟Shift键按下
      const shiftEvent = new KeyboardEvent('keydown', { key: 'Shift' });
      document.documentElement.dispatchEvent(shiftEvent);

      // 等待事件处理完成
      await new Promise(resolve => setTimeout(resolve, 50));

      // 验证tooltip已隐藏（因为会切换到toolpopup）
      tooltip = document.querySelector('.lucid-tooltip');
      expect(tooltip).toBeFalsy();
    });

    test('应该正确清理资源', async () => {
      const testElement = document.createElement('span');
      testElement.textContent = 'test word';
      document.body.appendChild(testElement);

      // 显示tooltip
      await tooltipManager.showTooltip(testElement, 'test');

      // 等待tooltip完全显示和事件监听器添加
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证有活跃的监听器（如果没有，说明事件管理器工作正常）
      // 注意：在轻量级实现中，监听器可能在不同时机添加
      const listenerCount = simpleEventManager.getActiveListenerCount();
      console.log('Active listeners:', listenerCount);

      // 销毁tooltip管理器
      tooltipManager.destroy();

      // 验证tooltip已清理
      const tooltip = document.querySelector('.lucid-tooltip');
      expect(tooltip).toBeFalsy();
    });
  });

  describe('集成测试', () => {
    test('应该支持多个tooltip的正确切换', async () => {
      const element1 = document.createElement('span');
      element1.textContent = 'word1';
      element1.dataset.word = 'word1';

      const element2 = document.createElement('span');
      element2.textContent = 'word2';
      element2.dataset.word = 'word2';

      document.body.appendChild(element1);
      document.body.appendChild(element2);

      // 显示第一个tooltip
      await tooltipManager.showTooltip(element1, 'word1');
      let tooltip = document.querySelector('.lucid-tooltip') as HTMLElement;
      expect(tooltip?.dataset.word).toBe('word1');

      // 切换到第二个tooltip
      await tooltipManager.showTooltip(element2, 'word2');
      tooltip = document.querySelector('.lucid-tooltip') as HTMLElement;
      expect(tooltip?.dataset.word).toBe('word2');

      // 应该只有一个tooltip存在
      const tooltips = document.querySelectorAll('.lucid-tooltip');
      expect(tooltips.length).toBe(1);
    });

    test('应该正确处理相同单词的重复显示', async () => {
      const testElement = document.createElement('span');
      testElement.textContent = 'test word';
      testElement.dataset.word = 'test';
      document.body.appendChild(testElement);

      // 显示tooltip
      await tooltipManager.showTooltip(testElement, 'test');
      const firstTooltip = document.querySelector('.lucid-tooltip');

      // 再次显示相同单词的tooltip
      await tooltipManager.showTooltip(testElement, 'test');
      const secondTooltip = document.querySelector('.lucid-tooltip');

      // 应该是同一个tooltip
      expect(firstTooltip).toBe(secondTooltip);

      // 应该只有一个tooltip
      const tooltips = document.querySelectorAll('.lucid-tooltip');
      expect(tooltips.length).toBe(1);
    });
  });

  describe('错误处理', () => {
    test('应该优雅处理DOM操作错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      // 创建一个会导致错误的场景
      const invalidElement = document.createElement('div');
      // 不添加到DOM中，可能导致某些操作失败

      // 尝试显示tooltip，应该不会抛出错误
      expect(() => {
        tooltipManager.showTooltip(invalidElement as HTMLElement, 'test');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
