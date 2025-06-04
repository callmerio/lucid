# 资源管理指南 - Lucid 浏览器扩展

## 📁 目录结构概览

```
lucid/
├── assets/                 # 编译时资源 (构建工具处理)
│   ├── icons/             # 组件中使用的SVG图标
│   ├── images/            # 组件中使用的图片资源
│   └── fonts/             # 自定义字体文件
├── public/                # 运行时资源 (直接复制)
│   └── icon/              # 扩展manifest图标 (必须)
└── src/tests/mock-data/   # 测试用模拟数据
```

## 🎯 目录用途详解

### Assets 目录 - 编译时资源

**用途**：需要通过构建工具处理的静态资源
- ✅ 构建时优化（压缩、hash命名、格式转换）
- ✅ 通过import语句引用
- ✅ 支持TypeScript类型检查
- ✅ 可以使用别名路径 `@assets/*`

**适用场景**：
```typescript
// ✅ 正确使用方式
import logoIcon from '@assets/icons/logo.svg';
import brandFont from '@assets/fonts/brand.woff2';
import heroImage from '@assets/images/hero.jpg';

// 在组件中使用
const Logo = () => <img src={logoIcon} alt="Logo" />;
```

**文件类型**：
- SVG图标（组件中使用）
- 图片资源（需要优化的）
- 字体文件
- 样式中引用的资源

### Public 目录 - 运行时资源

**用途**：直接复制到输出目录的静态文件
- ✅ 不经过构建处理
- ✅ 通过URL路径直接访问
- ✅ 浏览器扩展manifest资源
- ✅ web_accessible_resources配置的文件

**适用场景**：
```typescript
// ✅ 正确使用方式
const manifestIcon = '/icon/128.png';  // manifest.json中的图标
const publicAsset = '/data/config.json';  // 公共配置文件

// 在manifest配置中
{
  "icons": {
    "16": "/icon/16.png",
    "48": "/icon/48.png",
    "128": "/icon/128.png"
  }
}
```

**文件类型**：
- 扩展图标（16px, 48px, 128px等）
- web_accessible_resources文件
- 不需要处理的静态文件

### Src/Tests/Mock-Data 目录 - 测试数据

**用途**：测试和开发用的模拟数据
- ✅ 仅在开发和测试环境使用
- ✅ 不包含在生产构建中
- ✅ 通过import直接引用

**适用场景**：
```typescript
// ✅ 正确使用方式
import mockData from '@/tests/mock-data/tooltip-mock-data.json';
import testUsers from '@/tests/mock-data/users.json';

// 在测试中使用
describe('Tooltip Component', () => {
  it('should display mock data', () => {
    render(<Tooltip data={mockData} />);
  });
});
```

## 🔧 配置和别名

### TypeScript路径别名
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@assets/*": ["assets/*"],
      "@/*": ["src/*"]
    }
  }
}
```

### WXT构建配置
```typescript
// wxt.config.ts
export default defineConfig({
  alias: {
    "@assets": resolve(__dirname, "assets"),
    "@": resolve(__dirname, "src"),
  },
  manifest: {
    web_accessible_resources: [
      // 只有需要在content script中访问的public资源才需要配置
      // 例如：{ resources: ["assets/icons/*.svg"], matches: ["<all_urls>"] }
    ],
  }
});
```

## 📋 最佳实践

### ✅ 推荐做法

1. **图标管理**：
   ```typescript
   // 组件中使用的图标 → assets/icons/
   import SearchIcon from '@assets/icons/search.svg';
   
   // 扩展manifest图标 → public/icon/
   // 在manifest.json中引用："/icon/128.png"
   ```

2. **图片资源**：
   ```typescript
   // 需要优化的图片 → assets/images/
   import heroImage from '@assets/images/hero.jpg';
   
   // 不需要处理的图片 → public/
   // 直接URL访问："/images/static-banner.png"
   ```

3. **字体文件**：
   ```typescript
   // 自定义字体 → assets/fonts/
   import '@assets/fonts/custom-font.css';
   ```

4. **测试数据**：
   ```typescript
   // 模拟数据 → src/tests/mock-data/
   import mockApi from '@/tests/mock-data/api-response.json';
   ```

### ❌ 避免的做法

1. **不要混用目录**：
   ```typescript
   // ❌ 错误：在public中放置需要优化的资源
   import logo from '/public/logo.png';  // 不会被优化
   
   // ✅ 正确：使用assets
   import logo from '@assets/images/logo.png';
   ```

2. **不要在assets中放置manifest资源**：
   ```json
   // ❌ 错误：manifest无法访问assets中的文件
   {
     "icons": {
       "128": "@assets/icons/icon.png"  // 无效路径
     }
   }
   
   // ✅ 正确：使用public目录
   {
     "icons": {
       "128": "/icon/128.png"
     }
   }
   ```

3. **不要在public中放置测试数据**：
   ```typescript
   // ❌ 错误：测试数据不应该在public中
   import testData from '/mock-data/test.json';
   
   // ✅ 正确：使用src/tests目录
   import testData from '@/tests/mock-data/test.json';
   ```

## 🚀 构建优化

### Assets资源优化
- 自动压缩图片
- SVG优化和内联
- 字体子集化
- 文件名hash化

### Public资源处理
- 直接复制到输出目录
- 保持原始文件名
- 不进行任何处理

### 开发vs生产
```typescript
// 开发环境：快速构建，保留源映射
// 生产环境：完全优化，压缩所有资源

if (import.meta.env.DEV) {
  // 开发环境特定逻辑
} else {
  // 生产环境优化
}
```

## 🔍 故障排除

### 常见问题

1. **资源无法加载**：
   - 检查路径是否正确
   - 确认文件在正确的目录中
   - 验证别名配置

2. **构建错误**：
   - 检查import语句语法
   - 确认文件扩展名正确
   - 验证TypeScript类型

3. **扩展图标不显示**：
   - 确认图标在public/icon/目录
   - 检查manifest.json配置
   - 验证图标尺寸和格式

### 调试技巧

```typescript
// 检查资源路径
console.log('Asset path:', logoIcon);  // 显示实际路径

// 验证文件存在
import.meta.glob('@assets/icons/*.svg');  // 列出所有SVG文件
```

## 📚 相关文档

- [WXT Assets 官方文档](https://wxt.dev/guide/essentials/assets)
- [Vite Static Assets](https://vitejs.dev/guide/assets.html)
- [WebExtension Manifest Icons](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/icons)
