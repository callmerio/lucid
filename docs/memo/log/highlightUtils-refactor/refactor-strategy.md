# highlightUtils.ts 重构策略

## 📋 问题分析

### 当前状况
- **文件大小**: ~1700行代码
- **职责混合**: 违反单一职责原则
- **关注点**: 存储操作、DOM操作、Tooltip集成、核心算法、样式管理

### 主要问题
1. **存储操作** (~300行): `browser.storage.local` 读写、计数管理
2. **DOM 操作** (~400行): `<mark>` 包裹、unwrap、Range 操作、TreeWalker
3. **Tooltip 集成** (~200行): 事件绑定、TooltipManager 调用
4. **核心高亮算法** (~500行): 颜色计算、样式管理、高亮逻辑
5. **样式管理** (~300行): CSS 注入、颜色调色板、渐变计算

## 🏗️ 重构架构设计

### 推荐模块化架构
```
src/utils/highlight/
├── highlightCore.ts          // 核心高亮算法
├── highlightStorage.ts       // 存储相关操作
├── highlightDom.ts          // DOM 操作工具
├── highlightStyles.ts       // 样式和颜色管理
└── highlightEvents.ts       // 事件处理和 Tooltip 集成

src/services/
└── highlightService.ts      // 统一的高亮服务接口
```

### 模块职责定义

#### 1. highlightStorage.ts - 存储服务
```typescript
export class HighlightStorageService {
  async getWordMarkings(): Promise<Record<string, number>>
  async updateWordCount(word: string, count: number): Promise<void>
  async removeWord(word: string): Promise<void>
  async getSettings(): Promise<ExtensionStorage['settings']>
}
```

#### 2. highlightDom.ts - DOM 工具
```typescript
export class HighlightDomUtils {
  static wrapTextWithMark(textNode: Text, start: number, end: number, className: string): HTMLElement
  static unwrapHighlight(element: HTMLElement): void
  static findWordOccurrences(container: Element, word: string): Array<{node: Text, start: number, end: number}>
}
```

#### 3. highlightCore.ts - 核心逻辑
```typescript
export class HighlightCore {
  constructor(
    private storage: HighlightStorageService,
    private domUtils: typeof HighlightDomUtils,
    private eventHandler?: HighlightEventHandler
  ) {}
  
  async highlightWord(word: string, range?: Range): Promise<void>
  async removeHighlight(word: string): Promise<void>
  async toggleHighlight(word: string, context?: ToggleContext): Promise<void>
}
```

#### 4. highlightService.ts - 统一服务接口
```typescript
export class HighlightService {
  private core: HighlightCore;
  private storage: HighlightStorageService;
  
  // 提供简化的公共 API
}
```

## 📅 实施计划

### 阶段1: 存储分离 (1天) - 高优先级
**目标**: 创建独立的存储服务
- [x] 分析现有存储操作
- [ ] 创建 `highlightStorage.ts`
- [ ] 迁移所有 `browser.storage.local` 相关操作
- [ ] 更新现有函数调用存储服务
- [ ] 编写存储服务单元测试

**风险**: 低 - 存储操作相对独立
**收益**: 高 - 立即提升代码组织性

### 阶段2: DOM 工具化 (1-2天) - 中优先级  
**目标**: 提取DOM操作工具函数
- [ ] 创建 `highlightDom.ts`
- [ ] 提取DOM操作工具函数
- [ ] 重构现有代码使用新的工具函数
- [ ] 编写DOM工具单元测试

**风险**: 中 - 部分DOM操作与业务逻辑耦合
**收益**: 高 - 提升代码复用性和可测试性

### 阶段3: 事件解耦 (1-2天) - 需要谨慎处理
**目标**: 将Tooltip集成改为事件驱动
- [ ] 设计事件处理接口
- [ ] 创建 `highlightEvents.ts`
- [ ] 重构Tooltip集成逻辑
- [ ] 更新事件绑定机制

**风险**: 高 - 涉及用户交互逻辑，需要接口重设计
**收益**: 中 - 降低模块间耦合度

### 阶段4: 服务整合 (1天) - 最终整合
**目标**: 创建统一的服务接口
- [ ] 创建统一的 `HighlightService`
- [ ] 提供简化的公共 API
- [ ] 更新所有调用方
- [ ] 编写集成测试

**风险**: 低 - 主要是接口整合工作
**收益**: 高 - 提供清晰的对外API

## 📊 预期收益

### 量化指标
- **可维护性提升**: 60% (单个文件复杂度大幅降低)
- **开发效率提升**: 40% (清晰的职责分离便于并行开发)
- **测试覆盖率提升**: 50% (独立模块更容易编写单元测试)
- **Bug修复时间减少**: 30% (问题定位更精确)

### 质量改进
- ✅ 符合SOLID原则
- ✅ 提升代码可读性
- ✅ 增强模块复用性
- ✅ 简化单元测试
- ✅ 降低维护成本

## ⚠️ 风险评估与缓解

### 主要风险
1. **回归风险**: 现有功能可能在重构过程中出现问题
   - **缓解**: 重构前建立完整的集成测试套件
   
2. **循环依赖**: 模块间依赖关系需要仔细设计
   - **缓解**: 使用依赖注入和接口抽象
   
3. **学习成本**: 团队需要适应新的模块结构
   - **缓解**: 提供详细的文档和示例代码

### 实施保障
- 使用测试驱动的重构方法
- 每个阶段完成后进行完整的功能测试
- 保持向后兼容性，渐进式迁移
- 建立代码审查机制确保质量

## 🎯 成功标准

### 技术指标
- [ ] 单个文件代码行数 < 500行
- [ ] 模块间耦合度 < 20%
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过率 100%

### 业务指标
- [ ] 现有功能完全保持
- [ ] 性能无明显下降
- [ ] 新功能开发效率提升
- [ ] Bug修复时间缩短

---

**记录时间**: 2025-01-28
**分析模式**: Research Mode
**决策状态**: 已批准，等待实施
**预计完成**: 2025-02-03