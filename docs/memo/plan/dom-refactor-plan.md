# DOM & Managers 结构重构计划

## 问题分析

当前 `src/utils/dom` 目录及其子目录 `managers` 存在几个核心问题，导致了混乱：

1.  **职责不清与功能重叠**：
    *   存在两个 `TooltipManager`：一个在根目录 `tooltipManager.ts`（旧版），一个在 `managers/TooltipManager.tsx`（新版）。这表明重构可能未完成，留下了遗留代码。
    *   `TransparentPopupManager.ts` 的功能与 `services/PopupService.tsx` 严重重叠。它自己实现了创建DOM、渲染React组件、定位和事件处理的逻辑，而 `PopupService` 正是为这些功能设计的通用服务。这违反了 DRY (Don't Repeat Yourself) 原则。
    *   `toolpopupManager.tsx` 位于根目录，而其他管理器在 `managers` 子目录，结构不一致。

2.  **层次结构混乱**：
    *   `utils/dom` 应该存放纯粹的、低级别的DOM操作工具函数（例如 `selectionUtils.ts` 就是一个很好的例子）。
    *   然而，该目录目前包含了**高级业务逻辑控制器**（如 `toolpopupManager.tsx` 和 `TooltipManager.tsx`），它们负责协调服务（`DataService`, `PopupService`）和UI组件，这不属于 "utils" 的范畴。
    *   `simpleEventManager.ts` 是一个全局事件总线，其作用域远超DOM工具，更像一个核心**服务**。

3.  **命名和位置不一致**：
    *   `toolpopupManager.tsx` 和 `TransparentPopupManager.ts` 似乎都在处理详细弹窗（`Toolfull` 组件），但命名和位置不统一。
    *   `.ts` 和 `.tsx` 文件扩展名混用。管理器如果是纯逻辑类，应为 `.ts`；如果需要编写或返回JSX，则为 `.tsx`。

## 重构目标

我们的目标是建立一个清晰分层的架构，遵循以下原则：

*   **单一职责原则 (SRP)**：每个模块或类只做一件事。
*   **关注点分离 (SoC)**：将业务逻辑、UI渲染和底层服务清晰分开。
*   **代码内聚性**：将功能相关的文件组织在一起。
*   **消除冗余**：移除重复的代码和模块。

---

## 建议的新架构和重构步骤

我们将引入一个新的顶层目录 `src/managers`，专门用于存放这些高级业务逻辑控制器，并彻底清理 `utils/dom` 目录。

#### 新目录结构

```txt
lucid
└── src
    ├── components
    │   └── ...
    ├── constants
    │   └── ...
    ├── managers          // [新增] 高级业务逻辑控制器
    │   ├── TooltipManager.tsx
    │   └── ToolpopupManager.ts
    ├── services
    │   ├── EventManagerService.ts  // [移动并重命名]
    │   ├── PopupService.tsx
    │   └── ...
    └── utils
        ├── dom             // [清理后] 只保留纯粹的DOM工具
        │   └── selectionUtils.ts
        └── text
            └── ...
```

#### 详细重构步骤

---

**步骤 1：清理 `src/utils/dom`**

1.  **删除遗留的 `tooltipManager.ts`**
    *   **文件**: `lucid/src/utils/dom/tooltipManager.ts`
    *   **原因**: 这是旧的 "God Object" 实现，其功能已被 `managers` 目录下的模块化管理器所取代。它包含硬编码的翻译数据、混合的UI创建、定位和事件处理逻辑，维护性差。
    *   **操作**: **删除此文件**。

2.  **删除冗余的 `TransparentPopupManager.ts`**
    *   **文件**: `lucid/src/utils/dom/managers/TransparentPopupManager.ts`
    *   **原因**: 此管理器的功能完全被 `services/PopupService.tsx` 覆盖。它自己创建DOM、使用 `createRoot`、计算位置和处理事件，这正是 `PopupService` 的职责。保留它会导致代码冗余和维护噩梦。
    *   **操作**: **删除此文件**。其逻辑将由新的 `ToolpopupManager` 使用 `PopupService` 来实现。

3.  **删除临时的 `toolpopupManager.tsx`**
    *   **文件**: `lucid/src/utils/dom/toolpopupManager.tsx`
    *   **原因**: 它的逻辑是正确的（监听事件、调用服务），但位置错误。它将作为一个更规范的管理器被重新创建。
    *   **操作**: **删除此文件**。

4.  **移动和重命名 `simpleEventManager.ts`**
    *   **文件**: `lucid/src/utils/dom/simpleEventManager.ts`
    *   **原因**: 这是一个应用级的全局事件总线服务，而非一个简单的DOM工具。
    *   **操作**:
        *   **移动**到 `lucid/src/services/EventManagerService.ts`。
        *   **重命名**类 `SimpleEventManager` 为 `EventManagerService`。
        *   **更新**所有对 `simpleEventManager` 的导入路径和名称。

---

**步骤 2：建立新的 `src/managers` 目录**

1.  **创建 `src/managers` 目录**
    *   此目录将存放所有高级控制器，它们是连接服务和UI的桥梁。

2.  **移动和整理 Tooltip 相关管理器**
    *   **移动**: 将 `lucid/src/utils/dom/managers` 目录下的所有文件 (`TooltipManager.tsx`, `TooltipStateManager.ts`, `TooltipPositioner.ts`, `TooltipRenderer.ts`, `TooltipEventHandler.ts`, `index.ts`, `types.ts`) **移动**到 `lucid/src/managers/`。
    *   **可选优化**: 为了更好的封装，可以将 `Tooltip...` 的子管理器（State, Positioner, Renderer, EventHandler）放入 `lucid/src/managers/tooltip/` 子目录中，让 `TooltipManager.tsx` 作为该功能的唯一公共入口。

3.  **创建新的 `ToolpopupManager.ts`**
    *   **创建文件**: `lucid/src/managers/ToolpopupManager.ts`
    *   **职责**: 统一管理详细单词弹窗（`Toolfull` 组件）的显示逻辑。
    *   **实现**:
        ```typescript
        // src/managers/ToolpopupManager.ts
        import { popupService } from '../services/PopupService';
        import { dataService } from '../services/DataService';
        import { eventManagerService } from '../services/EventManagerService'; // 使用新的服务
        import { UI_EVENTS } from '../constants/uiEvents';
        import { Toolfull } from '../components/ui/Toolfull';
        import React from 'react';

        export class ToolpopupManager {
          private static instance: ToolpopupManager;

          private constructor() {
            this.setupGlobalEventListeners();
          }

          public static getInstance(): ToolpopupManager {
            if (!ToolpopupManager.instance) {
              ToolpopupManager.instance = new ToolpopupManager();
            }
            return ToolpopupManager.instance;
          }

          private setupGlobalEventListeners(): void {
            // 订阅从TooltipManager发出的过渡事件
            eventManagerService.subscribeGlobalEvent(
              UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP,
              (event) => {
                const { word, targetElement } = event.payload;
                this.show(word, targetElement);
              },
              {},
              'ToolpopupManager'
            );
          }

          public async show(word: string, referenceElement?: HTMLElement): Promise<void> {
            console.log(`[ToolpopupManager] Showing toolpopup for: "${word}"`);

            const wordDetails = await dataService.getWordDetails(word);
            if (!wordDetails) {
              console.warn(`[ToolpopupManager] No details found for: "${word}"`);
              return;
            }

            const popupId = `toolfull-${word}`;
            const toolfullContent = (
              <Toolfull
                word={word}
                wordData={wordDetails}
                onClose={() => this.hide(word)}
              />
            );

            // 统一使用 PopupService 来显示弹窗
            popupService.show(popupId, toolfullContent, {
              targetElement: referenceElement,
              // 可以添加更多自定义选项，如动画、样式等
            });
          }

          public hide(word: string): void {
            const popupId = `toolfull-${word}`;
            popupService.hide(popupId);
          }

          public destroy(): void {
            // 在这里添加取消订阅的逻辑
            console.log('[ToolpopupManager] Destroyed');
          }
        }
        ```

---

### 重构后的优势

1.  **清晰的目录结构**：
    *   `src/managers`: 存放业务流程的协调器。
    *   `src/services`: 存放可复用的核心服务（弹窗、事件、数据）。
    *   `src/utils/dom`: 只存放纯粹、无副作用的DOM工具函数。

2.  **职责明确**:
    *   `TooltipManager` 负责简单悬浮提示。
    *   `ToolpopupManager` 负责详细单词卡片。
    *   `PopupService` 是所有弹窗的唯一渲染和管理服务。
    *   `EventManagerService` 是唯一的全局事件总线。

3.  **代码更健壮且易于维护**：
    *   消除了 `TransparentPopupManager` 和 `PopupService` 之间的代码重复，所有弹窗逻辑都集中在一处。
    *   移除了遗留的 `tooltipManager.ts`，避免了混淆和潜在的bug。
    *   当需要修改弹窗的定位算法或动画效果时，只需修改 `PopupService` 和其底层的 `Popup.tsx` 组件，所有使用它的管理器都会自动受益。