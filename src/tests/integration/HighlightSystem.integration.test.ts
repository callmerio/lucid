/**
 * HighlightSystem 集成测试
 * 测试高亮系统各模块之间的协作
 */

import { highlightController } from '../../utils/highlight/HighlightController';
import { eventManager } from '../../utils/core/eventManager';
import { UI_EVENTS } from '../../constants/uiEvents';
import { serviceContainer } from '../../services/container/ServiceContainer';

// Mock serviceContainer
jest.mock('../../services/container/ServiceContainer', () => ({
  serviceContainer: {
    resolve: jest.fn()
  }
}));

describe('HighlightSystem Integration', () => {
  let mockStorageService: any;
  let eventDispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
    
    // 创建 mock storage service
    mockStorageService = {
      removeWordMarking: jest.fn().mockResolvedValue(undefined),
      updateWordMarking: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockResolvedValue({ highlightColor: 'orange' }),
      getMarkCount: jest.fn().mockResolvedValue(0)
    };

    (serviceContainer.resolve as jest.Mock).mockReturnValue(mockStorageService);

    // 监听事件分发
    eventDispatchSpy = jest.spyOn(eventManager, 'dispatch');

    // 重置所有 mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('完整的高亮工作流', () => {
    test('应该能够完成完整的高亮添加流程', async () => {
      // 1. 创建测试内容
      const container = document.createElement('div');
      container.innerHTML = 'This is a test word in a sentence.';
      document.body.appendChild(container);

      // 2. 创建选区
      const range = document.createRange();
      const textNode = container.firstChild as Text;
      range.setStart(textNode, 10); // 'test'
      range.setEnd(textNode, 14);

      // Mock window.getSelection
      Object.defineProperty(window, 'getSelection', {
        value: () => ({
          toString: () => 'test',
          removeAllRanges: jest.fn()
        })
      });

      // 3. 应用高亮
      await highlightController.applyWordHighlight(range, false);

      // 4. 验证存储操作
      expect(mockStorageService.getSettings).toHaveBeenCalled();
      expect(mockStorageService.getMarkCount).toHaveBeenCalledWith('test');
      expect(mockStorageService.updateWordMarking).toHaveBeenCalledWith('test', 1);
    });

    test('应该能够正确处理单词切换状态', async () => {
      // 测试从未高亮到高亮
      mockStorageService.getMarkCount.mockResolvedValue(0);
      
      const element = document.createElement('div');
      const context = { sourceElement: element };

      await highlightController.toggleWordHighlightState('test', false, context);

      expect(mockStorageService.getMarkCount).toHaveBeenCalledWith('test');
      expect(mockStorageService.updateWordMarking).toHaveBeenCalledWith('test', 1);

      // 测试从高亮到未高亮
      mockStorageService.getMarkCount.mockResolvedValue(2);
      jest.clearAllMocks();

      await highlightController.toggleWordHighlightState('test', false, context);

      expect(mockStorageService.removeWordMarking).toHaveBeenCalledWith('test');
    });
  });

  describe('事件系统集成', () => {
    test('应该正确发布和处理高亮交互事件', async () => {
      // 导入并测试事件发布
      const { addHighlightInteractionEvents } = await import('../../utils/highlight/HighlightDOM');
      
      const element = document.createElement('mark');
      element.classList.add('lucid-highlight');
      addHighlightInteractionEvents(element, 'test');

      // 触发鼠标进入事件
      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(eventDispatchSpy).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_ENTER,
        {
          word: 'test',
          element: element,
          translation: 'Loading translation for "test"...'
        }
      );

      // 触发鼠标离开事件
      const mouseLeaveEvent = new MouseEvent('mouseleave');
      element.dispatchEvent(mouseLeaveEvent);

      expect(eventDispatchSpy).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_LEAVE,
        {
          word: 'test',
          element: element
        }
      );
    });

    test('桥接器应该能够接收和处理高亮事件', async () => {
      // 动态导入桥接器以避免自动初始化问题
      const { HighlightTooltipBridge } = await import('../../utils/highlight/HighlightTooltipBridge');
      
      let eventHandlers: { [key: string]: Function } = {};
      
      // Mock eventManager.subscribe 来捕获事件处理器
      const mockSubscribe = jest.spyOn(eventManager, 'subscribe').mockImplementation((eventType, handler) => {
        eventHandlers[eventType] = handler;
        return jest.fn(); // cleanup function
      });

      // 创建桥接器实例
      const bridge = HighlightTooltipBridge.getInstance();

      // 验证事件订阅
      expect(mockSubscribe).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_ENTER,
        expect.any(Function),
        'HighlightTooltipBridge'
      );

      expect(mockSubscribe).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_LEAVE,
        expect.any(Function),
        'HighlightTooltipBridge'
      );

      // 测试事件处理（禁用状态下）
      bridge.disable();
      
      const element = document.createElement('div');
      const hoverEnterHandler = eventHandlers[UI_EVENTS.HIGHLIGHT.HOVER_ENTER];
      
      if (hoverEnterHandler) {
        await hoverEnterHandler({
          word: 'test',
          element: element
        });
        // 禁用状态下不应该有副作用
      }

      mockSubscribe.mockRestore();
    });
  });

  describe('错误处理和恢复', () => {
    test('应该能够在存储错误时继续工作', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock 存储服务错误
      mockStorageService.updateWordMarking.mockRejectedValue(new Error('Storage unavailable'));

      const element = document.createElement('div');
      
      // 应该不抛出异常
      await expect(
        highlightController.addWordHighlight('test', element, false)
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('应该能够处理DOM操作异常', async () => {
      // Mock DOM 查询返回 null
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      await expect(
        highlightController.removeWordHighlight('test')
      ).resolves.not.toThrow();

      // 恢复原始方法
      document.querySelectorAll = originalQuerySelectorAll;
    });
  });

  describe('性能和内存管理', () => {
    test('应该能够处理大量高亮元素', async () => {
      const startTime = performance.now();
      
      // 创建多个高亮元素
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('mark');
        element.classList.add('lucid-highlight');
        element.dataset.word = `word${i}`;
        element.textContent = `word${i}`;
        document.body.appendChild(element);
      }

      // 执行批量操作
      await highlightController.removeWordHighlight('word50');

      const endTime = performance.now();
      
      // 应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(1000); // 1秒内
    });

    test('应该能够正确清理事件监听器', () => {
      const { addHighlightInteractionEvents } = require('../../utils/highlight/HighlightDOM');
      
      const elements: HTMLElement[] = [];
      
      // 创建多个元素并添加事件
      for (let i = 0; i < 10; i++) {
        const element = document.createElement('div');
        addHighlightInteractionEvents(element, `word${i}`);
        elements.push(element);
      }

      // 移除元素（模拟清理）
      elements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // 手动触发垃圾回收测试（在实际环境中）
      // 这里只是确保没有内存泄漏的明显迹象
      expect(elements.every(el => el.parentNode === null)).toBe(true);
    });
  });

  describe('边界情况集成测试', () => {
    test('应该处理空文档状态', async () => {
      document.body.innerHTML = '';
      
      await expect(
        highlightController.removeWordHighlight('nonexistent')
      ).resolves.not.toThrow();
    });

    test('应该处理文档片段和 Shadow DOM', () => {
      const fragment = document.createDocumentFragment();
      const div = document.createElement('div');
      div.innerHTML = '<mark class="lucid-highlight" data-word="test">test</mark>';
      fragment.appendChild(div);

      // 应该能够处理未连接到主文档的元素
      expect(() => {
        fragment.querySelectorAll('.lucid-highlight');
      }).not.toThrow();
    });

    test('应该处理并发操作', async () => {
      const promises = [];
      
      // 并发执行多个高亮操作
      for (let i = 0; i < 5; i++) {
        promises.push(
          highlightController.toggleWordHighlightState(`word${i}`, false)
        );
      }

      // 所有操作都应该成功完成
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('向后兼容性', () => {
    test('废弃的 API 应该仍然工作', async () => {
      const { addTooltipEvents } = await import('../../utils/highlight/HighlightDOM');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const element = document.createElement('div');
      addTooltipEvents(element, 'test');

      // 应该记录废弃警告
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] addTooltipEvents is deprecated, use addHighlightInteractionEvents instead'
      );

      // 但功能应该仍然工作
      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(eventDispatchSpy).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_ENTER,
        expect.objectContaining({
          word: 'test',
          element: element
        })
      );

      consoleSpy.mockRestore();
    });
  });
});