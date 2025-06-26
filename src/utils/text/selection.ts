/**
 * selectionUtils.ts
 * Utilities for expanding a DOM Range selection to a full word boundary,
 * including special handling for hyphens, apostrophes, numbers with units, and plain words.
 */

// 正则定义
/** 单词边界：空格、标点、分隔符、尖括号 */
const WORD_BOUNDARY_REGEX = /[\s\p{P}\p{Z}<>]/u;
/** 连字符单词（state-of-the-art） */
const HYPHENATED_WORD_REGEX = /\b[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+\b/u;
/** 带撇号单词（can't, it's） */
const APOSTROPHE_WORD_REGEX = /\b\p{L}+'\p{L}+\b/u;
/** 数字+单位（100kg, 50%） */
const NUMBER_WITH_UNITS_REGEX = /\b\d+[\p{L}\p{N}%]+\b/u;
/** 普通单词（extension, that） */
const PLAIN_WORD_REGEX = /\b[\p{L}\p{N}]+\b/u;

/** 按优先级排列的特殊模式合集 */
const SPECIAL_PATTERNS_TO_KEEP_TOGETHER = [
  HYPHENATED_WORD_REGEX,
  APOSTROPHE_WORD_REGEX,
  NUMBER_WITH_UNITS_REGEX,
  PLAIN_WORD_REGEX,
];

// 文本节点辅助函数
function findLastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const found = findLastTextNode(node.childNodes[i]);
    if (found) {
      return found;
    }
  }
  return null;
}

function findFirstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    const found = findFirstTextNode(node.childNodes[i]);
    if (found) {
      return found;
    }
  }
  return null;
}

function getPreviousTextNode(node: Node): Text | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur.previousSibling) {
      cur = cur.previousSibling;
      const last = findLastTextNode(cur);
      if (last) {
        return last;
      }
    } else {
      cur = cur.parentNode;
      if (
        !cur ||
        cur.nodeType === Node.DOCUMENT_NODE ||
        cur.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        return null;
      }
    }
  }
  return null;
}

function getNextTextNode(node: Node): Text | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur.nextSibling) {
      cur = cur.nextSibling;
      const first = findFirstTextNode(cur);
      if (first) {
        return first;
      }
    } else {
      cur = cur.parentNode;
      if (
        !cur ||
        cur.nodeType === Node.DOCUMENT_NODE ||
        cur.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        return null;
      }
    }
  }
  return null;
}

// 上下文收集
interface ContextResult {
  text: string;
  startNode: Text;
  startOffset: number;
  endNode: Text;
  endOffset: number;
  focusPositionInContext: number;
}
function getContextualText(
  focusNode: Text,
  focusOffset: number,
  maxLength: number = 100,
): ContextResult {
  let textBefore = "";
  let textAfter = "";
  let startNodeRef: Text = focusNode;
  let startOffsetRef = focusOffset;
  let endNodeRef: Text = focusNode;
  let endOffsetRef = focusOffset;

  // 收集前文
  let needBefore = Math.floor(maxLength / 2);
  const beforeText = focusNode.textContent?.slice(0, focusOffset) ?? "";
  if (beforeText.length >= needBefore) {
    textBefore = beforeText.slice(-needBefore);
    startOffsetRef = focusOffset - textBefore.length;
    needBefore = 0;
  } else {
    textBefore = beforeText;
    startOffsetRef = 0;
    needBefore -= textBefore.length;
  }
  let prev = getPreviousTextNode(focusNode);
  while (prev && needBefore > 0) {
    const content = prev.textContent ?? "";
    if (content.length > needBefore) {
      textBefore = content.slice(-needBefore) + textBefore;
      startNodeRef = prev;
      startOffsetRef = content.length - needBefore;
      needBefore = 0;
    } else {
      textBefore = content + textBefore;
      startNodeRef = prev;
      startOffsetRef = 0;
      needBefore -= content.length;
      prev = getPreviousTextNode(prev);
    }
  }

  // 收集后文
  let needAfter = Math.ceil(maxLength / 2);
  const afterText = focusNode.textContent?.slice(focusOffset) ?? "";
  if (afterText.length >= needAfter) {
    textAfter = afterText.slice(0, needAfter);
    endOffsetRef = focusOffset + textAfter.length;
    needAfter = 0;
  } else {
    textAfter = afterText;
    endOffsetRef = focusOffset + textAfter.length;
    needAfter -= afterText.length;
  }
  let nxt = getNextTextNode(focusNode);
  while (nxt && needAfter > 0) {
    const content = nxt.textContent ?? "";
    if (content.length > needAfter) {
      textAfter += content.slice(0, needAfter);
      endNodeRef = nxt;
      endOffsetRef = needAfter;
      needAfter = 0;
    } else {
      textAfter += content;
      endNodeRef = nxt;
      endOffsetRef = content.length;
      needAfter -= content.length;
      nxt = getNextTextNode(nxt);
    }
  }

  return {
    text: textBefore + textAfter,
    startNode: startNodeRef,
    startOffset: startOffsetRef,
    endNode: endNodeRef,
    endOffset: endOffsetRef,
    focusPositionInContext: textBefore.length,
  };
}

// 索引映射至 DOM
interface DomPosition {
  node: Node;
  offset: number;
}
function mapContextIndexToDomPosition(
  target: number,
  context: string,
  firstNode: Text,
  firstOffset: number,
): DomPosition | null {
  if (target < 0 || target > context.length) {
    return null;
  }
  let traversed = 0;
  let cur: Node | null = firstNode;
  let offsetInNode = firstOffset;
  while (cur) {
    if (cur.nodeType === Node.TEXT_NODE) {
      const txt = cur.textContent ?? "";
      const avail = txt.length - offsetInNode;
      if (traversed + avail >= target) {
        return { node: cur, offset: offsetInNode + (target - traversed) };
      }
      traversed += avail;
    }
    cur = getNextTextNode(cur);
    offsetInNode = 0;
  }
  return null;
}

/**
 * 将传入 Range 扩展到完整单词边界
 */
export function expandSelectionToFullWord(range: Range): Range {
  const newRange = range.cloneRange();
  let startNode: Node | null = range.startContainer;
  let startOffset = range.startOffset;
  let endNode: Node | null = range.endContainer;
  let endOffset = range.endOffset;

  // 跳过起始的边界字符
  if (startNode?.nodeType === Node.TEXT_NODE) {
    const txt = (startNode as Text).textContent ?? "";
    while (
      startOffset < txt.length &&
      WORD_BOUNDARY_REGEX.test(txt[startOffset])
    ) {
      startOffset++;
    }
  }

  const MAX_HOPS = 500;
  let hops = 0;

  // 向左扩展
  let searchingStart = true;
  while (searchingStart && startNode && hops++ < MAX_HOPS) {
    if (startNode.nodeType === Node.TEXT_NODE) {
      const textNode = startNode as Text;
      const content = textNode.textContent ?? "";
      const context = getContextualText(textNode, startOffset);
      let matched = false;
      for (const pattern of SPECIAL_PATTERNS_TO_KEEP_TOGETHER) {
        const reg = new RegExp(pattern.source, "gu");
        for (const m of context.text.matchAll(reg)) {
          const s = m.index!;
          const e = s + m[0].length;
          if (
            s <= context.focusPositionInContext &&
            e >= context.focusPositionInContext
          ) {
            const dom = mapContextIndexToDomPosition(
              s,
              context.text,
              context.startNode,
              context.startOffset,
            );
            if (dom) {
              startNode = dom.node;
              startOffset = dom.offset;
              searchingStart = false; // stop once we've reached the word boundary
              matched = true;
            }
            break;
          }
        }
        if (matched) {
          break;
        }
      }
      if (!matched) {
        if (startOffset === 0) {
          const prevNode = getPreviousTextNode(textNode);
          if (prevNode) {
            startNode = prevNode;
            startOffset = prevNode.textContent!.length;
          } else {
            searchingStart = false;
          }
        } else {
          let i = startOffset - 1;
          while (i >= 0 && !WORD_BOUNDARY_REGEX.test(content[i])) {
            i--;
          }
          if (i >= 0) {
            startOffset = i + 1;
            searchingStart = false;
          } else {
            startOffset = 0;
            const prevNode = getPreviousTextNode(textNode);
            if (prevNode) {
              startNode = prevNode;
              startOffset = prevNode.textContent!.length;
            } else {
              searchingStart = false;
            }
          }
        }
      }
    } else {
      const prevNode = getPreviousTextNode(startNode);
      if (prevNode) {
        startNode = prevNode;
        startOffset = prevNode.textContent!.length;
      } else {
        searchingStart = false;
      }
    }
    // removed no-progress abort logic for left expansion
  }
  if (hops >= MAX_HOPS) {
    console.warn("abort left expansion");
  }

  // 修剪尾部边界
  if (endNode?.nodeType === Node.TEXT_NODE) {
    const endTxt = (endNode as Text).textContent ?? "";
    while (endOffset > 0 && WORD_BOUNDARY_REGEX.test(endTxt[endOffset - 1])) {
      endOffset--;
    }
  }

  // 向右扩展
  hops = 0;
  let searchingEnd = true;
  while (searchingEnd && endNode && hops++ < MAX_HOPS) {
    if (endNode.nodeType === Node.TEXT_NODE) {
      const textNode = endNode as Text;
      const content = textNode.textContent ?? "";
      const context = getContextualText(textNode, endOffset);
      let matched = false;
      for (const pattern of SPECIAL_PATTERNS_TO_KEEP_TOGETHER) {
        const reg = new RegExp(pattern.source, "gu");
        for (const m of context.text.matchAll(reg)) {
          const s = m.index!;
          const e = s + m[0].length;
          if (
            s <= context.focusPositionInContext &&
            e >= context.focusPositionInContext
          ) {
            const dom = mapContextIndexToDomPosition(
              e,
              context.text,
              context.startNode,
              context.startOffset,
            );
            if (dom) {
              endNode = dom.node;
              endOffset = dom.offset;
              searchingEnd = false; // stop once we've reached the word boundary
              matched = true;
            }
            break;
          }
        }
        if (matched) {
          break;
        }
      }
      if (!matched) {
        let i = endOffset;
        while (i < content.length && !WORD_BOUNDARY_REGEX.test(content[i])) {
          i++;
        }
        if (i < content.length) {
          endOffset = i;
          searchingEnd = false;
        } else {
          endOffset = content.length;
          const nextNode = getNextTextNode(textNode);
          if (nextNode) {
            endNode = nextNode;
            endOffset = 0;
          } else {
            searchingEnd = false;
          }
        }
      }
    } else {
      const nextNode = getNextTextNode(endNode);
      if (nextNode) {
        endNode = nextNode;
        endOffset = 0;
      } else {
        searchingEnd = false;
      }
    }
    // removed no-progress abort logic for right expansion
  }
  if (hops >= MAX_HOPS) {
    console.warn("abort right expansion");
  }

  newRange.setStart(startNode, startOffset);
  newRange.setEnd(endNode, endOffset);
  return newRange;
}
