/**
 * UI Events Constants - 统一管理所有 UI 相关事件
 * 用于解决组件间循环依赖问题，实现事件驱动架构
 */

/**
 * Lucid UI 事件接口
 */
export interface LucidUIEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  source: string;
  id: string;
}

/**
 * 事件处理器类型
 */
export type LucidEventHandler<T = any> = (event: LucidUIEvent<T>) => void;

/**
 * UI 事件常量定义
 * 使用命名空间模式组织事件，便于管理和避免冲突
 */
export const UI_EVENTS = {
  /**
   * Tooltip 相关事件
   */
  TOOLTIP: {
    SHOW: 'lucid:tooltip:show',
    HIDE: 'lucid:tooltip:hide',
    SHOWN: 'lucid:tooltip:shown',
    HIDDEN: 'lucid:tooltip:hidden',
    TRANSITION_TO_POPUP: 'lucid:tooltip:transition-to-popup',
    HOVER_ENTER: 'lucid:tooltip:hover-enter',
    HOVER_LEAVE: 'lucid:tooltip:hover-leave'
  },

  /**
   * Toolpopup 相关事件
   */
  TOOLPOPUP: {
    SHOW: 'lucid:toolpopup:show',
    HIDE: 'lucid:toolpopup:hide',
    SHOWN: 'lucid:toolpopup:shown',
    HIDDEN: 'lucid:toolpopup:hidden',
    WORD_CLICK: 'lucid:toolpopup:word-click',
    PRONUNCIATION_PLAY: 'lucid:toolpopup:pronunciation-play'
  },

  /**
   * 透明弹窗相关事件
   */
  TRANSPARENT_POPUP: {
    SHOW: 'lucid:transparent-popup:show',
    HIDE: 'lucid:transparent-popup:hide',
    TOGGLE: 'lucid:transparent-popup:toggle',
    SHOWN: 'lucid:transparent-popup:shown',
    HIDDEN: 'lucid:transparent-popup:hidden'
  },

  /**
   * 全局 UI 状态事件
   */
  UI_STATE: {
    HIDE_ALL: 'lucid:ui:hide-all',
    STATE_CHANGE: 'lucid:ui:state-change',
    FOCUS_CHANGE: 'lucid:ui:focus-change',
    COMPONENT_REGISTER: 'lucid:ui:component-register',
    COMPONENT_UNREGISTER: 'lucid:ui:component-unregister'
  },

  /**
   * 高亮相关事件
   */
  HIGHLIGHT: {
    WORD_HIGHLIGHTED: 'lucid:highlight:word-highlighted',
    WORD_UNHIGHLIGHTED: 'lucid:highlight:word-unhighlighted',
    COUNT_CHANGED: 'lucid:highlight:count-changed',
    STATE_UPDATED: 'lucid:highlight:state-updated'
  },

  /**
   * 用户交互事件
   */
  INTERACTION: {
    SHIFT_KEY_PRESSED: 'lucid:interaction:shift-key-pressed',
    ESCAPE_KEY_PRESSED: 'lucid:interaction:escape-key-pressed',
    CLICK_OUTSIDE: 'lucid:interaction:click-outside',
    WORD_SELECTED: 'lucid:interaction:word-selected'
  }
} as const;

/**
 * 事件载荷类型定义
 */
export interface EventPayloads {
  // Tooltip 事件载荷
  [UI_EVENTS.TOOLTIP.SHOW]: {
    word: string;
    targetElement: HTMLElement;
    translation?: any;
  };

  [UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP]: {
    word: string;
    targetElement: HTMLElement;
    fromTooltip: HTMLElement;
  };

  // Toolpopup 事件载荷
  [UI_EVENTS.TOOLPOPUP.SHOW]: {
    word: string;
    referenceElement?: HTMLElement;
    fromTooltip?: HTMLElement;
  };

  [UI_EVENTS.TOOLPOPUP.WORD_CLICK]: {
    word: string;
    clickedElement: HTMLElement;
  };

  [UI_EVENTS.TOOLPOPUP.PRONUNCIATION_PLAY]: {
    word: string;
    region: 'us' | 'uk';
  };

  // 透明弹窗事件载荷
  [UI_EVENTS.TRANSPARENT_POPUP.SHOW]: {
    position?: { x: number; y: number };
    referenceElement?: HTMLElement;
  };

  [UI_EVENTS.TRANSPARENT_POPUP.HIDE]: {
    reason?: string;
  };

  [UI_EVENTS.TRANSPARENT_POPUP.TOGGLE]: {
    force?: boolean; // true: 强制显示, false: 强制隐藏, undefined: 切换
  };

  [UI_EVENTS.TRANSPARENT_POPUP.SHOWN]: {
    position: { x: number; y: number };
    element: HTMLElement;
  };

  [UI_EVENTS.TRANSPARENT_POPUP.HIDDEN]: {
    reason?: string;
  };

  // UI 状态事件载荷
  [UI_EVENTS.UI_STATE.HIDE_ALL]: {
    except?: string;
    reason?: string;
  };

  [UI_EVENTS.UI_STATE.STATE_CHANGE]: {
    from: string;
    to: string;
    component: string;
  };

  // 高亮事件载荷
  [UI_EVENTS.HIGHLIGHT.WORD_HIGHLIGHTED]: {
    word: string;
    element: HTMLElement;
    count: number;
  };

  [UI_EVENTS.HIGHLIGHT.COUNT_CHANGED]: {
    word: string;
    oldCount: number;
    newCount: number;
  };

  // 交互事件载荷
  [UI_EVENTS.INTERACTION.SHIFT_KEY_PRESSED]: {
    targetElement?: HTMLElement;
    currentWord?: string;
  };

  [UI_EVENTS.INTERACTION.CLICK_OUTSIDE]: {
    clickedElement: HTMLElement;
    activeComponent?: string;
  };
}

/**
 * 事件优先级定义
 */
export enum EventPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * 事件配置选项
 */
export interface EventOptions {
  priority?: EventPriority;
  once?: boolean;
  debounce?: number;
  throttle?: number;
}

/**
 * 组件注册信息
 */
export interface ComponentInfo {
  name: string;
  instance: any;
  events: string[];
  priority: number;
}

/**
 * 事件统计信息
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  activeListeners: number;
  averageProcessingTime: number;
}
