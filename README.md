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


