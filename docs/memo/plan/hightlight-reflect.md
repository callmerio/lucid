📋 详细重构执行计划

🚨 阶段0：基础修复 (2天，关键阶段)

任务0.1：样式审计与版本统一 (0.5天)

步骤1：样式差异分析

# 创建样式审计脚本

mkdir -p scripts/refactor
touch scripts/refactor/style-audit.js

# 分析三处样式定义的差异：

# 1. highlightUtils.ts 中的 StyleManager.HIGHLIGHT_STYLES (369-943行)

# 2. src/styles/components/Tooltip.css

# 3. src/styles/components/Toolfull.css

步骤2：确定样式合并策略

- highlightUtils.ts 中的样式更完整，包含复杂交互效果
- 需要将完整样式迁移到对应的组件CSS文件中
- 确保不丢失任何交互功能

任务0.2：服务层集成修复 (1天)

立即修复架构分裂问题：

// 文件：src/services/container/ServiceContainer.ts
// 添加服务注册
import { HighlightStorageService } from '../storage/highlightStorage';

// 在应用初始化时注册
serviceContainer.registerSingleton(
'HighlightStorageService',
() => HighlightStorageService.getInstance()
);

// 文件：src/utils/highlight/highlightUtils.ts
// 添加服务依赖
import { serviceContainer } from '@services/container/ServiceContainer';
import type { HighlightStorageService } from '@services/storage/highlightStorage';

const getHighlightStorage = () =>
serviceContainer.resolve<HighlightStorageService>('HighlightStorageService');

// 替换所有 browser.storage.local 调用：
// 原代码：
// const data = await browser.storage.local.get(['wordMarkings']);
// const wordMarkings = data.wordMarkings || {};

// 新代码：
// const wordMarkings = await getHighlightStorage().getWordMarkings();

任务0.3：设计系统扩展 (0.5天)

/_ 文件：src/styles/theme/design-tokens.css _/
/_ 添加完整的高亮颜色调色板 _/
:root {
/_ 高亮颜色系统 - Orange _/
--lucid-highlight-orange-300: #fdba74;
--lucid-highlight-orange-400: #fb923c;
--lucid-highlight-orange-500: #f97316;
--lucid-highlight-orange-600: #ea580c;
--lucid-highlight-orange-700: #c2410c;
--lucid-highlight-orange-800: #C10007;

    /* 高亮颜色系统 - Blue */
    --lucid-highlight-blue-300: #93c5fd;
    --lucid-highlight-blue-400: #60a5fa;
    --lucid-highlight-blue-500: #3b82f6;
    --lucid-highlight-blue-600: #2563eb;
    --lucid-highlight-blue-700: #1d4ed8;
    --lucid-highlight-blue-800: #1e40af;

    /* 高亮颜色系统 - Green */
    --lucid-highlight-green-300: #86efac;
    --lucid-highlight-green-400: #4ade80;
    --lucid-highlight-green-500: #22c55e;
    --lucid-highlight-green-600: #16a34a;
    --lucid-highlight-green-700: #15803d;
    --lucid-highlight-green-800: #166534;

}

📦 阶段1：纯逻辑分离 (1.5天)

任务1.1：创建工具函数模块

// 文件：src/utils/highlight/HighlightUtils.ts
/\*\*

- 高亮工具函数 - 纯函数，无副作用
  \*/

// 常量定义
export const MAX_MARK_COUNT = 10;
export const LEVEL_STEP = 2;
export const DEFAULT_BASE_COLOR = "orange";
export const GRADIENT_SPLIT = 60;
export const BLEND_WEIGHT = 0.7;

// 色阶映射
export const DARK_SHADES: Record<number, number> = { 1: 700, 2: 600, 3: 500, 4: 400, 5: 300 };
export const LIGHT_SHADES: Record<number, number> = { 1: 400, 2: 500, 3: 600, 4: 700, 5: 800 };

// 从 highlightUtils.ts 迁移的纯函数
export const isBoundaryChar = (ch: string) => !/[a-z0-9]/i.test(ch);

export function hasWordBoundary(lower: string, idx: number, wordLen: number): boolean {
const before = idx === 0 ? "" : lower[idx - 1];
const after = idx + wordLen >= lower.length ? "" : lower[idx + wordLen];
const boundaryBefore = before === "" || isBoundaryChar(before);
const boundaryAfter = after === "" || isBoundaryChar(after);
return boundaryBefore && boundaryAfter;
}

export function mixHexColors(hexA: string, hexB: string, weight = 0.5): string {
const a = parseInt(hexA.replace("#", ""), 16);
const b = parseInt(hexB.replace("#", ""), 16);
const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
const r = Math.round(ar _ weight + br _ (1 - weight));
const g = Math.round(ag _ weight + bg _ (1 - weight));
const bl = Math.round(ab _ weight + bb _ (1 - weight));
return "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function getEffectiveTextColor(node: Node | null): string {
let cur: Node | null = node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
while (cur && cur !== document) {
if (cur instanceof HTMLElement) {
const col = window.getComputedStyle(cur).color;
if (col && col !== "transparent" && !col.startsWith("rgba(0, 0, 0, 0")) {
const m = col.match(/\d+/g);
if (m && m.length >= 3) {
const [r, g, b] = m.map(Number);
return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
}
}
cur = cur?.parentNode || null;
}
const [r, g, b] = (window.getComputedStyle(document.body).color.match(/\d+/g) || ["0", "0",
"0"]).map(Number);
return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function buildTextGradient(primaryHex: string, baseColor: string, originHex: string): string {
// 使用新的设计变量
const endHex = `var(--lucid-highlight-${baseColor}-500)`;
const fromMix = mixHexColors(primaryHex, originHex, BLEND_WEIGHT);
const toMix = mixHexColors(endHex, originHex, BLEND_WEIGHT);
return `linear-gradient(to right, ${fromMix} 0%, ${fromMix} ${GRADIENT_SPLIT}%, ${toMix} 100%)`;
}

export function calculateHighlight(baseColor: string, queryCount: number, isDarkText: boolean): {
className: string; hex: string } {
const level = Math.min(5, Math.ceil(queryCount / LEVEL_STEP));
const shade = isDarkText ? DARK_SHADES[level] : LIGHT_SHADES[level];
const className = `text-${baseColor}-${shade}`;
// 使用 CSS 变量而不是硬编码的调色板
const hex = `var(--lucid-highlight-${baseColor}-${shade})`;
return { className, hex };
}

任务1.2：创建DOM操作模块

// 文件：src/utils/highlight/HighlightDOM.ts
/\*\*

- 高亮DOM操作 - 纯DOM增删改查，无业务逻辑
  _/
  import _ as HighlightUtils from './HighlightUtils';

export function getAncestorHighlight(node: Node | null): HTMLElement | null {
while (node && node !== document) {
if (node instanceof HTMLElement && node.classList.contains("lucid-highlight")) {
return node;
}
node = node.parentNode;
}
return null;
}

export function removeEmptyHighlights(): void {
document.querySelectorAll<HTMLElement>(".lucid-highlight").forEach((el) => {
if (!el.textContent?.trim()) {
el.remove();
}
});
}

export function unwrapHighlight(el: HTMLElement): void {
const parent = el.parentNode;
if (!parent) return;
while (el.firstChild) {
parent.insertBefore(el.firstChild, el);
}
parent.removeChild(el);
}

export function unwrapHighlightsInRange(rng: Range): void {
const walker = document.createTreeWalker(
rng.commonAncestorContainer,
NodeFilter.SHOW_ELEMENT,
{
acceptNode: (node) =>
node instanceof HTMLElement &&
node.classList.contains("lucid-highlight") &&
rng.intersectsNode(node)
? NodeFilter.FILTER_ACCEPT
: NodeFilter.FILTER_REJECT,
},
);

    const toUnwrap: HTMLElement[] = [];
    while (walker.nextNode()) {
      toUnwrap.push(walker.currentNode as HTMLElement);
    }
    toUnwrap.forEach(unwrapHighlight);

}

export function createHighlightElement(
word: string,
count: number,
highlightClassName: string,
primaryHex: string,
baseColor: string,
originHex: string,
): HTMLElement {
const el = document.createElement("mark");
el.classList.add("lucid-highlight", highlightClassName);
el.dataset.word = word;
el.dataset.markCount = count.toString();
el.dataset.baseColor = baseColor;
el.dataset.appliedTimestamp = Date.now().toString();
el.textContent = word;

    const gradient = HighlightUtils.buildTextGradient(primaryHex, baseColor, originHex);
    el.style.background = gradient;
    el.style.webkitBackgroundClip = "text";
    el.style.backgroundClip = "text";
    el.style.color = "transparent";

    // 不再调用 addTooltipEvents - 解耦关键点
    return el;

}

// 样式管理器（瘦身版，只管理高亮相关样式）
export const HighlightStyleManager = {
STYLE_ID: "lucid-highlight-styles",
HIGHLIGHT_STYLES: `       .lucid-highlight {
        transition: color 500ms ease-in-out;
        cursor: pointer;
        position: relative;
      }
      .lucid-highlight.flash {
        animation: lucid-flash 200ms ease-in-out;
      }
      @keyframes lucid-flash {
        0%,100% { color:inherit!important; }
        50%     { background-color:currentColor!important; color:#ffffff!important; }
      }
    `,
ensureStyles(root: Node): void {
if (!(root === document || root instanceof ShadowRoot)) return;

      const container = root === document ? document : (root as ShadowRoot);
      const existingStyle = container.querySelector(`#${this.STYLE_ID}`);
      if (existingStyle) return;

      const styleEl = document.createElement("style");
      styleEl.id = this.STYLE_ID;
      styleEl.textContent = this.HIGHLIGHT_STYLES.trim();

      if (root === document) {
        document.head.appendChild(styleEl);
      } else {
        (root as ShadowRoot).prepend(styleEl);
      }
    },

};

🔄 阶段2：服务化状态管理优化 (1.5天)

任务2.1：扩展 HighlightStorageService

// 文件：src/services/storage/highlightStorage.ts (增强现有服务)
export class HighlightStorageService {
// 现有方法保持不变...

    // 新增方法以匹配 highlightUtils.ts 的需求
    async incrementMarkCount(word: string, maxCount: number = 10): Promise<number> {
      const wordMarkings = await this.getWordMarkings();
      const currentCount = wordMarkings[word] || 0;
      const newCount = Math.min(currentCount + 1, maxCount);
      await this.updateWordMarking(word, newCount);
      return newCount;
    }

    async decrementMarkCount(word: string): Promise<number> {
      const wordMarkings = await this.getWordMarkings();
      const currentCount = wordMarkings[word] || 0;
      const newCount = Math.max(currentCount - 1, 0);
      if (newCount === 0) {
        await this.removeWordMarking(word);
      } else {
        await this.updateWordMarking(word, newCount);
      }
      return newCount;
    }

    async getMarkCount(word: string): Promise<number> {
      const wordMarkings = await this.getWordMarkings();
      return wordMarkings[word] || 0;
    }

    async setMarkCount(word: string, count: number): Promise<void> {
      if (count <= 0) {
        await this.removeWordMarking(word);
      } else {
        await this.updateWordMarking(word, count);
      }
    }

}

🎨 阶段3：样式归位与模块解耦 (2天)

任务3.1：样式系统重组 (1天)

/_ 文件：src/styles/components/Tooltip.css _/
/_ 合并 highlightUtils.ts 中的完整 tooltip 样式 _/

/_ 基础样式保持现有... _/

/_ 从 highlightUtils.ts 迁移的高级交互样式 _/
.lucid-tooltip-main {
display: flex;
align-items: center;
position: relative;
flex: 1;
}

.lucid-tooltip-text {
flex: 1;
display: flex;
align-items: center;
}

.lucid-tooltip-hover-zone {
position: absolute;
right: 0;
top: 0;
bottom: 0;
width: 40%;
pointer-events: none;
}

.lucid-tooltip-actions {
display: none;
align-items: center;
gap: var(--lucid-spacing-2);
margin-left: 0px;
opacity: 0;
transform: translateX(15px) scale(0.8);
max-width: 0;
overflow-x: visible;
overflow-y: visible;
transition: opacity 400ms var(--lucid-ease-bounce),
transform 400ms var(--lucid-ease-bounce),
max-width var(--lucid-transition-normal),
margin-left var(--lucid-transition-normal);
}

.lucid-tooltip-expanded .lucid-tooltip-content {
padding-right: var(--lucid-spacing-3);
}

.lucid-tooltip-expanded .lucid-tooltip-actions {
max-width: 60px;
margin-left: var(--lucid-spacing-4);
}

/_ 更多完整的样式... _/

任务3.2：TooltipManager 改造 - MutationObserver 方案 (1天)

// 文件：src/utils/dom/managers/tooltip/TooltipManager.tsx
export class TooltipManager {
private mutationObserver: MutationObserver | null = null;
private boundHighlights = new WeakSet<HTMLElement>();

    constructor(/* 现有参数 */) {
      // 现有初始化代码...
      this.initHighlightElementObserver();
    }

    /**
     * 初始化高亮元素监听器 - 关键的解耦实现
     */
    private initHighlightElementObserver(): void {
      // 性能优化：使用节流
      let observerTimeout: number | null = null;

      this.mutationObserver = new MutationObserver((mutations) => {
        if (observerTimeout) return;

        observerTimeout = window.setTimeout(() => {
          this.processMutations(mutations);
          observerTimeout = null;
        }, 16); // 约60fps
      });

      // 开始监听，使用优化的配置
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false // 仅监听DOM结构变化
      });

      // 处理已存在的高亮元素
      this.processExistingHighlights();
    }

    private processMutations(mutations: MutationRecord[]): void {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // 查找新添加的高亮元素
            const highlights = element.classList?.contains('lucid-highlight')
              ? [element as HTMLElement]
              : Array.from(element.querySelectorAll('.lucid-highlight')) as HTMLElement[];

            highlights.forEach((highlightEl) => {
              this.attachTooltipEvents(highlightEl);
            });
          }
        });
      });
    }

    private processExistingHighlights(): void {
      document.querySelectorAll('.lucid-highlight').forEach((el) => {
        this.attachTooltipEvents(el as HTMLElement);
      });
    }

    /**
     * 为高亮元素绑定 tooltip 事件
     */
    private attachTooltipEvents(element: HTMLElement): void {
      // 避免重复绑定
      if (this.boundHighlights.has(element)) {
        return;
      }

      const word = element.dataset.word || element.textContent?.trim() || '';
      if (!word) return;

      // 使用 passive 监听器优化性能
      const mouseEnterHandler = async () => {
        this.cancelHide();
        try {
          await this.showTooltip({
            word: word,
            translation: `Loading translation for "${word}"...`,
            targetElement: element,
            preferredPosition: 'auto'
          });
        } catch (error) {
          console.error('[Lucid] Error showing tooltip:', error);
        }
      };

      const mouseLeaveHandler = () => {
        this.hideTooltip(false);
      };

      element.addEventListener('mouseenter', mouseEnterHandler, { passive: true });
      element.addEventListener('mouseleave', mouseLeaveHandler, { passive: true });

      // 记录已绑定的元素
      this.boundHighlights.add(element);
    }

    destroy(): void {
      // 现有销毁逻辑...

      // 断开 MutationObserver
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      // 清理绑定记录
      this.boundHighlights = new WeakSet();
    }

}

🎯 阶段4：控制器整合 (1天)

任务4.1：创建 HighlightController

// 文件：src/utils/highlight/HighlightController.ts
import { serviceContainer } from '@services/container/ServiceContainer';
import type { HighlightStorageService } from '@services/storage/highlightStorage';
import _ as HighlightUtils from './HighlightUtils';
import _ as HighlightDOM from './HighlightDOM';

export class HighlightController {
private static instance: HighlightController;
private highlightStorage: HighlightStorageService;

    private constructor() {
      this.highlightStorage = serviceContainer.resolve<HighlightStorageService>('HighlightStorageService');
    }

    static getInstance(): HighlightController {
      if (!HighlightController.instance) {
        HighlightController.instance = new HighlightController();
      }
      return HighlightController.instance;
    }

    /**
     * 应用高亮到选区
     */
    async applyWordHighlight(range: Range, isDarkText: boolean): Promise<void> {
      HighlightDOM.HighlightStyleManager.ensureStyles(document);

      const rawSelection = window.getSelection()?.toString().trim() || "";
      const word = rawSelection.toLowerCase();

      if (!word || range.collapsed) {
        console.warn("[Lucid] Invalid range or empty word");
        return;
      }

      try {
        const settings = await this.highlightStorage.getSettings();
        const baseColor = settings.highlightColor || HighlightUtils.DEFAULT_BASE_COLOR;

        // 检查是否已有高亮
        const existingCount = await this.highlightStorage.getMarkCount(word);
        let targetHighlight: HTMLElement | null = null;

        // 检查选区是否与现有高亮相关
        const ancestorMark = HighlightDOM.getAncestorHighlight(range.startContainer);
        if (ancestorMark && ancestorMark.dataset.word === word) {
          targetHighlight = ancestorMark;
        }

        if (targetHighlight && existingCount > 0) {
          // 重新高亮：增加计数
          const newCount = await this.highlightStorage.incrementMarkCount(word,

HighlightUtils.MAX_MARK_COUNT);
this.updateAllWordHighlights(word, newCount, baseColor, isDarkText);

          // 闪烁提示
          targetHighlight.classList.add("flash");
          setTimeout(() => targetHighlight?.classList.remove("flash"), 500);

          console.log(`[Lucid] Updated "${word}" highlights to count ${newCount}`);
          return;
        }

        // 新高亮
        const newCount = await this.highlightStorage.incrementMarkCount(word,

HighlightUtils.MAX_MARK_COUNT);
const { className: highlightClassName, hex } = HighlightUtils.calculateHighlight(baseColor,
newCount, isDarkText);

        // 创建高亮元素
        this.createHighlightInRange(range, word, newCount, highlightClassName, hex, baseColor);

        // 高亮页面上的其他相同词汇
        this.highlightWordInContainer(document.body, word, newCount, highlightClassName, hex, baseColor);

        // 清除选择
        window.getSelection()?.removeAllRanges();

      } catch (error) {
        console.error(`[Lucid] Error in applyWordHighlight for "${word}":`, error);
      }
    }

    /**
     * 切换单词高亮状态
     */
    async toggleWordHighlightState(
      word: string,
      isDarkText: boolean,
      context?: { range?: Range; sourceElement?: HTMLElement }
    ): Promise<void> {
      const cleanedWord = word.toLowerCase().trim();
      if (!cleanedWord) return;

      try {
        const currentCount = await this.highlightStorage.getMarkCount(cleanedWord);

        if (currentCount > 0) {
          // 移除高亮
          await this.removeWordHighlight(cleanedWord);
        } else {
          // 添加高亮
          if (context?.range) {
            await this.applyWordHighlight(context.range, isDarkText);
          } else if (context?.sourceElement) {
            await this.addWordHighlight(cleanedWord, context.sourceElement, isDarkText);
          } else {
            // 降级处理
            await this.addWordHighlight(cleanedWord, document.body, isDarkText);
          }
        }
      } catch (error) {
        console.error(`[Lucid] Error in toggleWordHighlightState for "${cleanedWord}":`, error);
      }
    }

    // 私有辅助方法...
    private createHighlightInRange(range: Range, word: string, count: number, className: string, hex:

string, baseColor: string): void {
try {
HighlightDOM.unwrapHighlightsInRange(range);

        const highlightElement = HighlightDOM.createHighlightElement(
          word, count, className, hex, baseColor,
          HighlightUtils.getEffectiveTextColor(range.startContainer)
        );

        range.surroundContents(highlightElement);
      } catch (e) {
        if (e instanceof DOMException && e.name === "InvalidStateError") {
          // 降级到容器高亮
          this.highlightWordInContainer(
            range.startContainer.parentElement || document.body,
            word, count, className, hex, baseColor
          );
        } else {
          throw e;
        }
      }
    }

    // 其他辅助方法...

}

🧹 阶段5：最终清理与优化 (1天)

任务5.1：更新调用点

// 文件：entrypoints/content.ts
import { HighlightController } from '@utils/highlight/HighlightController';

// 替换所有 highlightUtils 调用
const highlightController = HighlightController.getInstance();

async function handleSelectionAndHighlight() {
// ... 现有逻辑 ...

    // 原代码：
    // await applyWordHighlight(expandedRange, isDarkText);

    // 新代码：
    await highlightController.applyWordHighlight(expandedRange, isDarkText);

}

任务5.2：清理和导出

# 删除旧文件

rm src/utils/highlight/highlightUtils.ts
rm -rf src/utils/dom/legacy/

# 更新索引文件

# 文件：src/utils/highlight/index.ts

export { HighlightController } from './HighlightController';
export _ as HighlightUtils from './HighlightUtils';
export _ as HighlightDOM from './HighlightDOM';

# 文件：src/utils/index.ts

export \* from './highlight';

🔒 风险控制与验证

功能验证测试

// 文件：scripts/refactor/verify-refactor.test.ts
describe('Highlight Refactor Verification', () => {
test('服务层集成正常', async () => {
const controller = HighlightController.getInstance();
// 验证存储服务正常工作
});

    test('样式功能完整', () => {
      // 验证所有CSS样式都正确迁移
    });

    test('MutationObserver性能正常', () => {
      // 验证性能无显著回退
    });

});

实施检查清单

- 阶段0：基础修复完成，架构分裂问题解决
- 阶段1：纯函数提取，模块边界清晰
- 阶段2：服务层统一，存储逻辑一致
- 阶段3：样式归位，MutationObserver正常工作
- 阶段4：控制器整合，业务逻辑统一
- 阶段5：清理完成，旧代码移除

回滚策略

每个阶段都保留 git 分支，确保可以快速回滚到任何稳定状态。

这个详细计划解决了原方案的所有遗漏，确保重构过程安全、完整且可验证。关键改进包括：

1. 修复架构分裂：使用现有的 HighlightStorageService
2. 样式安全迁移：确保不丢失任何交互功能
3. 性能优化：MutationObserver 使用最佳实践
4. 渐进式重构：每个阶段都可独立验证

🎯 实施优先级

高优先级 (立即执行)

1. 服务层统一：修复架构分裂
2. 样式冲突解决：确保功能完整性

中优先级 (后续执行)

3. 模块解耦：MutationObserver 方案
4. 设计系统完善：颜色系统集成

低优先级 (最后优化)

5. 性能优化：事件监听优化
6. 代码结构：最终清理

💡 关键改进建议

1. 测试驱动重构：每个阶段都要有对应的测试验证
2. 渐进式迁移：避免大爆炸式重构，确保每步都是安全的
3. 性能监控：在关键路径添加性能监控点
4. 文档同步：及时更新架构文档和 API 文档
