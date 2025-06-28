/**
 * 高亮数据存储服务
 * 负责管理浏览器扩展中的高亮数据持久化
 */

import type { HighlightData, UserSettings } from "@types";

export interface ExtensionStorage {
  settings?: UserSettings;
  wordMarkings?: {
    [word: string]: number; // key 是小写单词，value 是标记次数
  };
  highlights?: HighlightData[];
}

/**
 * 高亮存储服务类
 * 遵循单一职责原则，专门处理高亮数据的存储操作
 */
export class HighlightStorageService {
  private static instance: HighlightStorageService;

  private constructor() {}

  /**
   * 获取单例实例
   * 遵循单例模式，确保全局只有一个存储服务实例
   */
  public static getInstance(): HighlightStorageService {
    if (!HighlightStorageService.instance) {
      HighlightStorageService.instance = new HighlightStorageService();
    }
    return HighlightStorageService.instance;
  }

  /**
   * 获取所有高亮数据
   */
  async getAllHighlights(): Promise<HighlightData[]> {
    try {
      const data = await browser.storage.local.get(['highlights']);
      return data.highlights || [];
    } catch (error) {
      console.error('[HighlightStorage] Error getting highlights:', error);
      return [];
    }
  }

  /**
   * 获取单词标记次数
   */
  async getWordMarkings(): Promise<{ [word: string]: number }> {
    try {
      const data = await browser.storage.local.get(['wordMarkings']);
      return data.wordMarkings || {};
    } catch (error) {
      console.error('[HighlightStorage] Error getting word markings:', error);
      return {};
    }
  }

  /**
   * 更新单词标记次数
   */
  async updateWordMarking(word: string, count: number): Promise<void> {
    try {
      const wordMarkings = await this.getWordMarkings();
      wordMarkings[word] = count;
      await browser.storage.local.set({ wordMarkings });
    } catch (error) {
      console.error('[HighlightStorage] Error updating word marking:', error);
      throw error;
    }
  }

  /**
   * 删除单词标记
   */
  async removeWordMarking(word: string): Promise<void> {
    try {
      const wordMarkings = await this.getWordMarkings();
      delete wordMarkings[word];
      await browser.storage.local.set({ wordMarkings });
    } catch (error) {
      console.error('[HighlightStorage] Error removing word marking:', error);
      throw error;
    }
  }

  /**
   * 获取用户设置
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await browser.storage.local.get(['settings']);
      return data.settings || {
        theme: 'auto',
        highlightColor: 'orange',
        enableShortcuts: true,
      };
    } catch (error) {
      console.error('[HighlightStorage] Error getting settings:', error);
      return {
        theme: 'auto',
        highlightColor: 'orange',
        enableShortcuts: true,
      };
    }
  }

  /**
   * 更新用户设置
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await browser.storage.local.set({ settings: newSettings });
    } catch (error) {
      console.error('[HighlightStorage] Error updating settings:', error);
      throw error;
    }
  }

  /**
   * 清除所有数据
   */
  async clearAll(): Promise<void> {
    try {
      await browser.storage.local.clear();
    } catch (error) {
      console.error('[HighlightStorage] Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * 增加单词标记次数
   */
  async incrementMarkCount(word: string): Promise<number> {
    try {
      const wordMarkings = await this.getWordMarkings();
      const currentCount = wordMarkings[word] || 0;
      const newCount = currentCount + 1;
      wordMarkings[word] = newCount;
      await browser.storage.local.set({ wordMarkings });
      return newCount;
    } catch (error) {
      console.error('[HighlightStorage] Error incrementing mark count:', error);
      throw error;
    }
  }

  /**
   * 减少单词标记次数
   */
  async decrementMarkCount(word: string): Promise<number> {
    try {
      const wordMarkings = await this.getWordMarkings();
      const currentCount = wordMarkings[word] || 0;
      const newCount = Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        delete wordMarkings[word];
      } else {
        wordMarkings[word] = newCount;
      }
      
      await browser.storage.local.set({ wordMarkings });
      return newCount;
    } catch (error) {
      console.error('[HighlightStorage] Error decrementing mark count:', error);
      throw error;
    }
  }

  /**
   * 获取指定单词的标记次数
   */
  async getMarkCount(word: string): Promise<number> {
    try {
      const wordMarkings = await this.getWordMarkings();
      return wordMarkings[word] || 0;
    } catch (error) {
      console.error('[HighlightStorage] Error getting mark count:', error);
      return 0;
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    try {
      const usage = await browser.storage.local.getBytesInUse();
      // Chrome 扩展本地存储限制通常是 5MB
      const quota = 5 * 1024 * 1024; // 5MB in bytes
      return { used: usage, quota };
    } catch (error) {
      console.error('[HighlightStorage] Error getting storage usage:', error);
      return { used: 0, quota: 5 * 1024 * 1024 };
    }
  }
}
