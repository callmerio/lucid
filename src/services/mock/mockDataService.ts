/**
 * Mock Data 服务
 * 提供统一的 mock 数据访问接口，支持静态导入和动态加载
 */

// 静态导入 mock 数据
import tooltipMockData from '../../tests/mock-data/tooltip-mock-data.json';

export interface MockDataService {
  getTooltipData(word?: string): Promise<any>;
  getWordDefinition(word: string): Promise<any>;
}

/**
 * 基于静态导入的 Mock Data 服务实现
 * 优势：
 * 1. 编译时打包，无需运行时网络请求
 * 2. 类型安全，支持 TypeScript 类型检查
 * 3. 构建优化，可以进行 tree shaking
 * 4. 无需配置 web_accessible_resources
 */
export class StaticMockDataService implements MockDataService {
  private static instance: StaticMockDataService;

  private constructor() { }

  public static getInstance(): StaticMockDataService {
    if (!StaticMockDataService.instance) {
      StaticMockDataService.instance = new StaticMockDataService();
    }
    return StaticMockDataService.instance;
  }

  /**
   * 获取 tooltip 数据
   * @param word 查询的单词（当前实现忽略此参数，返回固定数据）
   */
  async getTooltipData(word?: string): Promise<any> {
    console.log(`[StaticMockDataService] Getting tooltip data for: ${word || 'default'}`);

    // 直接返回静态导入的数据
    return tooltipMockData;
  }

  /**
   * 获取单词定义
   * @param word 查询的单词
   */
  async getWordDefinition(word: string): Promise<any> {
    console.log(`[StaticMockDataService] Getting word definition for: ${word}`);

    // 尝试在 mock 数据中查找匹配的单词
    const wordData = tooltipMockData.words.find(
      (w: any) => w.word.toLowerCase() === word.toLowerCase()
    );

    if (wordData) {
      return {
        word: wordData.word,
        phonetic: wordData.phonetic,
        explain: wordData.explain,
        wordFormats: wordData.wordFormats || []
      };
    }

    // 如果没有找到，返回第一个作为 fallback
    const fallbackData = tooltipMockData.words[0];
    console.log(`[StaticMockDataService] Word "${word}" not found, using fallback:`, fallbackData.word);

    return {
      word: fallbackData.word,
      phonetic: fallbackData.phonetic,
      explain: fallbackData.explain,
      wordFormats: fallbackData.wordFormats || []
    };
  }
}

/**
 * 基于动态导入的 Mock Data 服务实现
 * 优势：
 * 1. 按需加载，减少初始包大小
 * 2. 支持运行时动态切换数据源
 * 3. 更灵活的数据管理
 */
export class DynamicMockDataService implements MockDataService {
  private static instance: DynamicMockDataService;
  private cachedData: any = null;

  private constructor() { }

  public static getInstance(): DynamicMockDataService {
    if (!DynamicMockDataService.instance) {
      DynamicMockDataService.instance = new DynamicMockDataService();
    }
    return DynamicMockDataService.instance;
  }

  /**
   * 动态加载 mock 数据
   */
  private async loadMockData(): Promise<any> {
    if (this.cachedData) {
      return this.cachedData;
    }

    try {
      // 动态导入
      const mockDataModule = await import('../../tests/mock-data/tooltip-mock-data.json');
      this.cachedData = mockDataModule.default;
      console.log('[DynamicMockDataService] Mock data loaded successfully');
      return this.cachedData;
    } catch (error) {
      console.error('[DynamicMockDataService] Failed to load mock data:', error);
      throw error;
    }
  }

  async getTooltipData(word?: string): Promise<any> {
    console.log(`[DynamicMockDataService] Getting tooltip data for: ${word || 'default'}`);
    return await this.loadMockData();
  }

  async getWordDefinition(word: string): Promise<any> {
    console.log(`[DynamicMockDataService] Getting word definition for: ${word}`);

    const mockData = await this.loadMockData();
    const wordData = mockData.words.find(
      (w: any) => w.word.toLowerCase() === word.toLowerCase()
    );

    if (wordData) {
      return {
        word: wordData.word,
        phonetic: wordData.phonetic,
        explain: wordData.explain,
        wordFormats: wordData.wordFormats || []
      };
    }

    // Fallback
    const fallbackData = mockData.words[0];
    console.log(`[DynamicMockDataService] Word "${word}" not found, using fallback:`, fallbackData.word);

    return {
      word: fallbackData.word,
      phonetic: fallbackData.phonetic,
      explain: fallbackData.explain,
      wordFormats: fallbackData.wordFormats || []
    };
  }
}

// 默认导出静态服务（推荐用于生产环境）
export const mockDataService = StaticMockDataService.getInstance();

// 也可以选择动态服务
export const dynamicMockDataService = DynamicMockDataService.getInstance();
