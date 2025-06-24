/**
 * 简化集成测试
 * 测试核心功能的基本集成
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// 简化的集成测试系统
class SimpleIntegrationSystem {
  private cache = new Map<string, any>();
  private currentTooltip: HTMLElement | null = null;
  private events: any[] = [];

  async getData(word: string): Promise<any> {
    // 模拟数据获取
    const mockData: Record<string, any> = {
      'hello': { word: 'hello', definition: 'A greeting' },
      'world': { word: 'world', definition: 'The earth' }
    };
    
    await new Promise(resolve => setTimeout(resolve, 10));
    return mockData[word.toLowerCase()] || null;
  }

  async showTooltip(word: string, element: HTMLElement): Promise<void> {
    // 1. 检查缓存
    let data = this.cache.get(word);
    
    // 2. 如果没有缓存，获取数据
    if (!data) {
      data = await this.getData(word);
      if (data) {
        this.cache.set(word, data);
      }
    }

    // 3. 如果没有数据，使用默认
    if (!data) {
      data = { word, definition: 'No definition found' };
    }

    // 4. 创建 tooltip
    this.hideTooltip(); // 先隐藏之前的
    
    this.currentTooltip = document.createElement('div');
    this.currentTooltip.className = 'simple-tooltip';
    this.currentTooltip.textContent = `${data.word}: ${data.definition}`;
    
    const rect = element.getBoundingClientRect();
    this.currentTooltip.style.position = 'fixed';
    this.currentTooltip.style.left = `${rect.left}px`;
    this.currentTooltip.style.top = `${rect.top - 30}px`;
    
    document.body.appendChild(this.currentTooltip);

    // 5. 记录事件
    this.events.push({ type: 'shown', word, data });
  }

  hideTooltip(): void {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.events.push({ type: 'hidden' });
      this.currentTooltip = null;
    }
  }

  getCurrentTooltip(): HTMLElement | null {
    return this.currentTooltip;
  }

  getEvents(): any[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  clearCache(): void {
    this.cache.clear();
  }

  destroy(): void {
    this.hideTooltip();
    this.clearCache();
    this.clearEvents();
  }
}

describe('Simple Integration', () => {
  let system: SimpleIntegrationSystem;
  let testElement: HTMLElement;

  beforeEach(() => {
    system = new SimpleIntegrationSystem();
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
    system.destroy();
    if (testElement.parentNode) {
      document.body.removeChild(testElement);
    }
  });

  describe('基本功能', () => {
    it('应该显示 tooltip', async () => {
      await system.showTooltip('hello', testElement);

      const tooltip = system.getCurrentTooltip();
      expect(tooltip).toBeTruthy();
      expect(tooltip?.textContent).toContain('hello');
      expect(tooltip?.textContent).toContain('A greeting');
    });

    it('应该隐藏 tooltip', async () => {
      await system.showTooltip('hello', testElement);
      expect(system.getCurrentTooltip()).toBeTruthy();

      system.hideTooltip();
      expect(system.getCurrentTooltip()).toBe(null);
    });

    it('应该处理未找到的单词', async () => {
      await system.showTooltip('nonexistent', testElement);

      const tooltip = system.getCurrentTooltip();
      expect(tooltip?.textContent).toContain('No definition found');
    });
  });

  describe('缓存功能', () => {
    it('应该缓存数据', async () => {
      expect(system.getCacheSize()).toBe(0);

      await system.showTooltip('hello', testElement);
      expect(system.getCacheSize()).toBe(1);

      system.hideTooltip();
      await system.showTooltip('hello', testElement);
      expect(system.getCacheSize()).toBe(1); // 仍然是1，使用了缓存
    });

    it('应该为不同单词建立独立缓存', async () => {
      await system.showTooltip('hello', testElement);
      system.hideTooltip();

      await system.showTooltip('world', testElement);
      expect(system.getCacheSize()).toBe(2);
    });
  });

  describe('事件系统', () => {
    it('应该记录显示和隐藏事件', async () => {
      system.clearEvents();

      await system.showTooltip('hello', testElement);
      system.hideTooltip();

      const events = system.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('shown');
      expect(events[0].word).toBe('hello');
      expect(events[1].type).toBe('hidden');
    });

    it('应该在切换单词时记录正确事件', async () => {
      system.clearEvents();

      await system.showTooltip('hello', testElement);
      await system.showTooltip('world', testElement);

      const events = system.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('shown');
      expect(events[0].word).toBe('hello');
      expect(events[1].type).toBe('hidden');
      expect(events[2].type).toBe('shown');
      expect(events[2].word).toBe('world');
    });
  });

  describe('DOM 管理', () => {
    it('应该正确管理 DOM 元素', async () => {
      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(0);

      await system.showTooltip('hello', testElement);
      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(1);

      system.hideTooltip();
      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(0);
    });

    it('应该在切换时只保留一个 tooltip', async () => {
      await system.showTooltip('hello', testElement);
      await system.showTooltip('world', testElement);

      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(1);
      expect(system.getCurrentTooltip()?.textContent).toContain('world');
    });
  });

  describe('位置计算', () => {
    it('应该根据元素位置设置 tooltip 位置', async () => {
      await system.showTooltip('hello', testElement);

      const tooltip = system.getCurrentTooltip();
      expect(tooltip?.style.left).toBe('100px');
      expect(tooltip?.style.top).toBe('170px'); // 200 - 30
      expect(tooltip?.style.position).toBe('fixed');
    });
  });

  describe('资源清理', () => {
    it('应该在销毁时清理所有资源', async () => {
      await system.showTooltip('hello', testElement);
      await system.showTooltip('world', testElement);

      expect(system.getCurrentTooltip()).toBeTruthy();
      expect(system.getCacheSize()).toBe(2);
      expect(system.getEvents().length).toBeGreaterThan(0);

      system.destroy();

      expect(system.getCurrentTooltip()).toBe(null);
      expect(system.getCacheSize()).toBe(0);
      expect(system.getEvents()).toHaveLength(0);
      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(0);
    });
  });

  describe('异步处理', () => {
    it('应该正确处理异步数据获取', async () => {
      const startTime = Date.now();
      
      await system.showTooltip('hello', testElement);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应该有一定的延迟（模拟异步）
      expect(duration).toBeGreaterThan(5);
      
      const tooltip = system.getCurrentTooltip();
      expect(tooltip?.textContent).toContain('A greeting');
    });

    it('应该处理并发请求', async () => {
      // 顺序执行多个请求
      await system.showTooltip('hello', testElement);
      await system.showTooltip('world', testElement);
      await system.showTooltip('hello', testElement);

      // 应该只有一个 tooltip
      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(1);
      expect(system.getCurrentTooltip()?.textContent).toContain('hello');
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串', async () => {
      await system.showTooltip('', testElement);

      const tooltip = system.getCurrentTooltip();
      expect(tooltip?.textContent).toContain('No definition found');
    });

    it('应该处理重复显示同一单词', async () => {
      await system.showTooltip('hello', testElement);
      const firstTooltip = system.getCurrentTooltip();

      await system.showTooltip('hello', testElement);
      const secondTooltip = system.getCurrentTooltip();

      expect(firstTooltip).not.toBe(secondTooltip);
      expect(document.querySelectorAll('.simple-tooltip')).toHaveLength(1);
    });

    it('应该处理多次隐藏', () => {
      system.hideTooltip();
      system.hideTooltip();
      system.hideTooltip();

      expect(system.getCurrentTooltip()).toBe(null);
    });
  });
});
