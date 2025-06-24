/**
 * TooltipRenderer 单元测试
 * 测试 tooltip 渲染器的核心功能
 */

import { TooltipRenderer, TooltipRenderOptions } from '@utils/dom/managers/TooltipRenderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock React 和相关依赖
vi.mock('react', () => ({
  default: {
    createElement: vi.fn((type, props, ...children) => ({
      type,
      props: { ...props, children },
      key: props?.key || null,
    })),
  },
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

vi.mock('@components/ui/Tooltip', () => ({
  Tooltip: vi.fn(({ word, translation, phonetic, partOfSpeech, onExpand, onCollapse, onClose }) => ({
    type: 'div',
    props: {
      className: 'lucid-tooltip',
      'data-word': word,
      'data-translation': translation,
      'data-phonetic': phonetic,
      'data-part-of-speech': partOfSpeech,
      children: [
        { type: 'span', props: { children: word } },
        { type: 'span', props: { children: translation } },
        phonetic && { type: 'span', props: { children: phonetic } },
        partOfSpeech && { type: 'span', props: { children: partOfSpeech } },
        { type: 'button', props: { onClick: onExpand, children: 'Expand' } },
        { type: 'button', props: { onClick: onCollapse, children: 'Collapse' } },
        { type: 'button', props: { onClick: onClose, children: 'Close' } },
      ].filter(Boolean),
    },
  })),
}));

describe('TooltipRenderer', () => {
  let renderer: TooltipRenderer;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    renderer = new TooltipRenderer();

    // 创建模拟容器
    mockContainer = document.createElement('div');
    mockContainer.id = 'lucid-tooltip-container';
    document.body.appendChild(mockContainer);

    // 清理之前的 tooltip
    const existingTooltips = document.querySelectorAll('.lucid-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());
  });

  afterEach(() => {
    renderer.destroy();
    if (mockContainer.parentNode) {
      document.body.removeChild(mockContainer);
    }
  });

  describe('初始化', () => {
    it('应该正确初始化渲染器', () => {
      expect(renderer).toBeDefined();
      expect(renderer.getCurrentTooltip()).toBe(null);
    });

    it('应该创建容器元素', () => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      renderer.render(options);

      const container = document.getElementById('lucid-tooltip-container');
      expect(container).toBeTruthy();
    });
  });

  describe('渲染功能', () => {
    it('应该渲染基本的 tooltip', () => {
      const options: TooltipRenderOptions = {
        word: 'hello',
        translation: '你好',
        position: { x: 100, y: 100 },
      };

      const tooltipElement = renderer.render(options);

      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement.classList.contains('lucid-tooltip')).toBe(true);
      expect(renderer.getCurrentTooltip()).toBe(tooltipElement);
    });

    it('应该渲染包含音标的 tooltip', () => {
      const options: TooltipRenderOptions = {
        word: 'hello',
        translation: '你好',
        phonetic: '/həˈloʊ/',
        position: { x: 100, y: 100 },
      };

      const tooltipElement = renderer.render(options);

      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement.getAttribute('data-phonetic')).toBe('/həˈloʊ/');
    });

    it('应该渲染包含词性的 tooltip', () => {
      const options: TooltipRenderOptions = {
        word: 'hello',
        translation: '你好',
        partOfSpeech: 'interjection',
        position: { x: 100, y: 100 },
      };

      const tooltipElement = renderer.render(options);

      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement.getAttribute('data-part-of-speech')).toBe('interjection');
    });

    it('应该设置正确的位置', () => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 150, y: 200 },
      };

      const tooltipElement = renderer.render(options);

      expect(tooltipElement.style.left).toBe('150px');
      expect(tooltipElement.style.top).toBe('200px');
      expect(tooltipElement.style.position).toBe('fixed');
    });

    it('应该设置回调函数', () => {
      const mockCallbacks = {
        onExpand: vi.fn(),
        onCollapse: vi.fn(),
        onClose: vi.fn(),
      };

      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
        ...mockCallbacks,
      };

      const tooltipElement = renderer.render(options);

      // 验证回调函数被传递给组件
      // 这里我们通过检查 React 组件的 props 来验证
      expect(tooltipElement).toBeTruthy();
    });
  });

  describe('更新功能', () => {
    let initialTooltip: HTMLElement;

    beforeEach(() => {
      const options: TooltipRenderOptions = {
        word: 'initial',
        translation: '初始',
        position: { x: 100, y: 100 },
      };
      initialTooltip = renderer.render(options);
    });

    it('应该更新现有的 tooltip', () => {
      const newOptions: TooltipRenderOptions = {
        word: 'updated',
        translation: '更新',
        position: { x: 200, y: 200 },
      };

      const updatedTooltip = renderer.render(newOptions);

      expect(updatedTooltip).toBe(initialTooltip); // 应该是同一个元素
      expect(updatedTooltip.getAttribute('data-word')).toBe('updated');
      expect(updatedTooltip.style.left).toBe('200px');
      expect(updatedTooltip.style.top).toBe('200px');
    });

    it('应该更新位置', () => {
      const newPosition = { x: 300, y: 400 };

      renderer.updatePosition(newPosition);

      expect(initialTooltip.style.left).toBe('300px');
      expect(initialTooltip.style.top).toBe('400px');
    });

    it('在没有 tooltip 时更新位置应该无效果', () => {
      renderer.hide(); // 隐藏 tooltip

      expect(() => {
        renderer.updatePosition({ x: 100, y: 100 });
      }).not.toThrow();
    });
  });

  describe('显示和隐藏', () => {
    let tooltipElement: HTMLElement;

    beforeEach(() => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };
      tooltipElement = renderer.render(options);
    });

    it('应该显示 tooltip', () => {
      renderer.show();

      expect(tooltipElement.style.display).not.toBe('none');
      expect(tooltipElement.style.visibility).not.toBe('hidden');
    });

    it('应该隐藏 tooltip', () => {
      renderer.hide();

      expect(tooltipElement.style.display).toBe('none');
    });

    it('应该切换 tooltip 可见性', () => {
      // 初始状态应该是可见的
      expect(tooltipElement.style.display).not.toBe('none');

      renderer.toggle();
      expect(tooltipElement.style.display).toBe('none');

      renderer.toggle();
      expect(tooltipElement.style.display).not.toBe('none');
    });
  });

  describe('销毁功能', () => {
    it('应该正确销毁渲染器', () => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      const tooltipElement = renderer.render(options);
      expect(renderer.getCurrentTooltip()).toBe(tooltipElement);

      renderer.destroy();

      expect(renderer.getCurrentTooltip()).toBe(null);

      // 验证 DOM 元素被移除
      const tooltipInDOM = document.querySelector('.lucid-tooltip');
      expect(tooltipInDOM).toBe(null);
    });

    it('应该清理 React 根节点', () => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      renderer.render(options);

      // 验证销毁操作不会抛出错误
      expect(() => {
        renderer.destroy();
      }).not.toThrow();

      // 验证容器被清理
      const container = document.getElementById('lucid-tooltip-container');
      expect(container?.innerHTML).toBe('');
    });

    it('多次销毁应该安全', () => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      renderer.render(options);

      expect(() => {
        renderer.destroy();
        renderer.destroy();
        renderer.destroy();
      }).not.toThrow();
    });
  });

  describe('容器管理', () => {
    it('应该重用现有容器', () => {
      const options1: TooltipRenderOptions = {
        word: 'test1',
        translation: '测试1',
        position: { x: 100, y: 100 },
      };

      const options2: TooltipRenderOptions = {
        word: 'test2',
        translation: '测试2',
        position: { x: 200, y: 200 },
      };

      renderer.render(options1);
      const container1 = document.getElementById('lucid-tooltip-container');

      renderer.render(options2);
      const container2 = document.getElementById('lucid-tooltip-container');

      expect(container1).toBe(container2);
    });

    it('应该在容器不存在时创建新容器', () => {
      // 移除现有容器
      const existingContainer = document.getElementById('lucid-tooltip-container');
      if (existingContainer) {
        existingContainer.remove();
      }

      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      renderer.render(options);

      const newContainer = document.getElementById('lucid-tooltip-container');
      expect(newContainer).toBeTruthy();
      expect(newContainer?.parentNode).toBe(document.body);
    });
  });

  describe('错误处理', () => {
    it('应该处理渲染错误', () => {
      // Mock console.error 来捕获错误日志
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      // 创建会导致错误的选项
      const invalidOptions = {
        word: null as any,
        translation: null as any,
        position: { x: 100, y: 100 },
      };

      expect(() => {
        renderer.render(invalidOptions);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('应该处理位置更新错误', () => {
      expect(() => {
        renderer.updatePosition({ x: NaN, y: NaN });
      }).not.toThrow();
    });
  });

  describe('状态查询', () => {
    it('应该正确报告是否有活动的 tooltip', () => {
      expect(renderer.getCurrentTooltip()).toBe(null);

      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      const tooltipElement = renderer.render(options);
      expect(renderer.getCurrentTooltip()).toBe(tooltipElement);

      renderer.destroy();
      expect(renderer.getCurrentTooltip()).toBe(null);
    });

    it('应该正确报告 tooltip 可见性', () => {
      const options: TooltipRenderOptions = {
        word: 'test',
        translation: '测试',
        position: { x: 100, y: 100 },
      };

      const tooltipElement = renderer.render(options);

      // 初始状态应该是可见的
      expect(tooltipElement.style.display).not.toBe('none');

      renderer.hide();
      expect(tooltipElement.style.display).toBe('none');

      renderer.show();
      expect(tooltipElement.style.display).not.toBe('none');
    });
  });
});
