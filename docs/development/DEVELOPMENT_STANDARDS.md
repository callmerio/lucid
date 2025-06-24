# 开发规范和最佳实践

**版本**: v1.0  
**更新时间**: 2025-01-27  
**适用范围**: Lucid 浏览器扩展新架构

## 📖 概述

本文档定义了 Lucid 浏览器扩展新架构的开发规范、代码风格指南和最佳实践，确保代码质量和团队协作效率。

## 🎯 核心原则

### 1. 代码质量原则

- **可读性优先**: 代码应该易于理解和维护
- **类型安全**: 充分利用 TypeScript 的类型系统
- **测试驱动**: 先写测试，再写实现
- **文档完整**: 为所有公共 API 提供文档

### 2. 架构设计原则

- **单一职责**: 每个模块只负责一个特定功能
- **开闭原则**: 对扩展开放，对修改封闭
- **依赖倒置**: 依赖抽象而不是具体实现
- **接口隔离**: 使用小而专一的接口

## 📝 代码风格指南

### TypeScript 规范

#### 1. 类型定义

```typescript
// ✅ 好的做法：明确的接口定义
interface TooltipOptions {
  readonly word: string;
  readonly translation: string;
  readonly targetElement: HTMLElement;
  readonly phonetic?: string;
  readonly partOfSpeech?: string;
}

// ❌ 避免：使用 any 类型
interface BadOptions {
  data: any; // 应该明确类型
}

// ✅ 好的做法：使用联合类型
type Position = 'top' | 'bottom' | 'left' | 'right';

// ❌ 避免：使用字符串类型
type BadPosition = string;
```

#### 2. 类和方法定义

```typescript
// ✅ 好的做法：完整的类定义
class TooltipManager {
  private static instance: TooltipManager | null = null;
  private readonly stateManager: TooltipStateManager;
  
  private constructor(
    private readonly options: TooltipManagerOptions = {}
  ) {
    this.stateManager = new TooltipStateManager();
  }
  
  /**
   * 获取 TooltipManager 的单例实例
   * @returns TooltipManager 实例
   */
  public static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }
  
  /**
   * 显示 Tooltip
   * @param options - 显示选项
   * @throws {TooltipError} 当目标元素无效时
   */
  public async showTooltip(options: ShowTooltipOptions): Promise<void> {
    if (!options.targetElement) {
      throw new TooltipError('目标元素不能为空', 'INVALID_TARGET');
    }
    
    try {
      await this.renderTooltip(options);
    } catch (error) {
      this.handleError(error, 'showTooltip');
      throw error;
    }
  }
  
  private async renderTooltip(options: ShowTooltipOptions): Promise<void> {
    // 实现细节
  }
  
  private handleError(error: Error, context: string): void {
    console.error(`[TooltipManager.${context}]`, error);
  }
}
```

#### 3. 错误处理

```typescript
// ✅ 好的做法：自定义错误类型
class TooltipError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TooltipError';
  }
}

// ✅ 好的做法：错误代码枚举
enum TooltipErrorCode {
  INVALID_TARGET = 'INVALID_TARGET',
  RENDER_FAILED = 'RENDER_FAILED',
  POSITION_FAILED = 'POSITION_FAILED'
}

// ✅ 好的做法：完整的错误处理
async function safeOperation(): Promise<void> {
  try {
    await riskyOperation();
  } catch (error) {
    if (error instanceof TooltipError) {
      // 处理已知错误
      this.handleKnownError(error);
    } else {
      // 处理未知错误
      this.handleUnknownError(error);
    }
    throw error; // 重新抛出以便上层处理
  }
}
```

### 命名规范

#### 1. 文件和目录命名

```
src/
├── utils/
│   ├── dom/
│   │   ├── managers/
│   │   │   ├── TooltipManager.ts          # PascalCase for classes
│   │   │   ├── TooltipStateManager.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── tooltip-types.ts           # kebab-case for type files
│   │   │   └── event-types.ts
│   │   └── helpers/
│   │       ├── position-calculator.ts     # kebab-case for utilities
│   │       └── dom-utils.ts
├── tests/
│   ├── managers/
│   │   ├── TooltipManager.test.ts         # .test.ts suffix
│   │   └── TooltipStateManager.test.ts
│   └── helpers/
│       └── test-utils.ts                  # kebab-case for test utilities
```

#### 2. 变量和函数命名

```typescript
// ✅ 好的做法：描述性命名
const tooltipManager = TooltipManager.getInstance();
const currentTargetElement = tooltipManager.getCurrentTargetElement();
const isTooltipVisible = tooltipManager.isVisible();

// ✅ 好的做法：动词开头的方法名
function calculateOptimalPosition(): Position { }
function validateTargetElement(): boolean { }
function renderTooltipContent(): HTMLElement { }

// ✅ 好的做法：布尔值命名
const isVisible = true;
const hasPhonetic = !!options.phonetic;
const canExpand = state.visible && !state.expanded;

// ❌ 避免：缩写和不清晰的命名
const mgr = TooltipManager.getInstance(); // 应该是 manager
const elem = document.getElementById('target'); // 应该是 element
const pos = calculatePosition(); // 应该是 position
```

#### 3. 常量命名

```typescript
// ✅ 好的做法：SCREAMING_SNAKE_CASE
const DEFAULT_HIDE_DELAY = 300;
const MAX_TOOLTIP_WIDTH = 400;
const TOOLTIP_Z_INDEX = 10000;

// ✅ 好的做法：枚举命名
enum TooltipPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right'
}

// ✅ 好的做法：配置对象
const DEFAULT_OPTIONS: Readonly<TooltipManagerOptions> = {
  hideDelay: DEFAULT_HIDE_DELAY,
  showDelay: 0,
  defaultPosition: TooltipPosition.TOP,
  enableKeyboard: true
} as const;
```

## 🏗️ 组件开发规范

### 1. 类设计规范

```typescript
// ✅ 好的做法：完整的类设计
abstract class BaseManager {
  protected readonly id: string;
  protected isDestroyed = false;
  
  constructor(id?: string) {
    this.id = id || this.generateId();
  }
  
  /**
   * 销毁管理器并清理资源
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.cleanup();
    this.isDestroyed = true;
  }
  
  protected abstract cleanup(): void;
  
  protected checkDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error(`${this.constructor.name} has been destroyed`);
    }
  }
  
  private generateId(): string {
    return `${this.constructor.name}-${Date.now()}-${Math.random()}`;
  }
}

// ✅ 好的做法：继承基类
class TooltipStateManager extends BaseManager {
  private listeners: Set<StateChangeListener> = new Set();
  private state: TooltipState = this.getInitialState();
  
  constructor() {
    super('tooltip-state-manager');
  }
  
  public addListener(listener: StateChangeListener): void {
    this.checkDestroyed();
    this.listeners.add(listener);
  }
  
  public removeListener(listener: StateChangeListener): void {
    this.listeners.delete(listener);
  }
  
  protected cleanup(): void {
    this.listeners.clear();
    this.state = this.getInitialState();
  }
  
  private getInitialState(): TooltipState {
    return {
      visible: false,
      expanded: false,
      word: '',
      targetElement: null,
      hideTimeout: null
    };
  }
}
```

### 2. 依赖注入模式

```typescript
// ✅ 好的做法：依赖注入
interface ITooltipRenderer {
  render(options: TooltipRenderOptions): HTMLElement;
  destroy(): void;
}

interface ITooltipPositioner {
  calculatePosition(options: PositionOptions): Position;
}

class TooltipManager {
  constructor(
    private readonly renderer: ITooltipRenderer,
    private readonly positioner: ITooltipPositioner,
    private readonly stateManager: TooltipStateManager
  ) {}
  
  // 工厂方法
  public static create(): TooltipManager {
    const renderer = new TooltipRenderer();
    const positioner = new TooltipPositioner();
    const stateManager = new TooltipStateManager();
    
    return new TooltipManager(renderer, positioner, stateManager);
  }
}
```

### 3. 事件系统规范

```typescript
// ✅ 好的做法：类型安全的事件系统
interface EventMap {
  'tooltip:show': { word: string; element: HTMLElement };
  'tooltip:hide': { reason: string };
  'tooltip:expand': { expanded: boolean };
  'tooltip:error': { error: Error; context: string };
}

class EventEmitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<Function>>();
  
  public on<K extends keyof T>(
    event: K,
    listener: (data: T[K]) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  public off<K extends keyof T>(
    event: K,
    listener: (data: T[K]) => void
  ): void {
    this.listeners.get(event)?.delete(listener);
  }
  
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Event listener error for ${String(event)}:`, error);
      }
    });
  }
}

// 使用示例
class TooltipManager extends EventEmitter<EventMap> {
  public async showTooltip(options: ShowTooltipOptions): Promise<void> {
    try {
      // 显示逻辑
      this.emit('tooltip:show', {
        word: options.word,
        element: options.targetElement
      });
    } catch (error) {
      this.emit('tooltip:error', { error, context: 'showTooltip' });
      throw error;
    }
  }
}
```

## 🧪 测试编写规范

### 1. 测试结构

```typescript
// ✅ 好的做法：清晰的测试结构
describe('TooltipManager', () => {
  let manager: TooltipManager;
  let mockElement: HTMLElement;
  
  beforeEach(() => {
    // 设置测试环境
    manager = TooltipManager.getInstance();
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });
  
  afterEach(() => {
    // 清理测试环境
    manager.destroy();
    document.body.removeChild(mockElement);
  });
  
  describe('showTooltip', () => {
    it('应该显示基本的 tooltip', async () => {
      // Arrange
      const options: ShowTooltipOptions = {
        word: 'test',
        translation: '测试',
        targetElement: mockElement
      };
      
      // Act
      await manager.showTooltip(options);
      
      // Assert
      expect(manager.isVisible()).toBe(true);
      expect(manager.getCurrentWord()).toBe('test');
    });
    
    it('应该在目标元素为空时抛出错误', async () => {
      // Arrange
      const options: ShowTooltipOptions = {
        word: 'test',
        translation: '测试',
        targetElement: null as any
      };
      
      // Act & Assert
      await expect(manager.showTooltip(options))
        .rejects
        .toThrow(TooltipError);
    });
  });
  
  describe('hideTooltip', () => {
    beforeEach(async () => {
      // 每个测试前先显示 tooltip
      await manager.showTooltip({
        word: 'test',
        translation: '测试',
        targetElement: mockElement
      });
    });
    
    it('应该隐藏 tooltip', () => {
      // Act
      manager.hideTooltip(true);
      
      // Assert
      expect(manager.isVisible()).toBe(false);
    });
  });
});
```

### 2. Mock 和 Stub

```typescript
// ✅ 好的做法：合理使用 Mock
import { vi } from 'vitest';

// Mock 外部依赖
vi.mock('@utils/dom/managers/TooltipRenderer', () => ({
  TooltipRenderer: vi.fn().mockImplementation(() => ({
    render: vi.fn().mockReturnValue(document.createElement('div')),
    destroy: vi.fn()
  }))
}));

// 测试中使用 Mock
describe('TooltipManager with mocked dependencies', () => {
  let mockRenderer: any;
  
  beforeEach(() => {
    const { TooltipRenderer } = require('@utils/dom/managers/TooltipRenderer');
    mockRenderer = new TooltipRenderer();
  });
  
  it('应该调用渲染器', async () => {
    // Arrange
    const manager = new TooltipManager(mockRenderer, /* other deps */);
    
    // Act
    await manager.showTooltip(options);
    
    // Assert
    expect(mockRenderer.render).toHaveBeenCalledWith(
      expect.objectContaining({
        word: 'test',
        translation: '测试'
      })
    );
  });
});
```

### 3. 测试覆盖率要求

```typescript
// ✅ 测试覆盖率目标
// - 语句覆盖率: >= 90%
// - 分支覆盖率: >= 85%
// - 函数覆盖率: >= 95%
// - 行覆盖率: >= 90%

// ✅ 必须测试的场景
describe('边界条件测试', () => {
  it('应该处理空字符串', () => { });
  it('应该处理 null 值', () => { });
  it('应该处理 undefined 值', () => { });
  it('应该处理超长字符串', () => { });
  it('应该处理特殊字符', () => { });
});

describe('错误处理测试', () => {
  it('应该处理网络错误', () => { });
  it('应该处理解析错误', () => { });
  it('应该处理权限错误', () => { });
});

describe('性能测试', () => {
  it('应该在合理时间内完成操作', async () => {
    const startTime = performance.now();
    await manager.showTooltip(options);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // 100ms
  });
});
```

## 📚 文档编写规范

### 1. JSDoc 注释

```typescript
/**
 * Tooltip 管理器，负责统一管理 Tooltip 的显示、隐藏和状态
 * 
 * @example
 * ```typescript
 * const manager = TooltipManager.getInstance();
 * await manager.showTooltip({
 *   word: 'hello',
 *   translation: '你好',
 *   targetElement: element
 * });
 * ```
 * 
 * @since 1.0.0
 */
class TooltipManager {
  /**
   * 显示 Tooltip
   * 
   * @param options - 显示选项
   * @param options.word - 要显示的单词
   * @param options.translation - 翻译内容
   * @param options.targetElement - 目标元素
   * @param options.phonetic - 音标（可选）
   * @param options.preferredPosition - 首选位置（可选）
   * 
   * @returns Promise，在 Tooltip 显示完成后 resolve
   * 
   * @throws {TooltipError} 当目标元素无效时抛出
   * 
   * @example
   * ```typescript
   * await manager.showTooltip({
   *   word: 'beautiful',
   *   translation: '美丽的',
   *   phonetic: '/ˈbjuːtɪfl/',
   *   targetElement: document.getElementById('word'),
   *   preferredPosition: 'top'
   * });
   * ```
   * 
   * @since 1.0.0
   */
  public async showTooltip(options: ShowTooltipOptions): Promise<void> {
    // 实现
  }
}
```

### 2. README 文档结构

```markdown
# 组件名称

简短描述组件的作用和用途。

## 安装

\`\`\`bash
npm install package-name
\`\`\`

## 快速开始

\`\`\`typescript
import { ComponentName } from 'package-name';

const component = new ComponentName();
component.doSomething();
\`\`\`

## API 文档

### 方法

#### `methodName(param: Type): ReturnType`

方法描述。

**参数**:
- `param` (Type): 参数描述

**返回值**: ReturnType - 返回值描述

**示例**:
\`\`\`typescript
const result = component.methodName('value');
\`\`\`

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| option1 | string | 'default' | 选项描述 |
| option2 | number | 100 | 选项描述 |

## 示例

### 基本使用

\`\`\`typescript
// 示例代码
\`\`\`

### 高级用法

\`\`\`typescript
// 高级示例代码
\`\`\`

## 故障排查

### 常见问题

**问题**: 描述问题
**解决方案**: 描述解决方案

## 更新日志

### v1.0.0
- 初始版本
```

## 🔧 工具和配置

### 1. ESLint 配置

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-readonly": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn"
  }
}
```

### 2. Prettier 配置

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 3. TypeScript 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 📊 代码质量检查

### 1. 提交前检查

```bash
# 运行所有检查
npm run pre-commit

# 包含以下步骤：
npm run lint          # ESLint 检查
npm run type-check    # TypeScript 类型检查
npm run test          # 运行测试
npm run build         # 构建检查
```

### 2. 代码审查清单

- [ ] 代码符合 TypeScript 规范
- [ ] 所有公共 API 有 JSDoc 注释
- [ ] 测试覆盖率达到要求
- [ ] 错误处理完整
- [ ] 性能考虑合理
- [ ] 安全性检查通过
- [ ] 文档更新完整

## 🚀 最佳实践总结

### 1. 性能优化

- 使用 `readonly` 修饰符防止意外修改
- 合理使用缓存避免重复计算
- 及时清理事件监听器和定时器
- 使用 `WeakMap` 和 `WeakSet` 避免内存泄漏

### 2. 安全性

- 验证所有外部输入
- 使用 CSP 防止 XSS 攻击
- 避免使用 `eval()` 和 `innerHTML`
- 正确处理用户权限

### 3. 可维护性

- 保持函数简短（< 50 行）
- 使用有意义的变量名
- 避免深层嵌套（< 4 层）
- 定期重构和优化代码

---

**维护者**: Lucid 开发团队  
**版本**: v1.0  
**最后更新**: 2025-01-27