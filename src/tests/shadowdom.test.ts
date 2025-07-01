/**
 * @file shadowdom.test.ts
 * @description Shadow DOM 功能测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shadowDOMService } from '../services/ShadowDOMService';
import { styleInjectionService } from '../services/StyleInjectionService';

describe('Shadow DOM Service', () => {
  beforeEach(() => {
    // 清理之前的测试
    shadowDOMService.cleanup();
  });

  afterEach(() => {
    // 清理测试
    shadowDOMService.cleanup();
  });

  it('should create shadow container with proper structure', () => {
    const containerId = 'test-container';
    const container = shadowDOMService.createShadowContainer({ id: containerId });

    expect(container).toBeDefined();
    expect(container.hostElement).toBeInstanceOf(HTMLElement);
    expect(container.shadowRoot).toBeInstanceOf(ShadowRoot);
    expect(container.contentContainer).toBeInstanceOf(HTMLElement);
    
    // 检查宿主元素
    expect(container.hostElement.tagName.toLowerCase()).toBe('lucid-shadow-host');
    expect(container.hostElement.id).toBe(`lucid-shadow-${containerId}`);
    
    // 检查内容容器
    expect(container.contentContainer.className).toBe('lucid-shadow-content');
    expect(container.shadowRoot.contains(container.contentContainer)).toBe(true);
  });

  it('should manage multiple containers', () => {
    const container1 = shadowDOMService.createShadowContainer({ id: 'container1' });
    const container2 = shadowDOMService.createShadowContainer({ id: 'container2' });

    expect(shadowDOMService.hasContainer('container1')).toBe(true);
    expect(shadowDOMService.hasContainer('container2')).toBe(true);
    expect(shadowDOMService.getContainerIds()).toEqual(['container1', 'container2']);

    shadowDOMService.destroyContainer('container1');
    expect(shadowDOMService.hasContainer('container1')).toBe(false);
    expect(shadowDOMService.hasContainer('container2')).toBe(true);
  });

  it('should prevent duplicate container creation', () => {
    const containerId = 'duplicate-test';
    const container1 = shadowDOMService.createShadowContainer({ id: containerId });
    const container2 = shadowDOMService.createShadowContainer({ id: containerId });

    expect(container1).toBe(container2);
    expect(shadowDOMService.getContainerIds()).toEqual([containerId]);
  });
});

describe('Style Injection Service', () => {
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    // 创建测试用的 shadow DOM
    const hostElement = document.createElement('div');
    shadowRoot = hostElement.attachShadow({ mode: 'open' });
    document.body.appendChild(hostElement);
  });

  afterEach(() => {
    // 清理测试
    document.body.innerHTML = '';
    styleInjectionService.clearCache();
  });

  it('should inject link and reset styles', async () => {
    await styleInjectionService.injectStyles(shadowRoot, {
      componentType: 'tooltip'
    });

    const styleContainer = shadowRoot.querySelector('.lucid-shadow-styles');
    expect(styleContainer).toBeInstanceOf(HTMLElement);
    
    // 检查 link 标签
    const linkElement = styleContainer?.querySelector('link[rel="stylesheet"]');
    expect(linkElement).toBeInstanceOf(HTMLLinkElement);
    expect(linkElement?.getAttribute('href')).toContain('content.css');
    
    // 检查重置样式
    const resetStyleElement = styleContainer?.querySelector('style[data-lucid-reset="true"]');
    expect(resetStyleElement).toBeInstanceOf(HTMLStyleElement);
    expect(resetStyleElement?.textContent).toContain(':host');
  });

  it('should inject same structure for different component types', async () => {
    await styleInjectionService.injectStyles(shadowRoot, {
      componentType: 'toolfull'
    });

    const styleContainer = shadowRoot.querySelector('.lucid-shadow-styles');
    const linkElement = styleContainer?.querySelector('link[rel="stylesheet"]');
    const resetStyleElement = styleContainer?.querySelector('style[data-lucid-reset="true"]');
    
    expect(linkElement).toBeInstanceOf(HTMLLinkElement);
    expect(resetStyleElement).toBeInstanceOf(HTMLStyleElement);
  });

  it('should inject custom styles', async () => {
    const customStyles = ['.custom-class { color: red; }'];
    
    await styleInjectionService.injectStyles(shadowRoot, {
      componentType: 'all',
      customStyles
    });

    const styleContainer = shadowRoot.querySelector('.lucid-shadow-styles');
    const customStyleElement = styleContainer?.querySelector('style[data-lucid-custom="true"]');
    
    expect(customStyleElement).toBeInstanceOf(HTMLStyleElement);
    expect(customStyleElement?.textContent).toContain('.custom-class');
  });

  it('should provide component type support', () => {
    expect(styleInjectionService.supportsComponentType('tooltip')).toBe(true);
    expect(styleInjectionService.supportsComponentType('toolfull')).toBe(true);
    expect(styleInjectionService.supportsComponentType('all')).toBe(true);
    expect(styleInjectionService.supportsComponentType('invalid')).toBe(false);
  });
});