# Lucid 项目代码风格和约定

## TypeScript 配置

### 编译选项
- 使用 React JSX 转换 (`"jsx": "react-jsx"`)
- 启用路径别名映射
- 继承 WXT 的 TypeScript 配置
- 允许导入 TypeScript 扩展名

### 路径别名
```typescript
"@/*": ["src/*"]
"@components/*": ["src/components/*"]
"@utils/*": ["src/utils/*"]
"@services/*": ["src/services/*"]
"@types/*": ["src/types/*"]
"@hooks/*": ["src/hooks/*"]
"@styles/*": ["src/styles/*"]
"@constants/*": ["src/constants/*"]
"@lib/*": ["src/lib/*"]
"@assets/*": ["assets/*"]
```

## ESLint 规则

### TypeScript 规则
- 使用 TypeScript 推荐规则
- 未使用变量报错，但允许 `_` 前缀参数
- `any` 类型警告
- 非空断言警告

### React 规则
- React 推荐规则
- React Hooks 规则
- 不需要显式导入 React
- 禁用 prop-types（使用 TypeScript）
- React Refresh 组件导出检查

### 通用规则
- `console.log` 警告，`console.error` 等允许
- `debugger` 报错
- 优先使用 `const`
- 禁用 `var`
- 强制使用严格相等 (`===`)
- 必须使用大括号
- 禁用未使用的表达式
- 禁用重复导入

## 命名约定

### 文件命名
- React 组件: PascalCase (如 `TooltipManager.tsx`)
- 工具函数: camelCase (如 `highlightUtils.ts`)
- 类型定义: camelCase (如 `index.ts`)
- 常量文件: camelCase (如 `uiEvents.ts`)

### 变量命名
- 变量和函数: camelCase
- 常量: UPPER_SNAKE_CASE
- 类和接口: PascalCase
- 私有成员: 前缀 `_`

### 组件约定
- 组件文件导出默认组件
- 使用函数组件和 Hooks
- Props 接口以组件名 + Props 命名

## 代码组织

### 导入顺序
1. 第三方库导入
2. 内部模块导入（使用路径别名）
3. 相对路径导入
4. 类型导入（使用 `import type`）

### 文件结构
```typescript
// 导入
import { ... } from 'external-lib';
import { ... } from '@utils/...';
import { ... } from './relative';
import type { ... } from '@types/...';

// 类型定义
interface LocalInterface { ... }

// 常量
const CONSTANTS = { ... };

// 主要实现
export class/function/const ...

// 默认导出
export default ...;
```

## 注释和文档

### JSDoc 注释
- 公共 API 必须有 JSDoc
- 复杂逻辑需要解释性注释
- 使用中文注释说明业务逻辑

### 注释风格
```typescript
/**
 * 函数描述
 * @param param1 参数描述
 * @returns 返回值描述
 */
function example(param1: string): boolean {
  // 单行注释说明逻辑
  return true;
}
```

## 错误处理

### 异常处理
- 使用 try-catch 处理异步操作
- 提供有意义的错误消息
- 记录错误日志但不暴露敏感信息

### 类型安全
- 避免使用 `any` 类型
- 使用类型守卫和断言
- 优先使用联合类型而非 `any`

## 性能约定

### React 性能
- 使用 `useMemo` 和 `useCallback` 优化
- 避免在渲染中创建新对象
- 合理使用 `React.memo`

### 代码分割
- 使用动态导入进行代码分割
- 懒加载非关键组件
- 优化 bundle 大小