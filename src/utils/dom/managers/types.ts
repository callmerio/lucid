/**
 * Tooltip 管理器相关类型定义
 * 简化版本，支持基本的 Tooltip 和 Toolfull 管理
 */

import { WordDetails } from '@/types/services';

// 基础位置类型
export interface Position {
  x: number;
  y: number;
}

// 位置偏好
export type PositionPreference = 'top' | 'bottom' | 'left' | 'right' | 'auto';

// 简单 Tooltip 数据
export interface SimpleTooltipData {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
}

// Tooltip 状态（简化版本）
export interface TooltipState {
  visible: boolean;
  expanded: boolean;
  word: string;
  targetElement: HTMLElement | null;
  hideTimeout: number | null;
}

// 状态变化事件
export interface StateChangeEvent {
  type: 'show' | 'hide' | 'expand' | 'collapse';
  state: TooltipState;
  previousState: TooltipState;
}

// 状态变化监听器
export type StateChangeListener = (event: StateChangeEvent) => void;

// Tooltip 数据
export interface TooltipData {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  definitions?: string[];
  examples?: string[];
  etymology?: string;
  frequency?: number;
}

// 显示 Tooltip 选项
export interface ShowTooltipOptions {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  definitions?: string[];
  examples?: string[];
  etymology?: string;
  frequency?: number;
  targetElement: HTMLElement;
  preferredPosition?: PositionPreference;
  showDelay?: number;
  hideDelay?: number;
}

// 位置计算选项
export interface PositionCalculationOptions {
  targetElement: HTMLElement;
  tooltipElement?: HTMLElement;
  preferredPosition?: PositionPreference;
  offset?: { x: number; y: number };
  viewport?: { width: number; height: number };
}

// TooltipManager 选项
export interface TooltipManagerOptions {
  onWordAction?: (word: string, action: string) => void;
  onExpand?: (word: string) => void;
  onCollapse?: (word: string) => void;
  onClose?: (word: string) => void;
  showDelay?: number;
  hideDelay?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// 位置计算结果
export interface PositionResult {
  position: Position;
  actualPosition: PositionPreference;
  adjustments: {
    flippedHorizontally: boolean;
    flippedVertically: boolean;
    constrainedToViewport: boolean;
  };
}
