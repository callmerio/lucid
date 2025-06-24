/**
 * 组件类型定义
 * 统一管理所有组件的TypeScript类型
 */

import { ReactNode } from 'react';

// 基础组件属性
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

// Tooltip组件属性
export interface TooltipProps extends BaseComponentProps {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  position: { x: number; y: number };
  visible: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
}

// Toolpopup组件属性
export interface ToolpopupProps extends BaseComponentProps {
  word: string;
  wordData: DetailedWordData;
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void;
  onWordAction?: (action: string, word: string) => void;
}

// 高亮标记组件属性
export interface HighlightMarkerProps extends BaseComponentProps {
  word: string;
  count: number;
  baseColor: string;
  isDarkText: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// 详细单词数据接口
export interface DetailedWordData {
  word: string;
  phonetic?: {
    us?: string;
    uk?: string;
  };
  explain?: Array<{
    pos: string;
    definitions: Array<{
      chinese: string;
      chinese_short?: string;
      english?: string;
    }>;
  }>;
  examples?: Array<{
    sentence: string;
    translation: string;
  }>;
}

// 事件处理器类型
export type EventHandler<T = unknown> = (event: T) => void;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

// 组件状态类型
export interface ComponentState<T = unknown> {
  loading: boolean;
  error: string | null;
  data: T;
}

// 高阶组件属性
export interface WithEventManagerProps {
  eventManager: {
    subscribe: (eventType: string, handler: EventHandler) => void;
    unsubscribe: (eventType: string, handler: EventHandler) => void;
    emit: (eventType: string, payload: unknown) => void;
  };
}

export interface WithErrorBoundaryProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack?: string }) => void;
}