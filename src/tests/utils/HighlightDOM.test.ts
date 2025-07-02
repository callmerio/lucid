/**
 * HighlightDOM 单元测试
 * 测试 DOM 操作和事件处理
 */

import {
  createHighlightElement,
  addHighlightInteractionEvents,
  addTooltipEvents,
  getAncestorHighlight,
  removeEmptyHighlights,
  unwrapHighlight,
  unwrapHighlightsInRange
} from '../../utils/highlight/HighlightDOM';
import { eventManager } from '../../utils/core/eventManager';
import { UI_EVENTS } from '../../constants/uiEvents';
import { vi } from 'vitest';

// Mock eventManager
vi.mock('../../utils/core/eventManager', () => ({
  eventManager: {
    dispatch: vi.fn()
  }
}));

describe('HighlightDOM', () => {
  let mockEventDispatch: any;

  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
    // 重置 mock
    vi.clearAllMocks();
    mockEventDispatch = eventManager.dispatch as any;
  });

  describe('createHighlightElement', () => {
    test('应该创建正确的高亮元素', () => {
      const element = createHighlightElement(
        'test',
        2,
        'highlight-orange-2',
        '#FF6347',
        'orange',
        '#000000'
      );

      expect(element.tagName).toBe('MARK');
      expect(element.classList.contains('lucid-highlight')).toBe(true);
      expect(element.classList.contains('highlight-orange-2')).toBe(true);
      expect(element.dataset.word).toBe('test');
      expect(element.dataset.markCount).toBe('2');
      expect(element.dataset.baseColor).toBe('orange');
      expect(element.dataset.interactionEventsAdded).toBe('true');
      expect(element.textContent).toBe('test');
    });

    test('应该设置正确的样式', () => {
      const element = createHighlightElement(
        'test',
        1,
        'highlight-orange-1',
        '#FFA500',
        'orange',
        '#000000'
      );

      expect(element.style.background).toContain('linear-gradient');
      expect(element.style.webkitBackgroundClip).toBe('text');
      expect(element.style.backgroundClip).toBe('text');
      expect(element.style.color).toBe('transparent');
    });

    test('应该设置时间戳', () => {
      const beforeTime = Date.now();
      const element = createHighlightElement(
        'test',
        1,
        'highlight-orange-1',
        '#FFA500',
        'orange',
        '#000000'
      );
      const afterTime = Date.now();

      const timestamp = parseInt(element.dataset.appliedTimestamp || '0');
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('addHighlightInteractionEvents', () => {
    test('应该添加鼠标事件监听器', () => {
      const element = document.createElement('div');
      addHighlightInteractionEvents(element, 'test');

      // 触发 mouseenter 事件
      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(mockEventDispatch).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_ENTER,
        {
          word: 'test',
          element: element,
          translation: 'Loading translation for "test"...'
        }
      );

      // 触发 mouseleave 事件
      const mouseLeaveEvent = new MouseEvent('mouseleave');
      element.dispatchEvent(mouseLeaveEvent);

      expect(mockEventDispatch).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_LEAVE,
        {
          word: 'test',
          element: element
        }
      );
    });

    test('应该处理事件分发错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockEventDispatch.mockImplementation(() => {
        throw new Error('Event dispatch failed');
      });

      const element = document.createElement('div');
      addHighlightInteractionEvents(element, 'test');

      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] Error dispatching highlight hover enter event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('addTooltipEvents (deprecated)', () => {
    test('应该记录废弃警告并调用新函数', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const element = document.createElement('div');
      
      addTooltipEvents(element, 'test');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Lucid] addTooltipEvents is deprecated, use addHighlightInteractionEvents instead'
      );

      // 验证事件仍然被添加
      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);

      expect(mockEventDispatch).toHaveBeenCalledWith(
        UI_EVENTS.HIGHLIGHT.HOVER_ENTER,
        expect.objectContaining({
          word: 'test',
          element: element
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getAncestorHighlight', () => {
    test('应该找到祖先高亮元素', () => {
      const highlightElement = document.createElement('mark');
      highlightElement.classList.add('lucid-highlight');
      highlightElement.dataset.word = 'test';

      const textNode = document.createTextNode('test');
      highlightElement.appendChild(textNode);
      document.body.appendChild(highlightElement);

      const result = getAncestorHighlight(textNode);
      expect(result).toBe(highlightElement);
    });

    test('应该在没有高亮祖先时返回null', () => {
      const div = document.createElement('div');
      const textNode = document.createTextNode('test');
      div.appendChild(textNode);
      document.body.appendChild(div);

      const result = getAncestorHighlight(textNode);
      expect(result).toBeNull();
    });

    test('应该处理元素节点', () => {
      const highlightElement = document.createElement('mark');
      highlightElement.classList.add('lucid-highlight');
      
      const span = document.createElement('span');
      highlightElement.appendChild(span);
      document.body.appendChild(highlightElement);

      const result = getAncestorHighlight(span);
      expect(result).toBe(highlightElement);
    });
  });

  describe('removeEmptyHighlights', () => {
    test('应该移除空的高亮元素', () => {
      // 创建空高亮元素
      const emptyHighlight = document.createElement('mark');
      emptyHighlight.classList.add('lucid-highlight');
      document.body.appendChild(emptyHighlight);

      // 创建有内容的高亮元素
      const nonEmptyHighlight = document.createElement('mark');
      nonEmptyHighlight.classList.add('lucid-highlight');
      nonEmptyHighlight.textContent = 'test';
      document.body.appendChild(nonEmptyHighlight);

      expect(document.querySelectorAll('.lucid-highlight')).toHaveLength(2);

      removeEmptyHighlights();

      const remainingHighlights = document.querySelectorAll('.lucid-highlight');
      expect(remainingHighlights).toHaveLength(1);
      expect(remainingHighlights[0]).toBe(nonEmptyHighlight);
    });

    test('应该移除只有空白字符的高亮元素', () => {
      const whitespaceHighlight = document.createElement('mark');
      whitespaceHighlight.classList.add('lucid-highlight');
      whitespaceHighlight.textContent = '   \n\t  ';
      document.body.appendChild(whitespaceHighlight);

      removeEmptyHighlights();

      expect(document.querySelectorAll('.lucid-highlight')).toHaveLength(0);
    });
  });

  describe('unwrapHighlight', () => {
    test('应该解包高亮元素并保留内容', () => {
      const parent = document.createElement('div');
      const highlight = document.createElement('mark');
      highlight.classList.add('lucid-highlight');
      highlight.textContent = 'test content';
      
      parent.appendChild(highlight);
      document.body.appendChild(parent);

      unwrapHighlight(highlight);

      expect(parent.querySelector('.lucid-highlight')).toBeNull();
      expect(parent.textContent).toBe('test content');
    });

    test('应该处理有多个子节点的高亮元素', () => {
      const parent = document.createElement('div');
      const highlight = document.createElement('mark');
      highlight.classList.add('lucid-highlight');
      
      const textNode1 = document.createTextNode('hello ');
      const span = document.createElement('span');
      span.textContent = 'world';
      const textNode2 = document.createTextNode('!');
      
      highlight.appendChild(textNode1);
      highlight.appendChild(span);
      highlight.appendChild(textNode2);
      
      parent.appendChild(highlight);
      document.body.appendChild(parent);

      unwrapHighlight(highlight);

      expect(parent.querySelector('.lucid-highlight')).toBeNull();
      expect(parent.textContent).toBe('hello world!');
      expect(parent.querySelector('span')).toBeTruthy();
    });

    test('应该处理没有父元素的高亮元素', () => {
      const highlight = document.createElement('mark');
      highlight.classList.add('lucid-highlight');
      highlight.textContent = 'test';

      // 应该不会抛出错误
      expect(() => unwrapHighlight(highlight)).not.toThrow();
    });
  });

  describe('unwrapHighlightsInRange', () => {
    test('应该解包范围内的所有高亮元素', () => {
      const container = document.createElement('div');
      
      // 创建一些文本和高亮元素
      container.innerHTML = `
        Some text
        <mark class="lucid-highlight">highlighted1</mark>
        more text
        <mark class="lucid-highlight">highlighted2</mark>
        end text
      `;
      
      document.body.appendChild(container);

      // 创建选择整个容器的范围
      const range = document.createRange();
      range.selectNodeContents(container);

      unwrapHighlightsInRange(range);

      expect(container.querySelectorAll('.lucid-highlight')).toHaveLength(0);
      expect(container.textContent).toContain('highlighted1');
      expect(container.textContent).toContain('highlighted2');
    });

    test('应该只解包范围内的高亮元素', () => {
      const container = document.createElement('div');
      
      const highlight1 = document.createElement('mark');
      highlight1.classList.add('lucid-highlight');
      highlight1.textContent = 'outside';
      
      const targetDiv = document.createElement('div');
      const highlight2 = document.createElement('mark');
      highlight2.classList.add('lucid-highlight');
      highlight2.textContent = 'inside';
      targetDiv.appendChild(highlight2);
      
      container.appendChild(highlight1);
      container.appendChild(targetDiv);
      document.body.appendChild(container);

      // 创建只选择 targetDiv 的范围
      const range = document.createRange();
      range.selectNodeContents(targetDiv);

      unwrapHighlightsInRange(range);

      // 范围外的高亮应该保留
      expect(container.querySelector('.lucid-highlight')).toBe(highlight1);
      // 范围内的高亮应该被解包
      expect(targetDiv.querySelector('.lucid-highlight')).toBeNull();
      expect(targetDiv.textContent).toBe('inside');
    });

    test('应该处理空范围', () => {
      const range = document.createRange();
      // 不设置范围内容，创建一个空范围
      
      expect(() => unwrapHighlightsInRange(range)).not.toThrow();
    });
  });

  describe('DOM 操作边界测试', () => {
    test('应该处理malformed DOM结构', () => {
      // 创建一个没有正确嵌套的DOM结构
      const container = document.createElement('div');
      const highlight = document.createElement('mark');
      highlight.classList.add('lucid-highlight');
      
      // 直接将高亮元素添加到文档片段，不添加到DOM树
      const fragment = document.createDocumentFragment();
      fragment.appendChild(highlight);
      
      expect(() => unwrapHighlight(highlight)).not.toThrow();
    });

    test('应该处理循环引用的事件监听器', () => {
      const element = document.createElement('div');
      
      // 添加多次事件监听器
      addHighlightInteractionEvents(element, 'test1');
      addHighlightInteractionEvents(element, 'test2');
      
      // 触发事件应该正常工作
      const mouseEnterEvent = new MouseEvent('mouseenter');
      element.dispatchEvent(mouseEnterEvent);
      
      // 应该有两次调用
      expect(mockEventDispatch).toHaveBeenCalledTimes(2);
    });
  });
});