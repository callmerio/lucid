# Lucid 项目开发命令指南

## 开发命令

### 启动开发服务器
```bash
# 主要开发命令 (Chrome)
pnpm dev

# Firefox开发
pnpm dev:firefox

# 清理缓存后启动
pnpm dev:clean

# 清理所有数据后启动
pnpm dev:clean-all
```

### 构建和打包
```bash
# 构建生产版本
pnpm build

# Firefox构建
pnpm build:firefox

# 打包扩展
pnpm zip
pnpm zip:firefox
```

### 代码质量
```bash
# TypeScript编译检查
pnpm compile
pnpm type-check

# 代码检查
pnpm lint
pnpm lint:fix

# 代码格式化
pnpm format
pnpm format:check
```

### 测试
```bash
# 运行测试
pnpm test

# 测试UI界面
pnpm test:ui

# 运行测试（一次性）
pnpm test:run

# 测试覆盖率
pnpm test:coverage
```

### 清理和维护
```bash
# 清理开发环境
pnpm dev:cleanup

# 重新安装依赖
pnpm install
```

## 系统工具命令 (macOS)

### 文件操作
```bash
# 列出文件
ls -la

# 查找文件
find . -name "*.ts" -type f

# 搜索内容
grep -r "pattern" src/

# 文件权限
chmod +x scripts/*.sh
```

### 进程管理
```bash
# 查看端口占用
lsof -ti:3000

# 终止进程
kill -TERM <pid>

# 查看Chrome进程
ps aux | grep chrome
```

### Git操作
```bash
# 基本操作
git status
git add .
git commit -m "message"
git push

# 分支操作
git branch
git checkout -b feature/new-feature
git merge main
```

## 开发脚本

### 自定义脚本
- `./scripts/wxt-dev.sh`: WXT开发服务器启动器
- `./scripts/dev-smart.sh`: 智能开发模式
- `./scripts/dev-simple.sh`: 简单开发模式
- `./scripts/monitor-dev.sh`: 开发监控
- `./scripts/switch-css-mode.js`: CSS模式切换

### 脚本使用
```bash
# 直接运行WXT开发服务器
./scripts/wxt-dev.sh

# 清理所有数据后启动
./scripts/wxt-dev.sh --clean-all

# 智能开发模式
./scripts/dev-smart.sh
```