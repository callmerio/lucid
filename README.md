# WXT + React

This template should help get you started developing with React in WXT.

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
