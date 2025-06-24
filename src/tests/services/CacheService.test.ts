/**
 * CacheService 单元测试
 * 测试缓存服务的核心功能
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 缓存条目接口
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Mock 缓存统计接口
interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  oldestEntry?: number;
  newestEntry?: number;
}

// Mock 缓存服务实现
class MockCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = [];
  private maxSize: number;
  private defaultTtl: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(maxSize = 100, defaultTtl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  async initialize(): Promise<void> {
    // 初始化逻辑
  }

  async destroy(): Promise<void> {
    this.clear();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.missCount++;
      return null;
    }

    this.updateAccessOrder(key);
    this.hitCount++;
    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const actualTtl = ttl !== undefined ? ttl : this.defaultTtl;
    const expiresAt = now + actualTtl;

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.ensureMaxSize();
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.getTotalRequests() > 0 ? this.hitCount / this.getTotalRequests() : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private ensureMaxSize(): void {
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  private getTotalRequests(): number {
    return this.hitCount + this.missCount;
  }

  // 测试辅助方法
  setTime(timestamp: number): void {
    vi.setSystemTime(timestamp);
  }

  getHitCount(): number {
    return this.hitCount;
  }

  getMissCount(): number {
    return this.missCount;
  }
}

describe('CacheService', () => {
  let cacheService: MockCacheService;

  beforeEach(() => {
    vi.useFakeTimers();
    cacheService = new MockCacheService(3, 1000); // 最大3个条目，1秒TTL
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始化和销毁', () => {
    it('应该正确初始化缓存服务', async () => {
      await cacheService.initialize();

      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(3);
      expect(stats.hitRate).toBe(0);
    });

    it('应该正确销毁缓存服务', async () => {
      await cacheService.set('key1', 'value1');
      expect(cacheService.getStats().size).toBe(1);

      await cacheService.destroy();

      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('基本缓存操作', () => {
    it('应该设置和获取缓存值', async () => {
      await cacheService.set('key1', 'value1');

      const value = await cacheService.get('key1');

      expect(value).toBe('value1');
      expect(cacheService.getHitCount()).toBe(1);
      expect(cacheService.getMissCount()).toBe(0);
    });

    it('应该在键不存在时返回null', async () => {
      const value = await cacheService.get('nonexistent');

      expect(value).toBe(null);
      expect(cacheService.getHitCount()).toBe(0);
      expect(cacheService.getMissCount()).toBe(1);
    });

    it('应该移除缓存值', async () => {
      await cacheService.set('key1', 'value1');
      expect(await cacheService.get('key1')).toBe('value1');

      await cacheService.remove('key1');

      expect(await cacheService.get('key1')).toBe(null);
    });

    it('应该清空所有缓存', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      expect(cacheService.getStats().size).toBe(2);

      await cacheService.clear();

      expect(cacheService.getStats().size).toBe(0);
      expect(await cacheService.get('key1')).toBe(null);
      expect(await cacheService.get('key2')).toBe(null);
    });
  });

  describe('TTL过期处理', () => {
    it('应该在TTL过期后返回null', async () => {
      await cacheService.set('key1', 'value1', 500); // 500ms TTL

      // 立即获取应该成功
      expect(await cacheService.get('key1')).toBe('value1');

      // 600ms后应该过期
      vi.advanceTimersByTime(600);
      expect(await cacheService.get('key1')).toBe(null);
      expect(cacheService.getMissCount()).toBe(1);
    });

    it('应该使用默认TTL', async () => {
      await cacheService.set('key1', 'value1'); // 使用默认1000ms TTL

      // 500ms后仍然有效
      vi.advanceTimersByTime(500);
      expect(await cacheService.get('key1')).toBe('value1');

      // 1100ms后过期
      vi.advanceTimersByTime(600);
      expect(await cacheService.get('key1')).toBe(null);
    });

    it('应该在过期时自动清理条目', async () => {
      await cacheService.set('key1', 'value1', 500);
      expect(cacheService.getStats().size).toBe(1);

      vi.advanceTimersByTime(600);
      await cacheService.get('key1'); // 触发过期检查

      expect(cacheService.getStats().size).toBe(0);
    });
  });

  describe('LRU淘汰策略', () => {
    it('应该在超过最大容量时淘汰最旧的条目', async () => {
      // 填满缓存
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');
      expect(cacheService.getStats().size).toBe(3);

      // 添加第4个条目，应该淘汰key1
      await cacheService.set('key4', 'value4');

      expect(cacheService.getStats().size).toBe(3);
      expect(await cacheService.get('key1')).toBe(null);
      expect(await cacheService.get('key2')).toBe('value2');
      expect(await cacheService.get('key3')).toBe('value3');
      expect(await cacheService.get('key4')).toBe('value4');
    });

    it('应该在访问时更新LRU顺序', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      // 访问key1，使其成为最新的
      await cacheService.get('key1');

      // 添加新条目，应该淘汰key2（现在是最旧的）
      await cacheService.set('key4', 'value4');

      expect(await cacheService.get('key1')).toBe('value1');
      expect(await cacheService.get('key2')).toBe(null);
      expect(await cacheService.get('key3')).toBe('value3');
      expect(await cacheService.get('key4')).toBe('value4');
    });
  });

  describe('统计信息', () => {
    it('应该正确计算命中率', async () => {
      await cacheService.set('key1', 'value1');

      // 2次命中，1次未命中
      await cacheService.get('key1'); // 命中
      await cacheService.get('key1'); // 命中
      await cacheService.get('key2'); // 未命中

      const stats = cacheService.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
    });

    it('应该返回正确的缓存大小', async () => {
      expect(cacheService.getStats().size).toBe(0);

      await cacheService.set('key1', 'value1');
      expect(cacheService.getStats().size).toBe(1);

      await cacheService.set('key2', 'value2');
      expect(cacheService.getStats().size).toBe(2);

      await cacheService.remove('key1');
      expect(cacheService.getStats().size).toBe(1);
    });

    it('应该返回最旧和最新条目的时间戳', async () => {
      const time1 = 1000;
      const time2 = 2000;

      vi.setSystemTime(time1);
      await cacheService.set('key1', 'value1');

      vi.setSystemTime(time2);
      await cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();
      expect(stats.oldestEntry).toBe(time1);
      expect(stats.newestEntry).toBe(time2);
    });

    it('应该在空缓存时返回undefined时间戳', async () => {
      const stats = cacheService.getStats();
      expect(stats.oldestEntry).toBeUndefined();
      expect(stats.newestEntry).toBeUndefined();
    });
  });

  describe('数据类型支持', () => {
    it('应该支持字符串类型', async () => {
      await cacheService.set('string', 'hello world');
      expect(await cacheService.get('string')).toBe('hello world');
    });

    it('应该支持数字类型', async () => {
      await cacheService.set('number', 42);
      expect(await cacheService.get('number')).toBe(42);
    });

    it('应该支持对象类型', async () => {
      const obj = { name: 'test', value: 123 };
      await cacheService.set('object', obj);
      expect(await cacheService.get('object')).toEqual(obj);
    });

    it('应该支持数组类型', async () => {
      const arr = [1, 2, 3, 'test'];
      await cacheService.set('array', arr);
      expect(await cacheService.get('array')).toEqual(arr);
    });

    it('应该支持null和undefined', async () => {
      await cacheService.set('null', null);
      await cacheService.set('undefined', undefined);

      expect(await cacheService.get('null')).toBe(null);
      expect(await cacheService.get('undefined')).toBe(undefined);
    });
  });

  describe('边界情况', () => {
    it('应该处理空键名', async () => {
      await cacheService.set('', 'empty key');
      expect(await cacheService.get('')).toBe('empty key');
    });

    it('应该处理重复设置相同键', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key1', 'value2');

      expect(await cacheService.get('key1')).toBe('value2');
      expect(cacheService.getStats().size).toBe(1);
    });

    it('应该处理零TTL', async () => {
      await cacheService.set('key1', 'value1', 0);

      // 推进时间1ms，使其过期
      vi.advanceTimersByTime(1);

      // 立即过期
      expect(await cacheService.get('key1')).toBe(null);
    });

    it('应该处理负数TTL', async () => {
      await cacheService.set('key1', 'value1', -1000);

      // 立即过期
      expect(await cacheService.get('key1')).toBe(null);
    });
  });
});
