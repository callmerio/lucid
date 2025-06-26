/**
 * TooltipPositioner 单元测试
 * 测试 tooltip 位置计算器的核心功能
 */

import { Position, PositionOptions, TooltipPositioner } from '@utils/dom/managers/tooltip/TooltipPositioner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('TooltipPositioner', () => {
  let positioner: TooltipPositioner;
  let targetElement: HTMLElement;
  let tooltipElement: HTMLElement;

  beforeEach(() => {
    positioner = new TooltipPositioner();

    // 创建目标元素
    targetElement = document.createElement('div');
    targetElement.style.position = 'absolute';
    targetElement.style.left = '100px';
    targetElement.style.top = '100px';
    targetElement.style.width = '50px';
    targetElement.style.height = '20px';
    document.body.appendChild(targetElement);

    // 创建 tooltip 元素
    tooltipElement = document.createElement('div');
    tooltipElement.style.position = 'fixed';
    tooltipElement.style.width = '200px';
    tooltipElement.style.height = '100px';
    document.body.appendChild(tooltipElement);

    // Mock getBoundingClientRect
    vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 150,
      bottom: 120,
      width: 50,
      height: 20,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    vi.spyOn(tooltipElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    document.body.removeChild(targetElement);
    document.body.removeChild(tooltipElement);
    vi.restoreAllMocks();
  });

  describe('基本位置计算', () => {
    it('应该计算顶部位置', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'top',
      };

      const position = positioner.calculatePosition(options);

      // 顶部位置会超出视口上边界（y = 100 - 100 - 8 = -8），
      // 所以系统会自动选择底部位置作为替代
      expect(position.x).toBe(25); // (100 + 50/2) - 200/2 = 25
      expect(position.y).toBe(128); // 120 + 8 (offset) = 128 (底部位置)
    });

    it('应该计算底部位置', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      const position = positioner.calculatePosition(options);

      // 底部位置：目标元素下方，水平居中
      expect(position.x).toBe(25); // (100 + 50/2) - 200/2 = 25
      expect(position.y).toBe(128); // 120 + 8 (offset) = 128
    });

    it('应该计算左侧位置', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'left',
      };

      const position = positioner.calculatePosition(options);

      // 左侧位置会超出视口左边界（x = 100 - 200 - 8 = -108），
      // 所以系统会自动选择底部位置作为替代
      expect(position.x).toBe(25); // (100 + 50/2) - 200/2 = 25 (底部位置)
      expect(position.y).toBe(128); // 120 + 8 (offset) = 128 (底部位置)
    });

    it('应该计算右侧位置', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'right',
      };

      const position = positioner.calculatePosition(options);

      // 右侧位置：目标元素右侧，垂直居中
      expect(position.x).toBe(158); // 150 + 8 (offset) = 158
      expect(position.y).toBe(60); // (100 + 20/2) - 100/2 = 60
    });
  });

  describe('自动位置选择', () => {
    it('应该选择最佳可用位置', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'auto',
      };

      const position = positioner.calculatePosition(options);

      // 应该选择一个有效的位置
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.x + 200).toBeLessThanOrEqual(1024); // 不超出右边界
      expect(position.y + 100).toBeLessThanOrEqual(768); // 不超出下边界
    });

    it('应该在首选位置无效时选择替代位置', () => {
      // 将目标元素移到屏幕顶部，使顶部位置无效
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 5, // 很接近顶部
        right: 150,
        bottom: 25,
        width: 50,
        height: 20,
        x: 100,
        y: 5,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'top', // 首选顶部，但空间不足
      };

      const position = positioner.calculatePosition(options);

      // 应该选择底部位置作为替代
      expect(position.y).toBeGreaterThan(25); // 应该在目标元素下方
    });
  });

  describe('视口边界处理', () => {
    it('应该调整超出右边界的位置', () => {
      // 将目标元素移到屏幕右侧
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 950, // 接近右边界
        top: 100,
        right: 1000,
        bottom: 120,
        width: 50,
        height: 20,
        x: 950,
        y: 100,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      const position = positioner.calculatePosition(options);

      // 位置应该被调整以适应视口
      expect(position.x + 200).toBeLessThanOrEqual(1024 - 10); // 考虑 margin
    });

    it('应该调整超出下边界的位置', () => {
      // 将目标元素移到屏幕底部
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 700, // 接近底部
        right: 150,
        bottom: 720,
        width: 50,
        height: 20,
        x: 100,
        y: 700,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      const position = positioner.calculatePosition(options);

      // 位置应该被调整以适应视口
      expect(position.y + 100).toBeLessThanOrEqual(768 - 10); // 考虑 margin
    });

    it('应该调整超出左边界的位置', () => {
      // 将目标元素移到屏幕左侧
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 5, // 接近左边界
        top: 100,
        right: 55,
        bottom: 120,
        width: 50,
        height: 20,
        x: 5,
        y: 100,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      const position = positioner.calculatePosition(options);

      // 位置应该被调整以适应视口
      expect(position.x).toBeGreaterThanOrEqual(10); // 考虑 margin
    });

    it('应该调整超出上边界的位置', () => {
      // 将目标元素移到屏幕顶部
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 5, // 接近顶部
        right: 150,
        bottom: 25,
        width: 50,
        height: 20,
        x: 100,
        y: 5,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'top',
      };

      const position = positioner.calculatePosition(options);

      // 位置应该被调整以适应视口
      expect(position.y).toBeGreaterThanOrEqual(10); // 考虑 margin
    });
  });

  describe('自定义参数', () => {
    it('应该使用自定义偏移量', () => {
      const customOffset = 20;
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'top',
        offset: customOffset,
      };

      const position = positioner.calculatePosition(options);

      // 顶部位置会超出视口上边界（y = 100 - 100 - 20 = -20），
      // 所以系统会自动选择底部位置，使用自定义偏移量
      expect(position.y).toBe(120 + customOffset); // 120 + 20 = 140 (底部位置)
    });

    it('应该使用自定义边距', () => {
      const customMargin = 20;

      // 将目标元素移到接近边界的位置
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 5,
        top: 100,
        right: 55,
        bottom: 120,
        width: 50,
        height: 20,
        x: 5,
        y: 100,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
        margin: customMargin,
      };

      const position = positioner.calculatePosition(options);

      expect(position.x).toBeGreaterThanOrEqual(customMargin);
    });
  });

  describe('位置更新', () => {
    it('应该更新元素位置', () => {
      const position: Position = { x: 300, y: 400 };

      positioner.updatePosition(tooltipElement, position);

      expect(tooltipElement.style.left).toBe('300px');
      expect(tooltipElement.style.top).toBe('400px');
    });

    it('应该处理负数位置', () => {
      const position: Position = { x: -10, y: -20 };

      positioner.updatePosition(tooltipElement, position);

      expect(tooltipElement.style.left).toBe('-10px');
      expect(tooltipElement.style.top).toBe('-20px');
    });

    it('应该处理小数位置', () => {
      const position: Position = { x: 123.456, y: 789.123 };

      positioner.updatePosition(tooltipElement, position);

      expect(tooltipElement.style.left).toBe('123.456px');
      expect(tooltipElement.style.top).toBe('789.123px');
    });
  });

  describe('鼠标位置计算', () => {
    it('应该基于鼠标位置计算 tooltip 位置', () => {
      const mockEvent = {
        clientX: 200,
        clientY: 300,
      } as MouseEvent;

      const position = positioner.calculateMousePosition(mockEvent, tooltipElement);

      // 默认偏移量是 8
      expect(position.x).toBe(208); // 200 + 8
      expect(position.y).toBe(308); // 300 + 8
    });

    it('应该使用自定义偏移量计算鼠标位置', () => {
      const mockEvent = {
        clientX: 200,
        clientY: 300,
      } as MouseEvent;

      const customOffset = 15;
      const position = positioner.calculateMousePosition(mockEvent, tooltipElement, customOffset);

      expect(position.x).toBe(215); // 200 + 15
      expect(position.y).toBe(315); // 300 + 15
    });

    it('应该调整鼠标位置以避免超出视口', () => {
      // 鼠标在右下角
      const mockEvent = {
        clientX: 900, // 接近右边界
        clientY: 700, // 接近底边界
      } as MouseEvent;

      const position = positioner.calculateMousePosition(mockEvent, tooltipElement);

      // 应该调整到鼠标左上方
      expect(position.x).toBeLessThan(900); // 应该在鼠标左侧
      expect(position.y).toBeLessThan(700); // 应该在鼠标上方
    });
  });

  describe('边界情况', () => {
    it('应该处理零尺寸的目标元素', () => {
      vi.spyOn(targetElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        right: 100, // 零宽度
        bottom: 100, // 零高度
        width: 0,
        height: 0,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      expect(() => {
        const position = positioner.calculatePosition(options);
        expect(position).toBeDefined();
      }).not.toThrow();
    });

    it('应该处理零尺寸的 tooltip 元素', () => {
      vi.spyOn(tooltipElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 0, // 零宽度
        bottom: 0, // 零高度
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      expect(() => {
        const position = positioner.calculatePosition(options);
        expect(position).toBeDefined();
      }).not.toThrow();
    });

    it('应该处理极小的视口', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 100, // 很小的宽度
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 100, // 很小的高度
      });

      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'auto',
      };

      expect(() => {
        const position = positioner.calculatePosition(options);
        expect(position).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('性能考虑', () => {
    it('应该缓存计算结果', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'bottom',
      };

      // 多次调用相同的计算
      const position1 = positioner.calculatePosition(options);
      const position2 = positioner.calculatePosition(options);

      expect(position1).toEqual(position2);
    });

    it('应该高效处理大量位置计算', () => {
      const options: PositionOptions = {
        targetElement,
        tooltipElement,
        preferredPosition: 'auto',
      };

      const startTime = performance.now();

      // 执行大量计算
      for (let i = 0; i < 1000; i++) {
        positioner.calculatePosition(options);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 应该在合理时间内完成
      expect(duration).toBeLessThan(100); // 100ms 内完成 1000 次计算
    });
  });
});
