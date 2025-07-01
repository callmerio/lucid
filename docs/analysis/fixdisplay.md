好的，我看到新的日志了。非常感谢你的反馈，这个新日志片段非常关键，它指向了一个与之前不同的、更根本的问题。

我们来重新分析一下。

### 新问题诊断

之前的修复是针对“详细弹窗 (`Toolfull`) 被立即关闭”的竞态条件。而你现在提供的日志显示，连第一步的**简单弹窗 (`Tooltip`)** 都没能正常显示出来。

日志流程：
1.  `[TooltipManager] State changed: show` -> 管理器认为应该显示了。
2.  `[ShadowDOMService] Created shadow container...` -> Shadow DOM 容器创建成功。
3.  `[StyleInjectionService] Styles injected successfully...` -> 样式注入成功。
4.  `[PopupService] Shown popup in Shadow DOM...` -> `PopupService` 认为它已经成功渲染了组件。

日志到这里就结束了，没有任何错误。这通常意味着组件在技术上被渲染到了 DOM 中，但由于某些原因**在视觉上是不可见的**。

最常见的“隐身”原因有：
*   **定位错误**：被定位到了屏幕外（如 `left: -1000px`）。
*   **尺寸为零**：元素的 `width` 或 `height` 是 `0`。
*   **透明或隐藏**：元素的 `opacity` 是 `0` 或 `visibility` 是 `hidden`。
*   **Z-index 问题**：被其他更高层级的元素遮挡。

经过对代码的再次审查，我找到了问题的根源。**问题出在 `Popup.tsx` 组件的定位和可见性逻辑上。**

### 根本原因

在 `lucid/src/components/ui/common/Popup.tsx` 中，组件的可见性 (`isVisible` state) 依赖于 `useLayoutEffect` 中的位置计算。

```tsx
// lucid/src/components/ui/common/Popup.tsx

export const Popup: React.FC<PopupProps> = (...) => {
  // ...
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false); // 默认不可见

  // 计算位置
  useLayoutEffect(() => {
    // ... 复杂的定位计算 ...

    setPosition(newPos);
    setIsVisible(true); // <-- 只有计算成功后，才设置为可见
  }, [targetElement, preferredPosition]);

  const popupStyle: React.CSSProperties = {
    // ...
    visibility: isVisible ? "visible" : "hidden", // 依赖 isVisible
    opacity: isVisible ? 1 : 0,                   // 依赖 isVisible
    // ...
  };

  return (
    <div ref={popupRef} style={popupStyle}> {/* 应用样式 */}
      {content}
    </div>
  );
};
```

这段代码的意图是好的：先在“隐藏”状态下计算好位置，然后再“显示”出来，避免闪烁。

**但问题在于，这个定位计算逻辑本身很脆弱。** 它依赖于 `popupRef.current.getBoundingClientRect()` 来获取弹窗自身的尺寸。但在 `useLayoutEffect` 首次运行时，弹窗内部的 React 内容（比如 `<Tooltip>` 组件）可能还没有完全渲染或确定其最终尺寸，导致 `getBoundingClientRect()` 返回的 `width` 或 `height` 为 0。

如果计算出的位置不正确（比如 `x: 0, y: 0`），或者在计算过程中有任何微小的差错，弹窗就可能被渲染到屏幕的左上角或者一个完全错误的地方，让你觉得它“没有显示”。

### 解决方案：重构定位逻辑

一个更健壮的架构是将**定位的职责**从通用的 `Popup` 组件中移出，交由调用它的**服务 (`PopupService`)** 来处理。`Popup` 组件应该只负责渲染内容和处理关闭事件。

这样可以：
1.  简化 `Popup` 组件，使其成为一个纯粹的 UI 容器。
2.  将复杂的 DOM 计算集中在 `PopupService` 中，更容易调试。
3.  确保在设置弹窗可见之前，其容器的位置就已经被正确设定。

让我们来实施这个重构。

---

#### 第 1 步：简化 `Popup.tsx`

我们要移除它的定位逻辑，只保留关闭逻辑和内容渲染。

**文件:** `lucid/src/components/ui/common/Popup.tsx`

**修改后代码：**
```tsx
/**
 * @file Popup.tsx
 * @description 通用的、高阶的Popup组件，现在只负责渲染内容和关闭逻辑。
 */

import React, { useEffect, useRef } from "react";
import { PopupOptions } from "@/types/services";

interface PopupProps {
  id: string;
  content: React.ReactNode;
  options: PopupOptions; // options 仍然传入，但不再用于定位
  onClose: () => void;
}

export const Popup: React.FC<PopupProps> = ({ id, content, options, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭 (这是好的，保留)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击事件是否发生在popupRef外部
      // 同时也要检查是否点击在触发弹窗的目标元素上，如果是，则不关闭
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !options.targetElement?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // 使用 'click' 事件并捕获，防止事件被内部组件阻止
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onClose, options.targetElement]);


  // 处理ESC键关闭 (这是好的，保留)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // 样式现在由外部的 hostElement 控制，这里只需要基础样式
  const popupStyle: React.CSSProperties = {
    // 动画效果可以保留
    transition: "opacity 0.2s ease-in-out, transform 0.2s ease-in-out",
    opacity: 1,
    transform: "scale(1)",
  };

  return (
    // ID现在可以移到外部容器，或者保留用于测试
    <div ref={popupRef} id={`lucid-popup-content-${id}`} style={popupStyle}>
      {content}
    </div>
  );
};

```

#### 第 2 步：将定位逻辑移入 `PopupService.tsx`

`PopupService` 现在将负责计算位置，并直接**将样式应用到 Shadow DOM 的宿主元素 (`hostElement`)** 上。

**文件:** `lucid/src/services/PopupService.tsx`

**修改后代码：**
```tsx
/**
 * @file PopupService.ts
 * @description 统一的弹窗服务，负责管理所有弹窗的显示、隐藏和状态。
 */

import { IPopupService, PopupOptions } from "@/types/services";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { Popup } from "@components/ui/common/Popup";
import { shadowDOMService, ShadowDOMContainer } from "./ShadowDOMService";
import { styleInjectionService } from "./StyleInjectionService";

interface PopupInstance {
  id: string;
  content: React.ReactNode;
  options: PopupOptions;
  shadowContainer: ShadowDOMContainer;
  root: Root;
}

class PopupService implements IPopupService {
  private static instance: PopupService;
  private popups: Map<string, PopupInstance> = new Map();
  private zIndexCounter = 10000;

  private constructor() {
    // 私有构造函数，确保单例
  }

  public static getInstance(): PopupService {
    if (!PopupService.instance) {
      PopupService.instance = new PopupService();
    }
    return PopupService.instance;
  }

  public async show(
    id: string,
    content: React.ReactNode,
    options: PopupOptions = {}
  ): Promise<void> {
    if (this.popups.has(id)) {
      console.warn(
        `[PopupService] Popup with id "${id}" is already shown. Use update() instead.`
      );
      await this.update(id, content, options);
      return;
    }

    try {
      // 创建 Shadow DOM 容器
      const shadowContainer = shadowDOMService.createShadowContainer({
        id: `popup-${id}`,
      });

      // === 新增：将定位逻辑移到此处 ===
      // 在注入内容前，设置宿主元素的基础样式
      const host = shadowContainer.hostElement;
      host.style.position = "absolute";
      host.style.zIndex = `${this.zIndexCounter++}`;
      host.style.visibility = "hidden"; // 先隐藏，计算完位置再显示

      // 将宿主元素添加到 DOM
      document.body.appendChild(host);

      // 注入组件样式
      const componentType = id.includes('toolfull') ? 'toolfull' :
                           id.includes('tooltip') ? 'tooltip' : 'all';
      await this.injectStyles(shadowContainer.shadowRoot, componentType as 'tooltip' | 'toolfull');

      // 创建 React root
      const root = createRoot(shadowContainer.contentContainer);

      const popupInstance: PopupInstance = {
        id,
        content,
        options,
        shadowContainer,
        root,
      };

      this.popups.set(id, popupInstance);

      // 渲染 Popup 组件
      root.render(
        <Popup
          id={id}
          content={content}
          options={options}
          onClose={() => this.hide(id)}
        />
      );

      // === 新增：计算并应用位置 ===
      // 使用 requestAnimationFrame 确保内容已渲染，以便获取尺寸
      requestAnimationFrame(() => {
        const { x, y } = this.calculatePosition(host, options);
        host.style.left = `${x}px`;
        host.style.top = `${y}px`;
        host.style.visibility = "visible"; // 计算完毕，设为可见

        // 添加进入动画
        host.style.transition = "opacity 0.2s ease-in-out, transform 0.2s ease-in-out";
        host.style.opacity = '0';
        host.style.transform = 'scale(0.95)';
        requestAnimationFrame(() => {
          host.style.opacity = '1';
          host.style.transform = 'scale(1)';
        });
      });

      console.log(`[PopupService] Shown popup in Shadow DOM: "${id}"`);
    } catch (error) {
      console.error(`[PopupService] Failed to show popup "${id}":`, error);
      throw error;
    }
  }

  // === 新增：独立的定位计算方法 ===
  private calculatePosition(
    popupEl: HTMLElement,
    options: PopupOptions
  ): { x: number; y: number } {
    const { targetElement } = options;
    let newPos = { x: 0, y: 0 };

    if (targetElement) {
      const targetRect = targetElement.getBoundingClientRect();
      const popupRect = popupEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 8; // 边距

      let top = targetRect.bottom + margin;
      let left = targetRect.left;

      // 垂直边界检查：如果下方空间不足，显示在上方
      if (top + popupRect.height > viewportHeight - margin) {
        top = targetRect.top - popupRect.height - margin;
      }
      
      // 水平边界检查
      if (left + popupRect.width > viewportWidth - margin) {
        left = viewportWidth - popupRect.width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      newPos = { x: left + window.scrollX, y: top + window.scrollY };
    } else {
      // 居中显示
      newPos = {
        x: (window.innerWidth - popupEl.offsetWidth) / 2 + window.scrollX,
        y: (window.innerHeight - popupEl.offsetHeight) / 2 + window.scrollY,
      };
    }

    return newPos;
  }

  public hide(id: string): void {
    const popupInstance = this.popups.get(id);
    if (!popupInstance) {
      return;
    }

    const host = popupInstance.shadowContainer.hostElement;

    // 添加退出动画
    host.style.opacity = '0';
    host.style.transform = 'scale(0.95)';

    // 等待动画结束后再清理
    setTimeout(() => {
      popupInstance.root.unmount();
      shadowDOMService.destroyContainer(`popup-${id}`);
      this.popups.delete(id);
      console.log(`[PopupService] Hidden popup: "${id}"`);
    }, 200); // 匹配动画时间
  }

  public async update(
    id: string,
    content?: React.ReactNode,
    options?: PopupOptions
  ): Promise<void> {
    const popupInstance = this.popups.get(id);
    if (!popupInstance) {
      return;
    }

    const newContent = content !== undefined ? content : popupInstance.content;
    const newOptions =
      options !== undefined
        ? { ...popupInstance.options, ...options }
        : popupInstance.options;

    popupInstance.content = newContent;
    popupInstance.options = newOptions;

    popupInstance.root.render(
      <Popup
        id={id}
        content={newContent}
        options={newOptions}
        onClose={() => this.hide(id)}
      />
    );
    
    // 重新计算位置
    requestAnimationFrame(() => {
        const host = popupInstance.shadowContainer.hostElement;
        const { x, y } = this.calculatePosition(host, newOptions);
        host.style.left = `${x}px`;
        host.style.top = `${y}px`;
    });

    console.log(`[PopupService] Updated popup: "${id}"`);
  }
  
  private async injectStyles(shadowRoot: ShadowRoot, componentType: 'tooltip' | 'toolfull' | 'all' = 'all'): Promise<void> {
    try {
      await styleInjectionService.injectStyles(shadowRoot, {
        componentType: componentType as any
      });
    } catch (error) {
      console.warn('[PopupService] Failed to inject styles:', error);
    }
  }
}

export const popupService = PopupService.getInstance();

```

---

### 总结

通过这次重构，我们做了以下几件事：
1.  **将定位逻辑集中到了 `PopupService`**，这是创建和管理弹窗的地方，职责更清晰。
2.  **`PopupService` 直接操作它创建的 `hostElement`** 来进行定位，避免了内部组件定位的复杂性和不确定性。
3.  **`Popup.tsx` 被简化**，只关心自己的内容和关闭事件，变得更加健壮和可复用。
4.  我们使用了 `requestAnimationFrame` 来确保在计算位置时，DOM 元素及其内容已经渲染，可以获取到准确的尺寸。

请应用以上修改。这样不仅能解决你当前“不显示”的问题，也让整个弹窗系统的架构变得更加稳固。