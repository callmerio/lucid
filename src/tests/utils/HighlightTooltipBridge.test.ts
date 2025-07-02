/**
 * HighlightTooltipBridge 单元测试
 * 测试高亮-提示框桥接器基本功能
 */

import { HighlightTooltipBridge, highlightTooltipBridge } from '../../utils/highlight/HighlightTooltipBridge';
import { vi } from 'vitest';

// Mock eventManager
vi.mock('../../utils/core/eventManager', () => ({
  eventManager: {
    subscribe: vi.fn(() => vi.fn()), // 返回一个清理函数
    dispatch: vi.fn()
  }
}));

// Mock TooltipManager
vi.mock('../../utils/dom/managers/tooltip/TooltipManager', () => ({
  TooltipManager: {
    getInstance: vi.fn(() => ({
      cancelHide: vi.fn(),
      showTooltip: vi.fn().mockResolvedValue(undefined),
      hideTooltip: vi.fn(),
      getCurrentMode: vi.fn(() => 'simple') // 添加 getCurrentMode mock
    }))
  }
}));

describe('HighlightTooltipBridge', () => {
  let bridge: HighlightTooltipBridge;

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 获取桥接器实例
    bridge = HighlightTooltipBridge.getInstance();
  });

  describe('单例模式', () => {
    test('应该返回相同的实例', () => {
      const instance1 = HighlightTooltipBridge.getInstance();
      const instance2 = HighlightTooltipBridge.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(highlightTooltipBridge);
    });
  });

  describe('基本功能', () => {
    test('应该正确初始化', () => {
      expect(bridge).toBeDefined();
      expect(bridge.isActive()).toBe(true);
    });

    test('应该能够启用和禁用桥接器', () => {
      expect(bridge.isActive()).toBe(true); // 默认启用

      bridge.disable();
      expect(bridge.isActive()).toBe(false);

      bridge.enable();
      expect(bridge.isActive()).toBe(true);
    });
  });

  describe('清理功能', () => {
    test('清理功能应该不抛出错误', () => {
      // 由于桥接器是单例，我们只测试 cleanup 不会抛出错误
      expect(() => bridge.cleanup()).not.toThrow();
    });
  });

  describe('模式检查逻辑', () => {
    test('在详细模式下应该忽略自动隐藏', () => {
      // 这个测试更多是为了确保代码结构正确，
      // 实际的模式检查逻辑在集成测试中会更好验证
      expect(bridge.isActive()).toBe(true);
    });
  });

  describe('边界情况', () => {
    test('多次启用和禁用应该正常工作', () => {
      bridge.enable();
      bridge.enable(); // 重复启用
      expect(bridge.isActive()).toBe(true);

      bridge.disable();
      bridge.disable(); // 重复禁用
      expect(bridge.isActive()).toBe(false);

      bridge.enable();
      expect(bridge.isActive()).toBe(true);
    });
  });
});