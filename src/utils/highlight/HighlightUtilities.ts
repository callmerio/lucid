/**
 * HighlightUtilities.ts - Pure utility functions for highlight calculations and color management
 * 
 * This module contains all pure utility functions that don't depend on DOM:
 * - Color calculations and mixing
 * - Text boundary detection
 * - Gradient generation
 * - Highlight color computation
 */

// 一个 shade 等级对应 3 次标记，因此允许到 5 * 3 = 15 次
export const MAX_MARK_COUNT = 10;
export const LEVEL_STEP = 2;
export const DEFAULT_BASE_COLOR = "orange"; // 默认高亮基础颜色

// Pre‑computed shade mappings and palettes to avoid re‑creating them on every call
export const DARK_SHADES: Record<number, number> = { 1: 700, 2: 600, 3: 500, 4: 400, 5: 300 };
export const LIGHT_SHADES: Record<number, number> = { 1: 400, 2: 500, 3: 600, 4: 700, 5: 800 };

export const COLOR_PALETTE: Record<string, Record<number, string>> = {
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#C10007",
    900: "#7c2d12",
    950: "#431407",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
} as const;

/**
 * 构造"由左向右"的文本渐变字符串。
 *
 * @param primaryHex 首颜色的十六进制值
 * @param baseColor  调色盘基色，用于取得 500 阶的终止色
 * @param split      主色在渐变中的占比百分比 (0‑100)，默认 60
 * @returns   可直接赋给 `style.background` 的 `linear-gradient(...)` 字符串
 */
export const GRADIENT_SPLIT = 60; // percentage where the gradient switches colour
export const BLEND_WEIGHT = 0.7; // 9 : 1 blend with original text colour

export function mixHexColors(hexA: string, hexB: string, weight = 0.5): string {
  const a = parseInt(hexA.replace("#", ""), 16);
  const b = parseInt(hexB.replace("#", ""), 16);
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar * weight + br * (1 - weight));
  const g = Math.round(ag * weight + bg * (1 - weight));
  const bl = Math.round(ab * weight + bb * (1 - weight));
  return "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function getEffectiveTextColor(node: Node | null): string {
  let cur: Node | null =
    node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (cur && cur !== document) {
    if (cur instanceof HTMLElement) {
      const col = window.getComputedStyle(cur).color;
      if (col && col !== "transparent" && !col.startsWith("rgba(0, 0, 0, 0")) {
        const m = col.match(/\d+/g);
        if (m && m.length >= 3) {
          const [r, g, b] = m.map(Number);
          return (
            "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
          );
        }
      }
    }
    cur = cur?.parentNode || null;
  }
  const [r, g, b] = (
    window.getComputedStyle(document.body).color.match(/\d+/g) || [
      "0",
      "0",
      "0",
    ]
  ).map(Number);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function buildTextGradient(
  primaryHex: string,
  baseColor: string,
  originHex: string,
): string {
  const endHex = COLOR_PALETTE[baseColor]?.[500] ?? COLOR_PALETTE.orange[500];
  const fromMix = mixHexColors(primaryHex, originHex, BLEND_WEIGHT);
  const toMix = mixHexColors(endHex, originHex, BLEND_WEIGHT);
  return `linear-gradient(to right, ${fromMix} 0%, ${fromMix} ${GRADIENT_SPLIT}%, ${toMix} 100%)`;
}

/**
 * 根据标记次数与主题色计算应使用的色阶。
 *
 * @param baseColor   高亮基色，例如 'orange'
 * @param queryCount  当前单词的累计标记次数
 * @param isDarkText  文本是否处于深色背景（影响取深/浅色阶）
 * @returns  结果对象：
 *  - `className`：Tailwind 风格类名，便于调试
 *  - `hex`      ：实际用于行内样式的十六进制颜色
 */
export function calculateHighlight(
  baseColor: string,
  queryCount: number,
  isDarkText: boolean,
): { className: string; hex: string } {
  // 1-3 次 = level 1, 4-6 次 = level 2, 最多 level 5
  const level = Math.min(5, Math.ceil(queryCount / LEVEL_STEP));

  const shade = isDarkText ? DARK_SHADES[level] : LIGHT_SHADES[level];

  const className = `text-${baseColor}-${shade}`;

  const hex = COLOR_PALETTE[baseColor]?.[shade] ?? COLOR_PALETTE.orange[shade];
  return { className, hex };
}

// ---------- utility helpers (extracted for clarity) ----------
export const isBoundaryChar = (ch: string) => !/[a-z0-9]/i.test(ch);

/**
 * Check if the substring starting at `idx` is surrounded by word‑boundaries.
 */
export function hasWordBoundary(lower: string, idx: number, wordLen: number): boolean {
  const before = idx === 0 ? "" : lower[idx - 1];
  const after = idx + wordLen >= lower.length ? "" : lower[idx + wordLen];
  const boundaryBefore = before === "" || isBoundaryChar(before);
  const boundaryAfter = after === "" || isBoundaryChar(after);
  return boundaryBefore && boundaryAfter;
}