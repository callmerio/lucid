/**
 * @file StyleInjectionService.ts
 * @description 样式注入服务，负责向 Shadow DOM 中动态注入扩展样式
 * 使用内联样式字符串，确保样式可靠加载
 */

import {
  getAllShadowStyles,
  getTooltipStyles,
  getToolfullStyles,
  shadowResetCSS
} from '@styles/shadow/shadowStyles';

export interface StyleInjectionOptions {
  componentType?: 'tooltip' | 'toolfull' | 'all';
  customStyles?: string[];
  priority?: number;
}

class StyleInjectionService {
  private static instance: StyleInjectionService;
  private injectedStyles: Set<string> = new Set();

  private constructor() { }

  public static getInstance(): StyleInjectionService {
    if (!StyleInjectionService.instance) {
      StyleInjectionService.instance = new StyleInjectionService();
    }
    return StyleInjectionService.instance;
  }

  /**
   * 根据组件类型获取对应的样式
   */
  private getStylesByComponentType(componentType: 'tooltip' | 'toolfull' | 'all'): string {
    switch (componentType) {
      case 'tooltip':
        return getTooltipStyles();
      case 'toolfull':
        return getToolfullStyles();
      case 'all':
      default:
        return getAllShadowStyles();
    }
  }

  /**
   * 向 Shadow DOM 注入样式
   * 使用 link 标签加载扩展 CSS 文件，参考 trancy 的方式
   */
  public async injectStyles(
    shadowRoot: ShadowRoot,
    options: StyleInjectionOptions = {}
  ): Promise<void> {
    const { componentType = 'all', customStyles = [] } = options;

    try {
      // 创建样式注入的容器
      const styleContainer = document.createElement('div');
      styleContainer.className = 'lucid-shadow-styles';

      // 1. 先注入 link 标签加载扩展的 CSS 文件 (类似 trancy)
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = this.getExtensionResourceUrl('content-scripts/content.css');

      // 添加错误处理
      linkElement.onerror = () => {
        console.warn('[StyleInjectionService] Failed to load content.css, falling back to inline styles');
        // 如果 link 加载失败，fallback 到完整内联样式
        this.injectInlineStyles(styleContainer, componentType);
      };

      linkElement.onload = () => {
        console.log('[StyleInjectionService] CSS loaded successfully via link tag');
      };

      styleContainer.appendChild(linkElement);

      // 2. 只注入 Shadow DOM 必要的重置样式
      const resetStyles = this.getResetStyles();
      const resetStyleElement = document.createElement('style');
      resetStyleElement.setAttribute('data-lucid-reset', 'true');
      resetStyleElement.textContent = resetStyles;
      styleContainer.appendChild(resetStyleElement);

      // 3. 注入自定义样式
      if (customStyles.length > 0) {
        const customStyleElement = document.createElement('style');
        customStyleElement.setAttribute('data-lucid-custom', 'true');
        customStyleElement.textContent = customStyles.join('\n');
        styleContainer.appendChild(customStyleElement);
      }

      // 将样式容器添加到 shadow root 的开头
      if (shadowRoot.firstChild) {
        shadowRoot.insertBefore(styleContainer, shadowRoot.firstChild);
      } else {
        shadowRoot.appendChild(styleContainer);
      }

      // 记录已注入的样式
      const styleId = `${componentType}-${Date.now()}`;
      this.injectedStyles.add(styleId);

      console.log(`[StyleInjectionService] Styles injected successfully for ${componentType} using link + inline`);
    } catch (error) {
      console.error('[StyleInjectionService] Failed to inject styles:', error);
      throw error;
    }
  }

  /**
   * 获取扩展资源 URL
   */
  private getExtensionResourceUrl(path: string): string {
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime?.getURL) {
      return (window as any).chrome.runtime.getURL(path);
    }
    return path;
  }

  /**
   * Fallback: 注入完整的内联样式 (仅在 link 加载失败时使用)
   */
  private injectInlineStyles(container: HTMLElement, componentType: 'tooltip' | 'toolfull' | 'all'): void {
    console.log(`[StyleInjectionService] Injecting fallback styles for ${componentType}`);
    
    // 注入完整的组件样式作为备用
    const componentStyles = this.getStylesByComponentType(componentType);
    const fallbackStyleElement = document.createElement('style');
    fallbackStyleElement.setAttribute('data-lucid-fallback', 'true');
    fallbackStyleElement.textContent = componentStyles;
    container.appendChild(fallbackStyleElement);
  }

  /**
   * 获取基础样式重置
   */
  public getResetStyles(): string {
    return shadowResetCSS;
  }

  /**
   * 根据组件类型获取优化的样式
   */
  public getStylesForComponent(componentType: 'tooltip' | 'toolfull'): string {
    return this.getStylesByComponentType(componentType);
  }

  /**
   * 清理样式缓存
   */
  public clearCache(): void {
    this.injectedStyles.clear();
    console.log('[StyleInjectionService] Cache cleared');
  }

  /**
   * 获取已注入样式的统计信息
   */
  public getStats(): { injectedCount: number; injectedStyles: string[] } {
    return {
      injectedCount: this.injectedStyles.size,
      injectedStyles: Array.from(this.injectedStyles)
    };
  }

  /**
   * 检查样式是否支持组件类型
   */
  public supportsComponentType(componentType: string): boolean {
    return ['tooltip', 'toolfull', 'all'].includes(componentType);
  }
}

export const styleInjectionService = StyleInjectionService.getInstance();