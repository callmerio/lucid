/**
 * 缓存服务
 * 负责管理查词结果的本地缓存，提高响应速度
 */

import { CacheService as ICacheService, CacheStats } from '../interfaces';
import type { WordDefinition } from '../api/dictionaryApi';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

/**
 * LRU 缓存服务
 * 实现最近最少使用 (LRU) 缓存算法
 */
export class CacheService implements ICacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>>;
  private accessOrder: string[];
  private maxSize: number;
  private defaultTtl: number;
  private hitCount: number = 0;
  private missCount: number = 0;

  private constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = options.maxSize || 1000; // 默认最大 1000 条缓存
    this.defaultTtl = options.ttl || 24 * 60 * 60 * 1000; // 默认 24 小时
  }

  /**
   * 获取单例实例
   */
  public static getInstance(options?: CacheOptions): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(options);
    }
    return CacheService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    // 启动定期清理
    this.startPeriodicCleanup();
  }

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    await this.clear();
  }

  /**
   * 生成缓存键
   */
  private generateKey(word: string, language: string = 'en'): string {
    return `${language}:${word.toLowerCase()}`;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
          this.accessOrder.splice(index, 1);
        }
      }
    }
  }

  /**
   * 确保缓存大小不超过限制
   */
  private ensureMaxSize(): void {
    while (this.cache.size > this.maxSize && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * 获取缓存值
   */
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

  /**
   * 设置缓存值
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTtl);

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt,
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.ensureMaxSize();
  }

  /**
   * 删除缓存
   */
  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      oldestEntry: oldestTimestamp === Infinity ? undefined : oldestTimestamp,
      newestEntry: newestTimestamp === 0 ? undefined : newestTimestamp,
    };
  }

  /**
   * 获取缓存的单词定义 (向后兼容)
   */
  async getWordDefinition(word: string, language: string = 'en'): Promise<WordDefinition | null> {
    const key = this.generateKey(word, language);
    return this.get<WordDefinition>(key);
  }

  /**
   * 缓存单词定义 (向后兼容)
   */
  async setWordDefinition(
    word: string, 
    definition: WordDefinition, 
    language: string = 'en',
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(word, language);
    return this.set(key, definition, ttl);
  }

  /**
   * 删除特定缓存 (向后兼容)
   */
  async removeWordDefinition(word: string, language: string = 'en'): Promise<void> {
    const key = this.generateKey(word, language);
    return this.remove(key);
  }

  /**
   * 定期清理过期缓存
   */
  startPeriodicCleanup(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);
  }
}
