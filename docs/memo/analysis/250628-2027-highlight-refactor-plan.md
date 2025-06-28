# HighlightUtils 重构详细执行计划

**任务文件名：** REFACTOR-1-重构高亮工具模块架构  
**创建于：** 2025-06-28 20:27 +08:00  
**关联协议：** RIPER-5 v5.0  

## 上下文

项目 ID: Lucid Browser Extension  
当前架构问题：
1. **架构分离问题** - `HighlightStorageService` 存在但未被使用，`highlightUtils.ts` 直接调用 `browser.storage`
2. **样式版本冲突** - CSS 样式在三个位置重复定义，版本不一致
3. **紧耦合问题** - highlight 模块直接依赖 TooltipManager

## 1. 研究成果摘要 (RESEARCH)

### 架构分析发现：

**现有服务层：**
- ✅ `ServiceContainer` - 已实现完整的依赖注入容器
- ✅ `HighlightStorageService` - 已实现但未集成到服务容器
- ❌ `highlightUtils.ts` - 绕过服务层直接调用 `browser.storage.local`

**样式冲突分析：**
- `src/utils/highlight/highlightUtils.ts` (lines 369-943) - 完整的硬编码样式
- `src/styles/components/Tooltip.css` - 部分样式，缺少高亮相关
- `src/styles/components/Toolfull.css` - 基础样式，无高亮样式
- `src/styles/theme/design-tokens.css` - 设计系统变量，缺少高亮颜色

## 2. 选定方案 (INNOVATE)

**最终方案方向：** 
- 保持现有架构模式，修复服务层集成
- 逐步分离职责，避免破坏性重构
- 使用 MutationObserver 模式解耦模块间依赖
- 样式整合到设计系统中

**高层架构图：** 
```
highlightUtils.ts (1798 lines)
├── 拆分为 →
│   ├── HighlightUtils.ts (纯工具函数)
│   ├── HighlightDOM.ts (DOM 操作)
│   ├── HighlightController.ts (业务控制)
│   └── MutationObserver (事件解耦)
└── 集成现有 →
    ├── ServiceContainer
    ├── HighlightStorageService  
    └── 统一样式系统
```

## 3. 项目计划 (PLAN)

**总估时：** 9 个工作日  
**风险等级：** 中等（有现有服务可复用）

### Stage 0: 基础修复 (2天)
**目标：** 修复架构分离和样式冲突

#### 0.1 服务层集成修复 (1天)
```typescript
// 在 ServiceContainer 中注册服务
serviceContainer.registerSingleton(
  'HighlightStorageService', 
  () => HighlightStorageService.getInstance()
);

// highlightUtils.ts 中使用服务
const storageService = serviceContainer.resolve<HighlightStorageService>('HighlightStorageService');
```

#### 0.2 样式审计和整合 (1天)
- 合并 `highlightUtils.ts` 中的硬编码样式到 `design-tokens.css`
- 清理重复的 CSS 定义
- 扩展设计系统颜色变量

### Stage 1: 纯逻辑分离 (1.5天)
**目标：** 提取工具函数，保持接口不变

#### 1.1 创建 HighlightUtils.ts (纯工具函数)
```typescript
// src/utils/highlight/HighlightUtils.ts
export class HighlightUtils {
  static normalizeText(text: string): string { /* */ }
  static calculateWordBounds(element: Element): DOMRect { /* */ }
  static generateHighlightId(): string { /* */ }
  // ... 其他纯函数
}
```

#### 1.2 创建 HighlightDOM.ts (DOM 操作)
```typescript
// src/utils/highlight/HighlightDOM.ts  
export class HighlightDOM {
  static wrapTextNode(node: Text, bounds: Range): Element { /* */ }
  static unwrapHighlight(element: Element): void { /* */ }
  static findHighlightElements(container: Element): Element[] { /* */ }
}
```

### Stage 2: 服务层优化 (1.5天)
**目标：** 增强现有 HighlightStorageService

#### 2.1 扩展存储服务功能
```typescript
// 新增方法到 HighlightStorageService
async incrementMarkCount(word: string): Promise<number> { /* */ }
async getHighlightsByPage(url: string): Promise<HighlightData[]> { /* */ }
async bulkUpdateMarkings(updates: WordMarkingUpdate[]): Promise<void> { /* */ }
```

### Stage 3: 事件系统重构 (2天)
**目标：** 使用 MutationObserver 解耦模块

#### 3.1 MutationObserver 实现
```typescript
// src/utils/highlight/HighlightMutationObserver.ts
export class HighlightMutationObserver {
  private observer: MutationObserver;
  
  constructor() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (this.isHighlightElement(node)) {
            // 通知其他模块新的高亮元素已添加
            this.notifyHighlightAdded(node as Element);
          }
        });
      });
    });
  }
}
```

### Stage 4: 控制器整合 (2天)
**目标：** 创建统一的业务控制层

#### 4.1 HighlightController 实现
```typescript
// src/utils/highlight/HighlightController.ts
export class HighlightController {
  constructor(
    private storageService: HighlightStorageService,
    private domHandler: HighlightDOM,
    private mutationObserver: HighlightMutationObserver
  ) {}
  
  async highlightWord(word: string, element: Element): Promise<void> {
    // 统一的高亮业务逻辑
  }
}
```

### Stage 5: 清理和集成 (2天)
**目标：** 移除遗留代码，完成集成测试

## 4. 任务进度 (EXECUTE)

**最近更新：** 2025-06-28 20:27 +08:00  
**当前阶段：** Stage 0 准备开始  

### 关键文件结构

**现有关键文件：**
- `src/utils/highlight/highlightUtils.ts` (1798 lines) - 需要重构的主文件
- `src/services/storage/highlightStorage.ts` - 现有服务，需要集成
- `src/services/container/ServiceContainer.ts` - 依赖注入容器
- `src/styles/theme/design-tokens.css` - 设计系统变量

**重构后目标结构：**
```
src/utils/highlight/
├── highlightUtils.ts (保留，作为主入口)
├── HighlightUtils.ts (纯工具函数)
├── HighlightDOM.ts (DOM 操作)
├── HighlightController.ts (业务控制)
├── HighlightMutationObserver.ts (事件观察)
└── types.ts (类型定义)
```

## 5. 风险评估与缓解策略

### 高风险项：
1. **CSS 样式丢失** - 硬编码样式迁移时可能遗漏
   - **缓解：** 逐步迁移，保持旧样式作为备份
   
2. **现有功能破坏** - 重构过程可能影响现有高亮功能
   - **缓解：** 保持原接口不变，内部实现渐进式重构

### 中风险项：
1. **服务依赖循环** - ServiceContainer 集成可能造成循环依赖
   - **缓解：** 使用工厂模式延迟初始化

## 6. 验收标准

### Stage 0 完成标准：
- [ ] HighlightStorageService 已注册到 ServiceContainer
- [ ] highlightUtils.ts 使用服务而非直接调用 browser.storage
- [ ] 所有硬编码样式已迁移到 design-tokens.css
- [ ] 无样式丢失，功能正常

### 最终完成标准：
- [ ] 代码行数从 1798 行减少到单个文件 < 500 行
- [ ] 模块间无直接依赖，通过事件通信
- [ ] 所有样式使用设计系统变量
- [ ] 单元测试覆盖率 > 80%
- [ ] 现有功能完全保持

## 7. 下一步行动

**立即开始：** Stage 0.1 - 服务层集成修复
**预期时间：** 1天
**负责角色：** LD (开发者)