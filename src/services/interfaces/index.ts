/**
 * 服务层接口定义
 * 定义所有服务的抽象接口，实现依赖倒置原则
 */

// 基础服务接口
export interface BaseService {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}

// 数据服务接口
export interface DataService<T = any> extends BaseService {
  getData(key: string): Promise<T | null>;
  setData(key: string, value: T): Promise<void>;
  removeData(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 缓存服务接口
export interface CacheService<T = any> extends BaseService {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): CacheStats;
}

// 存储服务接口
export interface StorageService<T = any> extends BaseService {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  watch(key: string, callback: (value: T | null) => void): () => void;
}

// API服务接口
export interface ApiService<TRequest = any, TResponse = any> extends BaseService {
  request(params: TRequest): Promise<TResponse>;
  get(url: string, params?: any): Promise<TResponse>;
  post(url: string, data?: any): Promise<TResponse>;
}

// 字典API服务接口
export interface DictionaryApiService extends ApiService {
  getWordDefinition(word: string, language?: string): Promise<WordDefinition>;
  getWordExamples(word: string, language?: string): Promise<WordExample[]>;
  getWordPronunciation(word: string, language?: string): Promise<WordPronunciation>;
}

// 事件服务接口
export interface EventService extends BaseService {
  subscribe<T>(eventType: string, handler: EventHandler<T>): EventCleanup;
  unsubscribe(eventType: string, handler: EventHandler): void;
  emit<T>(eventType: string, payload: T): void;
  once<T>(eventType: string, handler: EventHandler<T>): EventCleanup;
}

// 类型定义
export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface WordDefinition {
  word: string;
  phonetic?: string;
  translation: string;
  partOfSpeech?: string;
  definitions?: Array<{
    meaning: string;
    example?: string;
  }>;
}

export interface WordExample {
  sentence: string;
  translation: string;
  source?: string;
}

export interface WordPronunciation {
  us?: string;
  uk?: string;
  audio?: {
    us?: string;
    uk?: string;
  };
}

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;
export type EventCleanup = () => void;

// 服务容器接口
export interface ServiceContainer {
  register<T>(token: string | symbol, implementation: T): void;
  resolve<T>(token: string | symbol): T;
  has(token: string | symbol): boolean;
  remove(token: string | symbol): void;
}

// 服务令牌
export const SERVICE_TOKENS = {
  CACHE_SERVICE: Symbol('CacheService'),
  STORAGE_SERVICE: Symbol('StorageService'),
  DICTIONARY_API_SERVICE: Symbol('DictionaryApiService'),
  EVENT_SERVICE: Symbol('EventService'),
  DATA_SERVICE: Symbol('DataService'),
} as const;