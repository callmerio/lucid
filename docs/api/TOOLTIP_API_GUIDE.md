# Tooltip API 使用指南

**版本**: v1.0  
**更新时间**: 2025-01-27

## 📖 概述

本文档详细介绍 Lucid 浏览器扩展 Tooltip 系统的 API 接口，包括所有公共方法、配置选项和使用示例。

## 🎯 TooltipManager API

### 获取实例

```typescript
import { TooltipManager } from '@utils/dom/managers/TooltipManager';

// 获取单例实例
const tooltipManager = TooltipManager.getInstance();
```

### 显示 Tooltip

#### `showTooltip(options: ShowTooltipOptions): Promise<void>`

显示一个 Tooltip，支持丰富的配置选项。

**参数**:
```typescript
interface ShowTooltipOptions {
  word: string;                    // 必需：要显示的单词
  translation: string;             // 必需：翻译内容
  targetElement: HTMLElement;      // 必需：目标元素
  phonetic?: string;              // 可选：音标
  partOfSpeech?: string;          // 可选：词性
  preferredPosition?: Position;    // 可选：首选位置
  offset?: number;                // 可选：偏移量
  examples?: string[];            // 可选：例句
  synonyms?: string[];            // 可选：同义词
  antonyms?: string[];            // 可选：反义词
}

type Position = 'top' | 'bottom' | 'left' | 'right';
```

**示例**:
```typescript
// 基本使用
await tooltipManager.showTooltip({
  word: 'hello',
  translation: '你好',
  targetElement: document.getElementById('word-element')
});

// 完整配置
await tooltipManager.showTooltip({
  word: 'beautiful',
  translation: '美丽的，漂亮的',
  phonetic: '/ˈbjuːtɪfl/',
  partOfSpeech: 'adjective',
  targetElement: element,
  preferredPosition: 'top',
  offset: 12,
  examples: [
    'She is a beautiful woman.',
    'What a beautiful day!'
  ],
  synonyms: ['pretty', 'lovely', 'gorgeous'],
  antonyms: ['ugly', 'hideous']
});
```

### 隐藏 Tooltip

#### `hideTooltip(immediate?: boolean): void`

隐藏当前显示的 Tooltip。

**参数**:
- `immediate` (可选): 是否立即隐藏，默认为 false（延迟隐藏）

**示例**:
```typescript
// 延迟隐藏（默认）
tooltipManager.hideTooltip();

// 立即隐藏
tooltipManager.hideTooltip(true);
```

### 展开和收起

#### `expandTooltip(): void`

展开 Tooltip 显示更多内容。

```typescript
tooltipManager.expandTooltip();
```

#### `collapseTooltip(): void`

收起 Tooltip 到简洁模式。

```typescript
tooltipManager.collapseTooltip();
```

#### `toggleExpanded(): void`

切换 Tooltip 的展开状态。

```typescript
tooltipManager.toggleExpanded();
```

### 状态查询

#### `isVisible(): boolean`

检查 Tooltip 是否可见。

```typescript
if (tooltipManager.isVisible()) {
  console.log('Tooltip 当前可见');
}
```

#### `isExpanded(): boolean`

检查 Tooltip 是否处于展开状态。

```typescript
if (tooltipManager.isExpanded()) {
  console.log('Tooltip 已展开');
}
```

#### `getCurrentWord(): string`

获取当前显示的单词。

```typescript
const currentWord = tooltipManager.getCurrentWord();
console.log('当前单词:', currentWord);
```

#### `getCurrentTargetElement(): HTMLElement | null`

获取当前的目标元素。

```typescript
const targetElement = tooltipManager.getCurrentTargetElement();
if (targetElement) {
  console.log('目标元素:', targetElement);
}
```

### 事件处理

#### `handleMouseEnter(element: HTMLElement): void`

处理鼠标进入事件。

```typescript
element.addEventListener('mouseenter', () => {
  tooltipManager.handleMouseEnter(element);
});
```

#### `handleMouseLeave(element: HTMLElement): void`

处理鼠标离开事件。

```typescript
element.addEventListener('mouseleave', () => {
  tooltipManager.handleMouseLeave(element);
});
```

#### `handleKeyboardEvent(event: KeyboardEvent): void`

处理键盘事件。

```typescript
document.addEventListener('keydown', (event) => {
  tooltipManager.handleKeyboardEvent(event);
});
```

**支持的键盘快捷键**:
- `Escape`: 隐藏 Tooltip
- `Enter`: 展开/收起 Tooltip
- `Space`: 展开/收起 Tooltip

### 生命周期管理

#### `destroy(): void`

销毁管理器并清理所有资源。

```typescript
// 在组件卸载时调用
tooltipManager.destroy();
```

## 🔧 配置选项

### TooltipManagerOptions

```typescript
interface TooltipManagerOptions {
  hideDelay?: number;              // 隐藏延迟（毫秒）
  showDelay?: number;              // 显示延迟（毫秒）
  defaultPosition?: Position;      // 默认位置
  defaultOffset?: number;          // 默认偏移量
  enableKeyboard?: boolean;        // 启用键盘快捷键
  enableMouse?: boolean;           // 启用鼠标事件
  maxWidth?: number;               // 最大宽度
  maxHeight?: number;              // 最大高度
  zIndex?: number;                 // z-index 值
  className?: string;              // 自定义 CSS 类名
  theme?: 'light' | 'dark' | 'auto'; // 主题
}
```

### 默认配置

```typescript
const defaultOptions: TooltipManagerOptions = {
  hideDelay: 300,
  showDelay: 0,
  defaultPosition: 'top',
  defaultOffset: 8,
  enableKeyboard: true,
  enableMouse: true,
  maxWidth: 300,
  maxHeight: 200,
  zIndex: 10000,
  theme: 'auto'
};
```

## 📊 状态管理 API

### 状态监听

#### `addStateChangeListener(listener: StateChangeListener): void`

添加状态变化监听器。

```typescript
type StateChangeListener = (event: StateChangeEvent) => void;

interface StateChangeEvent {
  type: 'show' | 'hide' | 'expand' | 'collapse';
  state: TooltipState;
  previousState: TooltipState;
  timestamp: number;
}

// 添加监听器
tooltipManager.addStateChangeListener((event) => {
  console.log('状态变化:', event.type);
  console.log('当前状态:', event.state);
  console.log('之前状态:', event.previousState);
});
```

#### `removeStateChangeListener(listener: StateChangeListener): void`

移除状态变化监听器。

```typescript
const listener = (event) => { /* ... */ };

// 添加监听器
tooltipManager.addStateChangeListener(listener);

// 移除监听器
tooltipManager.removeStateChangeListener(listener);
```

### 状态查询

#### `getState(): TooltipState`

获取当前完整状态。

```typescript
interface TooltipState {
  visible: boolean;
  expanded: boolean;
  word: string;
  targetElement: HTMLElement | null;
  hideTimeout: NodeJS.Timeout | null;
}

const state = tooltipManager.getState();
console.log('完整状态:', state);
```

## 🎨 渲染 API

### 自定义渲染选项

```typescript
interface TooltipRenderOptions {
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  position: { x: number; y: number };
  expanded?: boolean;
  theme?: string;
  className?: string;
}
```

### 渲染器配置

```typescript
interface RendererConfig {
  containerSelector?: string;       // 容器选择器
  componentProps?: Record<string, any>; // React 组件属性
  styleOverrides?: CSSStyleDeclaration; // 样式覆盖
  animationDuration?: number;       // 动画持续时间
  enableAnimation?: boolean;        // 启用动画
}
```

## 📍 位置计算 API

### 位置选项

```typescript
interface PositionOptions {
  targetElement: HTMLElement;      // 目标元素
  tooltipElement: HTMLElement;     // Tooltip 元素
  preferredPosition?: Position;    // 首选位置
  offset?: number;                 // 偏移量
  viewport?: {                     // 视口信息
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  constraints?: {                  // 约束条件
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}
```

### 位置计算结果

```typescript
interface CalculatedPosition {
  x: number;                       // X 坐标
  y: number;                       // Y 坐标
  actualPosition: Position;        // 实际使用的位置
  adjustments: {                   // 调整信息
    flippedHorizontal: boolean;
    flippedVertical: boolean;
    constrainedX: boolean;
    constrainedY: boolean;
  };
}
```

## 🎪 事件系统 API

### 事件类型

```typescript
// 内置事件类型
type TooltipEventType = 
  | 'tooltip:show'
  | 'tooltip:hide'
  | 'tooltip:expand'
  | 'tooltip:collapse'
  | 'tooltip:position-change'
  | 'tooltip:error';

// 事件数据
interface TooltipEventData {
  type: TooltipEventType;
  payload: any;
  timestamp: number;
  source: string;
}
```

### 事件监听

```typescript
// 监听特定事件
tooltipManager.addEventListener('tooltip:show', (data) => {
  console.log('Tooltip 显示:', data.payload);
});

// 监听所有事件
tooltipManager.addEventListener('*', (data) => {
  console.log('事件触发:', data.type, data.payload);
});
```

## 🔍 调试和监控 API

### 统计信息

#### `getStats(): ManagerStats`

获取管理器统计信息。

```typescript
interface ManagerStats {
  instanceId: string;
  createdAt: number;
  totalShows: number;
  totalHides: number;
  totalExpands: number;
  totalCollapses: number;
  averageShowTime: number;
  currentState: TooltipState;
  memoryUsage: {
    listeners: number;
    timers: number;
    elements: number;
  };
}

const stats = tooltipManager.getStats();
console.log('管理器统计:', stats);
```

### 性能监控

#### `enablePerformanceMonitoring(enabled: boolean): void`

启用或禁用性能监控。

```typescript
// 启用性能监控
tooltipManager.enablePerformanceMonitoring(true);

// 获取性能数据
const perfData = tooltipManager.getPerformanceData();
console.log('性能数据:', perfData);
```

### 调试模式

#### `setDebugMode(enabled: boolean): void`

启用或禁用调试模式。

```typescript
// 启用调试模式
tooltipManager.setDebugMode(true);

// 调试模式下会输出详细日志
await tooltipManager.showTooltip(options);
// 控制台输出: [TooltipManager] Showing tooltip for word: "hello"
```

## 🚨 错误处理

### 错误类型

```typescript
// 自定义错误类型
class TooltipError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'TooltipError';
  }
}

// 错误代码
enum TooltipErrorCode {
  INVALID_TARGET = 'INVALID_TARGET',
  RENDER_FAILED = 'RENDER_FAILED',
  POSITION_FAILED = 'POSITION_FAILED',
  STATE_ERROR = 'STATE_ERROR'
}
```

### 错误处理示例

```typescript
try {
  await tooltipManager.showTooltip({
    word: 'test',
    translation: '测试',
    targetElement: null // 错误：空元素
  });
} catch (error) {
  if (error instanceof TooltipError) {
    console.error('Tooltip 错误:', error.code, error.message);
    console.error('错误上下文:', error.context);
  } else {
    console.error('未知错误:', error);
  }
}
```

## 📝 使用示例

### 完整示例

```typescript
import { TooltipManager } from '@utils/dom/managers/TooltipManager';

class WordHighlighter {
  private tooltipManager: TooltipManager;
  
  constructor() {
    this.tooltipManager = TooltipManager.getInstance();
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // 监听状态变化
    this.tooltipManager.addStateChangeListener((event) => {
      this.onStateChange(event);
    });
    
    // 监听键盘事件
    document.addEventListener('keydown', (event) => {
      this.tooltipManager.handleKeyboardEvent(event);
    });
  }
  
  async highlightWord(element: HTMLElement, word: string): Promise<void> {
    try {
      // 获取翻译（模拟 API 调用）
      const translation = await this.getTranslation(word);
      
      // 显示 Tooltip
      await this.tooltipManager.showTooltip({
        word,
        translation: translation.text,
        phonetic: translation.phonetic,
        partOfSpeech: translation.partOfSpeech,
        targetElement: element,
        preferredPosition: 'top',
        examples: translation.examples
      });
      
    } catch (error) {
      console.error('显示 Tooltip 失败:', error);
    }
  }
  
  private async getTranslation(word: string): Promise<any> {
    // 模拟翻译 API
    return {
      text: '示例翻译',
      phonetic: '/ˈeksəmpl/',
      partOfSpeech: 'noun',
      examples: ['This is an example.']
    };
  }
  
  private onStateChange(event: StateChangeEvent): void {
    switch (event.type) {
      case 'show':
        console.log('Tooltip 显示');
        break;
      case 'hide':
        console.log('Tooltip 隐藏');
        break;
      case 'expand':
        console.log('Tooltip 展开');
        break;
      case 'collapse':
        console.log('Tooltip 收起');
        break;
    }
  }
  
  destroy(): void {
    this.tooltipManager.destroy();
  }
}

// 使用示例
const highlighter = new WordHighlighter();

// 为页面上的单词添加高亮
document.querySelectorAll('.word').forEach(element => {
  element.addEventListener('mouseenter', () => {
    const word = element.textContent;
    highlighter.highlightWord(element as HTMLElement, word);
  });
  
  element.addEventListener('mouseleave', () => {
    highlighter.tooltipManager.handleMouseLeave(element as HTMLElement);
  });
});
```

---

**维护者**: Lucid 开发团队  
**版本**: v1.0  
**最后更新**: 2025-01-27