Of course. Here is a highly actionable, step-by-step plan to refactor the `highlightUtils.ts` module. This plan is designed for direct execution, providing clear commands and code snippets to ensure a smooth and verifiable process.

### **High-Executability Refactoring Plan: `highlightUtils.ts`**

This plan will systematically decompose the oversized `highlightUtils.ts` module, fix architectural inconsistencies, and decouple it from the tooltip system, following the best practices already established in your project.

---

### **Phase 0: Preparation & Baseline**

**Goal:** Ensure a safe working environment and establish a performance/testing baseline.

1.  **Create a New Branch:**

    ```bash
    git checkout -b feature/refactor-highlight-utils
    ```

2.  **Establish a Test Baseline:** Run the full test suite to confirm the current state before making changes.
    ```bash
    pnpm test
    ```
    - **Action:** Note any existing failures. The goal is to not introduce new ones.

---

### **Phase 1: Foundational Fixes (Storage & CSS)**

**Goal:** Correct the most critical architectural violations to simplify the subsequent refactoring.

**Task 1.1: Integrate `HighlightStorageService`**

- **Why:** To eliminate direct calls to `browser.storage` and unify data access through the existing service layer.
- **File:** `src/utils/highlight/highlightUtils.ts`

- **Action:**

  1.  Import the `serviceContainer` and the `HighlightStorageService` type.
  2.  Create a helper function `getStorageService()` for easy access.
  3.  Find and replace all `browser.storage.local.get/set` calls with the corresponding service methods.

  ```typescript
  // Add these imports at the top of src/utils/highlight/highlightUtils.ts
  import { serviceContainer } from "@services/container/ServiceContainer";
  import type { HighlightStorageService } from "@services/storage/highlightStorage";

  /**
   * 获取高亮存储服务实例
   */
  function getStorageService(): HighlightStorageService {
    return serviceContainer.resolve<HighlightStorageService>(
      "HighlightStorageService"
    );
  }

  // --- Example Replacement ---

  // Find this (or similar):
  // const data = await browser.storage.local.get(['wordMarkings']);
  // const wordMarkings = data.wordMarkings || {};

  // Replace with:
  // const storageService = getStorageService();
  // const wordMarkings = await storageService.getWordMarkings();
  ```

**Task 1.2: Relocate All Styles**

- **Why:** To separate concerns, resolve CSS conflicts, and make styles maintainable within the design system.
- **File:** `src/utils/highlight/highlightUtils.ts`

- **Action:**
  1.  Create a new file: `src/styles/components/Highlight.css`.
  2.  **Cut** the CSS rules for `.lucid-highlight` and `@keyframes lucid-flash` from the `StyleManager.HIGHLIGHT_STYLES` string in `highlightUtils.ts` and **paste** them into `src/styles/components/Highlight.css`.
  3.  **Cut** all tooltip-related styles from `StyleManager.HIGHLIGHT_STYLES` and **paste** them into `src/styles/components/Tooltip.css`.
  4.  **Cut** all toolpopup-related styles from `StyleManager.HIGHLIGHT_STYLES` and **paste** them into `src/styles/components/Toolfull.css`.
  5.  **Delete** the entire `StyleManager` object from `highlightUtils.ts`.

**Task 1.3: Update Style Injection Service**

- **Why:** The `PopupService` needs to be able to inject the newly separated component styles.
- **File:** `src/services/StyleInjectionService.ts`

- **Action:**

  1.  Import the new `Highlight.css` content.
  2.  Update the `getStylesByComponentType` method to handle a `'highlight'` type.

  ```typescript
  // In src/styles/shadow/shadowStyles.ts
  // Import the new highlight CSS
  import highlightCSS from '../components/Highlight.css?raw';
  // ... then add a function to export it
  export const getHighlightStyles = (): string => highlightCSS;

  // In src/services/StyleInjectionService.ts
  import {
    // ... existing imports
    getHighlightStyles // Add this import
  } from '@styles/shadow/shadowStyles';

  // Update the getStylesByComponentType method
  private getStylesByComponentType(componentType: 'tooltip' | 'toolfull' | 'highlight' | 'all'): string {
      switch (componentType) {
          case 'tooltip':
              return getTooltipStyles();
          case 'toolfull':
              return getToolfullStyles();
          case 'highlight': // Add this case
              return getHighlightStyles();
          case 'all':
          default:
              return getAllShadowStyles();
      }
  }
  ```

---

### **Phase 2: Decompose the Monolith**

**Goal:** Break down the large `highlightUtils.ts` file into smaller, single-responsibility modules.

**Task 2.1: Create Pure Utility Module (`HighlightUtils.ts`)**

- **Action:**
  1.  Create a new file: `src/utils/highlight/HighlightUtils.ts`.
  2.  Move all pure, non-DOM, non-state functions from the old `highlightUtils.ts` into this new file as exported functions.
      - `isBoundaryChar`
      - `hasWordBoundary`
      - `mixHexColors`
      - `getEffectiveTextColor`
      - `buildTextGradient`
      - `calculateHighlight`

**Task 2.2: Create DOM Manipulation Module (`HighlightDOM.ts`)**

- **Action:**

  1.  Create a new file: `src/utils/highlight/HighlightDOM.ts`.
  2.  Move all functions that directly manipulate the DOM into this new file.
      - `getAncestorHighlight`
      - `removeEmptyHighlights`
      - `unwrapHighlight`
      - `unwrapHighlightsInRange`
      - `createHighlightElement`
      - `highlightWordInContainer`
      - `highlightWordInContainerForceAll`
  3.  **Crucially,** in the moved `createHighlightElement` function, **delete** the lines that call `addTooltipEvents`. This is a key step for decoupling.

      ```typescript
      // In the new src/utils/highlight/HighlightDOM.ts
      export function createHighlightElement(...) {
          // ... (element creation logic) ...

          // DELETE THESE LINES:
          // addTooltipEvents(el, word);
          // el.dataset.tooltipEventsAdded = "true";

          return el;
      }
      ```

**Task 2.3: Create Controller Module (`HighlightController.ts`)**

- **Action:**

  1.  Create a new file: `src/utils/highlight/HighlightController.ts`.
  2.  This class will now orchestrate the highlighting logic.
  3.  Move the main business logic functions into this class as methods: `applyWordHighlight`, `toggleWordHighlightState`, `addWordHighlight`, `removeWordHighlight`, `decreaseWordHighlight`, `updateAllWordHighlights`.
  4.  The controller will use the new static modules `HighlightUtils` and `HighlightDOM` and the injected `HighlightStorageService`.

  ```typescript
  // Skeleton for src/utils/highlight/HighlightController.ts
  import * as HighlightUtils from "./HighlightUtils";
  import * as HighlightDOM from "./HighlightDOM";
  import { serviceContainer } from "@services/container/ServiceContainer";
  import type { HighlightStorageService } from "@services/storage/highlightStorage";

  export class HighlightController {
    private storageService: HighlightStorageService;

    constructor() {
      this.storageService = serviceContainer.resolve<HighlightStorageService>(
        "HighlightStorageService"
      );
    }

    // Paste and adapt the logic of applyWordHighlight here
    public async applyWordHighlight(
      range: Range,
      isDarkText: boolean
    ): Promise<void> {
      // ... uses this.storageService, HighlightUtils.*, and HighlightDOM.*
    }

    // ... other methods ...
  }
  ```

---

### **Phase 3: Decouple via `MutationObserver`**

**Goal:** Remove the direct dependency of the highlight logic on the `TooltipManager`.

- **Why:** Highlighting should only be responsible for creating `<mark>` elements. The Tooltip system should be responsible for observing these elements and attaching its own behaviors.
- **File:** `src/utils/dom/managers/tooltip/TooltipManager.tsx`

- **Action:**

  1.  Implement a `MutationObserver` in the `TooltipManager`'s constructor to watch `document.body` for new nodes.
  2.  The observer's callback will check for added elements with the `.lucid-highlight` class.
  3.  Create a new private method `attachTooltipEvents` inside `TooltipManager` that contains the logic previously found in `highlightUtils.ts`'s `addTooltipEvents`.
  4.  Update the `destroy` method in `TooltipManager` to call `observer.disconnect()`.

  ```typescript
  // In src/utils/dom/managers/tooltip/TooltipManager.tsx
  export class TooltipManager {
    private observer: MutationObserver;
    private boundHighlights = new WeakSet<HTMLElement>(); // Prevent double-binding

    constructor(options: TooltipManagerOptions = {}) {
      // ... existing constructor logic ...
      this.initHighlightObserver();
    }

    private initHighlightObserver(): void {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              const highlights = el.matches(".lucid-highlight")
                ? [el]
                : el.querySelectorAll(".lucid-highlight");
              highlights.forEach((h) =>
                this.attachTooltipEvents(h as HTMLElement)
              );
            }
          });
        });
      });

      this.observer.observe(document.body, { childList: true, subtree: true });
    }

    private attachTooltipEvents(element: HTMLElement): void {
      if (this.boundHighlights.has(element)) return; // Already bound

      const word = element.dataset.word;
      if (!word) return;

      element.addEventListener("mouseenter", async () => {
        /* ... show tooltip logic ... */
      });
      element.addEventListener("mouseleave", () => {
        /* ... hide tooltip logic ... */
      });
      // Add other listeners like click if needed

      this.boundHighlights.add(element);
    }

    public destroy(): void {
      // ... existing destroy logic ...
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }
  ```

---

### **Phase 4: Integration and Cleanup**

**Goal:** Finalize the refactor by updating entry points and removing the old file.

**Task 4.1: Update Application Entry Point**

- **File:** `entrypoints/content.ts`
- **Action:** Replace any calls to the old `applyWordHighlight` with the new `HighlightController`.

  ```typescript
  // In entrypoints/content.ts

  // BEFORE:
  // import { applyWordHighlight } from '@utils/highlight/highlightUtils';
  // ...
  // await applyWordHighlight(expandedRange, isDarkText);

  // AFTER:
  import { HighlightController } from "@utils/highlight/HighlightController"; // Adjust path if needed
  const highlightController = new HighlightController(); // Or use a singleton pattern
  // ...
  await highlightController.applyWordHighlight(expandedRange, isDarkText);
  ```

**Task 4.2: Delete Old File**

- **Action:** Once all logic has been moved and integrations are updated, delete the original file.
  ```bash
  rm src/utils/highlight/highlightUtils.ts
  ```

**Task 4.3: Create Index File for Exports**

- **Action:** Create `src/utils/highlight/index.ts` to provide a clean export interface for the new modules.
  ```typescript
  // src/utils/highlight/index.ts
  export { HighlightController } from "./HighlightController";
  export * as HighlightUtils from "./HighlightUtils";
  export * as HighlightDOM from "./HighlightDOM";
  ```

---

### **Phase 5: Verification**

**Goal:** Ensure the refactoring was successful and introduced no regressions.

1.  **Run Tests:** Execute the test suite again.

    ```bash
    pnpm test
    ```

    - **Expected:** The test results should be identical to or better than the baseline established in Phase 0.

2.  **Manual QA Checklist:**
    - [ ] Select text with `Shift` key. Does it highlight correctly?
    - [ ] Hover over a highlighted word. Does the tooltip appear?
    - [ ] Re-highlight an already highlighted word. Does the color change correctly according to its `markCount`?
    - [ ] Click the "decrease count" button in the tooltip. Does the highlight color update?
    - [ ] Decrease count to zero. Does the highlight disappear entirely?
    - [ ] Check the browser console for any new errors.

By following these five phases, you will systematically and safely refactor the `highlightUtils.ts` module, resulting in a more maintainable, decoupled, and architecturally consistent codebase.
