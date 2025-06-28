/**
 * 简化版 Tooltip 管理器集成测试
 * 测试基本的 Tooltip 和 Toolfull 切换功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TooltipManager } from '@utils/dom/managers/tooltip/TooltipManager';

// Mock PopupService
vi.mock('@services/PopupService', () => ({
  popupService: {
    show: vi.fn(),
    hide: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock DataService
vi.mock('@services/DataService', () => ({
  dataService: {
    getWordDetails: vi.fn(),
  },
}));

describe('简化版 Tooltip 管理器集成测试', () => {
  let tooltipManager: TooltipManager;
  let testElement: HTMLElement;

  beforeEach(() => {
    // 创建测试元素
    testElement = document.createElement('div');
    testElement.textContent = 'test word';
    document.body.appendChild(testElement);

    // 获取管理器实例
    tooltipManager = TooltipManager.getInstance();
  });

  afterEach(() => {
    // 清理
    tooltipManager.destroy();
    document.body.removeChild(testElement);
    vi.clearAllMocks();
  });

  describe('基本功能', () => {
    it('应该能够显示简单的 tooltip', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        phonetic: '/test/',
        partOfSpeech: 'n.',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);

      // 验证状态
      expect(tooltipManager.isVisible()).toBe(true);
      expect(tooltipManager.getCurrentWord()).toBe('test');
      expect(tooltipManager.getCurrentMode()).toBe('simple');
    });

    it('应该能够隐藏 tooltip', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);
      tooltipManager.hideTooltip();

      expect(tooltipManager.isVisible()).toBe(false);
    });

    it('应该能够切换到详细模式', async () => {
      // Mock 详细数据
      const mockDetailedData = {
        word: 'test',
        phonetic: { us: '/test/', uk: '/test/' },
        explain: [{
          pos: 'n.',
          definitions: [{
            definition: 'a procedure intended to establish the quality',
            chinese: '测试',
            chinese_short: '测试',
          }],
        }],
      };

      const { dataService } = await import('@services/DataService');
      vi.mocked(dataService.getWordDetails).mockResolvedValue(mockDetailedData);

      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);
      await tooltipManager.showDetailedView('test', testElement);

      expect(tooltipManager.getCurrentMode()).toBe('detailed');
      expect(tooltipManager.getDetailedData()).toEqual(mockDetailedData);
    });
  });

  describe('事件处理', () => {
    it('应该能够处理键盘事件', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);

      // 模拟 Escape 键
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      tooltipManager.handleKeyboardEvent(escapeEvent);

      expect(tooltipManager.isVisible()).toBe(false);
    });

    it('应该能够处理展开和收起', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);

      // 测试展开
      tooltipManager.toggleExpanded();
      expect(tooltipManager.isExpanded()).toBe(true);

      // 测试收起
      tooltipManager.toggleExpanded();
      expect(tooltipManager.isExpanded()).toBe(false);
    });
  });

  describe('状态管理', () => {
    it('应该能够获取当前状态', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);

      const state = tooltipManager.getCurrentState();
      expect(state.visible).toBe(true);
      expect(state.word).toBe('test');
    });

    it('应该能够获取统计信息', () => {
      const stats = tooltipManager.getStats();
      expect(stats).toBeDefined();
    });

    it('应该能够取消隐藏', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);
      tooltipManager.cancelHide();

      expect(tooltipManager.isVisible()).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该能够处理数据加载失败', async () => {
      const { dataService } = await import('@services/DataService');
      vi.mocked(dataService.getWordDetails).mockRejectedValue(new Error('Network error'));

      const options = {
        word: 'test',
        translation: '测试',
        targetElement: testElement,
      };

      await tooltipManager.showTooltip(options);
      
      // 尝试切换到详细模式（应该不会抛出错误）
      await expect(tooltipManager.showDetailedView('test', testElement)).resolves.not.toThrow();
    });

    it('应该能够处理无效的目标元素', async () => {
      const options = {
        word: 'test',
        translation: '测试',
        targetElement: null as any,
      };

      // 应该不会抛出错误
      await expect(tooltipManager.showTooltip(options)).resolves.not.toThrow();
    });
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = TooltipManager.getInstance();
      const instance2 = TooltipManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('应该在销毁后允许创建新实例', () => {
      const instance1 = TooltipManager.getInstance();
      instance1.destroy();

      const instance2 = TooltipManager.getInstance();
      expect(instance2).toBeDefined();
    });
  });
});
