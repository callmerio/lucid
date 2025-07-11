# Lucid v2 开发计划

**版本**: v3.0  
**最后更新**: 2025-06-24  
**状态**: 🎯 架构优化完成，进入功能实现阶段  
**当前版本**: v0.1.0

---

## 🎯 项目愿景

将 Lucid 打造为**最智能的浏览器词典扩展**，通过先进的高亮系统和个性化学习记录，让用户在自然阅读中无感知地提升词汇量。

### 核心价值主张
- **无干扰学习**: 在不打断阅读流程的前提下提供即时词汇帮助
- **智能记忆**: 基于用户行为数据，智能调整词汇显示优先级  
- **渐进式增强**: 从基础查词到高级学习功能的平滑升级路径

---

## 📊 当前项目状态

### ✅ 已完成基础设施 (100%)

- ✅ **新架构实现**: TooltipManager、StateManager、EventHandler、Positioner、Renderer
- ✅ **测试体系建立**: 359个测试，99.7%通过率
- ✅ **TypeScript完善**: 编译错误修复，类型安全保障
- ✅ **文档体系**: 完整的架构设计、API指南、开发规范
- ✅ **WXT框架**: React 19 + TypeScript + Vite 构建系统

### 🔄 当前重点工作

#### 正在进行的优化
- **设计系统统一**: 字体权重、颜色系统、响应式设计
- **HighlightUtils重构**: 性能优化和代码结构改进
- **Tooltip体验增强**: 滑动功能和双主题支持
- **音节处理系统**: syllableUtils 功能完善

---

## 🎯 核心功能规划

基于 `func.md` 的功能清单，按优先级重新组织：

### 🥇 第一优先级：高级高亮系统

#### 1.1 翻译显示模式 (2-3周)

**1.1.1 沉浸模式增强** (已有基础，需完善)
- **当前状态**: 基础Tooltip功能已实现
- **待完善**:
  - [ ] 悬浮延迟优化 (≤100ms)
  - [ ] Shift键深入展开为Toolpopup
  - [ ] 智能位置计算优化
  - [ ] 连续悬浮平滑切换

**1.1.2 行内对照模式** (新功能)
- [ ] DOM注入策略实现
- [ ] 格式化翻译显示 `<mark>word (翻译)</mark>`
- [ ] 模糊显示和悬浮显现
- [ ] 性能优化(DocumentFragment、requestIdleCallback)

#### 1.2 高亮视觉样式系统 (2-3周)

**当前状态**: 基础高亮已实现，需要样式系统

- [ ] **渐变样式**: 基于markCount的颜色光谱
- [ ] **单色深浅**: 统一色调的深浅变化
- [ ] **自定义样式**: 用户自定义颜色选择
- [ ] **下划线样式**: 波浪线或实线选项
- [ ] **透明度样式**: 基于熟悉度的透明度变化
- [ ] **粗体样式**: 极简的字体加粗模式

#### 1.3 模式切换管理 (1周)

- [ ] 沉浸式/行内翻译/禁用模式切换
- [ ] 模式状态持久化
- [ ] 切换时DOM清理机制
- [ ] 异常回退保护

### 🥈 第二优先级：侧边栏控制中心 (3-4周)

#### 2.1 侧边栏基础功能

- [ ] 点击扩展图标滑出侧边栏
- [ ] 当前页面生词列表展示
- [ ] 点击滚动到词汇位置 + 闪烁提示
- [ ] 用户数据总览卡片

#### 2.2 核心设置面板

- [ ] 全局高亮开关
- [ ] 样式设置入口和预览
- [ ] 实时设置生效
- [ ] 颜色配置界面

### 🥉 第三优先级：查词功能集成 (4-5周)

#### 3.1 后端API集成
- [ ] 与lucid-bd项目API对接
- [ ] 错误处理和重试机制
- [ ] 请求缓存策略
- [ ] 离线支持

#### 3.2 查词界面完善
- [ ] Popup查词结果展示
- [ ] 发音播放功能
- [ ] 生词本添加功能
- [ ] 加载状态优化

---

## 🗓️ 详细开发时间线

### Phase 1: 高亮系统完善 (2025-07-01 - 2025-07-21)

**Week 1-2: 翻译显示模式**
- 完善沉浸模式体验
- 实现行内对照模式
- 模式切换机制

**Week 3: 视觉样式系统**
- 6种高亮样式实现
- 样式配置界面
- 实时预览功能

### Phase 2: 侧边栏开发 (2025-07-22 - 2025-08-18)

**Week 4-5: 基础功能**
- 侧边栏UI框架
- 生词列表功能
- 数据总览

**Week 6-7: 设置集成**
- 设置面板开发
- 与高亮系统联动
- 用户偏好存储

### Phase 3: 查词功能 (2025-08-19 - 2025-09-22)

**Week 8-10: API集成**
- 后端接口对接
- 缓存机制实现
- 错误处理完善

**Week 11-12: 界面优化**
- 查词结果展示
- 用户体验优化
- 性能调优

---

## 🎯 关键里程碑

### 里程碑 1: 高亮系统 2.0 (2025-07-21)
- ✅ 6种视觉样式完成
- ✅ 沉浸式/行内翻译模式
- ✅ 模式切换系统
- ✅ 用户自定义配置

### 里程碑 2: 侧边栏上线 (2025-08-18)
- ✅ 完整侧边栏功能
- ✅ 生词管理系统
- ✅ 设置面板集成
- ✅ 数据统计展示

### 里程碑 3: 查词系统 (2025-09-22)
- ✅ 后端API完全集成
- ✅ 离线缓存支持
- ✅ 发音功能实现
- ✅ 生词本管理

---

## 📈 技术架构演进

### 当前架构优势
- **模块化**: 清晰的服务层分离
- **可测试**: 99.7%的测试覆盖率
- **类型安全**: 完整的TypeScript支持
- **高性能**: 优化的事件处理和DOM操作

### 架构升级计划

#### 状态管理升级
```typescript
// 当前: 简单状态管理
// 升级到: 统一状态中心
interface AppState {
  highlight: HighlightState;
  display: DisplayModeState;
  settings: UserSettingsState;
  dictionary: DictionaryState;
}
```

#### 组件化重构
```typescript
// 新增组件模块
src/components/
├── highlight/           // 高亮相关组件
├── sidebar/            // 侧边栏组件
├── dictionary/         // 查词组件
└── settings/           // 设置组件
```

---

## 🔧 技术实现细节

### 性能优化策略

#### 高亮渲染优化
- **批量DOM操作**: 使用DocumentFragment
- **虚拟化**: 仅处理可见区域
- **防抖机制**: 避免频繁重绘
- **内存管理**: 及时清理无效高亮

#### 查词缓存策略
- **LRU缓存**: 最多缓存10000条查询
- **智能预加载**: 基于用户行为预测
- **压缩存储**: 减少存储空间占用
- **过期机制**: 定期清理过期数据

### 兼容性保障
- **浏览器支持**: Chrome 88+, Firefox 85+, Safari 14+
- **网站兼容**: 主流网站测试验证
- **响应式设计**: 支持各种屏幕尺寸
- **无障碍访问**: ARIA标签和键盘导航

---

## 🎮 用户体验设计

### 交互流程优化

#### 查词流程
```
悬浮单词 → 显示Tooltip → [Shift键] → 展开Toolpopup → 添加生词本
```

#### 设置流程
```
点击扩展图标 → 侧边栏滑出 → 设置入口 → 实时预览 → 保存应用
```

### 视觉设计原则
- **最小干扰**: 不破坏原网页布局
- **自然融入**: 符合网页主题风格
- **即时反馈**: 操作结果立即可见
- **渐进披露**: 复杂功能分层展示

---

## 📊 质量保证策略

### 测试策略
- **单元测试**: 保持99%+通过率
- **集成测试**: 功能模块联调验证
- **E2E测试**: 核心用户流程覆盖
- **性能测试**: 内存和响应时间监控

### 发布策略
- **灰度发布**: 分阶段功能发布
- **A/B测试**: 新功能效果验证
- **用户反馈**: 快速迭代优化
- **稳定性监控**: 实时错误追踪

---

## 🤝 项目协作

### 与lucid-bd项目集成
- **API接口**: 统一的查词接口规范
- **数据格式**: 标准化的响应结构
- **错误处理**: 一致的错误码系统
- **版本管理**: 前后端版本兼容策略

### 开发工作流
- **分支策略**: feature/develop/main三层结构
- **代码审查**: 关键功能双人审查
- **自动化**: CI/CD流水线完善
- **文档同步**: 代码与文档同步更新

---

## 📋 风险评估与缓解

### 技术风险
1. **高亮性能问题**: 大页面文本处理可能影响性能
   - **缓解**: 分片处理 + 虚拟化技术

2. **浏览器兼容性**: 不同浏览器API差异
   - **缓解**: WXT框架抽象 + 兼容层

3. **网站CSP限制**: 某些网站安全策略限制
   - **缓解**: 渐进增强 + 降级方案

### 产品风险
1. **用户学习成本**: 功能复杂度增加
   - **缓解**: 渐进式引导 + 简化界面

2. **性能影响感知**: 用户担心影响浏览体验
   - **缓解**: 性能监控 + 优化宣传

---

## 📈 成功指标

### 技术指标
- ✅ 高亮响应时间 < 50ms (P95)
- ✅ 查词请求成功率 > 95%
- ✅ 内存使用增量 < 30MB
- ✅ 测试覆盖率 > 95%

### 用户体验指标
- ✅ 功能使用率 > 80%
- ✅ 用户留存率 > 70%
- ✅ 错误反馈 < 0.1%
- ✅ 用户满意度 > 4.5/5.0

### 业务指标
- ✅ 每日活跃用户增长 > 20%
- ✅ 功能使用深度 > 3个功能/用户
- ✅ 用户推荐率 > 60%

---

## 📝 更新记录

### v3.0 (2025-06-24)
- 基于func.md、prd.md、tasks.md重新设计
- 结合最新的架构优化成果
- 明确功能优先级和时间规划
- 完善技术实现和质量保证策略

### v2.0 (2025-01-27)
- 基于实际开发进度全面更新计划
- 重新评估已完成和待完成功能

### v1.0 (2025-01-20)
- 初始开发计划

---

**维护者**: Lucid 开发团队  
**下次评审**: 2025-07-01