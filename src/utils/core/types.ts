/**
 * 核心类型定义
 * 为整个 utils 系统提供通用类型
 */

// 基础位置类型
export interface Position {
  x: number;
  y: number;
}

// 位置偏好
export type PositionPreference = 'top' | 'bottom' | 'left' | 'right' | 'auto';

// 通用回调函数类型
export type EventCallback<T = any> = (data: T) => void;
export type CleanupFunction = () => void;

// 管理器基础接口
export interface BaseManager {
  destroy(): void;
}

// 统计信息基础接口
export interface BaseStats {
  createdAt: number;
  lastUsed: number;
  usageCount: number;
}

// 配置基础接口
export interface BaseConfig {
  enabled: boolean;
  debug?: boolean;
}