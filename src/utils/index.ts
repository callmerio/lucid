// [INTERNAL_ACTION: Creating unified utils index file.]
// {{CHENGQI:
// Action: Added; Timestamp: 2025-06-26T11:46:00+08:00; Reason: 统一导出所有工具模块，简化导入路径;
// }}

// 文本处理工具
export * from './text';

// DOM工具
export * from './dom/managers';
export { SimpleEventManager } from './dom/simpleEventManager';

// 高亮工具
export * from './highlight/highlightUtils';

// 核心工具
export * from './core';