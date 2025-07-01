# CLAUDE.md

claude "You are Sage the Lead Backend Architect. Follow the instructions in .claude/agent/instructions.md. Use your memory at .claude/agent/memory.md for your private thoughts/notes. Review the .claude/shared/.md and docs/.md and claude.md readme.md at the root for details. I want you to first review the entire project and when you feel you have a good understanding of it then we are are going to start on task123md
Use MCP tools available (puppeteer for testing/scraping, context7 for docs). Verify: AC complete, REST compliance, solid error handling, query efficiency, real test coverage, security standards, clean maintainable code, no regressions. Run the test suite and any linting/verification commands before approval. Think critically about edge cases and potential production issues. If you find problems, provide specific, actionable feedback. Your role is to ensure this code is production-ready and won't cause issues when deployed."

## Project Overview

Lucid 是一个现代化浏览器扩展，基于 WXT + React 19 + TypeScript 构建，提供智能高亮与查词功能。项目采用组件化架构，包含透明弹窗、智能提示和交互式查词等核心功能。

## Development Commands

### Core Development

- `pnpm dev` - 启动开发服务器 (Chrome)
- `pnpm dev:firefox` - Firefox 开发模式
- `pnpm dev:clean` - 清理缓存后启动开发服务器
- `pnpm dev:cleanup` - 清理开发环境残留进程

### Building & Distribution

- `pnpm build` - 构建生产版本
- `pnpm build:firefox` - 构建 Firefox 版本
- `pnpm zip` - 创建扩展压缩包
- `pnpm zip:firefox` - 创建 Firefox 扩展包

### Testing

- `pnpm test` - 运行测试
- `pnpm test:ui` - 运行测试 UI 界面
- `pnpm test:run` - 运行一次性测试
- `pnpm test:coverage` - 运行测试覆盖率报告
- 单个测试: `pnpm test src/tests/specific-test.test.ts`
- 集成测试: `pnpm test src/tests/integration/`

### Code Quality

- `pnpm lint` - 运行 ESLint 检查
- `pnpm lint:fix` - 自动修复 lint 问题
- `pnpm format` - 格式化代码
- `pnpm format:check` - 检查代码格式
- `pnpm type-check` - TypeScript 类型检查

## Architecture Overview

### Core System Design

```
entrypoints/           # WXT 入口点
├── background.ts      # 后台脚本 (扩展图标点击处理)
├── content.ts         # 内容脚本 (透明弹窗消息处理)
└── popup/             # 弹窗界面

src/
├── components/        # React 组件库
│   └── ui/           # UI 组件 (Toolfull, Tooltip 等)
├── utils/dom/managers/ # 核心管理器系统
│   ├── popup/        # 弹窗管理器
│   └── tooltip/      # 提示框管理器
├── services/         # 业务服务层
└── types/           # TypeScript 类型定义
```

### Manager System (核心架构)

The project uses a manager-based architecture for UI components:

1. **TransparentPopupManager** - 管理透明弹窗生命周期，响应式定位
2. **TooltipManager** - 处理悬停提示功能
3. **ToolfullManager** - 管理详细信息弹窗

每个管理器都采用单例模式，负责组件的创建、定位、事件处理和清理。

### Message Communication

```
Background Script → Content Script → Manager System
扩展图标点击 → 消息转发 → 弹窗生命周期管理
```

## Key Development Patterns

### Component Development

- React 19 with TypeScript
- 组件位于 `src/components/ui/`
- 使用 CSS 模块化 (`src/styles/components/`)
- 错误边界包装: `withErrorBoundary` HOC

### Manager Pattern

当创建新的 UI 功能时:

1. 创建对应的 Manager 类 (`src/utils/dom/managers/`)
2. 实现单例模式和生命周期管理
3. 添加事件监听和清理机制
4. 集成到消息通信系统

### Testing Strategy

- 单元测试: `src/tests/managers/`
- 集成测试: `src/tests/integration/`
- 组件测试: `src/tests/components/`
- 性能测试: `src/tests/performance.test.ts`

## WXT Framework Integration

This project uses WXT (Web Extension Toolkit):

- Entry points defined in `entrypoints/`
- Manifest configuration handled by WXT
- Hot reload in development mode
- Cross-browser compatibility (Chrome/Firefox)

## Important File Locations

### Core Managers

- `src/utils/dom/managers/popup/TransparentPopupManager.ts` - 透明弹窗核心逻辑
- `src/utils/dom/managers/tooltip/TooltipManager.tsx` - 提示框管理
- `src/utils/dom/managers/types.ts` - 管理器类型定义

### UI Components

- `src/components/ui/Toolfull.tsx` - 透明弹窗组件
- `src/components/ui/Tooltip.tsx` - 提示框组件
- `src/components/ui/common/Popup.tsx` - 通用弹窗基类

### Services

- `src/services/DataService.ts` - 数据服务
- `src/services/api/dictionaryApi.ts` - 字典 API
- `src/services/cache/cacheService.ts` - 缓存服务

## Testing Debugging

- 开发环境: 使用 `pnpm dev` 启动，在浏览器扩展页面加载
- 透明弹窗调试: 在控制台使用 `window.lucidTransparentPopupManager`
- 集成测试: 专注于消息通信和组件交互

## CSS Architecture

- Design tokens: `src/styles/design-tokens.css`
- Component styles: `src/styles/components/`
- 动画: `src/styles/animations/`
- 主题系统: `src/styles/theme/`

## Performance Considerations

- 事件节流: 滚动事件使用 16ms 节流
- Passive 监听器: 避免阻塞滚动
- 内存管理: 完整的事件清理机制
- DOM 优化: 使用 requestAnimationFrame
