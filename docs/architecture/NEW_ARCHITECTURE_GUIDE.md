# Lucid 浏览器扩展 - 新架构使用指南

**版本**: v1.0  
**更新时间**: 2025-01-27  
**状态**: ✅ 已实现并验证

## 📖 概述

本文档介绍 Lucid 浏览器扩展的新架构设计，基于模块化、事件驱动和依赖注入的设计原则，提供了一个可扩展、可维护的 Tooltip 管理系统。

## 🏗️ 架构概览

### 核心设计原则

1. **单一职责原则** - 每个组件专注于特定功能
2. **依赖注入** - 组件间松耦合，便于测试和扩展
3. **事件驱动** - 通过事件系统实现组件间通信
4. **策略模式** - 支持灵活的功能扩展

### 架构层次

```
┌─────────────────────────────────────────┐
│              应用层 (App Layer)           │
├─────────────────────────────────────────┤
│            管理层 (Manager Layer)         │
│  ┌─────────────────────────────────────┐ │
│  │        TooltipManager               │ │
│  │     (主管理器 - 单例模式)             │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│            服务层 (Service Layer)         │
│  ┌─────────────┬─────────────┬─────────┐ │
│  │StateManager │EventHandler │Positioner│ │
│  │   (状态)     │   (事件)     │  (位置)  │ │
│  └─────────────┴─────────────┴─────────┘ │
├─────────────────────────────────────────┤
│            渲染层 (Render Layer)          │
│  ┌─────────────────────────────────────┐ │
│  │        TooltipRenderer              │ │
│  │      (React 组件渲染)                │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│            工具层 (Utils Layer)           │
│  ┌─────────────┬─────────────┬─────────┐ │
│  │   Types     │   Events    │ Helpers │ │
│  │  (类型定义)   │  (事件系统)   │ (工具)   │ │
│  └─────────────┴─────────────┴─────────┘ │
└─────────────────────────────────────────┘
```

## 🔧 核心组件详解

### 1. TooltipManager (主管理器)

**职责**: 统一的 Tooltip 管理入口，协调各个子系统

**特性**:
- 单例模式，全局唯一实例
- 依赖注入，管理所有子组件
- 提供统一的 API 接口

**主要方法**:
```typescript
class TooltipManager {
  // 显示 Tooltip
  async showTooltip(options: ShowTooltipOptions): Promise<void>
  
  // 隐藏 Tooltip
  hideTooltip(immediate?: boolean): void
  
  // 展开/收起
  expandTooltip(): void
  collapseTooltip(): void
  toggleExpanded(): void
  
  // 状态查询
  isVisible(): boolean
  isExpanded(): boolean
  getCurrentWord(): string
  getCurrentTargetElement(): HTMLElement | null
  
  // 事件处理
  handleMouseEnter(element: HTMLElement): void
  handleMouseLeave(element: HTMLElement): void
  handleKeyboardEvent(event: KeyboardEvent): void
  
  // 生命周期
  destroy(): void
}
```

### 2. TooltipStateManager (状态管理器)

**职责**: 管理 Tooltip 的状态和生命周期

**特性**:
- 状态集中管理
- 事件监听和通知
- 自动清理机制

**状态类型**:
```typescript
interface TooltipState {
  visible: boolean;
  expanded: boolean;
  word: string;
  targetElement: HTMLElement | null;
  hideTimeout: NodeJS.Timeout | null;
}
```

### 3. TooltipEventHandler (事件处理器)

**职责**: 处理用户交互和系统事件

**特性**:
- 统一的事件处理
- 防抖和节流机制
- 键盘快捷键支持

**事件类型**:
- 鼠标事件 (mouseenter, mouseleave)
- 键盘事件 (Escape, Enter)
- 按钮点击事件 (展开, 关闭)

### 4. TooltipPositioner (位置计算器)

**职责**: 智能计算 Tooltip 的最佳显示位置

**特性**:
- 智能位置调整
- 视口边界检测
- 多种定位策略

**位置策略**:
```typescript
type Position = 'top' | 'bottom' | 'left' | 'right';

interface PositionOptions {
  targetElement: HTMLElement;
  tooltipElement: HTMLElement;
  preferredPosition?: Position;
  offset?: number;
}
```

### 5. TooltipRenderer (渲染器)

**职责**: 负责 Tooltip 的 React 组件渲染

**特性**:
- React 18 并发特性支持
- 动态内容渲染
- 样式和主题管理

## 🚀 快速开始

### 基本使用

```typescript
import { TooltipManager } from '@utils/dom/managers/TooltipManager';

// 获取管理器实例
const tooltipManager = TooltipManager.getInstance();

// 显示 Tooltip
await tooltipManager.showTooltip({
  word: 'hello',
  translation: '你好',
  targetElement: document.getElementById('target'),
  preferredPosition: 'top'
});

// 隐藏 Tooltip
tooltipManager.hideTooltip();
```

### 高级配置

```typescript
// 带音标和词性的 Tooltip
await tooltipManager.showTooltip({
  word: 'beautiful',
  translation: '美丽的',
  phonetic: '/ˈbjuːtɪfl/',
  partOfSpeech: 'adjective',
  targetElement: element,
  preferredPosition: 'bottom',
  offset: 12
});
```

### 事件监听

```typescript
// 监听状态变化
tooltipManager.addStateChangeListener((event) => {
  console.log('状态变化:', event.type, event.state);
});

// 处理键盘事件
document.addEventListener('keydown', (event) => {
  tooltipManager.handleKeyboardEvent(event);
});
```

## 🧪 测试指南

### 测试覆盖

当前测试覆盖情况：
- **总测试数**: 359个
- **通过率**: 99.7%
- **测试类型**: 单元测试、集成测试、性能测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定组件测试
pnpm test src/tests/managers/TooltipManager.test.ts

# 运行测试并查看覆盖率
pnpm test --coverage
```

### 测试示例

```typescript
import { TooltipManager } from '@utils/dom/managers/TooltipManager';

describe('TooltipManager', () => {
  let manager: TooltipManager;
  
  beforeEach(() => {
    manager = TooltipManager.getInstance();
  });
  
  it('应该显示基本的 tooltip', async () => {
    await manager.showTooltip({
      word: 'test',
      translation: '测试',
      targetElement: mockElement
    });
    
    expect(manager.isVisible()).toBe(true);
    expect(manager.getCurrentWord()).toBe('test');
  });
});
```

## 🔧 开发规范

### 代码风格

1. **TypeScript 优先** - 所有新代码必须使用 TypeScript
2. **接口定义** - 为所有公共 API 定义接口
3. **错误处理** - 使用 try-catch 和适当的错误类型
4. **文档注释** - 为所有公共方法添加 JSDoc 注释

### 组件开发规范

1. **单一职责** - 每个组件只负责一个特定功能
2. **依赖注入** - 通过构造函数注入依赖
3. **事件驱动** - 使用事件系统进行组件间通信
4. **生命周期管理** - 实现 destroy 方法进行资源清理

### 测试编写规范

1. **测试驱动开发** - 先写测试，再写实现
2. **Mock 隔离** - 使用 Mock 隔离外部依赖
3. **边界测试** - 测试边界条件和错误情况
4. **性能测试** - 为关键路径添加性能测试

## 🚨 故障排查

### 常见问题

1. **Tooltip 不显示**
   - 检查目标元素是否存在
   - 验证权限和 DOM 访问
   - 查看控制台错误信息

2. **位置计算错误**
   - 检查目标元素的 getBoundingClientRect()
   - 验证视口尺寸
   - 确认 CSS 样式没有冲突

3. **性能问题**
   - 检查事件监听器是否正确清理
   - 验证 React 组件是否正确卸载
   - 使用性能分析工具定位瓶颈

### 调试工具

```typescript
// 获取管理器统计信息
const stats = tooltipManager.getStats();
console.log('管理器状态:', stats);

// 获取状态管理器详细信息
const stateStats = tooltipManager.getStateStats();
console.log('状态详情:', stateStats);

// 获取事件处理器统计
const eventStats = tooltipManager.getEventStats();
console.log('事件统计:', eventStats);
```

## 📚 扩展开发

### 添加新的位置策略

```typescript
// 扩展位置计算器
class CustomPositioner extends TooltipPositioner {
  calculateCustomPosition(options: PositionOptions): Position {
    // 自定义位置计算逻辑
    return { x: 100, y: 100 };
  }
}
```

### 自定义事件处理

```typescript
// 扩展事件处理器
class CustomEventHandler extends TooltipEventHandler {
  handleCustomEvent(event: CustomEvent): void {
    // 自定义事件处理逻辑
  }
}
```

### 主题和样式扩展

```typescript
// 自定义渲染器
class ThemedRenderer extends TooltipRenderer {
  render(options: TooltipRenderOptions): HTMLElement {
    // 应用自定义主题
    const element = super.render(options);
    element.classList.add('custom-theme');
    return element;
  }
}
```

## 📈 性能优化

### 最佳实践

1. **懒加载** - 按需加载组件和资源
2. **事件防抖** - 避免频繁的事件处理
3. **内存管理** - 及时清理事件监听器和定时器
4. **缓存策略** - 缓存计算结果和 DOM 查询

### 性能监控

```typescript
// 性能监控示例
const startTime = performance.now();
await tooltipManager.showTooltip(options);
const endTime = performance.now();
console.log(`显示耗时: ${endTime - startTime}ms`);
```

## 🔄 版本历史

### v1.0 (2025-01-27)
- ✅ 新架构完全实现
- ✅ 99.7% 测试通过率
- ✅ 完整的文档和使用指南
- ✅ 性能优化和监控

---

**维护者**: Lucid 开发团队  
**联系方式**: 项目 GitHub Issues  
**最后更新**: 2025-01-27