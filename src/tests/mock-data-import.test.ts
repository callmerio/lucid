/**
 * Mock Data 导入方式测试
 * 验证不同的 mock data 加载方式在 WXT 框架下的可行性
 */

import { describe, test, expect, vi } from 'vitest';

// 方式1: 直接导入 JSON 文件（静态导入）
import testMockData from './mock-data/test-mock-data.json';

describe('Mock Data 导入方式测试', () => {
  test('方式1: 直接静态导入 JSON 文件', () => {
    expect(testMockData).toBeDefined();
    expect(testMockData.words).toHaveLength(1);
    expect(testMockData.words[0].word).toBe('test');
    console.log('✅ 静态导入成功:', testMockData);
  });

  test('方式2: 动态导入 JSON 文件', async () => {
    try {
      // 动态导入
      const mockData = await import('./mock-data/test-mock-data.json');
      expect(mockData.default).toBeDefined();
      expect(mockData.default.words).toHaveLength(1);
      console.log('✅ 动态导入成功:', mockData.default);
    } catch (error) {
      console.error('❌ 动态导入失败:', error);
      throw error;
    }
  });

  test('方式3: 使用 fetch 加载（模拟浏览器环境）', async () => {
    // 这个测试在 Node.js 环境中可能失败，但可以验证代码逻辑
    try {
      // 模拟浏览器环境的 fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(testMockData)
      });

      const response = await fetch('./mock-data/test-mock-data.json');
      const data = await response.json();
      
      expect(data).toBeDefined();
      expect(data.words).toHaveLength(1);
      console.log('✅ Fetch 方式成功:', data);
    } catch (error) {
      console.error('❌ Fetch 方式失败:', error);
      throw error;
    }
  });
});
