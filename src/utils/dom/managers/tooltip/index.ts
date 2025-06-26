/**
 * Tooltip 管理器模块导出
 * 统一导出所有 tooltip 相关的管理器类和类型
 */

// 主要管理器
export { TooltipManager } from './TooltipManager';

// 专职管理器
export { TooltipRenderer } from './TooltipRenderer';
export { TooltipPositioner } from './TooltipPositioner';
export { TooltipStateManager } from './TooltipStateManager';
export { TooltipEventHandler } from './TooltipEventHandler';

// 类型定义
export type { TooltipRenderOptions } from './TooltipRenderer';
export type { Position, PositionOptions } from './TooltipPositioner';
export type { TooltipState, StateChangeEvent, StateChangeHandler } from './TooltipStateManager';
export type { EventHandlerOptions } from './TooltipEventHandler';
export type { TooltipManagerOptions, ShowTooltipOptions } from './TooltipManager';