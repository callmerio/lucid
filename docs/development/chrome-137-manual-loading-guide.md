# Chrome 137 手动加载扩展指南

## 🚨 问题背景

**Chrome 137.0.7151.57** 移除了 `--load-extension` 命令行参数支持，导致WXT/web-ext无法自动加载扩展到浏览器中。这是一个已知的兼容性问题。

## 🔧 解决方案

### 方案1: 手动加载扩展 (推荐)

#### 步骤1: 启动开发服务器
```bash
pnpm dev
```

#### 步骤2: 手动加载扩展
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目目录下的 `.output/chrome-mv3-dev` 文件夹
6. 扩展将被加载并显示在扩展列表中

#### 步骤3: 验证扩展功能
1. 打开任意网页
2. 检查扩展图标是否出现在工具栏
3. 测试content script功能
4. 验证popup和background script

### 方案2: 使用Chrome开发者版本

#### 下载Chrome Dev/Canary
- **Chrome Dev**: https://www.google.com/chrome/dev/
- **Chrome Canary**: https://www.google.com/chrome/canary/

#### 配置web-ext.config.ts
```typescript
export default defineWebExtConfig({
  binaries: {
    chrome: '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
    // 或者
    canary: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  },
  disabled: false, // 重新启用自动加载
  // ... 其他配置
});
```

### 方案3: 降级Chrome版本 (不推荐)

如果必须使用自动加载功能，可以降级到Chrome 136或更早版本。

## 🔄 开发工作流

### 新的开发流程
1. **启动开发服务器**: `pnpm dev`
2. **首次手动加载**: 按照上述步骤手动加载扩展
3. **热重载**: 代码更改后，扩展会自动重新构建
4. **刷新扩展**: 在 `chrome://extensions/` 点击扩展的刷新按钮
5. **测试功能**: 刷新测试页面验证更改

### 自动化脚本 (可选)

创建一个脚本来简化重复操作：

```bash
#!/bin/bash
# scripts/dev-with-manual-load.sh

echo "🚀 启动WXT开发服务器..."
pnpm dev &
DEV_PID=$!

echo "📂 扩展构建目录: .output/chrome-mv3-dev"
echo "🌐 请手动加载扩展:"
echo "   1. 打开 chrome://extensions/"
echo "   2. 开启开发者模式"
echo "   3. 加载已解压的扩展程序"
echo "   4. 选择: $(pwd)/.output/chrome-mv3-dev"

# 等待用户按键
read -p "按任意键停止开发服务器..."
kill $DEV_PID
```

## 📝 配置更改说明

### wxt.config.ts
```typescript
export default defineConfig({
  // Chrome 137兼容性配置 - 禁用web-ext自动启动
  runner: {
    disabled: true, // 禁用自动浏览器启动，需要手动加载扩展
  },
  // ... 其他配置保持不变
});
```

### web-ext.config.ts
```typescript
export default defineWebExtConfig({
  disabled: true, // Chrome 137兼容性: 禁用自动启动浏览器
  // ... 其他配置保持不变
});
```

## 🎯 优势与劣势

### 优势
- ✅ **兼容性**: 解决Chrome 137的兼容性问题
- ✅ **稳定性**: 避免自动启动可能的问题
- ✅ **控制性**: 开发者完全控制扩展加载过程
- ✅ **调试友好**: 更容易进行扩展调试

### 劣势
- ❌ **手动操作**: 需要手动加载扩展
- ❌ **工作流变化**: 开发流程需要适应
- ❌ **首次设置**: 每个新项目都需要手动设置

## 🔮 未来展望

WXT团队正在开发新的runner来替代web-ext，预计将在未来版本中解决这个问题。建议：

1. **关注WXT更新**: 定期检查WXT版本更新
2. **使用开发版Chrome**: 考虑使用Chrome Dev/Canary版本
3. **反馈问题**: 向WXT团队反馈使用体验

## 🔗 相关资源

- [WXT Runner 文档](https://wxt.dev/runner)
- [Chrome Extensions 开发者指南](https://developer.chrome.com/docs/extensions/)
- [WXT GitHub Issues](https://github.com/wxt-dev/wxt/issues)
