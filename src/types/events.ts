/**
 * 统一事件类型定义
 * 标准化整个应用的事件类型系统
 */

// 基础事件接口
export interface BaseEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  source: string;
}

// Lucid 应用事件
export interface LucidEvent<T = unknown> extends BaseEvent<T> {
  source: string;
}

// Tooltip 相关事件
export interface TooltipEvent<T = unknown> extends BaseEvent<T> {
  source: 'lucid.tooltip';
}

// 高亮相关事件
export interface HighlightEvent<T = unknown> extends BaseEvent<T> {
  source: 'lucid.highlight';
}

// 单词操作事件
export interface WordActionEvent extends LucidEvent<{
  word: string;
  action: WordAction;
  context?: string;
}> {
  type: 'word.action';
}

// 状态变化事件
export interface StateChangeEvent<T = unknown> extends LucidEvent<{
  previousState: T;
  currentState: T;
  changeType: string;
}> {
  type: 'state.change';
}

// UI 交互事件
export interface UIInteractionEvent extends LucidEvent<{
  element: string;
  interaction: UIInteraction;
  position?: { x: number; y: number };
}> {
  type: 'ui.interaction';
}

// 数据加载事件
export interface DataLoadEvent<T = unknown> extends LucidEvent<{
  dataType: string;
  data: T;
  loadTime: number;
  success: boolean;
  error?: string;
}> {
  type: 'data.load';
}

// 事件类型枚举
export enum EventTypes {
  // Tooltip 事件
  TOOLTIP_SHOW = 'tooltip.show',
  TOOLTIP_HIDE = 'tooltip.hide',
  TOOLTIP_EXPAND = 'tooltip.expand',
  TOOLTIP_COLLAPSE = 'tooltip.collapse',
  
  // 高亮事件
  HIGHLIGHT_ADD = 'highlight.add',
  HIGHLIGHT_REMOVE = 'highlight.remove',
  HIGHLIGHT_UPDATE = 'highlight.update',
  
  // 单词操作事件
  WORD_ACTION = 'word.action',
  WORD_LOOKUP = 'word.lookup',
  WORD_FAVORITE = 'word.favorite',
  
  // 状态变化事件
  STATE_CHANGE = 'state.change',
  
  // UI 交互事件
  UI_INTERACTION = 'ui.interaction',
  
  // 数据事件
  DATA_LOAD = 'data.load',
  DATA_CACHE = 'data.cache',
  DATA_ERROR = 'data.error',
}

// 单词操作类型
export enum WordAction {
  LOOKUP = 'lookup',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  HIGHLIGHT = 'highlight',
  UNHIGHLIGHT = 'unhighlight',
  INCREASE_COUNT = 'increase_count',
  DECREASE_COUNT = 'decrease_count',
  SHOW_DETAILS = 'show_details',
}

// UI 交互类型
export enum UIInteraction {
  CLICK = 'click',
  HOVER = 'hover',
  FOCUS = 'focus',
  BLUR = 'blur',
  SCROLL = 'scroll',
  RESIZE = 'resize',
  KEYPRESS = 'keypress',
}

// 事件处理器类型
export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void | Promise<void>;
export type EventCleanup = () => void;

// 事件订阅选项
export interface EventSubscriptionOptions {
  once?: boolean;
  priority?: number;
  filter?: (event: BaseEvent) => boolean;
}

// 事件发射器接口
export interface EventEmitter {
  on<T extends BaseEvent>(
    eventType: string, 
    handler: EventHandler<T>, 
    options?: EventSubscriptionOptions
  ): EventCleanup;
  
  off<T extends BaseEvent>(eventType: string, handler: EventHandler<T>): void;
  
  emit<T extends BaseEvent>(event: T): void;
  
  once<T extends BaseEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): EventCleanup;
  
  removeAllListeners(eventType?: string): void;
}

// 事件工厂函数
export const createEvent = <T = unknown>(
  type: string,
  payload: T,
  source: string = 'lucid'
): LucidEvent<T> => ({
  type,
  payload,
  timestamp: Date.now(),
  source,
});

export const createTooltipEvent = <T = unknown>(
  type: string,
  payload: T
): TooltipEvent<T> => ({
  type,
  payload,
  timestamp: Date.now(),
  source: 'lucid.tooltip',
});

export const createHighlightEvent = <T = unknown>(
  type: string,
  payload: T
): HighlightEvent<T> => ({
  type,
  payload,
  timestamp: Date.now(),
  source: 'lucid.highlight',
});

export const createWordActionEvent = (
  word: string,
  action: WordAction,
  context?: string
): WordActionEvent => ({
  type: 'word.action',
  payload: { word, action, context },
  timestamp: Date.now(),
  source: 'lucid',
});

export const createStateChangeEvent = <T = unknown>(
  previousState: T,
  currentState: T,
  changeType: string
): StateChangeEvent<T> => ({
  type: 'state.change',
  payload: { previousState, currentState, changeType },
  timestamp: Date.now(),
  source: 'lucid',
});