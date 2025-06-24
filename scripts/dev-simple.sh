#!/bin/bash

# WXT简化启动脚本 - 每次使用新的浏览器实例
# 解决Chrome进程锁定问题的最简方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WXT_DIR="$PROJECT_ROOT/.wxt"

echo -e "${BLUE}🚀 WXT简化启动器 - 全新浏览器实例${NC}"
echo "项目目录: $PROJECT_ROOT"

# 清理旧的Chrome数据目录
cleanup_old_chrome_data() {
    echo -e "${YELLOW}🧹 清理旧的Chrome数据目录...${NC}"
    
    if [ -d "$WXT_DIR" ]; then
        # 查找并删除旧的chrome-data-*目录（保留最近的3个）
        find "$WXT_DIR" -name "chrome-data-*" -type d -print0 | \
        xargs -0 ls -dt | \
        tail -n +4 | \
        xargs -r rm -rf
        
        local cleaned_count=$(find "$WXT_DIR" -name "chrome-data-*" -type d | wc -l)
        echo -e "${GREEN}✅ 保留最近的 $cleaned_count 个Chrome数据目录${NC}"
    else
        echo -e "${GREEN}✅ 没有旧的Chrome数据目录需要清理${NC}"
    fi
}

# 清理残留的Chrome进程（如果有的话）
cleanup_chrome_processes() {
    echo -e "${YELLOW}🔍 检查残留的Chrome进程...${NC}"
    
    # 查找使用项目目录的Chrome进程
    local chrome_pids=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$chrome_pids" ]; then
        echo -e "${YELLOW}⚠️  发现残留Chrome进程，正在清理...${NC}"
        echo "$chrome_pids" | xargs -r kill -TERM 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ Chrome进程清理完成${NC}"
    else
        echo -e "${GREEN}✅ 没有残留的Chrome进程${NC}"
    fi
}

# 检查端口占用
check_port() {
    echo -e "${YELLOW}🌐 检查端口3000...${NC}"
    
    if lsof -ti:3000 >/dev/null 2>&1; then
        local port_pid=$(lsof -ti:3000)
        local process_name=$(ps -p "$port_pid" -o comm= 2>/dev/null || echo "unknown")
        
        if [[ "$process_name" == *"node"* ]] || [[ "$process_name" == *"wxt"* ]]; then
            echo -e "${YELLOW}⚠️  端口3000被旧的开发服务器占用，正在清理...${NC}"
            kill -TERM "$port_pid" 2>/dev/null || true
            sleep 2
            echo -e "${GREEN}✅ 端口清理完成${NC}"
        else
            echo -e "${RED}❌ 端口3000被其他进程占用: $process_name (PID: $port_pid)${NC}"
            echo -e "${YELLOW}请手动处理或使用其他端口${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ 端口3000可用${NC}"
    fi
}

# 启动开发服务器
start_dev_server() {
    echo -e "${BLUE}🚀 启动WXT开发服务器（全新浏览器实例）...${NC}"
    echo -e "${BLUE}每次启动都会使用全新的Chrome实例，避免进程冲突${NC}"
    echo -e "${BLUE}按 Ctrl+C 停止服务器${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # 设置环境变量
    export NODE_ENV=development
    export WXT_DEV_SERVER_PORT=3000
    
    # 启动开发服务器（直接调用wxt，避免循环）
    pnpm run dev:original
}

# 信号处理 - 确保清理
cleanup_on_exit() {
    echo -e "\n${YELLOW}🛑 收到退出信号，清理当前Chrome实例...${NC}"
    
    # 清理当前启动的Chrome进程
    local current_chrome_pids=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data-" | grep -v grep | awk '{print $2}' || true)
    if [ -n "$current_chrome_pids" ]; then
        echo "$current_chrome_pids" | xargs -r kill -TERM 2>/dev/null || true
        sleep 1
        # 如果还有残留，强制终止
        local remaining_pids=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data-" | grep -v grep | awk '{print $2}' || true)
        if [ -n "$remaining_pids" ]; then
            echo "$remaining_pids" | xargs -r kill -KILL 2>/dev/null || true
        fi
    fi
    
    echo -e "${GREEN}✅ 清理完成${NC}"
    exit 0
}

# 注册信号处理器
trap cleanup_on_exit SIGINT SIGTERM

# 显示帮助信息
show_help() {
    echo "WXT简化启动脚本 - 每次使用全新浏览器实例"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --clean-all      清理所有Chrome数据目录"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "特性:"
    echo "  ✅ 每次启动使用全新Chrome实例"
    echo "  ✅ 自动清理旧的数据目录"
    echo "  ✅ 避免进程锁定冲突"
    echo "  ✅ 简单可靠的解决方案"
    echo ""
    echo "示例:"
    echo "  $0                # 正常启动"
    echo "  $0 --clean-all    # 清理所有数据后启动"
}

# 清理所有Chrome数据目录
clean_all_chrome_data() {
    echo -e "${YELLOW}🧹 清理所有Chrome数据目录...${NC}"
    
    if [ -d "$WXT_DIR" ]; then
        find "$WXT_DIR" -name "chrome-data-*" -type d -exec rm -rf {} + 2>/dev/null || true
        echo -e "${GREEN}✅ 所有Chrome数据目录已清理${NC}"
    else
        echo -e "${GREEN}✅ 没有Chrome数据目录需要清理${NC}"
    fi
}

# 主执行流程
main() {
    case "${1:-}" in
        --clean-all)
            clean_all_chrome_data
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        "")
            # 正常启动流程
            echo -e "${BLUE}开始准备全新的开发环境...${NC}"
            
            cleanup_old_chrome_data
            cleanup_chrome_processes
            check_port
            
            echo -e "${GREEN}🎉 环境准备完成！${NC}"
            echo -e "${BLUE}即将启动全新的Chrome实例...${NC}"
            echo ""
            
            start_dev_server
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
