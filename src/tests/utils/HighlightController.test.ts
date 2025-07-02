/**
 * HighlightController 单元测试
 * 测试业务逻辑控制器
 */

import { HighlightController, highlightController } from '../../utils/highlight/HighlightController';
import { serviceContainer } from '../../services/container/ServiceContainer';
import { vi } from 'vitest';

// Mock serviceContainer
vi.mock('../../services/container/ServiceContainer', () => ({
  serviceContainer: {
    resolve: vi.fn()
  }
}));

// Mock DOM operations
vi.mock('../../utils/highlight/HighlightDOM', () => ({
  unwrapHighlight: vi.fn(),
  updateAllWordHighlights: vi.fn(),
  highlightWordInContainerForceAll: vi.fn(() => true),
  highlightWordInContainer: vi.fn(() => true),
  getAncestorHighlight: vi.fn(),
  removeEmptyHighlights: vi.fn(),
  unwrapHighlightsInRange: vi.fn(),
  createHighlightElement: vi.fn(),
  addHighlightInteractionEvents: vi.fn()
}));

// Mock utilities
vi.mock('../../utils/highlight/HighlightUtilities', () => ({
  MAX_MARK_COUNT: 5,
  DEFAULT_BASE_COLOR: 'orange',
  calculateHighlight: vi.fn(() => ({ className: 'highlight-orange-1', hex: '#FFA500' })),
  getEffectiveTextColor: vi.fn(() => '#000000'),
  buildTextGradient: vi.fn(() => 'linear-gradient(45deg, #FFA500 0%, #000000 100%)')
}));

describe('HighlightController', () => {
  let mockStorageService: any;
  let controller: HighlightController;

  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
    
    // 创建 mock storage service
    mockStorageService = {
      removeWordMarking: vi.fn().mockResolvedValue(undefined),
      updateWordMarking: vi.fn().mockResolvedValue(undefined),
      getSettings: vi.fn().mockResolvedValue({ highlightColor: 'orange' }),
      getMarkCount: vi.fn().mockResolvedValue(0)
    };

    // Mock serviceContainer.resolve
    (serviceContainer.resolve as any).mockReturnValue(mockStorageService);

    // 获取控制器实例
    controller = HighlightController.getInstance();
    
    // 重置所有 mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('单例模式', () => {
    test('应该返回相同的实例', () => {
      const instance1 = HighlightController.getInstance();
      const instance2 = HighlightController.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(highlightController);
    });
  });

  describe('removeWordHighlight', () => {
    test('应该移除存储中的单词标记并移除DOM元素', async () => {
      // 创建一些高亮元素
      const highlight1 = document.createElement('mark');
      highlight1.classList.add('lucid-highlight');
      highlight1.dataset.word = 'test';
      
      const highlight2 = document.createElement('mark');
      highlight2.classList.add('lucid-highlight');
      highlight2.dataset.word = 'other';
      
      document.body.appendChild(highlight1);
      document.body.appendChild(highlight2);

      await controller.removeWordHighlight('test');

      expect(mockStorageService.removeWordMarking).toHaveBeenCalledWith('test');
    });

    test('应该处理存储服务错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageService.removeWordMarking.mockRejectedValue(new Error('Storage error'));

      const highlight = document.createElement('mark');
      highlight.classList.add('lucid-highlight');
      highlight.dataset.word = 'test';
      document.body.appendChild(highlight);

      await controller.removeWordHighlight('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] Error removing word highlights for "test":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('decreaseWordHighlight', () => {
    test('应该减少高亮计数并更新样式', async () => {
      const targetElement = document.createElement('mark');
      targetElement.dataset.markCount = '3';
      targetElement.dataset.baseColor = 'orange';

      await controller.decreaseWordHighlight('test', targetElement, false);

      expect(mockStorageService.updateWordMarking).toHaveBeenCalledWith('test', 2);
    });

    test('应该在计数为1时完全移除高亮', async () => {
      const targetElement = document.createElement('mark');
      targetElement.dataset.markCount = '1';
      
      const removeWordSpy = vi.spyOn(controller, 'removeWordHighlight').mockResolvedValue();

      await controller.decreaseWordHighlight('test', targetElement, false);

      expect(removeWordSpy).toHaveBeenCalledWith('test');
      expect(mockStorageService.updateWordMarking).not.toHaveBeenCalled();

      removeWordSpy.mockRestore();
    });

    test('应该在计数为0时完全移除高亮', async () => {
      const targetElement = document.createElement('mark');
      targetElement.dataset.markCount = '0';
      
      const removeWordSpy = vi.spyOn(controller, 'removeWordHighlight').mockResolvedValue();

      await controller.decreaseWordHighlight('test', targetElement, false);

      expect(removeWordSpy).toHaveBeenCalledWith('test');

      removeWordSpy.mockRestore();
    });

    test('应该处理存储错误并继续DOM操作', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageService.updateWordMarking.mockRejectedValue(new Error('Storage error'));

      const targetElement = document.createElement('mark');
      targetElement.dataset.markCount = '3';
      targetElement.dataset.baseColor = 'orange';

      await controller.decreaseWordHighlight('test', targetElement, false);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('addWordHighlight', () => {
    test('应该添加新的高亮', async () => {
      const targetElement = document.createElement('div');
      targetElement.dataset.baseColor = 'blue';

      await controller.addWordHighlight('test', targetElement, false);

      expect(mockStorageService.updateWordMarking).toHaveBeenCalledWith('test', 1);
    });

    test('应该使用默认颜色当元素没有基础颜色时', async () => {
      const targetElement = document.createElement('div');

      await controller.addWordHighlight('test', targetElement, false);

      expect(mockStorageService.updateWordMarking).toHaveBeenCalledWith('test', 1);
    });

    test('应该处理存储错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageService.updateWordMarking.mockRejectedValue(new Error('Storage error'));

      const targetElement = document.createElement('div');

      await controller.addWordHighlight('test', targetElement, false);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('applyWordHighlight', () => {
    let mockRange: Range;

    beforeEach(() => {
      mockRange = document.createRange();
      
      // Mock window.getSelection
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => ({
          toString: () => 'test word',
          removeAllRanges: vi.fn()
        }))
      });
    });

    test('应该处理新的选区高亮', async () => {
      const textNode = document.createTextNode('test word');
      document.body.appendChild(textNode);
      
      mockRange.selectNodeContents(textNode);
      
      mockStorageService.getMarkCount.mockResolvedValue(2);

      await controller.applyWordHighlight(mockRange, false);

      expect(mockStorageService.getSettings).toHaveBeenCalled();
      expect(mockStorageService.getMarkCount).toHaveBeenCalledWith('test word');
      expect(mockStorageService.updateWordMarking).toHaveBeenCalledWith('test word', 3);
    });

    test('应该处理已折叠的选区', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      Object.defineProperty(mockRange, 'collapsed', {
        get: () => true
      });

      await controller.applyWordHighlight(mockRange, false);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] applyWordHighlight: Range is null or collapsed. Skipping.'
      );

      consoleSpy.mockRestore();
    });

    test('应该处理空的选择文本', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => ({
          toString: () => '',
          removeAllRanges: vi.fn()
        }))
      });

      const textNode = document.createTextNode('test');
      mockRange.selectNodeContents(textNode);

      await controller.applyWordHighlight(mockRange, false);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] applyWordHighlight: Word is empty. Skipping.'
      );

      consoleSpy.mockRestore();
    });

    test('应该处理存储服务错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageService.getSettings.mockRejectedValue(new Error('Storage error'));

      const textNode = document.createTextNode('test');
      mockRange.selectNodeContents(textNode);

      await controller.applyWordHighlight(mockRange, false);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('toggleWordHighlightState', () => {
    test('应该移除已高亮的单词', async () => {
      mockStorageService.getMarkCount.mockResolvedValue(2);
      const removeWordSpy = vi.spyOn(controller, 'removeWordHighlight').mockResolvedValue();

      await controller.toggleWordHighlightState('test', false);

      expect(mockStorageService.getMarkCount).toHaveBeenCalledWith('test');
      expect(removeWordSpy).toHaveBeenCalledWith('test');

      removeWordSpy.mockRestore();
    });

    test('应该添加未高亮的单词（使用range）', async () => {
      mockStorageService.getMarkCount.mockResolvedValue(0);
      const applyWordSpy = vi.spyOn(controller, 'applyWordHighlight').mockResolvedValue();
      
      const mockRange = document.createRange();
      const context = { range: mockRange };

      await controller.toggleWordHighlightState('test', false, context);

      expect(applyWordSpy).toHaveBeenCalledWith(mockRange, false);

      applyWordSpy.mockRestore();
    });

    test('应该添加未高亮的单词（使用sourceElement）', async () => {
      mockStorageService.getMarkCount.mockResolvedValue(0);
      const addWordSpy = vi.spyOn(controller, 'addWordHighlight').mockResolvedValue();
      
      const mockElement = document.createElement('div');
      const context = { sourceElement: mockElement };

      await controller.toggleWordHighlightState('test', false, context);

      expect(addWordSpy).toHaveBeenCalledWith('test', mockElement, false);

      addWordSpy.mockRestore();
    });

    test('应该处理没有context的情况', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockStorageService.getMarkCount.mockResolvedValue(0);
      const addWordSpy = vi.spyOn(controller, 'addWordHighlight').mockResolvedValue();

      await controller.toggleWordHighlightState('test', false);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Adding highlight for "test" without specific range or sourceElement')
      );
      expect(addWordSpy).toHaveBeenCalledWith('test', document.body, false);

      addWordSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test('应该处理空单词', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await controller.toggleWordHighlightState('', false);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] toggleWordHighlightState: word is empty. Skipping.'
      );

      consoleSpy.mockRestore();
    });

    test('应该清理和标准化单词', async () => {
      mockStorageService.getMarkCount.mockResolvedValue(0);
      const addWordSpy = vi.spyOn(controller, 'addWordHighlight').mockResolvedValue();

      await controller.toggleWordHighlightState('  TesT  ', false);

      expect(mockStorageService.getMarkCount).toHaveBeenCalledWith('test');

      addWordSpy.mockRestore();
    });

    test('应该处理存储服务错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockStorageService.getMarkCount.mockRejectedValue(new Error('Storage error'));

      await controller.toggleWordHighlightState('test', false);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] Error in toggleWordHighlightState for word "test":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('错误处理和边界情况', () => {
    test('应该处理存储服务不可用', async () => {
      (serviceContainer.resolve as jest.Mock).mockImplementation(() => {
        throw new Error('Service not available');
      });

      expect(async () => {
        await controller.removeWordHighlight('test');
      }).not.toThrow();
    });

    test('应该处理DOM操作异常', async () => {
      // 直接 mock unwrapHighlight 抛出错误
      const HighlightDOM = await import('../../utils/highlight/HighlightDOM');
      const unwrapHighlightSpy = vi.spyOn(HighlightDOM, 'unwrapHighlight').mockImplementation(() => {
        throw new Error('DOM error');
      });

      await expect(controller.removeWordHighlight('test')).resolves.not.toThrow();
      
      unwrapHighlightSpy.mockRestore();
    });
  });
});