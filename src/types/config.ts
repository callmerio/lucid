/**
 * 配置类型定义
 * 统一管理应用配置相关的类型
 */

// 基础配置接口
export interface BaseConfig {
  enabled: boolean;
  version: string;
  debug?: boolean;
}

// Tooltip 配置
export interface TooltipConfig extends BaseConfig {
  showDelay: number;
  hideDelay: number;
  maxWidth: number;
  maxHeight: number;
  position: {
    preferred: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset: number;
    margin: number;
  };
  animation: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  style: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    fontFamily: string;
    borderRadius: number;
    shadow: boolean;
  };
}

// 高亮配置
export interface HighlightConfig extends BaseConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  opacity: {
    normal: number;
    hover: number;
    active: number;
  };
  animation: {
    enabled: boolean;
    duration: number;
    type: 'fade' | 'slide' | 'scale';
  };
  limits: {
    maxHighlights: number;
    maxWordLength: number;
  };
}

// 缓存配置
export interface CacheConfig extends BaseConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number;
  strategy: 'lru' | 'fifo' | 'lfu';
  persistence: {
    enabled: boolean;
    storageType: 'localStorage' | 'indexedDB' | 'memory';
    key: string;
  };
}

// API 配置
export interface ApiConfig extends BaseConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'apiKey' | 'bearer' | 'basic';
    credentials?: {
      apiKey?: string;
      token?: string;
      username?: string;
      password?: string;
    };
  };
  endpoints: {
    dictionary: string;
    translation: string;
    pronunciation: string;
    examples: string;
  };
}

// 用户界面配置
export interface UIConfig extends BaseConfig {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  sounds: boolean;
  notifications: boolean;
  shortcuts: {
    enabled: boolean;
    toggleTooltip: string;
    expandTooltip: string;
    hideTooltip: string;
    toggleHighlight: string;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

// 性能配置
export interface PerformanceConfig extends BaseConfig {
  debounceDelay: number;
  throttleDelay: number;
  maxConcurrentRequests: number;
  lazyLoading: boolean;
  preloading: boolean;
  optimization: {
    bundleSplitting: boolean;
    codeMinification: boolean;
    imageOptimization: boolean;
    caching: boolean;
  };
}

// 安全配置
export interface SecurityConfig extends BaseConfig {
  contentSecurityPolicy: boolean;
  sanitizeInput: boolean;
  validateOrigin: boolean;
  encryptStorage: boolean;
  permissions: {
    activeTab: boolean;
    storage: boolean;
    contextMenus: boolean;
    notifications: boolean;
  };
}

// 开发配置
export interface DevelopmentConfig extends BaseConfig {
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    console: boolean;
    file: boolean;
    remote: boolean;
  };
  debugging: {
    sourceMap: boolean;
    hotReload: boolean;
    devTools: boolean;
  };
  testing: {
    mockData: boolean;
    coverage: boolean;
    e2e: boolean;
  };
}

// 主应用配置
export interface LucidConfig {
  app: BaseConfig & {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  tooltip: TooltipConfig;
  highlight: HighlightConfig;
  cache: CacheConfig;
  api: ApiConfig;
  ui: UIConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
  development: DevelopmentConfig;
}

// 配置验证接口
export interface ConfigValidator<T = unknown> {
  validate(config: T): ConfigValidationResult;
  getDefaultConfig(): T;
  mergeConfig(base: T, override: Partial<T>): T;
}

// 配置验证结果
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

// 配置验证错误
export interface ConfigValidationError {
  path: string;
  message: string;
  value: unknown;
  expectedType: string;
}

// 配置验证警告
export interface ConfigValidationWarning {
  path: string;
  message: string;
  suggestion: string;
}

// 配置管理器接口
export interface ConfigManager {
  get<K extends keyof LucidConfig>(key: K): LucidConfig[K];
  set<K extends keyof LucidConfig>(key: K, value: LucidConfig[K]): void;
  update<K extends keyof LucidConfig>(key: K, updater: (current: LucidConfig[K]) => LucidConfig[K]): void;
  reset<K extends keyof LucidConfig>(key?: K): void;
  validate(): ConfigValidationResult;
  export(): LucidConfig;
  import(config: Partial<LucidConfig>): void;
  watch<K extends keyof LucidConfig>(key: K, callback: (value: LucidConfig[K]) => void): () => void;
}

// 默认配置工厂
export const createDefaultConfig = (): LucidConfig => ({
  app: {
    name: 'Lucid',
    version: '1.0.0',
    environment: 'development',
    enabled: true,
    debug: false,
  },
  tooltip: {
    enabled: true,
    version: '1.0.0',
    showDelay: 500,
    hideDelay: 300,
    maxWidth: 300,
    maxHeight: 200,
    position: {
      preferred: 'auto',
      offset: 8,
      margin: 10,
    },
    animation: {
      enabled: true,
      duration: 200,
      easing: 'ease-out',
    },
    style: {
      theme: 'auto',
      fontSize: 14,
      fontFamily: 'system-ui, sans-serif',
      borderRadius: 6,
      shadow: true,
    },
  },
  highlight: {
    enabled: true,
    version: '1.0.0',
    colors: {
      primary: '#ffeb3b',
      secondary: '#ff9800',
      accent: '#2196f3',
      background: '#ffffff',
    },
    opacity: {
      normal: 0.3,
      hover: 0.5,
      active: 0.7,
    },
    animation: {
      enabled: true,
      duration: 150,
      type: 'fade',
    },
    limits: {
      maxHighlights: 100,
      maxWordLength: 50,
    },
  },
  cache: {
    enabled: true,
    version: '1.0.0',
    maxSize: 1000,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    strategy: 'lru',
    persistence: {
      enabled: true,
      storageType: 'localStorage',
      key: 'lucid-cache',
    },
  },
  api: {
    enabled: true,
    version: '1.0.0',
    baseUrl: 'https://api.lucid.example.com',
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
    headers: {
      'Content-Type': 'application/json',
    },
    authentication: {
      type: 'none',
    },
    endpoints: {
      dictionary: '/dictionary',
      translation: '/translate',
      pronunciation: '/pronunciation',
      examples: '/examples',
    },
  },
  ui: {
    enabled: true,
    version: '1.0.0',
    language: 'en',
    theme: 'auto',
    animations: true,
    sounds: false,
    notifications: true,
    shortcuts: {
      enabled: true,
      toggleTooltip: 'Alt+T',
      expandTooltip: 'Alt+E',
      hideTooltip: 'Escape',
      toggleHighlight: 'Alt+H',
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false,
    },
  },
  performance: {
    enabled: true,
    version: '1.0.0',
    debounceDelay: 250,
    throttleDelay: 100,
    maxConcurrentRequests: 5,
    lazyLoading: true,
    preloading: false,
    optimization: {
      bundleSplitting: true,
      codeMinification: true,
      imageOptimization: true,
      caching: true,
    },
  },
  security: {
    enabled: true,
    version: '1.0.0',
    contentSecurityPolicy: true,
    sanitizeInput: true,
    validateOrigin: true,
    encryptStorage: false,
    permissions: {
      activeTab: true,
      storage: true,
      contextMenus: true,
      notifications: true,
    },
  },
  development: {
    enabled: false,
    version: '1.0.0',
    logging: {
      level: 'info',
      console: true,
      file: false,
      remote: false,
    },
    debugging: {
      sourceMap: true,
      hotReload: true,
      devTools: true,
    },
    testing: {
      mockData: false,
      coverage: false,
      e2e: false,
    },
  },
});