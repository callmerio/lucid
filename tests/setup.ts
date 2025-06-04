/**
 * Vitest 测试环境设置
 */

import { vi } from 'vitest';

// 模拟浏览器环境
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// 模拟 browser API
(global as any).browser = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
};

// 模拟 fetch API
global.fetch = vi.fn();
