/**
 * @file ShadowDOMService.ts
 * @description Shadow DOM 管理服务，负责创建和管理 shadow DOM 容器
 * 参考 trancy 扩展的架构模式，提供样式隔离功能
 */

export interface ShadowDOMOptions {
  id: string;
  mode?: 'open' | 'closed';
  delegatesFocus?: boolean;
}

export interface ShadowDOMContainer {
  hostElement: HTMLElement;
  shadowRoot: ShadowRoot;
  contentContainer: HTMLElement;
}

class ShadowDOMService {
  private static instance: ShadowDOMService;
  private containers: Map<string, ShadowDOMContainer> = new Map();

  private constructor() {}

  public static getInstance(): ShadowDOMService {
    if (!ShadowDOMService.instance) {
      ShadowDOMService.instance = new ShadowDOMService();
    }
    return ShadowDOMService.instance;
  }

  /**
   * 创建 Shadow DOM 容器
   * 参考 trancy 的 <xt-card> 结构
   */
  public createShadowContainer(options: ShadowDOMOptions): ShadowDOMContainer {
    const { id, mode = 'open', delegatesFocus = false } = options;

    if (this.containers.has(id)) {
      console.warn(`[ShadowDOMService] Container with id "${id}" already exists`);
      return this.containers.get(id)!;
    }

    // 创建宿主元素，类似 trancy 的 <xt-card>
    const hostElement = document.createElement('lucid-shadow-host');
    hostElement.id = `lucid-shadow-${id}`;
    
    // 创建 shadow root
    const shadowRoot = hostElement.attachShadow({ 
      mode, 
      delegatesFocus 
    });

    // 创建内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'lucid-shadow-content';

    shadowRoot.appendChild(contentContainer);

    const container: ShadowDOMContainer = {
      hostElement,
      shadowRoot,
      contentContainer
    };

    this.containers.set(id, container);

    console.log(`[ShadowDOMService] Created shadow container: "${id}"`);
    return container;
  }

  /**
   * 获取 Shadow DOM 容器
   */
  public getContainer(id: string): ShadowDOMContainer | undefined {
    return this.containers.get(id);
  }

  /**
   * 销毁 Shadow DOM 容器
   */
  public destroyContainer(id: string): void {
    const container = this.containers.get(id);
    if (!container) {
      console.warn(`[ShadowDOMService] Container with id "${id}" not found`);
      return;
    }

    // 移除宿主元素
    if (container.hostElement.parentNode) {
      container.hostElement.parentNode.removeChild(container.hostElement);
    }

    this.containers.delete(id);
    console.log(`[ShadowDOMService] Destroyed shadow container: "${id}"`);
  }

  /**
   * 检查是否存在容器
   */
  public hasContainer(id: string): boolean {
    return this.containers.has(id);
  }

  /**
   * 清理所有容器
   */
  public cleanup(): void {
    const containerIds = Array.from(this.containers.keys());
    containerIds.forEach(id => this.destroyContainer(id));
    console.log('[ShadowDOMService] Cleaned up all containers');
  }

  /**
   * 获取所有容器 ID
   */
  public getContainerIds(): string[] {
    return Array.from(this.containers.keys());
  }
}

export const shadowDOMService = ShadowDOMService.getInstance();