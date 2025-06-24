/**
 * TooltipPositioner - Tooltip 位置计算器
 * 负责计算 tooltip 的最佳显示位置
 */

/// <reference lib="dom" />

export interface Position {
  x: number;
  y: number;
}

export interface PositionOptions {
  targetElement: HTMLElement;
  tooltipElement: HTMLElement;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
  margin?: number;
}

export class TooltipPositioner {
  private readonly defaultOffset = 8;
  private readonly defaultMargin = 10;

  /**
   * 计算 tooltip 的最佳位置
   */
  calculatePosition(options: PositionOptions): Position {
    const {
      targetElement,
      tooltipElement,
      preferredPosition = 'auto',
      offset = this.defaultOffset,
      margin = this.defaultMargin,
    } = options;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 如果指定了位置偏好，先尝试该位置
    if (preferredPosition !== 'auto') {
      const position = this.calculateSpecificPosition(
        preferredPosition,
        targetRect,
        tooltipRect,
        offset
      );

      if (this.isPositionValid(position, tooltipRect, viewportWidth, viewportHeight, margin)) {
        return position;
      }
    }

    // 自动选择最佳位置
    return this.calculateAutoPosition(
      targetRect,
      tooltipRect,
      viewportWidth,
      viewportHeight,
      offset,
      margin
    );
  }

  /**
   * 计算指定位置的坐标
   */
  private calculateSpecificPosition(
    position: 'top' | 'bottom' | 'left' | 'right',
    targetRect: DOMRect,
    tooltipRect: DOMRect,
    offset: number
  ): Position {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    switch (position) {
      case 'top':
        return {
          x: targetCenterX - tooltipRect.width / 2,
          y: targetRect.top - tooltipRect.height - offset,
        };

      case 'bottom':
        return {
          x: targetCenterX - tooltipRect.width / 2,
          y: targetRect.bottom + offset,
        };

      case 'left':
        return {
          x: targetRect.left - tooltipRect.width - offset,
          y: targetCenterY - tooltipRect.height / 2,
        };

      case 'right':
        return {
          x: targetRect.right + offset,
          y: targetCenterY - tooltipRect.height / 2,
        };

      default:
        throw new Error(`Invalid position: ${position}`);
    }
  }

  /**
   * 自动计算最佳位置
   */
  private calculateAutoPosition(
    targetRect: DOMRect,
    tooltipRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    offset: number,
    margin: number
  ): Position {
    const positions: Array<{ position: 'top' | 'bottom' | 'left' | 'right'; coords: Position }> = [
      {
        position: 'bottom',
        coords: this.calculateSpecificPosition('bottom', targetRect, tooltipRect, offset),
      },
      {
        position: 'top',
        coords: this.calculateSpecificPosition('top', targetRect, tooltipRect, offset),
      },
      {
        position: 'right',
        coords: this.calculateSpecificPosition('right', targetRect, tooltipRect, offset),
      },
      {
        position: 'left',
        coords: this.calculateSpecificPosition('left', targetRect, tooltipRect, offset),
      },
    ];

    // 找到第一个有效位置
    for (const { coords } of positions) {
      if (this.isPositionValid(coords, tooltipRect, viewportWidth, viewportHeight, margin)) {
        return coords;
      }
    }

    // 如果没有完全有效的位置，选择最佳的位置并调整
    return this.adjustPositionToViewport(
      positions[0].coords,
      tooltipRect,
      viewportWidth,
      viewportHeight,
      margin
    );
  }

  /**
   * 检查位置是否在视口内有效
   */
  private isPositionValid(
    position: Position,
    tooltipRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    margin: number
  ): boolean {
    return (
      position.x >= margin &&
      position.y >= margin &&
      position.x + tooltipRect.width <= viewportWidth - margin &&
      position.y + tooltipRect.height <= viewportHeight - margin
    );
  }

  /**
   * 调整位置以适应视口
   */
  private adjustPositionToViewport(
    position: Position,
    tooltipRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    margin: number
  ): Position {
    let { x, y } = position;

    // 水平调整
    if (x < margin) {
      x = margin;
    } else if (x + tooltipRect.width > viewportWidth - margin) {
      x = viewportWidth - tooltipRect.width - margin;
    }

    // 垂直调整
    if (y < margin) {
      y = margin;
    } else if (y + tooltipRect.height > viewportHeight - margin) {
      y = viewportHeight - tooltipRect.height - margin;
    }

    return { x, y };
  }

  /**
   * 更新 tooltip 位置
   */
  updatePosition(tooltipElement: HTMLElement, position: Position): void {
    tooltipElement.style.left = `${position.x}px`;
    tooltipElement.style.top = `${position.y}px`;
  }

  /**
   * 获取元素相对于视口的位置
   */
  getElementViewportPosition(element: HTMLElement): Position {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
    };
  }

  /**
   * 获取鼠标位置相对于元素的偏移
   */
  getMouseOffset(event: MouseEvent, element: HTMLElement): Position {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  /**
   * 计算基于鼠标位置的 tooltip 位置
   */
  calculateMousePosition(
    event: MouseEvent,
    tooltipElement: HTMLElement,
    offset: number = this.defaultOffset
  ): Position {
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = event.clientX + offset;
    let y = event.clientY + offset;

    // 确保不超出视口
    if (x + tooltipRect.width > viewportWidth) {
      x = event.clientX - tooltipRect.width - offset;
    }

    if (y + tooltipRect.height > viewportHeight) {
      y = event.clientY - tooltipRect.height - offset;
    }

    return { x, y };
  }
}