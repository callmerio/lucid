# Tooltip-Toolfull 融合实施计划

## 📋 项目概述

基于深度分析和 `dom-refactor-plan.md` 的建议，制定 TooltipManager 和 ToolfullManager 融合的具体实施计划。

**核心策略**: 直接演进现有的 `TooltipManager`，而不是创建新的统一管理器。

## 🎯 核心原则

1. **演进优于革命**: 在现有优秀架构基础上扩展
2. **渐进式迁移**: 确保每个阶段都可以独立验证
3. **向后兼容**: 保持现有接口稳定
4. **数据懒加载**: 优化用户体验和性能

## 🏗️ 架构设计

### 状态管理扩展

```typescript
// src/utils/dom/managers/tooltip/TooltipStateManager.ts
export interface TooltipState {
  visible: boolean;
  mode: "simple" | "simple-expanded" | "detailed"; // 替代原有的 expanded
  word: string;
  targetElement: HTMLElement | null;
  hideTimeout: number | null;
  data?: {
    simple: { translation: string; phonetic?: string; partOfSpeech?: string };
    detailed?: WordDetails; // 懒加载的详细数据
  };
  isLoadingDetailed: boolean; // 加载状态
}
```

### 统一渲染组件

```typescript
// src/components/ui/common/UnifiedPopup.tsx
export const UnifiedPopup: React.FC<UnifiedPopupProps> = ({
  mode,
  simpleData,
  detailedData,
  isLoading,
  ...handlers
}) => {
  if (mode === "detailed" && detailedData) {
    return <Toolfull wordData={detailedData} {...handlers} />;
  }

  if (isLoading) {
    return <div className="lucid-popup-loading">Loading...</div>;
  }

  if (simpleData) {
    return <Tooltip {...simpleData} {...handlers} />;
  }

  return null;
};
```

## 🚀 实施计划

### 阶段一：准备与重构 (3-4天)

#### Day 1: 类型定义和状态扩展

- [ ] 创建 `src/utils/dom/managers/types.ts` 统一类型定义
- [ ] 扩展 `TooltipStateManager.ts` 支持新状态结构
- [ ] 添加新的状态操作方法：
  - `transitionToDetailed()`
  - `setDetailedData()`
  - `setLoadingState()`

#### Day 2: 数据服务准备

- [ ] 审计 `DataService` 和 `CacheService` 接口
- [ ] 实现数据懒加载策略
- [ ] 添加预加载机制

#### Day 3: 依赖关系审计

- [ ] 找到所有调用 `ToolfullManager` 的地方
- [ ] 找到所有调用 `legacy/tooltipManager` 的地方
- [ ] 特别关注 `highlightUtils.ts` 的依赖关系

#### Day 4: 测试准备

- [ ] 设计新的测试用例结构
- [ ] 准备测试数据和 Mock 对象

### 阶段二：核心功能实现 (5-7天)

#### Day 5-6: 统一渲染组件

- [ ] 创建 `UnifiedPopup.tsx` 容器组件
- [ ] 实现基于 `mode` 的条件渲染
- [ ] 添加加载状态 UI
- [ ] 处理组件间的事件传递

#### Day 7-8: TooltipManager 改造

- [ ] 修改 `showTooltip` 方法使用 `UnifiedPopup`
- [ ] 实现 `transitionToDetailed` 方法
- [ ] 添加数据懒加载逻辑
- [ ] 集成缓存机制

#### Day 9-10: 事件处理改造

- [ ] 修改 `TooltipEventHandler.ts` 处理新的状态变化
- [ ] 更新 Shift 键处理逻辑
- [ ] 移除对全局事件的依赖

#### Day 11: 集成测试

- [ ] 测试简单模式显示
- [ ] 测试详细模式切换
- [ ] 测试数据加载和缓存

### 阶段三：迁移与清理 (4-6天)

#### Day 12-13: highlightUtils 迁移

- [ ] 修改 `addTooltipEvents` 调用新的 `TooltipManager`
- [ ] 移除对 `legacy/tooltipManager` 的依赖
- [ ] 测试高亮功能完整性

#### Day 14-15: 旧代码清理

- [ ] 删除 `ToolfullManager.tsx`
- [ ] 删除 `legacy/tooltipManager.ts`
- [ ] 清理相关的导入和引用

#### Day 16-17: 事件系统清理

- [ ] 移除 `UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP`
- [ ] 更新事件常量定义
- [ ] 清理相关的事件监听器

### 阶段四：测试与验证 (3-5天)

#### Day 18-19: 单元测试

- [ ] 更新 `TooltipStateManager` 测试
- [ ] 更新 `TooltipManager` 测试
- [ ] 新增 `UnifiedPopup` 组件测试

#### Day 20-21: 集成测试

- [ ] 端到端用户流程测试
- [ ] 性能基准测试
- [ ] 兼容性测试

#### Day 22: 最终验证

- [ ] 手动功能测试
- [ ] 代码审查
- [ ] 文档更新

## 📊 关键里程碑

| 里程碑           | 完成标准           | 验证方式       |
| ---------------- | ------------------ | -------------- |
| 状态管理扩展完成 | 新状态结构正常工作 | 单元测试通过   |
| 统一组件创建完成 | 两种模式正常渲染   | 组件测试通过   |
| 核心功能实现完成 | 模式切换流畅       | 集成测试通过   |
| 旧代码清理完成   | 无冗余代码和依赖   | 代码审查通过   |
| 项目完成         | 所有功能正常       | 端到端测试通过 |

## 🔧 技术实现细节

### 数据懒加载策略

```typescript
// TooltipManager.tsx
private async fetchAndCacheDetailedData(word: string): Promise<void> {
  if (!this.stateManager.getState().data?.detailed) {
    this.stateManager.setLoadingState(true);
    try {
      const details = await dataService.getWordDetails(word);
      if (details) {
        this.stateManager.setDetailedData(details);
      }
    } catch (error) {
      console.error('Failed to load detailed data:', error);
    } finally {
      this.stateManager.setLoadingState(false);
    }
  }
}
```

### 预加载机制

```typescript
// 在显示简单 tooltip 时预加载详细数据
async showTooltip(options: ShowTooltipOptions): Promise<void> {
  // 立即显示简单模式
  this.stateManager.show(options.word, options.targetElement);

  // 后台预加载详细数据
  setTimeout(() => {
    this.fetchAndCacheDetailedData(options.word);
  }, 500); // 延迟 500ms 避免影响初始显示
}
```

### 平滑过渡动画

```css
/* 添加到 Tooltip.css 和 Toolfull.css */
.lucid-popup-transition {
  transition: all 0.3s ease-in-out;
}

.lucid-popup-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  opacity: 0.8;
}
```

## ⚠️ 风险控制

### 高风险项目

1. **状态管理复杂化**: 通过充分的单元测试覆盖
2. **数据加载失败**: 实现错误处理和降级策略
3. **性能回归**: 建立性能基准和监控

### 回滚策略

1. **阶段性提交**: 每个阶段完成后提交代码
2. **功能开关**: 使用配置控制新功能启用
3. **快速回滚**: 保持旧代码分支直到完全验证

## 📈 成功指标

### 技术指标

- [ ] 代码重复减少 30%
- [ ] 单元测试覆盖率 > 90%
- [ ] 性能不低于现有实现

### 用户体验指标

- [ ] 模式切换延迟 < 200ms
- [ ] 无功能回归
- [ ] 交互体验一致性

### 开发体验指标

- [ ] API 接口统一
- [ ] 文档完整更新
- [ ] 团队培训完成

## 📚 相关文档

- [详细技术分析](../analysis/tooltip-toolfull-comparison.md)
- [方案总结](../analysis/tooltip-toolfull-summary.md)
- [原始重构计划](./dom-refactor-plan.md)

## 🎯 下一步行动

1. **团队评审**: 确认实施计划和时间安排
2. **资源分配**: 分配开发人员和时间
3. **开始实施**: 从阶段一开始执行
4. **定期检查**: 每个阶段结束后进行评审

## 🛠️ 详细实施指南

### 阶段一具体任务

#### 1.1 类型定义创建

```typescript
// src/utils/dom/managers/types.ts
export enum TooltipMode {
  SIMPLE = "simple",
  SIMPLE_EXPANDED = "simple-expanded",
  DETAILED = "detailed",
}

export interface SimpleTooltipData {
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
}

export interface UnifiedTooltipState {
  visible: boolean;
  mode: TooltipMode;
  word: string;
  targetElement: HTMLElement | null;
  hideTimeout: number | null;
  data?: {
    simple: SimpleTooltipData;
    detailed?: WordDetails;
  };
  isLoadingDetailed: boolean;
  transitionTimeout: number | null;
}

export interface UnifiedPopupProps {
  mode: TooltipMode;
  simpleData?: SimpleTooltipData;
  detailedData?: WordDetails;
  isLoading?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
  onModeSwitch?: (mode: TooltipMode) => void;
}
```

#### 1.2 状态管理器扩展

```typescript
// 在 TooltipStateManager.ts 中添加新方法
export class TooltipStateManager {
  // 新增状态操作方法
  transitionToDetailed(): void {
    if (
      this.state.mode === TooltipMode.SIMPLE ||
      this.state.mode === TooltipMode.SIMPLE_EXPANDED
    ) {
      const previousState = { ...this.state };
      this.state.mode = TooltipMode.DETAILED;
      this.state.isLoadingDetailed = true;
      this.notifyStateChange("transition_to_detailed", previousState);
    }
  }

  setDetailedData(data: WordDetails): void {
    const previousState = { ...this.state };
    this.state.data = {
      ...this.state.data,
      detailed: data,
    };
    this.state.isLoadingDetailed = false;
    this.notifyStateChange("detailed_data_loaded", previousState);
  }

  setLoadingState(loading: boolean): void {
    const previousState = { ...this.state };
    this.state.isLoadingDetailed = loading;
    this.notifyStateChange("loading_state_changed", previousState);
  }

  switchToSimple(): void {
    if (this.state.mode === TooltipMode.DETAILED) {
      const previousState = { ...this.state };
      this.state.mode = TooltipMode.SIMPLE;
      this.notifyStateChange("switch_to_simple", previousState);
    }
  }
}
```

### 阶段二具体任务

#### 2.1 UnifiedPopup 组件实现

```tsx
// src/components/ui/common/UnifiedPopup.tsx
import React from "react";
import { Tooltip } from "../Tooltip";
import { Toolfull } from "../Toolfull";
import { TooltipMode, UnifiedPopupProps } from "@utils/dom/managers/types";
import "./UnifiedPopup.css";

export const UnifiedPopup: React.FC<UnifiedPopupProps> = ({
  mode,
  simpleData,
  detailedData,
  isLoading = false,
  onExpand,
  onCollapse,
  onClose,
  onModeSwitch,
}) => {
  // 详细模式渲染
  if (mode === TooltipMode.DETAILED) {
    if (isLoading) {
      return (
        <div className="lucid-popup-loading">
          <div className="loading-spinner"></div>
          <span>Loading detailed information...</span>
        </div>
      );
    }

    if (detailedData) {
      return (
        <Toolfull
          word={detailedData.word}
          wordData={detailedData}
          onClose={onClose}
          onMinimize={() => onModeSwitch?.(TooltipMode.SIMPLE)}
        />
      );
    }
  }

  // 简单模式渲染
  if (simpleData) {
    return (
      <Tooltip
        word={simpleData.word || ""}
        translation={simpleData.translation}
        phonetic={simpleData.phonetic}
        partOfSpeech={simpleData.partOfSpeech}
        onExpand={() => onModeSwitch?.(TooltipMode.DETAILED)}
        onCollapse={onCollapse}
        onClose={onClose}
        className={mode === TooltipMode.SIMPLE_EXPANDED ? "expanded" : ""}
      />
    );
  }

  return null;
};
```

#### 2.2 TooltipManager 核心改造

```typescript
// 在 TooltipManager.tsx 中的关键修改
export class TooltipManager {
  private dataCache = new Map<string, WordDetails>();
  private preloadPromises = new Map<string, Promise<WordDetails>>();

  async showTooltip(options: ShowTooltipOptions): Promise<void> {
    const { word, translation, phonetic, partOfSpeech, targetElement } = options;

    // 设置简单数据并显示
    const simpleData: SimpleTooltipData = {
      translation,
      phonetic,
      partOfSpeech
    };

    this.stateManager.show(word, targetElement);
    this.stateManager.setSimpleData(simpleData);

    // 渲染统一组件
    const unifiedContent = (
      <UnifiedPopup
        mode={TooltipMode.SIMPLE}
        simpleData={simpleData}
        onExpand={() => this.transitionToDetailed()}
        onCollapse={() => this.stateManager.collapse()}
        onClose={() => this.stateManager.hide(true)}
        onModeSwitch={(mode) => this.handleModeSwitch(mode)}
      />
    );

    popupService.show(`tooltip-${word}`, unifiedContent, {
      targetElement,
      position: options.preferredPosition,
    });

    // 预加载详细数据
    this.preloadDetailedData(word);
  }

  async transitionToDetailed(): Promise<void> {
    const currentWord = this.stateManager.getCurrentWord();
    if (!currentWord) return;

    this.stateManager.transitionToDetailed();

    try {
      const detailedData = await this.getDetailedData(currentWord);
      this.stateManager.setDetailedData(detailedData);
      this.updatePopupContent();
    } catch (error) {
      console.error('Failed to load detailed data:', error);
      this.stateManager.setLoadingState(false);
    }
  }

  private async getDetailedData(word: string): Promise<WordDetails> {
    // 检查缓存
    const cached = this.dataCache.get(word);
    if (cached) return cached;

    // 检查预加载
    const preloaded = this.preloadPromises.get(word);
    if (preloaded) {
      const data = await preloaded;
      this.dataCache.set(word, data);
      this.preloadPromises.delete(word);
      return data;
    }

    // 直接获取
    const data = await dataService.getWordDetails(word);
    this.dataCache.set(word, data);
    return data;
  }

  private preloadDetailedData(word: string): void {
    if (!this.dataCache.has(word) && !this.preloadPromises.has(word)) {
      this.preloadPromises.set(word, dataService.getWordDetails(word));
    }
  }

  private updatePopupContent(): void {
    const state = this.stateManager.getState();
    const word = state.word;

    const unifiedContent = (
      <UnifiedPopup
        mode={state.mode}
        simpleData={state.data?.simple}
        detailedData={state.data?.detailed}
        isLoading={state.isLoadingDetailed}
        onExpand={() => this.transitionToDetailed()}
        onCollapse={() => this.stateManager.collapse()}
        onClose={() => this.stateManager.hide(true)}
        onModeSwitch={(mode) => this.handleModeSwitch(mode)}
      />
    );

    popupService.update(`tooltip-${word}`, unifiedContent);
  }

  private handleModeSwitch(targetMode: TooltipMode): void {
    switch (targetMode) {
      case TooltipMode.DETAILED:
        this.transitionToDetailed();
        break;
      case TooltipMode.SIMPLE:
        this.stateManager.switchToSimple();
        this.updatePopupContent();
        break;
    }
  }
}
```

### 阶段三具体任务

#### 3.1 highlightUtils 迁移策略

```typescript
// 在 highlightUtils.ts 中的关键修改
import { TooltipManager } from "@utils/dom/managers/tooltip/TooltipManager";

// 替换原有的 tooltip 显示逻辑
export function addTooltipEvents(element: HTMLElement, word: string): void {
  const tooltipManager = TooltipManager.getInstance();

  element.addEventListener("mouseenter", async (event) => {
    // 获取翻译数据（可能来自缓存或 API）
    const translationData = await getTranslationData(word);

    await tooltipManager.showTooltip({
      word,
      translation: translationData.translation,
      phonetic: translationData.phonetic,
      partOfSpeech: translationData.partOfSpeech,
      targetElement: element,
      preferredPosition: "auto",
    });
  });

  element.addEventListener("mouseleave", () => {
    tooltipManager.hideTooltip();
  });
}
```

## 📋 检查清单

### 阶段一完成检查

- [ ] 新类型定义编译通过
- [ ] TooltipStateManager 扩展测试通过
- [ ] 数据服务接口确认
- [ ] 依赖关系文档化

### 阶段二完成检查

- [ ] UnifiedPopup 组件渲染正常
- [ ] 简单模式显示正确
- [ ] 详细模式切换成功
- [ ] 数据懒加载工作正常
- [ ] 缓存机制有效

### 阶段三完成检查

- [ ] highlightUtils 迁移完成
- [ ] 旧代码完全移除
- [ ] 事件系统清理完成
- [ ] 无编译错误和警告

### 阶段四完成检查

- [ ] 所有单元测试通过
- [ ] 集成测试通过
- [ ] 性能测试达标
- [ ] 手动测试验证
- [ ] 代码审查完成

---

**项目负责人**: [待分配]
**预计完成时间**: 22 个工作日
**风险等级**: 中等
**优先级**: 高
