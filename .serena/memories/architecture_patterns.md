# Lucid 项目架构模式和设计指南

## 整体架构

### 分层架构
```
┌─────────────────────────────────────┐
│           UI Layer (React)          │
├─────────────────────────────────────┤
│         Service Layer               │
│  ┌─────────┬─────────┬─────────┐   │
│  │   API   │  Cache  │ Storage │   │
│  └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤
│         Utility Layer               │
│  ┌─────────┬─────────┬─────────┐   │
│  │   DOM   │Highlight│  Text   │   │
│  └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤
│        Browser Extension            │
│  ┌─────────┬─────────┬─────────┐   │
│  │Background│Content │ Popup   │   │
│  └─────────┴─────────┴─────────┘   │
└─────────────────────────────────────┘
```

## 设计模式

### 1. 单例模式
用于管理器类，确保全局唯一实例：
```typescript
export class TooltipManager {
  private static instance: TooltipManager;
  
  static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }
}
```

### 2. 服务层模式
抽象业务逻辑，提供统一接口：
```typescript
// 抽象接口
interface DataService {
  getData(key: string): Promise<any>;
}

// 具体实现
class MockDataService implements DataService {
  async getData(key: string): Promise<any> {
    // 实现逻辑
  }
}
```

### 3. 事件驱动模式
使用事件系统进行组件间通信：
```typescript
// 事件管理器
class SimpleEventManager {
  subscribeGlobalEvent(eventType: string, handler: Function): void;
  dispatchGlobalEvent(eventType: string, payload: any): void;
}
```

### 4. 策略模式
用于不同的高亮策略和文本处理：
```typescript
interface HighlightStrategy {
  apply(element: HTMLElement, options: HighlightOptions): void;
}

class GradientHighlightStrategy implements HighlightStrategy {
  apply(element: HTMLElement, options: HighlightOptions): void {
    // 渐变高亮实现
  }
}
```

## 模块化设计

### 服务模块
- **API服务**: 处理外部API调用
- **缓存服务**: 管理数据缓存
- **存储服务**: 处理浏览器存储
- **模拟数据服务**: 提供开发和测试数据

### 工具模块
- **DOM工具**: DOM操作和事件处理
- **高亮工具**: 文本高亮功能
- **文本工具**: 文本处理和分析

### UI模块
- **管理器**: 全局状态和行为管理
- **组件**: 可复用的UI组件
- **样式**: 统一的样式系统

## 数据流设计

### 单向数据流
```
User Action → Event → Service → State → UI Update
```

### 状态管理
- 使用React Hooks进行本地状态管理
- 使用浏览器存储进行持久化
- 使用事件系统进行跨组件通信

## 错误处理策略

### 分层错误处理
1. **UI层**: 用户友好的错误提示
2. **服务层**: 业务逻辑错误处理
3. **工具层**: 底层异常捕获

### 错误恢复
- 优雅降级
- 重试机制
- 回退方案

## 性能优化模式

### 懒加载
```typescript
// 动态导入
const { TooltipManager } = await import("@utils/dom/tooltipManager");
```

### 缓存策略
- 内存缓存：频繁访问的数据
- 浏览器存储：持久化数据
- 计算结果缓存：复杂计算结果

### 防抖和节流
```typescript
import { debounce } from "lodash-es";

const debouncedHandler = debounce(handler, 250);
```

## 扩展性设计

### 插件化架构
- 服务可插拔替换
- 功能模块独立
- 配置驱动行为

### 接口抽象
- 定义清晰的接口契约
- 支持多种实现方式
- 便于测试和模拟

## 安全性考虑

### 输入验证
- 所有用户输入验证
- XSS防护
- 类型安全检查

### 权限控制
- 最小权限原则
- 敏感操作确认
- 数据访问控制

## 测试策略

### 测试金字塔
1. **单元测试**: 工具函数和服务
2. **集成测试**: 组件交互
3. **端到端测试**: 完整用户流程

### 测试模式
- 依赖注入便于测试
- 模拟外部依赖
- 测试数据隔离