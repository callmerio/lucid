/**
 * 词典 API 服务
 * 负责与后端词典服务的通信
 */

export interface WordDefinition {
  word: string;
  pronunciation?: string;
  definitions: Array<{
    partOfSpeech: string;
    meaning: string;
    example?: string;
  }>;
  etymology?: string;
  frequency?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

/**
 * 词典 API 客户端
 * 遵循单一职责原则，专门处理词典查询相关的 API 调用
 */
export class DictionaryApiService {
  private static instance: DictionaryApiService;
  private baseUrl: string;
  private apiKey?: string;

  private constructor() {
    // 从环境变量或配置中获取 API 基础 URL
    this.baseUrl = process.env.DICTIONARY_API_URL || 'https://api.lucid-dict.com';
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): DictionaryApiService {
    if (!DictionaryApiService.instance) {
      DictionaryApiService.instance = new DictionaryApiService();
    }
    return DictionaryApiService.instance;
  }

  /**
   * 设置 API 密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * 查询单词定义
   */
  async lookupWord(word: string, language = 'en'): Promise<ApiResponse<WordDefinition>> {
    try {
      const url = `${this.baseUrl}/api/dictionary/${language}/${encodeURIComponent(word)}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data as WordDefinition,
      };
    } catch (error) {
      console.error('[DictionaryApi] Error looking up word:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 批量查询单词
   */
  async lookupWords(words: string[], language = 'en'): Promise<ApiResponse<WordDefinition[]>> {
    try {
      const url = `${this.baseUrl}/api/dictionary/${language}/batch`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ words }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data as WordDefinition[],
      };
    } catch (error) {
      console.error('[DictionaryApi] Error looking up words:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取单词发音音频 URL
   */
  async getPronunciationUrl(word: string, language = 'en'): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/api/pronunciation/${language}/${encodeURIComponent(word)}`;
      const headers: Record<string, string> = {};

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.audioUrl || null;
    } catch (error) {
      console.error('[DictionaryApi] Error getting pronunciation:', error);
      return null;
    }
  }

  /**
   * 检查 API 连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/health`;
      // 使用 AbortController 实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 秒超时

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      console.error('[DictionaryApi] Connection check failed:', error);
      return false;
    }
  }
}
