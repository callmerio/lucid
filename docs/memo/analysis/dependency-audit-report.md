# 依赖关系审计报告

## 📋 概述

本报告详细分析了 `ToolfullManager` 和 `legacy/tooltipManager` 在项目中的所有依赖关系，为融合计划提供准确的迁移指导。

## 🔍 ToolfullManager 依赖分析

### 直接使用位置

#### 1. entrypoints/content.ts
```typescript
// 导入和初始化
const { ToolfullManager } = await import("@utils/dom/managers/popup/ToolfullManager.tsx");
toolfullManager = ToolfullManager.getInstance();

// 销毁调用
toolfullManager.destroy();
```

**影响评估**: 
- ✅ 主要入口点，需要替换为统一管理器
- 🔄 需要更新导入路径和初始化逻辑

#### 2. src/tests/performance.test.ts
```typescript
import { ToolfullManager } from '../utils/dom/managers/popup/ToolfullManager';

// 测试中的使用
toolfullManager = ToolfullManager.getInstance();
toolfullManager.destroy();
```

**影响评估**:
- ✅ 测试文件，需要更新 mock 和测试逻辑
- 🔄 需要适配新的统一管理器接口

#### 3. src/tests/integration/TransparentPopup.integration.test.ts
```typescript
// Mock 对象定义
mockToolfullManager = {
  isVisible: false,
  getInstance: vi.fn(() => mockToolfullManager),
  showToolfull: vi.fn(),
  hideToolfull: vi.fn(),
  destroy: vi.fn()
};
```

**影响评估**:
- ✅ 集成测试，需要更新 mock 接口
- 🔄 方法名从 `showToolfull/hideToolfull` 改为统一接口

### 事件系统连接

#### UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP
```typescript
// ToolfullManager 监听此事件
simpleEventManager.subscribeGlobalEvent(
  UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP,
  (event) => {
    const { word, targetElement } = event.payload;
    this.showToolfull(word, targetElement);
  }
);
```

**影响评估**:
- ⚠️ 关键事件连接，融合后需要移除此事件
- 🔄 改为内部方法调用实现模式切换

## 🔍 legacy/tooltipManager 依赖分析

### 直接使用位置

#### 1. src/utils/highlight/highlightUtils.ts
```typescript
import { TooltipManager } from "../dom/legacy/tooltipManager";

// 在 addTooltipEvents 函数中使用
function addTooltipEvents(element: HTMLElement, word: string): void {
  const tooltipManager = TooltipManager.getInstance();
  
  element.addEventListener('mouseenter', async () => {
    tooltipManager.cancelHide();
    await tooltipManager.showTooltip(element, word);
  });
  
  element.addEventListener('mouseleave', () => {
    tooltipManager.hideTooltip(300);
  });
}
```

**影响评估**:
- 🔴 **高优先级**: 这是高亮功能的核心依赖
- 🔄 需要更新为新的统一管理器接口
- ⚠️ 方法签名可能需要调整

#### 2. src/tests/lightweightTooltip.test.ts
```typescript
import { TooltipManager } from '../utils/dom/legacy/tooltipManager';

// 测试中的使用
tooltipManager = TooltipManager.getInstance();
await tooltipManager.showTooltip(testElement, 'test');
tooltipManager.hideTooltip(0);
tooltipManager.destroy();
```

**影响评估**:
- ✅ 测试文件，需要更新测试逻辑
- 🔄 需要适配新的接口和方法签名

#### 3. src/tests/performance.test.ts
```typescript
import { TooltipManager } from '../utils/dom/legacy/tooltipManager';

// 性能测试中的使用
tooltipManager = TooltipManager.getInstance();
tooltipManager.destroy();
```

**影响评估**:
- ✅ 性能测试，需要更新基准测试
- 🔄 需要验证新管理器的性能表现

### 事件系统依赖

#### Shift 键事件处理
```typescript
// legacy/tooltipManager 中的 Shift 键监听
const shiftKeyHandler = (event: KeyboardEvent) => {
  if (event.key === 'Shift' && this.currentTooltip) {
    // 触发 TRANSITION_TO_POPUP 事件
    simpleEventManager.dispatchGlobalEvent(
      UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP,
      {
        word: currentWord,
        targetElement: currentTargetElement,
        fromTooltip: currentTooltipElement
      },
      'TooltipManager'
    );
  }
};
```

**影响评估**:
- ⚠️ 关键交互逻辑，融合后改为内部方法调用
- 🔄 需要保持相同的用户体验

## 📊 迁移优先级矩阵

| 文件 | 优先级 | 复杂度 | 影响范围 | 迁移策略 |
|------|--------|--------|----------|----------|
| **highlightUtils.ts** | 🔴 高 | 中 | 核心功能 | 优先迁移 |
| **entrypoints/content.ts** | 🟡 中 | 低 | 入口点 | 同步迁移 |
| **performance.test.ts** | 🟢 低 | 低 | 测试 | 最后迁移 |
| **lightweightTooltip.test.ts** | 🟢 低 | 中 | 测试 | 最后迁移 |
| **TransparentPopup.integration.test.ts** | 🟢 低 | 低 | 测试 | 最后迁移 |

## 🔄 迁移计划

### 阶段 1: 核心功能迁移
1. **更新 highlightUtils.ts**
   - 替换 `legacy/tooltipManager` 导入
   - 更新 `addTooltipEvents` 函数
   - 适配新的方法签名

2. **更新 entrypoints/content.ts**
   - 移除 `ToolfullManager` 导入
   - 更新初始化逻辑
   - 简化管理器数量

### 阶段 2: 事件系统简化
1. **移除 TRANSITION_TO_POPUP 事件**
   - 从 `UI_EVENTS` 常量中删除
   - 清理相关事件监听器
   - 更新事件文档

2. **内部化模式切换**
   - 在统一管理器内部处理 Shift 键
   - 直接调用模式切换方法
   - 保持相同的用户体验

### 阶段 3: 测试更新
1. **更新单元测试**
   - 修改 mock 对象定义
   - 更新测试用例
   - 验证新接口

2. **更新集成测试**
   - 适配新的管理器架构
   - 验证端到端功能
   - 性能基准测试

## ⚠️ 风险点识别

### 高风险
1. **highlightUtils.ts 迁移**
   - 影响所有高亮功能
   - 方法签名变化可能导致错误
   - 需要充分测试

2. **事件系统变更**
   - 移除全局事件可能影响其他组件
   - 需要确保没有其他监听器

### 中风险
1. **测试适配**
   - Mock 对象需要重新设计
   - 测试用例可能需要大幅修改

2. **性能影响**
   - 新的统一管理器可能有不同的性能特征
   - 需要建立新的性能基准

### 低风险
1. **导入路径更新**
   - 相对简单的文本替换
   - IDE 可以辅助重构

## 📋 迁移检查清单

### highlightUtils.ts 迁移
- [ ] 更新导入语句
- [ ] 修改 `addTooltipEvents` 函数
- [ ] 适配新的方法签名
- [ ] 测试高亮功能完整性

### entrypoints/content.ts 迁移
- [ ] 移除 `ToolfullManager` 导入
- [ ] 更新管理器初始化
- [ ] 简化销毁逻辑
- [ ] 测试入口点功能

### 事件系统清理
- [ ] 移除 `TRANSITION_TO_POPUP` 事件定义
- [ ] 清理相关事件监听器
- [ ] 更新事件文档
- [ ] 验证无其他依赖

### 测试更新
- [ ] 更新所有相关测试文件
- [ ] 修改 mock 对象定义
- [ ] 验证测试覆盖率
- [ ] 运行完整测试套件

## 🎯 成功标准

1. **功能完整性**: 所有现有功能正常工作
2. **性能保持**: 不低于现有性能水平
3. **测试通过**: 所有测试用例通过
4. **代码简化**: 减少重复代码和复杂度
5. **用户体验**: 保持一致的交互体验

## 📚 相关文档

- [融合实施计划](../plan/tooltip-toolfull-fusion-plan.md)
- [技术对比分析](../analysis/tooltip-toolfull-comparison.md)
- [架构重构计划](../plan/dom-refactor-plan.md)

---

**审计完成时间**: 2025-06-28  
**下一步**: 开始阶段二的核心功能实现
