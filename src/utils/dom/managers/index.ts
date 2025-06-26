// [INTERNAL_ACTION: Creating unified managers index file.]
// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-26T11:45:00+08:00; Reason: 统一导出所有DOM管理器模块，优化依赖关系;
// }}

// Tooltip管理器
export { TooltipRenderer } from './tooltip/TooltipRenderer';
export type { TooltipRenderOptions } from './tooltip/TooltipRenderer';

// Popup管理器  
export { TransparentPopupManager } from './popup/TransparentPopupManager';
export type { TransparentPopupOptions } from './popup/TransparentPopupManager';

// 通用DOM管理器
export { SimpleEventManager } from '../simpleEventManager';