/**
 * @file DataService.ts
 * @description 统一的数据服务，负责获取和缓存单词数据。
 */

import { IDataService, WordDetails } from '../types/services';
import { mockDataService } from './mock/mockDataService'; // 暂时依赖mock数据

class DataService implements IDataService {
  private static instance: DataService;
  private cache: Map<string, WordDetails> = new Map();

  private constructor() {
    // 私有构造函数，确保单例
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * 获取单词的详细信息。
   * 首先检查缓存，如果未命中，则从数据源（当前为mock）获取，并存入缓存。
   * @param word - 要查询的单词
   * @returns 包含单词详细信息的Promise
   */
  public async getWordDetails(word: string): Promise<WordDetails | null> {
    const normalizedWord = word.toLowerCase();
    
    // 1. 检查缓存
    if (this.cache.has(normalizedWord)) {
      console.log(`[DataService] Cache hit for word: "${normalizedWord}"`);
      return this.cache.get(normalizedWord)!;
    }

    console.log(`[DataService] Cache miss for word: "${normalizedWord}". Fetching from source.`);

    try {
      // 2. 从数据源获取数据 (当前阶段使用mockDataService)
      // TODO: 未来将替换为真实的API调用
      const mockData = await mockDataService.getTooltipData();
      const wordData = mockData.words.find((w: any) => w.word.toLowerCase() === normalizedWord);

      if (wordData) {
        // 3. 存入缓存
        this.cache.set(normalizedWord, wordData);
        console.log(`[DataService] Fetched and cached data for: "${normalizedWord}"`);
        return wordData;
      } else {
        // 如果没有找到，返回第一个作为 fallback
        const fallbackData = mockData.words[0];
        console.log(`[DataService] No data found for: "${normalizedWord}", using fallback:`, fallbackData.word);
        // 使用原始请求的单词，但用 fallback 数据填充内容
        const resultData = { ...fallbackData, word: normalizedWord };
        this.cache.set(normalizedWord, resultData);
        return resultData;
      }
    } catch (error) {
      console.error(`[DataService] Error fetching data for "${word}":`, error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('[DataService] Cache cleared.');
  }
}

export const dataService = DataService.getInstance();
