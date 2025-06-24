/**
 * Tooltip 管理器相关类型定义
 */

// 基础位置类型
export interface Position {
  x: number;
  y: number;
}

// 位置偏好
export type PositionPreference = 'top' | 'bottom' | 'left' | 'right' | 'auto';

// Tooltip 状态
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

// 统计信息接口
export interface TooltipStats {
  state: {
    isVisible: boolean;
    isExpanded: boolean;
    currentWord: string;
    listenersCount: number;
    hasActiveTimeout: boolean;
  };
  events: {
    mouseEnterCount: number;
    mouseLeaveCount: number;
    expandClickCount: number;
    closeClickCount: number;
  };
  renderer: {
    renderCount: number;
    lastRenderTime: number;
    currentTooltip: HTMLElement | null;
  };
}

// 当前状态信息
export interface CurrentState {
  tooltip: TooltipState;
  renderer: {
    currentTooltip: HTMLElement | null;
    isRendering: boolean;
  };
  eventHandler: {
    hasActiveListeners: boolean;
    lastEventTime: number;
  };
}

// 事件处理器统计
export interface EventHandlerStats {
  mouseEnterCount: number;
  mouseLeaveCount: number;
  expandClickCount: number;
  closeClickCount: number;
}

// 状态管理器统计
export interface StateManagerStats {
  listenersCount: number;
  hasActiveTimeout: boolean;
  currentWord: string;
  isVisible: boolean;
  isExpanded: boolean;
}

// 渲染器配置
export interface RendererConfig {
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  zIndex?: number;
  animationDuration?: number;
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
