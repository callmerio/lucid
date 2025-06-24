# Lucid 浏览器扩展项目概览

## 项目目的
Lucid 是一个智能高亮与查词功能的现代化浏览器扩展，主要功能包括：
- 智能文本高亮
- 单词查询和翻译
- 音标显示和发音
- 上下文菜单集成
- 工具提示和弹窗界面

## 技术栈

### 核心框架
- **WXT**: 现代浏览器扩展开发框架 (v0.20.6)
- **React**: 前端UI框架 (v19.1.0)
- **TypeScript**: 类型安全的JavaScript (v5.8.3)
- **Vite**: 构建工具和开发服务器

### 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Vitest**: 测试框架
- **Husky**: Git hooks管理
- **lint-staged**: 提交前代码检查

### 依赖库
- **lodash-es**: 工具函数库
- **syllable**: 音节分析库
- **@testing-library**: 测试工具

## 项目结构

```
lucid/
├── src/                    # 源代码
│   ├── components/         # React组件 (待创建)
│   ├── services/          # 业务服务层
│   │   ├── api/           # API服务
│   │   ├── cache/         # 缓存服务
│   │   ├── mock/          # 模拟数据服务
│   │   └── storage/       # 存储服务
│   ├── utils/             # 工具函数
│   │   ├── dom/           # DOM操作工具
│   │   ├── highlight/     # 高亮功能
│   │   └── text/          # 文本处理
│   ├── types/             # TypeScript类型定义
│   ├── constants/         # 常量定义
│   └── tests/             # 测试文件
├── entrypoints/           # WXT入口点
│   ├── background.ts      # 后台脚本
│   ├── content.ts         # 内容脚本
│   └── popup/             # 弹窗界面
├── assets/                # 编译时资源
├── public/                # 运行时资源
├── scripts/               # 构建和开发脚本
└── docs/                  # 项目文档
```

## 架构特点
- 模块化设计，清晰的职责分离
- 服务层架构，支持缓存和API抽象
- 事件驱动的UI交互系统
- 完整的TypeScript类型系统
- 路径别名支持 (@/, @components/, @utils/ 等)