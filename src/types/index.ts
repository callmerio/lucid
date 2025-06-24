/**
 * 类型定义统一导出
 * 整合所有类型定义，提供统一的导入入口
 */

// 基础类型
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Position, Size {}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// 单词相关类型
export interface Word {
  text: string;
  language: string;
  normalized: string;
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
  examples?: Array<{
    sentence: string;
    translation: string;
  }>;
  pronunciation?: {
    us?: string;
    uk?: string;
    audio?: {
      us?: string;
      uk?: string;
    };
  };
}

export interface WordState {
  word: string;
  count: number;
  isFavorite: boolean;
  isHighlighted: boolean;
  lastAccessed: number;
  createdAt: number;
}

// 高亮相关类型 (保持向后兼容)
export interface HighlightData {
  id: string;
  text: string;
  color: string;
  count: number;
  timestamp: number;
}

export interface HighlightOptions {
  color: string;
  opacity: number;
  animation: boolean;
  persistent: boolean;
}

export interface HighlightInfo {
  id: string;
  word: string;
  element: HTMLElement;
  options: HighlightOptions;
  createdAt: number;
  count: number;
}

// 用户设置类型 (保持向后兼容)
export interface UserSettings {
  theme: "light" | "dark" | "auto";
  highlightColor: string;
  enableShortcuts: boolean;
}

// 扩展的用户偏好类型
export interface UserPreferences extends UserSettings {
  language: string;
  fontSize: number;
  animations: boolean;
  sounds: boolean;
  notifications: boolean;
  autoHighlight: boolean;
  showPhonetic: boolean;
  showExamples: boolean;
}

// 缓存相关类型
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount?: number;
  lastAccessed?: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  strategy?: 'lru' | 'fifo' | 'lfu';
}

// API 相关类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

// 存储相关类型
export interface StorageItem<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
}

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  ttl?: number;
}

// 统计相关类型
export interface UsageStats {
  totalWords: number;
  totalLookups: number;
  totalHighlights: number;
  favoriteWords: number;
  dailyUsage: Array<{
    date: string;
    lookups: number;
    highlights: number;
  }>;
  topWords: Array<{
    word: string;
    count: number;
  }>;
}

// 错误相关类型
export interface LucidError extends Error {
  code: string;
  context?: unknown;
  timestamp: number;
  recoverable: boolean;
}

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  eventType?: string;
}

// 性能相关类型
export interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  errorRate: number;
}

// 导出其他模块的类型
export * from './events';
export * from './config';

// 重新导出组件类型
export type {
  BaseComponentProps,
  TooltipProps,
  HighlightMarkerProps,
  DetailedWordData,
  EventHandler,
  AsyncEventHandler,
  ComponentState,
  WithErrorBoundaryProps,
} from '../components/types';

// 重新导出服务类型
export type {
  BaseService,
  DataService,
  CacheService,
  StorageService,
  ApiService,
  DictionaryApiService,
  EventService,
  ServiceContainer,
} from '../services/interfaces';

// 重新导出管理器类型
export type {
  TooltipRenderOptions,
  Position as TooltipPosition,
  PositionOptions,
  TooltipState,
  StateChangeEvent,
  StateChangeHandler,
  EventHandlerOptions,
  TooltipManagerOptions,
  ShowTooltipOptions,
} from '../utils/dom/managers';

// 工具类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type Awaited<T> = T extends Promise<infer U> ? U : T;

// 常量类型
export const LUCID_CONSTANTS = {
  APP_NAME: 'Lucid',
  VERSION: '1.0.0',
  STORAGE_PREFIX: 'lucid_',
  CACHE_PREFIX: 'cache_',
  EVENT_PREFIX: 'lucid:',
  CSS_PREFIX: 'lucid-',
  DATA_ATTRIBUTES: {
    WORD: 'data-lucid-word',
    HIGHLIGHT: 'data-lucid-highlight',
    TOOLTIP: 'data-lucid-tooltip',
    COUNT: 'data-lucid-count',
  },
  SELECTORS: {
    HIGHLIGHT: '.lucid-highlight',
    TOOLTIP: '.lucid-tooltip',
    CONTAINER: '.lucid-container',
  },
  TIMEOUTS: {
    TOOLTIP_SHOW: 500,
    TOOLTIP_HIDE: 300,
    API_REQUEST: 5000,
    CACHE_CLEANUP: 300000, // 5 minutes
  },
} as const;

export type LucidConstants = typeof LUCID_CONSTANTS;