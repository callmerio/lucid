/**
 * 扩展程序存储的类型定义
 */
export interface ExtensionStorage {
  settings?: {
    highlightBaseColor?: string; // 高亮基础颜色，例如 'orange', 'blue', 'green'
    // maxMarkCount?: number; // 未来可以定义最大标记次数
  };
  wordMarkings?: {
    [word: string]: number; // key 是小写单词，value 是标记次数
  };
}

/**
 * Finds the first occurrence of a word in the text nodes of a container element,
 * splits the text node around that word, and wraps the word in a <mark>.
 * Returns true if successful.
 */
function highlightWordInContainer(
  container: Element,
  word: string,
  count: number,
  highlightClassName: string,
  hex: string,
  baseColor: string
): boolean {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (!node.nodeValue) continue;
    const text = node.nodeValue;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(word.toLowerCase());
    if (idx === -1) continue;
    // Split into three parts
    const beforeText = text.slice(0, idx);
    const matchText = text.slice(idx, idx + word.length);
    const afterText = text.slice(idx + word.length);
    const parent = node.parentNode;
    if (!parent) return false;
    const beforeNode = document.createTextNode(beforeText);
    const matchNode = document.createElement('mark');
    matchNode.classList.add('lucid-highlight', highlightClassName);
    matchNode.dataset.word = word;
    matchNode.dataset.markCount = count.toString();
    matchNode.dataset.baseColor = baseColor;
    matchNode.dataset.appliedTimestamp = Date.now().toString();
    matchNode.textContent = matchText;
    // Apply text-gradient colour
    const gradient = `linear-gradient(to right, ${hex} 0%, ${hex} 60%, ${COLOR_PALETTE[baseColor]?.[500] ?? COLOR_PALETTE.orange[500]} 100%)`;
    matchNode.style.background = gradient;
    matchNode.style.webkitBackgroundClip = 'text';
    matchNode.style.backgroundClip = 'text';
    matchNode.style.color = 'transparent';
    const afterNode = document.createTextNode(afterText);
    parent.insertBefore(beforeNode, node);
    parent.insertBefore(matchNode, node);
    parent.insertBefore(afterNode, node);
    parent.removeChild(node);
    return true;
  }
  return false;
}

// 一个 shade 等级对应 3 次标记，因此允许到 5 * 3 = 15 次
const MAX_MARK_COUNT = 12;
const DEFAULT_BASE_COLOR = 'orange'; // 默认高亮基础颜色

// Pre‑computed shade mappings and palettes to avoid re‑creating them on every call
const DARK_SHADES: Record<number, number> = { 1: 700, 2: 600, 3: 500, 4: 400 };
const LIGHT_SHADES: Record<number, number> = { 1: 300, 2: 400, 3: 500, 4: 600 };

const COLOR_PALETTE: Record<string, Record<number, string>> = {
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
    500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
    500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16',
  },
} as const;

/**
 * 负责把一次性的全局样式插入到 <head> 或 ShadowRoot。
 */
const StyleManager = {
  STYLE_ID: 'lucid-highlight-styles',
  HIGHLIGHT_STYLES: `
.lucid-highlight { transition: color 500ms ease-in-out; }
/* background intentionally left to inline style */

.lucid-highlight.flash {
  animation: lucid-flash 200ms ease-in-out;
}

@keyframes lucid-flash {
  0%,100% { color:inherit!important; }
  50%     { background-color:currentColor!important; color:#ffffff!important; }
}
  `,
  ensureStyles(root: Node): void {
    // 仅在 Document 或 ShadowRoot 上注入
    if (!(root === document || root instanceof ShadowRoot)) return;

    // 使用类型断言确保类型安全
    const container = root === document ? document : root as ShadowRoot;

    // 检查是否已经注入过样式
    const existingStyle = container.querySelector(`#${this.STYLE_ID}`);
    if (existingStyle) return;

    const styleEl = document.createElement('style');
    styleEl.id = this.STYLE_ID;
    styleEl.textContent = this.HIGHLIGHT_STYLES.trim();

    // 将样式添加到文档的头部或Shadow DOM中
    if (root === document) {
      document.head.appendChild(styleEl);
    } else {
      (root as ShadowRoot).prepend(styleEl);
    }
  },
};

/**
 * 根据查询次数 & 主题计算文字颜色。
 * 返回：
 *   - className：仍保留 Tailwind 风格，方便 DevTools 查看；
 *   - hex      ：真实颜色值，用于行内 style，保证目标页未引入 Tailwind 也能生效。
 */
export function calculateHighlight(
  baseColor: string,
  queryCount: number,
  isDarkText: boolean,
): { className: string; hex: string } {
  // 1‒3 次 = level 1, 4‒6 次 = level 2, …，最多 level 5
  const level = Math.min(5, Math.ceil(queryCount / 3));

  const shade = isDarkText ? DARK_SHADES[level] : LIGHT_SHADES[level];

  const className = `text-${baseColor}-${shade}`;

  const hex = COLOR_PALETTE[baseColor]?.[shade] ?? COLOR_PALETTE.orange[shade];
  return { className, hex };
}

/**
 * 若给定节点处于 <mark.lucid-highlight> 内，返回该高亮元素，否则返回 null
 */
function getAncestorHighlight(node: Node | null): HTMLElement | null {
  while (node && node !== document) {
    if (node instanceof HTMLElement && node.classList.contains('lucid-highlight')) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

/** 删除文档中 textContent 为空的高亮元素（防止嵌套操作留下空壳） */
function removeEmptyHighlights() {
  document.querySelectorAll<HTMLElement>('.lucid-highlight').forEach(el => {
    if (!el.textContent?.trim()) el.remove();
  });
}

/** 把单个 <mark.lucid-highlight> 展开成纯文本内容 */
function unwrapHighlight(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

/** 在给定 Range 内部移除所有已有高亮，避免再次 wrap 产生嵌套 */
function unwrapHighlightsInRange(rng: Range) {
  const walker = document.createTreeWalker(
    rng.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: node =>
        node instanceof HTMLElement &&
          node.classList.contains('lucid-highlight') &&
          rng.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    },
  );

  const toUnwrap: HTMLElement[] = [];
  while (walker.nextNode()) toUnwrap.push(walker.currentNode as HTMLElement);
  toUnwrap.forEach(unwrapHighlight);
}

/**
 * 应用高亮到指定的 Range 对象
 * @param range 扩展后的选区 Range 对象
 * @param isDarkText 当前是否为暗黑模式
 */
export async function applyWordHighlight(range: Range, isDarkText: boolean): Promise<void> {
  // 确保 flash 动效等全局样式已注入
  StyleManager.ensureStyles(document);

  // 如果选区已处于现有高亮内部 → 仅更新计数与颜色，避免再包一层
  const ancestorMark = getAncestorHighlight(range.startContainer);
  if (ancestorMark && ancestorMark.dataset.word === range.toString().trim().toLowerCase()) {
    // bump count
    const prev = Number(ancestorMark.dataset.markCount ?? 0);
    const newCount = Math.min(prev + 1, MAX_MARK_COUNT);
    ancestorMark.dataset.markCount = newCount.toString();

    // 更新颜色
    const { hex } = calculateHighlight(
      ancestorMark.dataset.baseColor || DEFAULT_BASE_COLOR,
      newCount,
      isDarkText,
    );
    // Text gradient: from the current shade (hex) → baseColor-500
    const baseColor = ancestorMark.dataset.baseColor || DEFAULT_BASE_COLOR;
    const refreshGradient = `linear-gradient(to right, ${hex} 0%, ${hex} 60%, ${COLOR_PALETTE[baseColor]?.[500] ?? COLOR_PALETTE.orange[500]} 100%)`;
    ancestorMark.style.background = refreshGradient;
    ancestorMark.style.webkitBackgroundClip = 'text';
    ancestorMark.style.backgroundClip = 'text';
    ancestorMark.style.color = 'transparent';

    // 闪烁提示
    ancestorMark.classList.add('flash');
    setTimeout(() => ancestorMark.classList.remove('flash'), 500);
    return;
  }

  if (!range || range.collapsed) {
    console.warn('[Lucid] applyWordHighlight: Range is null or collapsed. Skipping.');
    return;
  }

  // Use original user selection for word matching to avoid expansions pulling in page-inserted text
  const rawSelection = window.getSelection()?.toString().trim() || '';
  const word = rawSelection.toLowerCase();
  if (!word) {
    console.warn('[Lucid] applyWordHighlight: Word is empty. Skipping.');
    return;
  }

  try {
    const data: ExtensionStorage = (await browser.storage.local.get(['settings', 'wordMarkings'])) as ExtensionStorage;
    const settings = data.settings || {};
    const wordMarkings = data.wordMarkings || {};

    const baseColor = settings.highlightBaseColor || DEFAULT_BASE_COLOR;
    let currentMarkCount = wordMarkings[word] || 0;
    currentMarkCount = Math.min(currentMarkCount + 1, MAX_MARK_COUNT); // 增加标记次数，但不超过上限

    wordMarkings[word] = currentMarkCount;
    await browser.storage.local.set({ wordMarkings });

    const { className: highlightClassName, hex } = calculateHighlight(baseColor, currentMarkCount, isDarkText);

    // 先展开选区内已有的高亮，避免嵌套
    unwrapHighlightsInRange(range);

    // 使用 surroundContents 包裹选区
    // 注意: surroundContents 对跨多个块级元素或复杂结构的选区可能失败
    try {
      // Smooth highlight: animate text color via transition.
      const highlightElement = document.createElement('mark');
      highlightElement.classList.add('lucid-highlight');
      // Apply the Tailwind‑style class so DevTools shows the exact shade
      highlightElement.classList.add(highlightClassName);
      // preserve data attributes but DO NOT set color or highlightClassName yet
      if (hex) highlightElement.dataset.baseColor = baseColor;
      highlightElement.dataset.word = word;
      highlightElement.dataset.markCount = currentMarkCount.toString();
      highlightElement.dataset.appliedTimestamp = Date.now().toString();

      // Text gradient: from the current shade (hex) → baseColor-500
      const startHex = hex;
      const endHex = COLOR_PALETTE[baseColor]?.[500] ?? COLOR_PALETTE.orange[500];
      const gradient = `linear-gradient(to right, ${startHex} 0%, ${startHex} 40%, ${endHex} 100%)`;
      highlightElement.style.background = gradient;
      highlightElement.style.webkitBackgroundClip = 'text';
      highlightElement.style.backgroundClip = 'text';
      highlightElement.style.color = 'transparent';

      const newHighlight = highlightElement.cloneNode(false) as HTMLElement;
      range.surroundContents(newHighlight);
      console.log(`[Lucid] Word "${word}" highlighted with smooth transition to color ${hex}`);

      // No need for delayed color transition; text color is now handled by gradient background-clip.
      // Optionally, could still trigger a transition if desired.
      // Immediately set the same gradient on newHighlight as well:
      newHighlight.style.background = gradient;
      newHighlight.style.webkitBackgroundClip = 'text';
      newHighlight.style.backgroundClip = 'text';
      newHighlight.style.color = 'transparent';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'InvalidStateError') {
        console.warn(`[Lucid] surroundContents failed for word "${word}", using container-based fallback`);
        // Use tree-walker based highlight within the smallest block container
        const containerEl = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer as Element
          : (range.commonAncestorContainer.parentElement as Element);
        if (containerEl && highlightWordInContainer(containerEl, word, currentMarkCount, highlightClassName, hex, baseColor)) {
          console.log(`[Lucid] Word "${word}" highlighted via container-based fallback`);
          return;
        }
        // If even this fails, log and exit without throwing
        console.error(`[Lucid] Container-based fallback failed for word "${word}"`);
        return;
      } else {
        // If it's not an InvalidStateError, or some other error, re-throw it.
        console.error(`[Lucid] Error during surroundContents (not InvalidStateError) for word "${word}":`, e);
        throw e;
      }
    }

    // 移除 flash 类，避免反复触发动画
    setTimeout(() => {
      document.querySelectorAll('.lucid-highlight.flash').forEach(el => el.classList.remove('flash'));
    }, 500);

    // 清除空壳高亮（例如嵌套操作后遗留）
    removeEmptyHighlights();

    // 清除浏览器自身的选择，让自定义高亮成为唯一视觉反馈
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  } catch (error) {
    console.error('[Lucid] General error in applyWordHighlight for word "' + word + '":', error);
    // Handle other potential errors from storage access, etc.
  }
}

/**
 * Helper function to wrap all non-empty text nodes within a DocumentFragment with a clone of a prototype element.
 * @param fragment The DocumentFragment containing nodes to process.
 * @param highlightPrototype The HTMLElement to clone for wrapping text nodes.
 */
function wrapTextNodesInFragment(fragment: DocumentFragment, highlightPrototype: HTMLElement) {
  const treeWalker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  // First, collect all text nodes to avoid issues with modifying the fragment while iterating
  while (treeWalker.nextNode()) {
    const currentNode = treeWalker.currentNode as Text;
    // Only consider text nodes with actual content
    if (currentNode.nodeValue && currentNode.nodeValue.trim() !== '') {
      textNodes.push(currentNode);
    }
  }

  textNodes.forEach(textNode => {
    // Ensure the textNode still has a parent in the fragment (it should)
    if (textNode.parentNode) {
      const highlightSpan = highlightPrototype.cloneNode(false) as HTMLElement; // Create a new mark for each text part

      // Important: The textNode itself is moved into the highlightSpan.
      // No need to clone textNode here as it's already extracted from the main DOM.
      highlightSpan.appendChild(textNode.cloneNode(false)); // Append a clone of the text content

      // Replace the original text node with the new highlightSpan containing the text
      textNode.parentNode.replaceChild(highlightSpan, textNode);
    }
  });
}
