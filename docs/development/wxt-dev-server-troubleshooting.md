# WXT开发服务器故障排除指南

## 🎯 问题概述

WXT开发服务器在运行一段时间后可能出现端口占用错误（`ECONNREFUSED`），需要清理缓存和重新安装依赖才能恢复。本指南提供了根本原因分析和长久性解决方案。

## 🔍 问题根本原因

### 1. Chrome进程锁定机制
- **SingletonLock机制**：Chrome使用锁定文件防止多个实例使用同一用户数据目录
- **进程残留**：WXT异常退出时，Chrome子进程没有被正确清理
- **资源占用**：残留进程继续占用端口和文件锁

### 2. 端口管理问题
- **内部通信端口**：WXT使用随机端口进行内部通信
- **端口冲突**：多个WXT实例可能争用相同资源
- **状态不一致**：WXT认为可以启动，但资源已被占用

### 3. 缓存状态问题
- **持久化配置**：`.wxt/chrome-data`目录保存Chrome配置
- **锁定文件**：`SingletonLock`、`SingletonSocket`等文件可能残留
- **状态不同步**：缓存状态与实际进程状态不一致

## 🛠️ 解决方案

### 立即解决方案

#### 方法1：使用智能启动脚本（推荐）
```bash
# 使用智能启动脚本
pnpm run dev:smart

# 或者清理缓存后启动
pnpm run dev:clean
```

#### 方法2：手动清理
```bash
# 1. 终止Chrome进程
pkill -f "chrome.*--user-data-dir=.*\.wxt/chrome-data"

# 2. 清理锁定文件
rm -f .wxt/chrome-data/SingletonLock
rm -f .wxt/chrome-data/SingletonSocket
rm -f .wxt/chrome-data/SingletonCookie

# 3. 清理端口占用
lsof -ti:3000 | xargs kill -9

# 4. 启动开发服务器
pnpm dev
```

#### 方法3：完全重置
```bash
# 使用内置清理命令
pnpm run dev:cleanup

# 或者完全重置
rm -rf .output
rm -rf node_modules/.wxt
rm -rf node_modules/.cache
rm -rf .wxt/chrome-data
pnpm install
pnpm dev
```

### 长久性解决方案

#### 1. 使用优化的启动脚本
项目已配置智能启动脚本，自动处理进程清理：

```bash
# 正常启动（自动清理）
pnpm run dev:smart

# 深度清理后启动
pnpm run dev:clean
```

#### 2. 启用进程监控
使用监控脚本实时监控开发环境状态：

```bash
# 查看当前状态
./scripts/monitor-dev.sh --status

# 启动监控模式
./scripts/monitor-dev.sh --monitor

# 启动监控并自动清理异常
./scripts/monitor-dev.sh --auto-cleanup
```

#### 3. 优化的Chrome配置
项目已优化Chrome启动参数，减少进程冲突：

- 禁用沙盒相关功能
- 优化进程管理
- 改进稳定性设置

## 📋 最佳实践

### 开发工作流
1. **启动开发服务器**：
   ```bash
   pnpm run dev:smart  # 推荐使用智能启动
   ```

2. **遇到问题时**：
   ```bash
   # 检查状态
   ./scripts/monitor-dev.sh --status
   
   # 清理并重启
   pnpm run dev:clean
   ```

3. **停止开发服务器**：
   - 使用 `Ctrl+C` 正常停止
   - 避免强制终止终端

### 预防措施
1. **定期清理**：每天开始开发前运行一次清理
2. **正确退出**：始终使用 `Ctrl+C` 停止服务器
3. **监控状态**：定期检查Chrome进程数量
4. **及时更新**：保持WXT和依赖项最新

## 🔧 故障排除

### 常见错误及解决方案

#### 错误1：`ECONNREFUSED 127.0.0.1:54703`
**原因**：WXT内部通信端口被占用
**解决**：
```bash
pnpm run dev:smart
```

#### 错误2：`Chrome process failed to start`
**原因**：Chrome进程锁定
**解决**：
```bash
./scripts/monitor-dev.sh --cleanup
pnpm dev
```

#### 错误3：`Port 3000 is already in use`
**原因**：开发服务器端口被占用
**解决**：
```bash
lsof -ti:3000 | xargs kill -9
pnpm dev
```

#### 错误4：`Extension failed to load`
**原因**：扩展构建文件损坏
**解决**：
```bash
pnpm run dev:clean
```

### 高级故障排除

#### 检查Chrome进程
```bash
# 查看所有相关Chrome进程
ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data"

# 查看进程树
pstree -p $(pgrep -f "chrome.*--user-data-dir=.*\.wxt/chrome-data")
```

#### 检查端口占用
```bash
# 查看端口占用详情
lsof -i:3000
netstat -tulpn | grep :3000
```

#### 检查文件锁定
```bash
# 查看锁定文件
ls -la .wxt/chrome-data/Singleton*

# 查看文件句柄
lsof +D .wxt/chrome-data/
```

## 📊 监控和维护

### 自动化监控
设置定时任务监控开发环境：

```bash
# 添加到crontab（每小时检查一次）
0 * * * * /path/to/project/scripts/monitor-dev.sh --status >> /tmp/wxt-monitor.log 2>&1
```

### 性能优化
1. **限制Chrome进程数量**：监控脚本会警告进程过多
2. **定期清理缓存**：避免缓存文件过大
3. **优化系统资源**：确保足够的内存和CPU

### 日志分析
查看WXT和Chrome日志：

```bash
# WXT日志
tail -f ~/.wxt/logs/dev.log

# Chrome日志
tail -f .wxt/chrome-data/chrome_debug.log
```

## 🚀 升级和维护

### 定期维护任务
1. **每周**：清理所有缓存文件
2. **每月**：更新WXT和相关依赖
3. **每季度**：检查和优化配置

### 版本升级注意事项
- 升级WXT前备份配置文件
- 测试新版本的兼容性
- 更新启动脚本和监控工具

## 📞 获取帮助

如果问题仍然存在：

1. **查看日志**：检查详细错误信息
2. **使用监控工具**：运行状态检查
3. **社区支持**：查看WXT官方文档和GitHub Issues
4. **重置环境**：作为最后手段，完全重置开发环境

---

**最后更新**：2024-01-XX  
**维护者**：开发团队  
**版本**：1.0.0
