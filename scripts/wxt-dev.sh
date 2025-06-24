#!/bin/bash

# WXT开发服务器启动脚本 - 避免循环调用
# 直接调用WXT，不通过npm脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}🚀 WXT开发服务器直接启动器${NC}"
echo "项目目录: $PROJECT_ROOT"

# 清理旧的Chrome数据目录
cleanup_old_chrome_data() {
    echo -e "${YELLOW}🧹 清理旧的Chrome数据目录...${NC}"
    
    local wxt_dir="$PROJECT_ROOT/.wxt"
    if [ -d "$wxt_dir" ]; then
        # 查找并删除旧的chrome-data-*目录（保留最近的3个）
        find "$wxt_dir" -name "chrome-data-*" -type d -print0 | \
        xargs -0 ls -dt | \
        tail -n +4 | \
        xargs -r rm -rf
        
        local cleaned_count=$(find "$wxt_dir" -name "chrome-data-*" -type d | wc -l)
        echo -e "${GREEN}✅ 保留最近的 $cleaned_count 个Chrome数据目录${NC}"
    else
        echo -e "${GREEN}✅ 没有旧的Chrome数据目录需要清理${NC}"
    fi
}

# 清理残留的Chrome进程
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

# 查找可用端口
find_available_port() {
    local start_port=${1:-3000}
    local max_port=$((start_port + 20))  # 最多尝试20个端口
    local port=$start_port
    
    echo -e "${YELLOW}🌐 查找可用端口...${NC}" >&2
    
    while [ $port -le $max_port ]; do
        if ! lsof -ti:$port >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 找到可用端口: $port${NC}" >&2
            echo "$port"  # 只有这个输出到stdout
            return 0
        else
            local port_pid=$(lsof -ti:$port)
            local process_name=$(ps -p "$port_pid" -o comm= 2>/dev/null || echo "unknown")
            
            # 如果是已知的开发服务器进程，尝试清理
            if [[ "$process_name" == *"node"* ]] || [[ "$process_name" == *"wxt"* ]] || [[ "$process_name" == *"vite"* ]]; then
                echo -e "${YELLOW}⚠️  端口$port被旧的开发服务器占用 ($process_name)，正在清理...${NC}" >&2
                kill -TERM "$port_pid" 2>/dev/null || true
                sleep 1
                
                # 再次检查是否清理成功
                if ! lsof -ti:$port >/dev/null 2>&1; then
                    echo -e "${GREEN}✅ 端口$port清理完成，使用此端口${NC}" >&2
                    echo "$port"  # 只有这个输出到stdout
                    return 0
                fi
            else
                echo -e "${YELLOW}⚠️  端口$port被占用: $process_name (PID: $port_pid)，尝试下一个端口...${NC}" >&2
            fi
        fi
        
        port=$((port + 1))
    done
    
    echo -e "${RED}❌ 在$start_port-$max_port范围内未找到可用端口${NC}" >&2
    exit 1
}

# 启动WXT开发服务器
start_wxt_dev() {
    local port=${1:-3000}
    
    echo -e "${BLUE}🚀 启动WXT开发服务器...${NC}"
    echo -e "${BLUE}使用端口: $port${NC}"
    echo -e "${BLUE}使用全新的Chrome实例，避免进程冲突${NC}"
    echo -e "${BLUE}按 Ctrl+C 停止服务器${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # 设置环境变量
    export NODE_ENV=development
    export WXT_DEV_SERVER_PORT=$port
    
    # 显示开发服务器URL
    echo -e "${GREEN}🌐 开发服务器将在以下地址启动:${NC}"
    echo -e "${GREEN}   Local:   http://localhost:$port${NC}"
    local network_ip=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
    echo -e "${GREEN}   Network: http://$network_ip:$port${NC}"
    echo ""
    
    # 直接调用WXT，避免npm脚本循环
    npx wxt --port "$port"
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
    echo "WXT开发服务器直接启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --clean-all      清理所有Chrome数据目录"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "特性:"
    echo "  ✅ 直接调用WXT，避免npm脚本循环"
    echo "  ✅ 每次启动使用全新Chrome实例"
    echo "  ✅ 自动清理旧的数据目录"
    echo "  ✅ 避免进程锁定冲突"
    echo "  ✅ 智能端口选择（3000-3020）"
    echo "  ✅ 自动清理已知开发服务器进程"
    echo ""
    echo "示例:"
    echo "  $0                # 正常启动"
    echo "  $0 --clean-all    # 清理所有数据后启动"
}

# 清理所有Chrome数据目录
clean_all_chrome_data() {
    echo -e "${YELLOW}🧹 清理所有Chrome数据目录...${NC}"
    
    local wxt_dir="$PROJECT_ROOT/.wxt"
    if [ -d "$wxt_dir" ]; then
        find "$wxt_dir" -name "chrome-data-*" -type d -exec rm -rf {} + 2>/dev/null || true
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
            echo -e "${BLUE}开始准备开发环境...${NC}"
            
            cleanup_old_chrome_data
            cleanup_chrome_processes
            
            # 查找可用端口
            local available_port=$(find_available_port 3000)
            
            echo -e "${GREEN}🎉 环境准备完成！${NC}"
            echo ""
            
            start_wxt_dev "$available_port"
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
