/**
 * 用户交互流程集成测试
 * 测试完整的用户交互场景
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock 用户交互管理器
class MockUserInteractionManager {
  private tooltipManager: any;
  private eventListeners = new Map<string, Function[]>();
  private activeElement: HTMLElement | null = null;
  private hoverTimer: number | null = null;
  private hideTimer: number | null = null;

  constructor(tooltipManager: any) {
    this.tooltipManager = tooltipManager;
    this.setupGlobalListeners();
  }

  private setupGlobalListeners(): void {
    // 模拟全局事件监听
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleMouseOver(event: Event): void {
    const target = event.target as HTMLElement;
    
    // 检查是否是可翻译的元素
    if (this.isTranslatableElement(target)) {
      this.clearTimers();
      
      // 延迟显示 tooltip
      this.hoverTimer = window.setTimeout(() => {
        this.showTooltipForElement(target);
      }, 300);
    }
  }

  private handleMouseOut(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (this.isTranslatableElement(target)) {
      this.clearTimers();
      
      // 延迟隐藏 tooltip
      this.hideTimer = window.setTimeout(() => {
        this.tooltipManager.hideTooltip();
        this.activeElement = null;
      }, 200);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.tooltipManager.hideTooltip();
      this.activeElement = null;
      this.clearTimers();
    }
  }

  private handleScroll(): void {
    // 滚动时隐藏 tooltip
    this.tooltipManager.hideTooltip();
    this.activeElement = null;
    this.clearTimers();
  }

  private isTranslatableElement(element: HTMLElement): boolean {
    // 检查元素是否包含英文单词
    const text = element.textContent?.trim() || '';
    return /^[a-zA-Z]+$/.test(text) && text.length > 1;
  }

  private async showTooltipForElement(element: HTMLElement): Promise<void> {
    const word = element.textContent?.trim() || '';
    if (word && this.activeElement !== element) {
      this.activeElement = element;
      await this.tooltipManager.showTooltip(word, element);
    }
  }

  private clearTimers(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  // 测试辅助方法
  simulateMouseOver(element: HTMLElement): void {
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      target: element
    });
    Object.defineProperty(event, 'target', { value: element });
    this.handleMouseOver(event);
  }

  simulateMouseOut(element: HTMLElement): void {
    const event = new MouseEvent('mouseout', {
      bubbles: true,
      cancelable: true,
      target: element
    });
    Object.defineProperty(event, 'target', { value: element });
    this.handleMouseOut(event);
  }

  simulateKeyDown(key: string): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    this.handleKeyDown(event);
  }

  simulateScroll(): void {
    this.handleScroll();
  }

  getActiveElement(): HTMLElement | null {
    return this.activeElement;
  }

  destroy(): void {
    this.clearTimers();
    document.removeEventListener('mouseover', this.handleMouseOver.bind(this));
    document.removeEventListener('mouseout', this.handleMouseOut.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('scroll', this.handleScroll.bind(this));
  }
}

// Mock TooltipManager for interaction testing
class MockInteractionTooltipManager {
  private currentTooltip: HTMLElement | null = null;
  private currentWord: string | null = null;
  private showCallbacks: Function[] = [];
  private hideCallbacks: Function[] = [];

  async showTooltip(word: string, targetElement: HTMLElement): Promise<void> {
    // 隐藏之前的 tooltip
    if (this.currentTooltip) {
      this.hideTooltip();
    }

    // 创建新的 tooltip
    this.currentTooltip = document.createElement('div');
    this.currentTooltip.className = 'lucid-tooltip';
    this.currentTooltip.textContent = `Definition of: ${word}`;
    this.currentTooltip.style.position = 'fixed';
    this.currentTooltip.style.zIndex = '10000';
    
    // 设置位置
    const rect = targetElement.getBoundingClientRect();
    this.currentTooltip.style.left = `${rect.left}px`;
    this.currentTooltip.style.top = `${rect.top - 30}px`;

    document.body.appendChild(this.currentTooltip);
    this.currentWord = word;

    // 触发回调
    this.showCallbacks.forEach(callback => callback(word, targetElement));
  }

  hideTooltip(): void {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      
      // 触发回调
      this.hideCallbacks.forEach(callback => callback(this.currentWord));
      
      this.currentTooltip = null;
      this.currentWord = null;
    }
  }

  getCurrentTooltip(): HTMLElement | null {
    return this.currentTooltip;
  }

  getCurrentWord(): string | null {
    return this.currentWord;
  }

  onShow(callback: Function): void {
    this.showCallbacks.push(callback);
  }

  onHide(callback: Function): void {
    this.hideCallbacks.push(callback);
  }
}

describe('User Interaction Integration', () => {
  let tooltipManager: MockInteractionTooltipManager;
  let interactionManager: MockUserInteractionManager;
  let testElement: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    tooltipManager = new MockInteractionTooltipManager();
    interactionManager = new MockUserInteractionManager(tooltipManager);
    
    // 创建测试元素
    testElement = document.createElement('span');
    testElement.textContent = 'hello';
    testElement.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 200,
      width: 50,
      height: 20,
      right: 150,
      bottom: 220,
      x: 100,
      y: 200,
      toJSON: () => ({})
    }));
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    vi.useRealTimers();
    interactionManager.destroy();
    tooltipManager.hideTooltip();
    if (testElement.parentNode) {
      document.body.removeChild(testElement);
    }
  });

  describe('鼠标悬停交互', () => {
    it('应该在鼠标悬停时延迟显示 tooltip', async () => {
      interactionManager.simulateMouseOver(testElement);
      
      // 立即检查，tooltip 不应该显示
      expect(tooltipManager.getCurrentTooltip()).toBe(null);
      
      // 300ms 后应该显示
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      expect(tooltipManager.getCurrentWord()).toBe('hello');
    });

    it('应该在鼠标离开时延迟隐藏 tooltip', async () => {
      // 先显示 tooltip
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      
      // 鼠标离开
      interactionManager.simulateMouseOut(testElement);
      
      // 立即检查，tooltip 应该还在
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      
      // 200ms 后应该隐藏
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();
      
      expect(tooltipManager.getCurrentTooltip()).toBe(null);
    });

    it('应该在快速移动鼠标时取消之前的定时器', async () => {
      // 第一次悬停
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(100);
      
      // 快速移开再悬停
      interactionManager.simulateMouseOut(testElement);
      interactionManager.simulateMouseOver(testElement);
      
      // 再等待 300ms
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      // 应该只显示一次
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      expect(tooltipManager.getCurrentWord()).toBe('hello');
    });
  });

  describe('键盘交互', () => {
    it('应该在按 Escape 键时隐藏 tooltip', async () => {
      // 先显示 tooltip
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      
      // 按 Escape 键
      interactionManager.simulateKeyDown('Escape');
      
      expect(tooltipManager.getCurrentTooltip()).toBe(null);
      expect(interactionManager.getActiveElement()).toBe(null);
    });

    it('应该在按其他键时不影响 tooltip', async () => {
      // 先显示 tooltip
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      
      // 按其他键
      interactionManager.simulateKeyDown('Enter');
      interactionManager.simulateKeyDown('Space');
      
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
    });
  });

  describe('滚动交互', () => {
    it('应该在滚动时立即隐藏 tooltip', async () => {
      // 先显示 tooltip
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
      
      // 滚动页面
      interactionManager.simulateScroll();
      
      expect(tooltipManager.getCurrentTooltip()).toBe(null);
      expect(interactionManager.getActiveElement()).toBe(null);
    });
  });

  describe('元素过滤', () => {
    it('应该只对英文单词元素显示 tooltip', async () => {
      // 创建不同类型的元素
      const englishElement = document.createElement('span');
      englishElement.textContent = 'word';
      
      const chineseElement = document.createElement('span');
      chineseElement.textContent = '中文';
      
      const numberElement = document.createElement('span');
      numberElement.textContent = '123';
      
      const mixedElement = document.createElement('span');
      mixedElement.textContent = 'word123';

      document.body.appendChild(englishElement);
      document.body.appendChild(chineseElement);
      document.body.appendChild(numberElement);
      document.body.appendChild(mixedElement);

      try {
        // 测试英文单词 - 应该显示
        interactionManager.simulateMouseOver(englishElement);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
        expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
        
        tooltipManager.hideTooltip();

        // 测试中文 - 不应该显示
        interactionManager.simulateMouseOver(chineseElement);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
        expect(tooltipManager.getCurrentTooltip()).toBe(null);

        // 测试数字 - 不应该显示
        interactionManager.simulateMouseOver(numberElement);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
        expect(tooltipManager.getCurrentTooltip()).toBe(null);

        // 测试混合内容 - 不应该显示
        interactionManager.simulateMouseOver(mixedElement);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
        expect(tooltipManager.getCurrentTooltip()).toBe(null);

      } finally {
        document.body.removeChild(englishElement);
        document.body.removeChild(chineseElement);
        document.body.removeChild(numberElement);
        document.body.removeChild(mixedElement);
      }
    });

    it('应该忽略单字母元素', async () => {
      const singleLetterElement = document.createElement('span');
      singleLetterElement.textContent = 'a';
      document.body.appendChild(singleLetterElement);

      try {
        interactionManager.simulateMouseOver(singleLetterElement);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
        
        expect(tooltipManager.getCurrentTooltip()).toBe(null);
      } finally {
        document.body.removeChild(singleLetterElement);
      }
    });
  });

  describe('多元素交互', () => {
    it('应该在切换元素时正确更新 tooltip', async () => {
      const element1 = document.createElement('span');
      element1.textContent = 'hello';
      element1.getBoundingClientRect = vi.fn(() => ({
        left: 100, top: 200, width: 50, height: 20,
        right: 150, bottom: 220, x: 100, y: 200, toJSON: () => ({})
      }));

      const element2 = document.createElement('span');
      element2.textContent = 'world';
      element2.getBoundingClientRect = vi.fn(() => ({
        left: 200, top: 200, width: 50, height: 20,
        right: 250, bottom: 220, x: 200, y: 200, toJSON: () => ({})
      }));

      document.body.appendChild(element1);
      document.body.appendChild(element2);

      try {
        // 悬停第一个元素
        interactionManager.simulateMouseOver(element1);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();
        
        expect(tooltipManager.getCurrentWord()).toBe('hello');
        expect(interactionManager.getActiveElement()).toBe(element1);

        // 快速切换到第二个元素
        interactionManager.simulateMouseOut(element1);
        interactionManager.simulateMouseOver(element2);
        vi.advanceTimersByTime(300);
        await vi.runAllTimersAsync();

        expect(tooltipManager.getCurrentWord()).toBe('world');
        expect(interactionManager.getActiveElement()).toBe(element2);

      } finally {
        document.body.removeChild(element1);
        document.body.removeChild(element2);
      }
    });
  });

  describe('事件回调', () => {
    it('应该在显示和隐藏时触发回调', async () => {
      const showCallback = vi.fn();
      const hideCallback = vi.fn();

      tooltipManager.onShow(showCallback);
      tooltipManager.onHide(hideCallback);

      // 显示 tooltip
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      expect(showCallback).toHaveBeenCalledWith('hello', testElement);

      // 隐藏 tooltip
      interactionManager.simulateMouseOut(testElement);
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();

      expect(hideCallback).toHaveBeenCalledWith('hello');
    });
  });

  describe('性能和资源管理', () => {
    it('应该正确清理定时器', () => {
      // 创建多个定时器
      interactionManager.simulateMouseOver(testElement);
      interactionManager.simulateMouseOut(testElement);
      interactionManager.simulateMouseOver(testElement);
      interactionManager.simulateMouseOut(testElement);

      // 销毁管理器
      interactionManager.destroy();

      // 推进时间，不应该有任何副作用
      vi.advanceTimersByTime(1000);
      expect(tooltipManager.getCurrentTooltip()).toBe(null);
    });

    it('应该处理快速连续的交互', async () => {
      const showCallback = vi.fn();
      tooltipManager.onShow(showCallback);

      // 快速连续交互
      for (let i = 0; i < 10; i++) {
        interactionManager.simulateMouseOver(testElement);
        interactionManager.simulateMouseOut(testElement);
      }

      // 最后一次悬停
      interactionManager.simulateMouseOver(testElement);
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      // 应该只显示一次
      expect(showCallback).toHaveBeenCalledTimes(1);
      expect(tooltipManager.getCurrentTooltip()).toBeTruthy();
    });
  });
});
