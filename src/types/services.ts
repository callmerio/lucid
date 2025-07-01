/**
 * @file services.ts
 * @description 定义项目中所有服务的接口。
 */

/**
 * 弹窗服务接口
 */
export interface IPopupService {
  /**
   * 显示一个弹窗
   * @param id - 弹窗的唯一标识符
   * @param content - 要在弹窗中渲染的React组件
   * @param options - 弹窗的配置选项
   */
  show(id: string, content: React.ReactNode, options?: PopupOptions): Promise<void>;

  /**
   * 隐藏一个弹窗
   * @param id - 要隐藏的弹窗的唯一标识符
   */
  hide(id: string): void;

  /**
   * 更新一个已显示弹窗的内容或选项
   * @param id - 要更新的弹窗的唯一标识符
   * @param content - 新的React组件内容
   * @param options - 新的配置选项
   */
  update(id: string, content?: React.ReactNode, options?: PopupOptions): Promise<void>;
}

/**
 * 弹窗配置选项
 */
export interface PopupOptions {
  targetElement?: HTMLElement;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  // ... 其他可能的配置项，如动画、遮罩等
}

/**
 * 数据服务接口
 */
export interface IDataService {
  /**
   * 获取单词的详细信息
   * @param word - 要查询的单词
   * @returns 包含单词详细信息的Promise
   */
  getWordDetails(word: string): Promise<WordDetails | null>;
}

/**
 * 单词详细信息接口
 */
export interface WordDetails {
  word: string;
  phonetic?: {
    us?: string;
    uk?: string;
  };
  explain: Array<{
    pos: string;
    definitions: Array<{
      definition: string;
      chinese: string;
      chinese_short?: string;
    }>;
  }>;
  wordFormats?: Array<{
    name: string;
    form: string;
  }>;
}
