# Lucid Extension 设计系统文档

## 📋 概述

Lucid Extension 采用统一的设计系统来管理所有组件的样式，确保视觉一致性和代码可维护性。

## 🎨 设计原则

### 1. **一致性优先**
- 所有组件使用相同的颜色、字体、间距系统
- 统一的交互动画和过渡效果
- 保持视觉语言的连贯性

### 2. **可维护性**
- 使用CSS变量管理设计token
- 避免硬编码的样式值
- 模块化的样式组织

### 3. **主题支持**
- 支持明暗主题切换
- 响应式设计适配
- 可扩展的主题系统

## 🏗️ 文件结构

```
src/styles/
├── design-tokens.css    # 设计变量定义
├── components.css       # 可复用组件类
├── animations.css       # 动画效果库
└── main.css            # 主样式文件
```

## 🎯 设计Token

### 颜色系统

```css
/* 毛玻璃背景 */
--lucid-bg-glass-primary: rgba(40, 40, 40, 0.7);
--lucid-bg-glass-secondary: rgba(30, 30, 30, 0.8);

/* 文字颜色 */
--lucid-text-primary: rgba(255, 255, 255, 0.95);
--lucid-text-secondary: rgba(255, 255, 255, 0.8);
--lucid-text-muted: #aaa;

/* 交互颜色 */
--lucid-accent-primary: #ff6b6b;
--lucid-accent-secondary: rgba(255, 255, 255, 0.1);
```

### 字体系统

```css
/* 字体栈 */
--lucid-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;

/* 字体大小 */
--lucid-font-size-sm: 12px;
--lucid-font-size-base: 13px;
--lucid-font-size-md: 14px;
--lucid-font-size-lg: 16px;
```

### 间距系统

```css
--lucid-spacing-2: 4px;
--lucid-spacing-3: 6px;
--lucid-spacing-4: 8px;
--lucid-spacing-5: 12px;
--lucid-spacing-6: 15px;
--lucid-spacing-8: 20px;
```

## 🧩 组件样式

### 毛玻璃效果

```css
/* 基础毛玻璃表面 */
.lucid-glass-surface {
  backdrop-filter: var(--lucid-blur-md);
  -webkit-backdrop-filter: var(--lucid-blur-md);
  border: 1px solid var(--lucid-border-subtle);
}

/* 主要背景 */
.lucid-glass-primary {
  background: var(--lucid-bg-glass-primary);
}
```

### 按钮组件

```css
.lucid-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--lucid-radius-sm);
  background: var(--lucid-accent-secondary);
  color: var(--lucid-text-secondary);
  cursor: pointer;
  transition: all var(--lucid-transition-fast);
}
```

### 弹窗组件

```css
.lucid-popup-base {
  position: absolute;
  font-family: var(--lucid-font-family);
  user-select: none;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--lucid-transition-fast);
}
```

## 🎬 动画系统

### 基础动画

```css
/* 淡入淡出 */
.lucid-animate-fade-in {
  animation: lucid-fade-in var(--lucid-transition-fast) ease-out forwards;
}

/* 缩放动画 */
.lucid-animate-scale-in {
  animation: lucid-scale-in var(--lucid-transition-normal) var(--lucid-ease-bounce) forwards;
}

/* 心跳动画 */
.lucid-animate-heartbeat {
  animation: lucid-heartbeat 4.2s ease-in-out infinite;
}
```

### 悬停效果

```css
.lucid-hover-scale:hover {
  transform: scale(1.05);
}

.lucid-hover-glow:hover {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}
```

## 🌓 主题系统

### 暗色主题（默认）

```css
:root {
  --lucid-bg-glass-primary: rgba(40, 40, 40, 0.7);
  --lucid-text-primary: rgba(255, 255, 255, 0.95);
}
```

### 亮色主题

```css
[data-theme="light"] {
  --lucid-bg-glass-primary: rgba(255, 255, 255, 0.8);
  --lucid-text-primary: rgba(0, 0, 0, 0.9);
}
```

## 📝 使用指南

### 1. **创建新组件**

```css
.my-component {
  /* 使用设计token */
  background: var(--lucid-bg-glass-primary);
  color: var(--lucid-text-primary);
  padding: var(--lucid-spacing-4);
  border-radius: var(--lucid-radius-md);
  
  /* 使用工具类 */
  @extend .lucid-glass-surface;
}
```

### 2. **应用动画**

```html
<div class="lucid-tooltip lucid-animate-fade-in">
  <!-- 内容 -->
</div>
```

### 3. **响应主题变化**

```css
.my-component {
  /* 自动响应主题变化 */
  background: var(--lucid-bg-glass-primary);
  color: var(--lucid-text-primary);
}
```

## ⚠️ 注意事项

### 1. **避免硬编码**
```css
/* ❌ 错误 */
.component {
  background: rgba(40, 40, 40, 0.7);
  color: #fff;
}

/* ✅ 正确 */
.component {
  background: var(--lucid-bg-glass-primary);
  color: var(--lucid-text-primary);
}
```

### 2. **使用语义化变量**
```css
/* ❌ 避免直接使用颜色值 */
.component {
  color: #ff6b6b;
}

/* ✅ 使用语义化变量 */
.component {
  color: var(--lucid-accent-primary);
}
```

### 3. **保持一致性**
- 使用统一的间距系统
- 遵循既定的字体层级
- 保持动画时间的一致性

## 🔧 维护指南

### 1. **添加新的设计token**
在 `design-tokens.css` 中添加新变量，并更新文档。

### 2. **创建新的工具类**
在 `components.css` 中添加可复用的样式类。

### 3. **扩展动画库**
在 `animations.css` 中添加新的动画效果。

## 📊 迁移指南

### 从旧样式系统迁移

1. **识别硬编码值**
2. **替换为设计token**
3. **应用工具类**
4. **测试主题切换**
5. **验证视觉效果**

### 迁移检查清单

- [ ] 替换所有硬编码的颜色值
- [ ] 使用统一的字体系统
- [ ] 应用标准间距
- [ ] 更新动画引用
- [ ] 测试主题兼容性
