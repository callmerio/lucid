# F2: System Patterns - 架构概述与设计模式

**最后更新**: 2025-01-27 13:15:00 +08:00

## 架构概述

### 整体架构模式
- **架构风格**: 分层架构 + 事件驱动
- **设计原则**: SOLID、高内聚低耦合、可测试性设计
- **模块化**: 基于功能的模块划分

### 核心架构组件

#### 1. WXT 框架结构 (已实现)
```
entrypoints/
├── background.ts         # 后台脚本 - 事件处理中心
├── content.ts           # 内容脚本 - DOM 操作层
└── popup/               # 弹出窗口 - 用户界面层
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    └── style.css
```

#### 2. 工具函数模块 (已实现)
```
utils/
├── selectionUtils.ts    # 文本选择处理 - 单一职责
└── highlightUtils.ts    # 高亮应用逻辑 - 策略模式
```

## 设计模式应用

### 1. 策略模式 (Strategy Pattern)
**应用场景**: 高亮样式和主题适配
- `ThemeStrategy`: 明暗主题策略
- `ColorGradientStrategy`: 颜色梯度策略
- **技术原则**: 开闭原则 (SOLID-O)

### 2. 观察者模式 (Observer Pattern)  
**应用场景**: 事件驱动的组件通信
- Background Script 监听用户操作
- Content Script 响应高亮变更
- **技术原则**: 依赖倒置原则 (SOLID-D)

### 3. 工厂模式 (Factory Pattern)
**应用场景**: API 客户端创建
- `ApiClientFactory`: 根据配置创建不同 API 客户端
- **技术原则**: 单一职责原则 (SOLID-S)

### 4. 单例模式 (Singleton Pattern)
**应用场景**: 存储管理和缓存服务
- `StorageManager`: 统一的存储访问
- `CacheService`: 全局缓存管理
- **技术原则**: 控制实例创建，避免资源浪费

### 5. 命令模式 (Command Pattern)
**应用场景**: 用户操作的撤销/重做
- `HighlightCommand`: 高亮操作命令
- `UndoRedoManager`: 操作历史管理
- **技术原则**: 封装变化，支持扩展

## 技术原则应用

### SOLID 原则实施

#### S - 单一职责原则
- `selectionUtils.ts`: 仅处理文本选择逻辑
- `highlightUtils.ts`: 仅处理高亮应用逻辑
- 每个组件专注单一功能

#### O - 开闭原则  
- 主题系统支持新主题扩展
- 高亮策略支持新算法添加
- API 客户端支持新服务集成

#### L - 里氏替换原则
- 所有主题策略可互相替换
- API 客户端实现可透明切换

#### I - 接口隔离原则
- 分离读写存储接口
- 区分查词和缓存接口

#### D - 依赖倒置原则
- 高层模块不依赖具体实现
- 通过接口定义依赖关系

### 其他核心原则

#### KISS (保持简单)
- 避免过度设计
- 优先选择简单解决方案
- 代码可读性优先

#### YAGNI (避免过度设计)
- 仅实现当前需要的功能
- 避免预测性编程
- 渐进式功能扩展

#### DRY (避免重复)
- 公共逻辑抽取到工具函数
- 样式系统统一管理
- 配置集中化

#### 高内聚低耦合
- 模块内部功能紧密相关
- 模块间依赖最小化
- 清晰的接口定义

#### 可测试性设计
- 依赖注入支持
- 纯函数优先
- 副作用隔离

#### 安全编码
- 输入验证和清理
- XSS 防护
- 权限最小化原则

#### Clean Code
- 有意义的命名
- 函数保持简短
- 注释解释为什么而非什么

## 数据流架构

### 单向数据流
```
User Action → Background Script → Content Script → DOM Update
     ↓              ↓                    ↓
Storage Update → Cache Update → UI Refresh
```

### 事件驱动通信
- Message Passing API 用于跨脚本通信
- Event Emitter 模式用于组件内通信
- 异步处理避免阻塞

## 错误处理策略

### 分层错误处理
1. **API 层**: 网络错误、认证错误
2. **业务层**: 数据验证错误、逻辑错误  
3. **UI 层**: 用户输入错误、显示错误

### 错误恢复机制
- 自动重试机制
- 降级服务策略
- 用户友好的错误提示

## 性能优化模式

### 懒加载 (Lazy Loading)
- 组件按需加载
- API 数据按需获取
- 资源延迟初始化

### 缓存策略
- LRU 缓存算法
- 多级缓存体系
- 缓存失效策略

### 防抖节流 (Debounce/Throttle)
- 用户输入防抖
- 滚动事件节流
- API 请求限频
