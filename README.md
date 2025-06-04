# Lucid 浏览器扩展

智能高亮与查词功能的现代化浏览器扩展，基于 WXT + React 19 + TypeScript 构建。

## 📁 项目结构

```
lucid/
├── src/                    # 源代码
│   ├── components/         # React组件
│   ├── services/          # 业务服务层
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型
│   └── tests/             # 测试文件
│       └── mock-data/     # 测试用模拟数据
├── entrypoints/           # WXT入口点
│   ├── background.ts      # 后台脚本
│   ├── content.ts         # 内容脚本
│   └── popup/             # 弹窗界面
├── assets/                # 编译时资源
│   ├── icons/             # SVG图标
│   ├── images/            # 图片资源
│   └── fonts/             # 字体文件
├── public/                # 运行时资源
│   └── icon/              # 扩展manifest图标
└── docs/                  # 项目文档
```

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式 (Chrome)
pnpm dev

# 开发模式 (Firefox)
pnpm dev:firefox

# 构建生产版本
pnpm build

# 运行测试
pnpm test
```

## Stagewise 开发工具栏

本项目集成了 Stagewise 开发工具栏，它提供了 AI 驱动的编辑功能，通过浏览器工具栏连接前端 UI 与代码编辑器中的 AI 代理。

### 功能特性

- 允许开发者在网页应用中选择元素
- 添加注释并让 AI 代理根据上下文进行修改
- 仅在开发环境中可用，不会包含在生产构建中

### 使用方法

1. 在开发模式下运行扩展：`pnpm dev`
2. 浏览器中会自动显示 Stagewise 工具栏
3. 使用工具栏功能选择元素并添加注释
4. AI 代理将根据您的指示进行代码修改

### 技术实现

- 使用 `@stagewise/toolbar-react` 在 React 组件中
- 使用 `@stagewise/toolbar` 在 content script 中
- 通过 WXT 构建配置确保工具栏仅在开发环境中可用
