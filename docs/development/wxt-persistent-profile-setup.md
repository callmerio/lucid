# WXT 持久化开发配置文件设置

## 📋 概述

本文档记录了如何配置WXT来管理一个持久化的开发浏览器配置文件，解决扩展在开发过程中需要重复加载的问题。

## 🎯 解决的问题

- **扩展重复加载**: 每次重启开发服务器时，扩展需要重新加载
- **开发工具丢失**: 浏览器开发者工具扩展和设置在重启后丢失
- **登录状态丢失**: 测试网站的登录状态无法保持
- **配置重置**: 浏览器设置和偏好在每次启动时重置

## ⚙️ 配置方案

### 1. web-ext.config.ts 配置

```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  binaries: {
    // 浏览器二进制文件路径配置
    chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // 其他浏览器...
  },
  disabled: false,
  startUrls: [
    'https://blog.google/products/chrome/favorite-google-chrome-extensions-2023/',
    'https://www.google.com/search?q=tailwind+css'
  ],
  
  // 🔑 持久化配置文件核心设置
  chromiumArgs: [
    '--user-data-dir=./.wxt/chrome-data', // 在项目目录下创建持久化配置文件
    '--disable-web-security', // 开发时禁用一些安全限制
    '--disable-features=VizDisplayCompositor', // 提高兼容性
  ],
  keepProfileChanges: true, // 保持配置文件的更改
});
```

### 2. wxt.config.ts 配置优化

```typescript
export default defineConfig({
  // ... 其他配置
  dev: {
    server: {
      port: 3000, // 使用默认端口3000
      host: 'localhost',
    },
    // 开发者工具自动打开配置
    ...({
      browserFlags: [
        "--auto-open-devtools-for-tabs",
        "--enable-features=AutoOpenDevToolsForPopups",
      ],
    } as any),
  },
  // ... 其他配置
});
```

## 📁 目录结构

配置完成后，项目目录结构如下：

```
.wxt/
├── chrome-data/           # 持久化Chrome配置文件目录
│   ├── Default/          # 默认用户配置文件
│   ├── Local State       # 本地状态文件
│   └── ...              # 其他Chrome配置文件
├── eslint-auto-imports.mjs
├── tsconfig.json
└── types/
```

## 🚀 使用方法

### 启动开发服务器

```bash
pnpm dev
```

### 验证配置

1. **检查持久化目录**: 确认 `.wxt/chrome-data` 目录已创建
2. **测试扩展加载**: 打开测试页面 `test_extension_loading.html`
3. **验证配置保持**: 重启开发服务器，检查浏览器设置是否保持

### 测试页面

使用 `test_extension_loading.html` 来验证：
- 扩展是否正确加载
- Content script是否注入
- 开发服务器状态
- 扩展功能是否正常

## 🔧 故障排除

### 端口冲突

如果遇到端口3000被占用：

```bash
# 查找占用端口的进程
lsof -ti:3000

# 终止进程
kill -9 <PID>
```

### 扩展未加载

1. 检查 `.output/chrome-mv3-dev/` 目录是否存在
2. 确认 `manifest.json` 文件是否正确生成
3. 查看浏览器扩展管理页面，确认扩展已启用

### 配置文件权限

确保 `.wxt/chrome-data` 目录有正确的读写权限：

```bash
chmod -R 755 .wxt/chrome-data
```

## 📝 注意事项

1. **版本控制**: `.wxt` 目录已在 `.gitignore` 中排除，不会提交到版本控制
2. **磁盘空间**: 持久化配置文件会占用一定磁盘空间
3. **清理**: 如需重置配置，删除 `.wxt/chrome-data` 目录即可
4. **跨平台**: Windows用户需要使用绝对路径配置

## 🎉 优势

- ✅ **开发效率提升**: 无需重复配置浏览器和扩展
- ✅ **状态保持**: 登录状态、设置偏好等得以保持
- ✅ **工具集成**: 开发者工具扩展可以持久安装
- ✅ **测试便利**: 可以安装测试用的其他扩展
- ✅ **配置隔离**: 每个项目有独立的浏览器配置

## 🔗 相关资源

- [WXT Browser Startup 官方文档](https://wxt.dev/guide/essentials/config/browser-startup)
- [web-ext 配置参考](https://www.npmjs.com/package/web-ext)
- [Chrome 命令行参数](https://peter.sh/experiments/chromium-command-line-switches/)
