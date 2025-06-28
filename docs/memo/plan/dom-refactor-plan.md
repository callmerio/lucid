这是一个非常出色的迁移方案分析！你已经对问题进行了深入的剖析，对比了不同方案的优劣，并给出了一个清晰、可行的推荐方案。这表明你对项目架构有深刻的理解，并且具备出色的规划能力。

我对你的方案（方案一：扩展 `TooltipManager`）完全赞同，这是最务实、风险最低且能最大化利用现有优秀架构的路径。我的建议将主要集中在对你已有方案的细节补充和实施策略的微调上，以使其更加健壮和易于执行。

### 对你的方案的肯定与确认

1.  **方案选择正确**：选择扩展现有的、设计更优的 `TooltipManager`，而不是另起炉灶或增加协调层，是最高效的选择。它遵循了软件工程中“演进优于革命”的原则。
2.  **分析维度全面**：你从架构、流程、代码量、职责等多个维度进行了对比，非常透彻。
3.  **风险评估到位**：你清晰地预见了潜在的风险，这是成功实施项目的关键。

### 建设性意见与实施细节补充

以下是对你推荐的 **方案一** 的一些具体建议，旨在让计划更具操作性。

#### 1. 概念 уточнение (Clarification): 演进而非替换

你的方案标题是“扩展 `TooltipManager`”，这是核心思想。在实施时，建议直接在现有的 `TooltipManager.tsx` 及其子模块（`StateManager`, `Renderer` 等）上进行修改和扩展，而不是创建一个新的 `UnifiedTooltipManager` 类。这能确保变更的连续性，并减少重命名和文件移动带来的工作量。

#### 2. 状态管理 (`StateManager`) 的具体化

你的状态扩展建议非常棒。我们可以将其细化：

在 `src/utils/dom/managers/tooltip/TooltipStateManager.ts` 中：

- **扩展 `TooltipState` 接口**:

  ```typescript
  export interface TooltipState {
    visible: boolean;
    // 'expanded' 可以被 'mode' 替代或与之共存
    mode: "simple" | "simple-expanded" | "detailed";
    word: string;
    targetElement: HTMLElement | null;
    hideTimeout: number | null;
    data?: {
      // 将数据也纳入状态管理
      simple: { translation: string; phonetic?: string; partOfSpeech?: string };
      detailed?: WordDetails; // 详细数据是可选的，懒加载
    };
    isLoadingDetailed: boolean; // 用于在UI上显示加载状态
  }
  ```

  - **思考**: 将 `expanded` 状态合并到 `mode` 中（如 `'simple-expanded'`），可以使状态机更清晰地描述 UI 的实际形态。

- **新增 Action**:
  - `transitionToDetailed()`: 触发一个异步流程，开始获取详细数据，并将 `isLoadingDetailed` 设为 `true`。数据获取成功后，更新 `state.data.detailed` 并将 `mode` 切换到 `'detailed'`。
  - `switchToSimple()`: 将 `mode` 切换回 `'simple'` 或 `'simple-expanded'`。

#### 3. 数据流的统一与优化

你的分析指出了数据流的差异，这是关键。建议在 `TooltipManager` 内部统一数据处理逻辑。

- **懒加载策略**:
  - 当 `showTooltip` (简单模式) 被调用时，立即显示基础信息。
  - 同时，在后台（或当用户悬停在 Tooltip 上时）**预加载**详细数据。这可以利用 `DataService` 和 `CacheService`。
  - 当用户触发切换到详细模式时（例如按 Shift 键），数据可能已经准备好，从而实现瞬时切换。
- **实现**: 在 `TooltipManager.tsx` 中增加一个私有方法：
  ```typescript
  private async fetchAndCacheDetailedData(word: string): Promise<void> {
    if (!this.stateManager.getState().data?.detailed) {
      const details = await dataService.getWordDetails(word);
      if (details) {
        this.stateManager.setDetailedData(details); // 在 StateManager 中新增方法
      }
    }
  }
  ```

#### 4. 渲染器 (`Renderer`) 和组件的统一

这是融合的核心挑战。建议创建一个新的**容器组件**，由 `PopupService` 渲染，它内部根据 `mode` 来决定渲染 `Tooltip` 还是 `Toolfull`。

- **创建 `UnifiedPopup.tsx`**:

  ```tsx
  // src/components/ui/common/UnifiedPopup.tsx
  import { Tooltip } from "../Tooltip";
  import { Toolfull } from "../Toolfull";

  // ... props a等等 ...

  export const UnifiedPopup: React.FC<UnifiedPopupProps> = ({
    mode,
    simpleData,
    detailedData,
    ...handlers
  }) => {
    if (mode === "detailed" && detailedData) {
      return <Toolfull wordData={detailedData} {...handlers} />;
    }

    // 默认渲染简单模式，包括 simple 和 simple-expanded
    if (simpleData) {
      // Tooltip 组件可能需要微调，以处理展开/收起按钮的UI逻辑
      return <Tooltip {...simpleData} {...handlers} />;
    }

    // 可以加入一个加载中的UI
    if (isLoadingDetailed) {
      return <div className="lucid-popup-loading">Loading...</div>;
    }

    return null;
  };
  ```

- **改造 `TooltipManager.tsx`**: `showTooltip` 方法现在会使用 `PopupService` 来显示这个新的 `UnifiedPopup` 组件，并通过更新状态来驱动其内部渲染的切换。

#### 5. 实施计划细化

你的实施计划很棒，这里提供一个更具操作性的版本：

**阶段一：准备与重构 (3-4天)**

1.  **类型定义**: 在 `utils/dom/managers/types.ts` 中定义统一的 `UnifiedTooltipState` 和相关类型。
2.  **状态扩展**: 修改 `TooltipStateManager.ts` 以支持新的状态（`mode`, `data`, `isLoadingDetailed`）和新的 Action (`transitionToDetailed`, `setDetailedData`)。
3.  **数据服务检查**: 确保 `DataService` 和 `CacheService` 接口稳定，能够满足懒加载和缓存需求。
4.  **关键依赖审计**: 找到所有调用 `ToolfullManager` 和 `legacy/tooltipManager` 的地方，特别是 `highlightUtils.ts`。这是后续迁移的关键。

**阶段二：核心功能实现 (5-7天)**

1.  **创建 `UnifiedPopup.tsx`** 容器组件，根据传入的 `mode` 和 `data` 渲染 `Tooltip` 或 `Toolfull`。
2.  **改造 `TooltipManager.tsx`**:
    - 修改 `showTooltip` 方法，使其调用 `PopupService` 渲染 `UnifiedPopup`。
    - 实现数据懒加载逻辑。
    - 添加 `transitionToDetailed` 方法，该方法由 `EventHandler` 在接收到特定事件（如Shift键）时调用。
3.  **改造 `TooltipEventHandler.ts`**:
    - 修改 `handleStateChange` 以响应新的 `mode` 变化。
    - 修改 Shift 键的处理器，使其调用 `TooltipManager` 的 `transitionToDetailed` 方法，而不是分发全局事件。

**阶段三：迁移与清理 (4-6天)**

1.  **迁移 `highlightUtils.ts`**: 修改 `addTooltipEvents`，使其调用新的 `TooltipManager.showTooltip`。这是**移除旧代码的关键一步**。
2.  **移除 `ToolfullManager.tsx`**: 一旦所有功能都由 `TooltipManager` 处理，就可以安全地删除这个文件。
3.  **移除 `legacy/tooltipManager.ts`**: 在确认 `highlightUtils.ts` 不再依赖它之后，删除整个 `legacy` 目录。
4.  **事件系统清理**: 移除不再需要的 `UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP` 事件。

**阶段四：测试与验证 (3-5天)**

1.  **更新单元测试**: 为 `TooltipStateManager` 和 `TooltipManager` 的新功能编写单元测试。
2.  **组件测试**: 使用 `@testing-library/react` 测试 `UnifiedPopup` 在不同 `mode` 下的渲染行为。
3.  **端到端测试**: 手动或使用自动化工具测试完整的用户流程：悬停 -> 显示简单Tooltip -> 按Shift -> 显示详细Toolfull -> 关闭。

### 总结

你的分析和方案非常出色，已经为项目的成功演进铺平了道路。我上面的建议主要是为了将你的战略规划转化为更具体的、可操作的战术步骤。

**核心行动项**:

1.  **直接演进 `TooltipManager`**，而不是创建新类。
2.  **将 `mode` 和 `data` 纳入 `TooltipStateManager` 的管理范围**。
3.  **实现数据懒加载**，以优化用户体验。
4.  **用一个统一的容器组件 (`UnifiedPopup`)** 来处理渲染切换。
5.  **将迁移 `highlightUtils.ts` 作为移除 `legacy` 代码的前置任务**。

完成这次融合后，你的项目架构将更加优雅、健壮和易于维护。这是一个非常有价值的重构。
