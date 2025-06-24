/**
 * 服务容器实现
 * 提供依赖注入功能，管理服务的注册和解析
 */

import { ServiceContainer as IServiceContainer } from '../interfaces';

export class ServiceContainer implements IServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string | symbol, any>();
  private singletons = new Map<string | symbol, any>();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * 注册服务
   */
  register<T>(token: string | symbol, implementation: T): void {
    this.services.set(token, implementation);
  }

  /**
   * 注册单例服务
   */
  registerSingleton<T>(
    token: string | symbol, 
    factory: () => T
  ): void {
    this.services.set(token, factory);
    // 标记为单例
    this.singletons.set(token, null);
  }

  /**
   * 解析服务
   */
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

  /**
   * 检查服务是否存在
   */
  has(token: string | symbol): boolean {
    return this.services.has(token);
  }

  /**
   * 移除服务
   */
  remove(token: string | symbol): void {
    this.services.delete(token);
    this.singletons.delete(token);
  }

  /**
   * 清空所有服务
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * 获取所有注册的服务令牌
   */
  getRegisteredTokens(): (string | symbol)[] {
    return Array.from(this.services.keys());
  }

  /**
   * 批量注册服务
   */
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

// 导出全局服务容器实例
export const serviceContainer = ServiceContainer.getInstance();