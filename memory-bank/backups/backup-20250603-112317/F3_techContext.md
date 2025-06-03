# F3: Technical Context - 技术栈与配置信息

**最后更新**: 2025-01-27 13:15:00 +08:00

## 技术栈概览

### 核心框架
- **WXT**: v0.20.6 - WebExtension 开发框架
- **React**: v19.1.0 - 用户界面框架  
- **TypeScript**: v5.8.3 - 类型安全语言
- **Vite**: 构建工具 (通过 WXT 集成)

### 开发工具链
- **ESLint**: v9.27.0 - 代码质量检查
- **Prettier**: v3.5.3 - 代码格式化
- **Husky**: v9.1.7 - Git hooks 管理
- **lint-staged**: v16.0.0 - 暂存文件检查

### 样式和 UI
- **TailwindCSS**: 通过 PostCSS 集成
- **PostCSS**: v8.5.3 - CSS 后处理器
- **Autoprefixer**: v10.4.21 - CSS 前缀自动添加

### 工具库
- **lodash-es**: v4.17.21 - 工具函数库 (防抖等)
- **syllable**: v5.0.1 - 音节分割库

### 开发增强
- **@stagewise/toolbar**: v0.2.1 - AI 驱动开发工具
- **@stagewise/toolbar-react**: v0.1.2 - React 集成

## 项目配置

### 构建配置 (wxt.config.ts)
```typescript
// 关键配置项
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['storage', 'tts', 'contextMenus'],
    host_permissions: ['<all_urls>']
  }
});
```

### TypeScript 配置 (tsconfig.json)
- 严格模式启用
- ES2022 目标版本
- 模块解析: Node
- JSX: react-jsx

### ESLint 配置
- TypeScript 规则集
- React 相关规则
- 自动修复支持

### 包管理
- **包管理器**: pnpm
- **Node.js**: 兼容 v18+
- **锁文件**: pnpm-lock.yaml

## 编程规范

### 命名约定
- **文件名**: camelCase (组件用 PascalCase)
- **变量**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **类型**: PascalCase
- **接口**: PascalCase (I 前缀可选)

### 代码组织
```
src/
├── components/          # React 组件
│   ├── common/         # 通用组件
│   └── feature/        # 功能特定组件
├── hooks/              # 自定义 React Hooks
├── services/           # 业务服务层
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── constants/          # 常量定义
```

### 函数设计原则
- **纯函数优先**: 无副作用，可预测
- **单一职责**: 每个函数只做一件事
- **参数限制**: 最多 3-4 个参数
- **返回类型**: 明确的 TypeScript 类型

### 错误处理规范
```typescript
// 统一错误类型
interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// 错误处理函数
function handleError(error: AppError): void {
  console.error(`[${error.code}] ${error.message}`, error.details);
}
```

### 异步编程规范
- **Promise 优先**: 避免回调地狱
- **async/await**: 提高代码可读性
- **错误捕获**: 统一的 try-catch 处理
- **超时控制**: 网络请求设置超时

## 浏览器兼容性

### 目标浏览器
- **Chrome**: v88+ (Manifest V3)
- **Firefox**: v109+ (Manifest V2/V3)
- **Edge**: v88+ (基于 Chromium)

### WebExtension API 使用
- **storage**: 本地数据存储
- **tts**: 文本转语音
- **contextMenus**: 右键菜单
- **tabs**: 标签页操作 (未来可能需要)

### 兼容性策略
- WXT 框架自动处理 API 差异
- 渐进式功能增强
- 优雅降级处理

## 性能要求

### 内存使用
- **目标**: < 50MB
- **当前**: ~30MB ✅
- **监控**: 定期性能测试

### 响应时间
- **扩展加载**: < 100ms ✅
- **高亮应用**: < 50ms ✅
- **查词请求**: < 2s (目标)

### 存储限制
- **本地存储**: 合理使用 browser.storage.local
- **缓存策略**: LRU 算法，定期清理
- **数据压缩**: 大数据集压缩存储

## 安全考虑

### 权限最小化
- 仅请求必要的浏览器权限
- 避免过度的 host_permissions
- 定期审查权限使用

### 数据安全
- 敏感数据加密存储
- 避免在日志中记录敏感信息
- 用户数据本地优先

### XSS 防护
- 严格的输入验证
- DOM 操作安全检查
- CSP 策略遵循

## 测试策略

### 测试框架 (计划)
- **单元测试**: Jest + React Testing Library
- **集成测试**: WXT 测试工具
- **E2E 测试**: Playwright

### 测试覆盖目标
- **单元测试**: > 80%
- **集成测试**: 核心流程覆盖
- **手动测试**: 多浏览器兼容性

### CI/CD 流程 (计划)
- 自动化测试运行
- 代码质量检查
- 构建产物验证

## 开发环境

### 本地开发
```bash
pnpm dev          # Chrome 开发模式
pnpm dev:firefox  # Firefox 开发模式
```

### 代码质量
```bash
pnpm lint         # 代码检查
pnpm format       # 代码格式化
pnpm type-check   # 类型检查
```

### 构建发布
```bash
pnpm build        # 生产构建
pnpm zip          # 打包发布
```

## 依赖管理策略

### 依赖更新
- 定期更新补丁版本
- 谨慎更新主版本
- 安全漏洞及时修复

### 包大小控制
- 避免不必要的依赖
- 使用 tree-shaking
- 按需导入工具函数

### 版本锁定
- 使用精确版本号
- 定期审查依赖安全性
- 维护依赖更新日志
