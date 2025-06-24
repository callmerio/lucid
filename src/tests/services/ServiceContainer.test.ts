/**
 * ServiceContainer 单元测试
 * 测试依赖注入容器的核心功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock 实现 - 模拟服务容器
class MockServiceContainer {
  private services = new Map<string | symbol, any>();
  private singletons = new Map<string | symbol, any>();
  private static instance: MockServiceContainer;

  private constructor() {}

  static getInstance(): MockServiceContainer {
    if (!MockServiceContainer.instance) {
      MockServiceContainer.instance = new MockServiceContainer();
    }
    return MockServiceContainer.instance;
  }

  static resetInstance(): void {
    MockServiceContainer.instance = null as any;
  }

  register<T>(token: string | symbol, implementation: T): void {
    this.services.set(token, implementation);
  }

  registerSingleton<T>(token: string | symbol, factory: () => T): void {
    this.services.set(token, factory);
    this.singletons.set(token, null);
  }

  resolve<T>(token: string | symbol): T {
    if (!this.has(token)) {
      throw new Error(`Service not found: ${String(token)}`);
    }

    // 检查是否为单例
    if (this.singletons.has(token)) {
      let instance = this.singletons.get(token);
      if (!instance) {
        const factory = this.services.get(token) as () => T;
        instance = factory();
        this.singletons.set(token, instance);
      }
      return instance;
    }

    const service = this.services.get(token);
    
    // 如果是工厂函数，调用它
    if (typeof service === 'function') {
      return service();
    }
    
    return service;
  }

  has(token: string | symbol): boolean {
    return this.services.has(token);
  }

  remove(token: string | symbol): void {
    this.services.delete(token);
    this.singletons.delete(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  getRegisteredTokens(): (string | symbol)[] {
    return Array.from(this.services.keys());
  }

  registerBatch(services: Array<{
    token: string | symbol;
    implementation: any;
    singleton?: boolean;
  }>): void {
    services.forEach(({ token, implementation, singleton = false }) => {
      if (singleton) {
        this.registerSingleton(token, implementation);
      } else {
        this.register(token, implementation);
      }
    });
  }
}

// Mock 服务接口
interface MockDataService {
  getData(key: string): Promise<any>;
  setData(key: string, value: any): Promise<void>;
}

class MockDataServiceImpl implements MockDataService {
  private data = new Map<string, any>();

  async getData(key: string): Promise<any> {
    return this.data.get(key) || null;
  }

  async setData(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }
}

describe('ServiceContainer', () => {
  let container: MockServiceContainer;
  const TEST_TOKEN = 'TestService';
  const TEST_SYMBOL = Symbol('TestSymbol');

  beforeEach(() => {
    MockServiceContainer.resetInstance();
    container = MockServiceContainer.getInstance();
  });

  afterEach(() => {
    container.clear();
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = MockServiceContainer.getInstance();
      const instance2 = MockServiceContainer.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('应该在重置后创建新实例', () => {
      const instance1 = MockServiceContainer.getInstance();
      MockServiceContainer.resetInstance();
      const instance2 = MockServiceContainer.getInstance();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('服务注册', () => {
    it('应该注册字符串令牌服务', () => {
      const service = new MockDataServiceImpl();
      
      container.register(TEST_TOKEN, service);
      
      expect(container.has(TEST_TOKEN)).toBe(true);
      expect(container.resolve(TEST_TOKEN)).toBe(service);
    });

    it('应该注册Symbol令牌服务', () => {
      const service = new MockDataServiceImpl();
      
      container.register(TEST_SYMBOL, service);
      
      expect(container.has(TEST_SYMBOL)).toBe(true);
      expect(container.resolve(TEST_SYMBOL)).toBe(service);
    });

    it('应该注册工厂函数服务', () => {
      const factory = vi.fn(() => new MockDataServiceImpl());
      
      container.register(TEST_TOKEN, factory);
      
      const service1 = container.resolve(TEST_TOKEN);
      const service2 = container.resolve(TEST_TOKEN);
      
      expect(factory).toHaveBeenCalledTimes(2);
      expect(service1).not.toBe(service2);
    });

    it('应该注册单例服务', () => {
      const factory = vi.fn(() => new MockDataServiceImpl());
      
      container.registerSingleton(TEST_TOKEN, factory);
      
      const service1 = container.resolve(TEST_TOKEN);
      const service2 = container.resolve(TEST_TOKEN);
      
      expect(factory).toHaveBeenCalledTimes(1);
      expect(service1).toBe(service2);
    });
  });

  describe('服务解析', () => {
    it('应该解析已注册的服务', () => {
      const service = new MockDataServiceImpl();
      container.register(TEST_TOKEN, service);
      
      const resolved = container.resolve(TEST_TOKEN);
      
      expect(resolved).toBe(service);
    });

    it('应该在服务不存在时抛出错误', () => {
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow('Service not found: NonExistentService');
    });

    it('应该在Symbol服务不存在时抛出错误', () => {
      const nonExistentSymbol = Symbol('NonExistent');
      
      expect(() => {
        container.resolve(nonExistentSymbol);
      }).toThrow(`Service not found: ${String(nonExistentSymbol)}`);
    });
  });

  describe('服务管理', () => {
    it('应该检查服务是否存在', () => {
      expect(container.has(TEST_TOKEN)).toBe(false);
      
      container.register(TEST_TOKEN, new MockDataServiceImpl());
      
      expect(container.has(TEST_TOKEN)).toBe(true);
    });

    it('应该移除服务', () => {
      const service = new MockDataServiceImpl();
      container.register(TEST_TOKEN, service);
      
      expect(container.has(TEST_TOKEN)).toBe(true);
      
      container.remove(TEST_TOKEN);
      
      expect(container.has(TEST_TOKEN)).toBe(false);
    });

    it('应该移除单例服务', () => {
      const factory = () => new MockDataServiceImpl();
      container.registerSingleton(TEST_TOKEN, factory);
      
      expect(container.has(TEST_TOKEN)).toBe(true);
      
      container.remove(TEST_TOKEN);
      
      expect(container.has(TEST_TOKEN)).toBe(false);
    });

    it('应该清空所有服务', () => {
      container.register('service1', new MockDataServiceImpl());
      container.register('service2', new MockDataServiceImpl());
      
      expect(container.getRegisteredTokens()).toHaveLength(2);
      
      container.clear();
      
      expect(container.getRegisteredTokens()).toHaveLength(0);
    });
  });

  describe('批量注册', () => {
    it('应该批量注册普通服务', () => {
      const services = [
        { token: 'service1', implementation: new MockDataServiceImpl() },
        { token: 'service2', implementation: new MockDataServiceImpl() },
      ];
      
      container.registerBatch(services);
      
      expect(container.has('service1')).toBe(true);
      expect(container.has('service2')).toBe(true);
    });

    it('应该批量注册单例服务', () => {
      const factory1 = vi.fn(() => new MockDataServiceImpl());
      const factory2 = vi.fn(() => new MockDataServiceImpl());
      
      const services = [
        { token: 'service1', implementation: factory1, singleton: true },
        { token: 'service2', implementation: factory2, singleton: true },
      ];
      
      container.registerBatch(services);
      
      // 解析两次，验证单例行为
      const service1a = container.resolve('service1');
      const service1b = container.resolve('service1');
      const service2a = container.resolve('service2');
      const service2b = container.resolve('service2');
      
      expect(factory1).toHaveBeenCalledTimes(1);
      expect(factory2).toHaveBeenCalledTimes(1);
      expect(service1a).toBe(service1b);
      expect(service2a).toBe(service2b);
    });

    it('应该批量注册混合类型服务', () => {
      const normalService = new MockDataServiceImpl();
      const singletonFactory = vi.fn(() => new MockDataServiceImpl());
      
      const services = [
        { token: 'normal', implementation: normalService },
        { token: 'singleton', implementation: singletonFactory, singleton: true },
      ];
      
      container.registerBatch(services);
      
      expect(container.resolve('normal')).toBe(normalService);
      
      const singleton1 = container.resolve('singleton');
      const singleton2 = container.resolve('singleton');
      expect(singleton1).toBe(singleton2);
      expect(singletonFactory).toHaveBeenCalledTimes(1);
    });
  });

  describe('获取注册信息', () => {
    it('应该返回所有注册的令牌', () => {
      container.register('service1', new MockDataServiceImpl());
      container.register(TEST_SYMBOL, new MockDataServiceImpl());
      
      const tokens = container.getRegisteredTokens();
      
      expect(tokens).toHaveLength(2);
      expect(tokens).toContain('service1');
      expect(tokens).toContain(TEST_SYMBOL);
    });

    it('应该在没有服务时返回空数组', () => {
      const tokens = container.getRegisteredTokens();
      
      expect(tokens).toHaveLength(0);
      expect(Array.isArray(tokens)).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理工厂函数抛出的错误', () => {
      const errorFactory = () => {
        throw new Error('Factory error');
      };
      
      container.register(TEST_TOKEN, errorFactory);
      
      expect(() => {
        container.resolve(TEST_TOKEN);
      }).toThrow('Factory error');
    });

    it('应该处理单例工厂函数抛出的错误', () => {
      const errorFactory = () => {
        throw new Error('Singleton factory error');
      };
      
      container.registerSingleton(TEST_TOKEN, errorFactory);
      
      expect(() => {
        container.resolve(TEST_TOKEN);
      }).toThrow('Singleton factory error');
    });
  });
});
