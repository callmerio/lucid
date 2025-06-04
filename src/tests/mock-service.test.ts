/**
 * Mock Service 测试
 * 验证修复后的 mock data 服务是否正常工作
 */

import { describe, test, expect } from 'vitest';
import { mockDataService, StaticMockDataService } from '@services/mock/mockDataService';

describe('Mock Data Service 修复验证', () => {
  test('静态 mock 服务应该能正常加载数据', async () => {
    const data = await mockDataService.getTooltipData();
    
    expect(data).toBeDefined();
    expect(data.words).toBeDefined();
    expect(Array.isArray(data.words)).toBe(true);
    expect(data.words.length).toBeGreaterThan(0);
    
    console.log('✅ 静态服务测试成功:', data.words[0].word);
  });

  test('应该能根据单词获取定义', async () => {
    const wordData = await mockDataService.getWordDefinition('escalade');
    
    expect(wordData).toBeDefined();
    expect(wordData.word).toBeDefined();
    expect(wordData.phonetic).toBeDefined();
    expect(wordData.explain).toBeDefined();
    
    console.log('✅ 单词定义获取成功:', wordData.word);
  });

  test('未找到单词时应该返回fallback数据', async () => {
    const wordData = await mockDataService.getWordDefinition('nonexistentword');
    
    expect(wordData).toBeDefined();
    expect(wordData.word).toBeDefined();
    expect(wordData.explain).toBeDefined();
    
    console.log('✅ Fallback数据测试成功:', wordData.word);
  });

  test('静态服务实例应该是单例', () => {
    const instance1 = StaticMockDataService.getInstance();
    const instance2 = StaticMockDataService.getInstance();
    
    expect(instance1).toBe(instance2);
    console.log('✅ 单例模式测试成功');
  });
});
