#!/bin/bash

# WXT智能开发服务器启动脚本
# 解决Chrome进程锁定和端口占用问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME_DATA_DIR="$PROJECT_ROOT/.wxt/chrome-data"
LOCK_FILE="$CHROME_DATA_DIR/SingletonLock"

echo -e "${BLUE}🚀 WXT智能开发服务器启动器${NC}"
echo "项目目录: $PROJECT_ROOT"

# 1. 检查并清理Chrome进程
cleanup_chrome_processes() {
    echo -e "${YELLOW}🔍 检查Chrome进程...${NC}"
    
    # 查找使用项目Chrome数据目录的进程
    CHROME_PIDS=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$CHROME_PIDS" ]; then
        echo -e "${YELLOW}⚠️  发现残留Chrome进程: $CHROME_PIDS${NC}"
        echo -e "${YELLOW}🧹 清理Chrome进程...${NC}"
        
        # 优雅终止
        echo "$CHROME_PIDS" | xargs -r kill -TERM 2>/dev/null || true
        sleep 2
        
        # 强制终止仍在运行的进程
        REMAINING_PIDS=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep | awk '{print $2}' || true)
        if [ -n "$REMAINING_PIDS" ]; then
            echo -e "${RED}💀 强制终止顽固进程...${NC}"
            echo "$REMAINING_PIDS" | xargs -r kill -KILL 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ Chrome进程清理完成${NC}"
    else
        echo -e "${GREEN}✅ 没有发现残留Chrome进程${NC}"
    fi
}

# 2. 清理锁定文件
cleanup_lock_files() {
    echo -e "${YELLOW}🔒 检查锁定文件...${NC}"
    
    if [ -L "$LOCK_FILE" ] || [ -f "$LOCK_FILE" ]; then
        echo -e "${YELLOW}🗑️  删除锁定文件: $LOCK_FILE${NC}"
        rm -f "$LOCK_FILE" 2>/dev/null || true
        echo -e "${GREEN}✅ 锁定文件清理完成${NC}"
    else
        echo -e "${GREEN}✅ 没有发现锁定文件${NC}"
    fi
    
    # 清理其他可能的锁定文件
    if [ -d "$CHROME_DATA_DIR" ]; then
        find "$CHROME_DATA_DIR" -name "SingletonSocket" -delete 2>/dev/null || true
        find "$CHROME_DATA_DIR" -name "SingletonCookie" -delete 2>/dev/null || true
    fi
}

# 3. 检查端口占用
check_ports() {
    echo -e "${YELLOW}🌐 检查端口占用...${NC}"
    
    # 检查3000端口
    if lsof -ti:3000 >/dev/null 2>&1; then
        PORT_PID=$(lsof -ti:3000)
        echo -e "${YELLOW}⚠️  端口3000被占用 (PID: $PORT_PID)${NC}"
        
        # 检查是否是WXT相关进程
        if ps -p "$PORT_PID" -o command= | grep -q "wxt\|vite"; then
            echo -e "${YELLOW}🔄 终止旧的WXT进程...${NC}"
            kill -TERM "$PORT_PID" 2>/dev/null || true
            sleep 2
            
            # 如果还在运行，强制终止
            if kill -0 "$PORT_PID" 2>/dev/null; then
                kill -KILL "$PORT_PID" 2>/dev/null || true
            fi
            echo -e "${GREEN}✅ 旧WXT进程已终止${NC}"
        else
            echo -e "${RED}❌ 端口3000被其他进程占用，请手动处理${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ 端口3000可用${NC}"
    fi
}

# 4. 清理缓存（可选）
cleanup_cache() {
    if [ "$1" = "--clean-cache" ]; then
        echo -e "${YELLOW}🧹 清理WXT缓存...${NC}"
        
        # 清理输出目录
        if [ -d "$PROJECT_ROOT/.output" ]; then
            rm -rf "$PROJECT_ROOT/.output"
            echo -e "${GREEN}✅ .output目录已清理${NC}"
        fi
        
        # 清理WXT缓存
        if [ -d "$PROJECT_ROOT/node_modules/.wxt" ]; then
            rm -rf "$PROJECT_ROOT/node_modules/.wxt"
            echo -e "${GREEN}✅ node_modules/.wxt已清理${NC}"
        fi
        
        # 清理Vite缓存
        if [ -d "$PROJECT_ROOT/node_modules/.cache" ]; then
            rm -rf "$PROJECT_ROOT/node_modules/.cache"
            echo -e "${GREEN}✅ Vite缓存已清理${NC}"
        fi
    fi
}

# 5. 启动开发服务器
start_dev_server() {
    echo -e "${BLUE}🚀 启动WXT开发服务器...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # 设置环境变量
    export NODE_ENV=development
    export WXT_DEV_SERVER_PORT=3000
    
    # 启动开发服务器（直接调用wxt，避免循环）
    pnpm run dev:original
}

# 6. 信号处理 - 确保清理
cleanup_on_exit() {
    echo -e "\n${YELLOW}🛑 收到退出信号，清理资源...${NC}"
    cleanup_chrome_processes
    cleanup_lock_files
    exit 0
}

# 注册信号处理器
trap cleanup_on_exit SIGINT SIGTERM

# 主执行流程
main() {
    echo -e "${BLUE}开始清理和检查...${NC}"
    
    # 执行清理步骤
    cleanup_chrome_processes
    cleanup_lock_files
    check_ports
    cleanup_cache "$1"
    
    echo -e "${GREEN}🎉 环境准备完成，启动开发服务器...${NC}"
    echo -e "${BLUE}按 Ctrl+C 停止服务器${NC}"
    echo ""
    
    # 启动开发服务器
    start_dev_server
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --clean-cache    清理所有缓存文件"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                # 正常启动"
    echo "  $0 --clean-cache  # 清理缓存后启动"
}

# 参数处理
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac
