# Lucid 浏览器扩展

智能高亮与查词功能的现代化浏览器扩展，基于 WXT + React 19 + TypeScript 构建。

## ✨ 核心功能

### 🎯 智能高亮系统

- **文本选择高亮**: 使用 Shift 键释放触发智能高亮
- **自动扩展选择**: 智能扩展到完整单词边界
- **颜色自适应**: 根据背景自动调整高亮颜色

### 💬 交互式查词

- **Tooltip 提示**: 悬停显示快速翻译
- **Toolpopup 详情**: Shift 键展开详细信息
- **智能定位**: 自动避免视口边界，确保最佳显示

### 🌟 透明弹窗 (新功能)

- **真正透明背景**: 通过内容脚本注入实现真正的背景透明效果
- **智能响应式定位**:
  - 大屏幕 (≥1024px): 右上角定位
  - 中等屏幕 (768px-1023px): 右上角但留更多空间
  - 小屏幕 (<768px): 居中显示，适配移动设备
- **滚动位置适配**: 页面滚动时自动调整位置
- **多种关闭方式**: 支持点击外部、ESC键、手动关闭
- **性能优化**: 事件节流和passive监听器确保流畅体验

## 📁 项目结构

```
lucid/
├── src/                    # 源代码
│   ├── components/         # React组件
│   │   └── ui/            # UI组件 (Toolfull等)
│   ├── services/          # 业务服务层
│   ├── utils/             # 工具函数
│   │   └── dom/           # DOM操作工具
│   │       └── managers/  # 管理器类
│   │           ├── TransparentPopupManager.ts  # 透明弹窗管理器
│   │           ├── TooltipManager.ts           # 提示框管理器
│   │           └── ToolpopupManager.ts         # 详情弹窗管理器
│   ├── types/             # TypeScript类型
│   └── tests/             # 测试文件
│       ├── integration/   # 集成测试
│       └── mock-data/     # 测试用模拟数据
├── entrypoints/           # WXT入口点
│   ├── background.ts      # 后台脚本 (处理扩展图标点击)
│   ├── content.ts         # 内容脚本 (透明弹窗消息处理)
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

# 运行集成测试
pnpm test src/tests/integration/
```

## 🌟 透明弹窗功能详解

### 使用方法

1. **激活透明弹窗**

   - 点击浏览器工具栏中的 Lucid 扩展图标
   - 透明弹窗将在页面上显示，背景完全透明

2. **关闭透明弹窗**

   - 点击弹窗外部任意区域
   - 按下 ESC 键
   - 点击弹窗内的关闭按钮
   - 再次点击扩展图标

3. **响应式体验**
   - 大屏幕设备：弹窗显示在右上角
   - 平板设备：右上角显示但留更多边距
   - 手机设备：居中显示，适配小屏幕

### 技术实现

#### 架构设计

```
Background Script → Content Script → TransparentPopupManager
      ↓                   ↓                    ↓
  扩展图标点击        消息处理与转发         弹窗生命周期管理
```

#### 核心组件

1. **TransparentPopupManager** (`src/utils/dom/managers/TransparentPopupManager.ts`)

   - 单例模式管理透明弹窗生命周期
   - 智能响应式定位算法
   - 事件监听器管理 (点击外部、ESC键、滚动、resize)
   - React组件渲染和清理

2. **消息通信系统**

   - Background Script 监听扩展图标点击
   - 通过 `browser.runtime.sendMessage` 发送切换消息
   - Content Script 接收并处理 `lucid:transparent-popup:toggle` 消息

3. **定位算法**

   ```typescript
   // 响应式定位策略
   const isSmallScreen = viewportWidth < 768;
   const isMediumScreen = viewportWidth >= 768 && viewportWidth < 1024;

   if (isSmallScreen) {
     // 居中显示，适配移动设备
     x = (viewportWidth - POPUP_WIDTH) / 2;
   } else if (isMediumScreen) {
     // 右上角但留更多空间
     x = viewportWidth - POPUP_WIDTH - mediumMargin;
   } else {
     // 大屏幕默认右上角
     x = viewportWidth - POPUP_WIDTH - MARGIN;
   }
   ```

#### 性能优化

- **事件节流**: 滚动事件使用16ms节流，约60fps更新频率
- **Passive监听器**: 滚动事件使用passive模式避免阻塞
- **内存管理**: 完整的事件清理机制防止内存泄漏
- **DOM优化**: 使用requestAnimationFrame优化动画性能

#### 兼容性保证

- 与现有 TooltipManager 和 ToolpopupManager 完全兼容
- 独立的事件管理系统，不干扰其他功能
- 优雅的错误处理和降级机制

### 测试覆盖

- **单元测试**: 核心定位算法和事件处理逻辑
- **集成测试**: 与现有系统的兼容性和消息通信
- **边界测试**: 极端屏幕尺寸和错误情况处理

## 🔧 开发指南

### 添加新功能到透明弹窗

1. 修改 `Toolfull` 组件添加UI元素
2. 在 `TransparentPopupManager` 中添加相应的事件处理
3. 更新消息通信协议 (如需要)
4. 添加相应的测试用例

### 调试透明弹窗

```javascript
// 在浏览器控制台中调试
const manager = window.lucidTransparentPopupManager;
manager.show(); // 显示弹窗
manager.hide(); // 隐藏弹窗
manager.isPopupVisible(); // 检查状态
```
