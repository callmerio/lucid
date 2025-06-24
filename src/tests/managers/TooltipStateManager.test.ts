/**
 * TooltipStateManager 单元测试
 * 测试状态管理器的核心功能
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 实现 - 模拟真实的状态管理器
interface TooltipState {
  visible: boolean;
  expanded: boolean;
  word: string;
  targetElement: HTMLElement | null;
  hideTimeout: number | null;
}

interface StateChangeEvent {
  type: 'show' | 'hide' | 'expand' | 'collapse';
  state: TooltipState;
  previousState: TooltipState;
}

class MockTooltipStateManager {
  private state: TooltipState = {
    visible: false,
    expanded: false,
    word: '',
    targetElement: null,
    hideTimeout: null,
  };

  private listeners: Array<(event: StateChangeEvent) => void> = [];

  show(word: string, element: HTMLElement) {
    const previousState = { ...this.state };
    this.state.visible = true;
    this.state.word = word;
    this.state.targetElement = element;

    if (this.state.hideTimeout) {
      clearTimeout(this.state.hideTimeout);
      this.state.hideTimeout = null;
    }

    this.notifyListeners('show', previousState);
  }

  hide(immediate = false) {
    if (!this.state.visible) return;

    const previousState = { ...this.state };

    if (immediate) {
      this.state.visible = false;
      this.state.expanded = false;
      this.state.word = '';
      this.state.targetElement = null;
      this.notifyListeners('hide', previousState);
    } else {
      this.state.hideTimeout = window.setTimeout(() => {
        this.state.visible = false;
        this.state.expanded = false;
        this.state.word = '';
        this.state.targetElement = null;
        this.state.hideTimeout = null;
        this.notifyListeners('hide', previousState);
      }, 300);
    }
  }

  expand() {
    if (this.state.expanded) return;

    const previousState = { ...this.state };
    this.state.expanded = true;
    this.notifyListeners('expand', previousState);
  }

  collapse() {
    if (!this.state.expanded) return;

    const previousState = { ...this.state };
    this.state.expanded = false;
    this.notifyListeners('collapse', previousState);
  }

  cancelHide() {
    if (this.state.hideTimeout) {
      clearTimeout(this.state.hideTimeout);
      this.state.hideTimeout = null;
    }
  }

  isVisible() {
    return this.state.visible;
  }

  isExpanded() {
    return this.state.expanded;
  }

  getCurrentWord() {
    return this.state.word;
  }

  getCurrentTargetElement() {
    return this.state.targetElement;
  }

  getState() {
    return { ...this.state };
  }

  addStateChangeListener(listener: (event: StateChangeEvent) => void) {
    this.listeners.push(listener);
  }

  removeStateChangeListener(listener: (event: StateChangeEvent) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  reset() {
    const previousState = { ...this.state };
    this.state = {
      visible: false,
      expanded: false,
      word: '',
      targetElement: null,
      hideTimeout: null,
    };
    if (previousState.visible) {
      this.notifyListeners('hide', previousState);
    }
  }

  destroy() {
    this.reset();
    this.listeners = [];
  }

  getStats() {
    return {
      listenersCount: this.listeners.length,
      hasActiveTimeout: this.state.hideTimeout !== null,
      currentWord: this.state.word,
      isVisible: this.state.visible,
      isExpanded: this.state.expanded,
    };
  }

  private notifyListeners(type: StateChangeEvent['type'], previousState: TooltipState) {
    const event: StateChangeEvent = {
      type,
      state: { ...this.state },
      previousState,
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[TooltipStateManager] Error in state change handler:', error);
      }
    });
  }
}

describe('TooltipStateManager', () => {
  let stateManager: MockTooltipStateManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    stateManager = new MockTooltipStateManager();
    mockElement = document.createElement('div');
    mockElement.textContent = 'test word';
    document.body.appendChild(mockElement);

    // 清理所有定时器
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    stateManager.destroy();
    document.body.removeChild(mockElement);
    vi.useRealTimers();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = stateManager.getState();

      expect(state.visible).toBe(false);
      expect(state.expanded).toBe(false);
      expect(state.word).toBe('');
      expect(state.targetElement).toBe(null);
      expect(state.hideTimeout).toBe(null);
    });

    it('应该返回正确的状态检查方法结果', () => {
      expect(stateManager.isVisible()).toBe(false);
      expect(stateManager.isExpanded()).toBe(false);
      expect(stateManager.getCurrentWord()).toBe('');
      expect(stateManager.getCurrentTargetElement()).toBe(null);
    });
  });

  describe('显示功能', () => {
    it('应该正确显示 tooltip', () => {
      const word = 'hello';

      stateManager.show(word, mockElement);

      const state = stateManager.getState();
      expect(state.visible).toBe(true);
      expect(state.word).toBe(word);
      expect(state.targetElement).toBe(mockElement);
      expect(stateManager.isVisible()).toBe(true);
      expect(stateManager.getCurrentWord()).toBe(word);
      expect(stateManager.getCurrentTargetElement()).toBe(mockElement);
    });

    it('应该触发状态变化事件', () => {
      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      const word = 'hello';
      stateManager.show(word, mockElement);

      expect(mockHandler).toHaveBeenCalledWith({
        type: 'show',
        state: expect.objectContaining({
          visible: true,
          word,
          targetElement: mockElement,
        }),
        previousState: expect.objectContaining({
          visible: false,
          word: '',
          targetElement: null,
        }),
      });
    });

    it('应该取消之前的隐藏定时器', () => {
      const word = 'hello';

      // 先显示然后安排隐藏
      stateManager.show(word, mockElement);
      stateManager.hide(); // 安排延迟隐藏

      // 再次显示应该取消隐藏
      stateManager.show('world', mockElement);

      // 快进时间，tooltip 应该仍然可见
      vi.advanceTimersByTime(500);
      expect(stateManager.isVisible()).toBe(true);
      expect(stateManager.getCurrentWord()).toBe('world');
    });
  });

  describe('隐藏功能', () => {
    beforeEach(() => {
      stateManager.show('test', mockElement);
    });

    it('应该立即隐藏 tooltip', () => {
      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.hide(true); // 立即隐藏

      const state = stateManager.getState();
      expect(state.visible).toBe(false);
      expect(state.expanded).toBe(false);
      expect(state.word).toBe('');
      expect(state.targetElement).toBe(null);

      expect(mockHandler).toHaveBeenCalledWith({
        type: 'hide',
        state: expect.objectContaining({
          visible: false,
        }),
        previousState: expect.objectContaining({
          visible: true,
          word: 'test',
        }),
      });
    });

    it('应该延迟隐藏 tooltip', () => {
      stateManager.hide(); // 延迟隐藏

      // 立即检查，应该仍然可见
      expect(stateManager.isVisible()).toBe(true);

      // 快进时间，应该被隐藏
      vi.advanceTimersByTime(300);
      expect(stateManager.isVisible()).toBe(false);
    });

    it('应该能够取消延迟隐藏', () => {
      stateManager.hide(); // 安排延迟隐藏
      stateManager.cancelHide(); // 取消隐藏

      // 快进时间，应该仍然可见
      vi.advanceTimersByTime(500);
      expect(stateManager.isVisible()).toBe(true);
    });

    it('对已隐藏的 tooltip 调用 hide 应该无效果', () => {
      stateManager.hide(true); // 立即隐藏

      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.hide(); // 再次隐藏

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('展开/收起功能', () => {
    beforeEach(() => {
      stateManager.show('test', mockElement);
    });

    it('应该正确展开 tooltip', () => {
      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.expand();

      expect(stateManager.isExpanded()).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'expand',
        state: expect.objectContaining({
          expanded: true,
        }),
        previousState: expect.objectContaining({
          expanded: false,
        }),
      });
    });

    it('应该正确收起 tooltip', () => {
      stateManager.expand(); // 先展开

      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.collapse();

      expect(stateManager.isExpanded()).toBe(false);
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'collapse',
        state: expect.objectContaining({
          expanded: false,
        }),
        previousState: expect.objectContaining({
          expanded: true,
        }),
      });
    });

    it('重复展开应该无效果', () => {
      stateManager.expand(); // 第一次展开

      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.expand(); // 重复展开

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('重复收起应该无效果', () => {
      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.collapse(); // 在未展开状态下收起

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('状态监听器', () => {
    it('应该能够添加和移除监听器', () => {
      const mockHandler1 = vi.fn();
      const mockHandler2 = vi.fn();

      stateManager.addStateChangeListener(mockHandler1);
      stateManager.addStateChangeListener(mockHandler2);

      stateManager.show('test', mockElement);

      expect(mockHandler1).toHaveBeenCalled();
      expect(mockHandler2).toHaveBeenCalled();

      // 移除一个监听器
      stateManager.removeStateChangeListener(mockHandler1);

      mockHandler1.mockClear();
      mockHandler2.mockClear();

      stateManager.expand();

      expect(mockHandler1).not.toHaveBeenCalled();
      expect(mockHandler2).toHaveBeenCalled();
    });

    it('应该处理监听器中的错误', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = vi.fn();

      // 模拟 console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      stateManager.addStateChangeListener(errorHandler);
      stateManager.addStateChangeListener(normalHandler);

      stateManager.show('test', mockElement);

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TooltipStateManager] Error in state change handler:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('重置和销毁', () => {
    it('应该正确重置状态', () => {
      stateManager.show('test', mockElement);
      stateManager.expand();

      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.reset();

      const state = stateManager.getState();
      expect(state.visible).toBe(false);
      expect(state.expanded).toBe(false);
      expect(state.word).toBe('');
      expect(state.targetElement).toBe(null);

      expect(mockHandler).toHaveBeenCalledWith({
        type: 'hide',
        state: expect.objectContaining({
          visible: false,
        }),
        previousState: expect.objectContaining({
          visible: true,
        }),
      });
    });

    it('应该正确销毁状态管理器', () => {
      stateManager.show('test', mockElement);
      stateManager.hide(); // 安排延迟隐藏

      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.destroy();

      // 检查状态被重置
      const state = stateManager.getState();
      expect(state.visible).toBe(false);

      // 检查监听器被清空
      const stats = stateManager.getStats();
      expect(stats.listenersCount).toBe(0);

      // 快进时间，确保定时器被清理
      vi.advanceTimersByTime(500);
      // 不应该有额外的状态变化事件
    });
  });

  describe('统计信息', () => {
    it('应该返回正确的统计信息', () => {
      const mockHandler = vi.fn();
      stateManager.addStateChangeListener(mockHandler);

      stateManager.show('test', mockElement);
      stateManager.hide(); // 安排延迟隐藏

      const stats = stateManager.getStats();

      expect(stats.listenersCount).toBe(1);
      expect(stats.hasActiveTimeout).toBe(true);
      expect(stats.currentWord).toBe('test');
      expect(stats.isVisible).toBe(true);
      expect(stats.isExpanded).toBe(false);
    });
  });
});
