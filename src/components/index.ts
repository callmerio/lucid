/**
 * 组件导出入口
 * 统一管理所有UI组件的导出
 */

// UI组件
export { Tooltip } from './ui/Tooltip';
export { HighlightMarker } from './ui/HighlightMarker';

// 高阶组件
export { withErrorBoundary } from './hoc/withErrorBoundary';

// 类型定义
export type { 
  TooltipProps, 
  HighlightMarkerProps,
  BaseComponentProps,
  DetailedWordData,
  EventHandler,
  AsyncEventHandler,
  ComponentState,
  WithErrorBoundaryProps
} from './types';