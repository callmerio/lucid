#!/bin/bash

# WXT开发服务器监控脚本
# 监控Chrome进程和端口状态，自动处理异常情况

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME_DATA_DIR="$PROJECT_ROOT/.wxt/chrome-data"
MONITOR_INTERVAL=10  # 监控间隔（秒）
MAX_CHROME_PROCESSES=20  # Chrome进程数量警告阈值

# 日志函数
log_info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO: $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARN: $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] SUCCESS: $1${NC}"
}

# 检查Chrome进程数量
check_chrome_processes() {
    local chrome_count=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep | wc -l)
    
    if [ "$chrome_count" -gt "$MAX_CHROME_PROCESSES" ]; then
        log_warn "Chrome进程数量过多: $chrome_count (阈值: $MAX_CHROME_PROCESSES)"
        return 1
    elif [ "$chrome_count" -gt 0 ]; then
        log_info "Chrome进程数量: $chrome_count"
        return 0
    else
        log_info "没有Chrome进程运行"
        return 0
    fi
}

# 检查端口状态
check_port_status() {
    local port=3000
    
    if lsof -ti:$port >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
        log_info "端口 $port 被占用 (PID: $pid, 进程: $process_name)"
        return 0
    else
        log_warn "端口 $port 未被占用 - WXT可能未运行"
        return 1
    fi
}

# 检查锁定文件
check_lock_files() {
    local lock_file="$CHROME_DATA_DIR/SingletonLock"
    
    if [ -L "$lock_file" ] || [ -f "$lock_file" ]; then
        local lock_target=$(readlink "$lock_file" 2>/dev/null || echo "文件")
        log_info "发现锁定文件: $lock_target"
        return 0
    else
        log_info "没有锁定文件"
        return 0
    fi
}

# 自动清理异常状态
auto_cleanup() {
    log_warn "检测到异常状态，开始自动清理..."
    
    # 清理Chrome进程
    local chrome_pids=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$chrome_pids" ]; then
        log_info "清理Chrome进程: $chrome_pids"
        echo "$chrome_pids" | xargs -r kill -TERM 2>/dev/null || true
        sleep 3
        
        # 检查是否还有残留进程
        local remaining_pids=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep | awk '{print $2}' || true)
        if [ -n "$remaining_pids" ]; then
            log_warn "强制终止残留进程: $remaining_pids"
            echo "$remaining_pids" | xargs -r kill -KILL 2>/dev/null || true
        fi
    fi
    
    # 清理锁定文件
    local lock_file="$CHROME_DATA_DIR/SingletonLock"
    if [ -L "$lock_file" ] || [ -f "$lock_file" ]; then
        log_info "清理锁定文件"
        rm -f "$lock_file" 2>/dev/null || true
    fi
    
    # 清理其他锁定相关文件
    if [ -d "$CHROME_DATA_DIR" ]; then
        find "$CHROME_DATA_DIR" -name "SingletonSocket" -delete 2>/dev/null || true
        find "$CHROME_DATA_DIR" -name "SingletonCookie" -delete 2>/dev/null || true
    fi
    
    log_success "自动清理完成"
}

# 显示系统状态
show_status() {
    echo -e "${BLUE}=== WXT开发环境状态 ===${NC}"
    echo "时间: $(date)"
    echo "项目目录: $PROJECT_ROOT"
    echo ""
    
    # Chrome进程状态
    echo -e "${YELLOW}Chrome进程:${NC}"
    local chrome_processes=$(ps aux | grep -E "chrome.*--user-data-dir=.*\.wxt/chrome-data" | grep -v grep || true)
    if [ -n "$chrome_processes" ]; then
        echo "$chrome_processes" | while read line; do
            echo "  $line"
        done
    else
        echo "  无Chrome进程运行"
    fi
    echo ""
    
    # 端口状态
    echo -e "${YELLOW}端口状态:${NC}"
    if lsof -ti:3000 >/dev/null 2>&1; then
        local pid=$(lsof -ti:3000)
        local process_info=$(ps -p "$pid" -o pid,ppid,comm,args 2>/dev/null || echo "PID $pid 进程信息获取失败")
        echo "  端口3000: 被占用"
        echo "  $process_info"
    else
        echo "  端口3000: 空闲"
    fi
    echo ""
    
    # 锁定文件状态
    echo -e "${YELLOW}锁定文件:${NC}"
    local lock_file="$CHROME_DATA_DIR/SingletonLock"
    if [ -L "$lock_file" ] || [ -f "$lock_file" ]; then
        local lock_target=$(readlink "$lock_file" 2>/dev/null || echo "文件")
        echo "  锁定文件: 存在 → $lock_target"
    else
        echo "  锁定文件: 不存在"
    fi
    echo ""
}

# 监控主循环
monitor_loop() {
    log_info "开始监控WXT开发环境 (间隔: ${MONITOR_INTERVAL}s)"
    log_info "按 Ctrl+C 停止监控"
    
    while true; do
        local issues=0
        
        # 检查各项状态
        if ! check_chrome_processes; then
            issues=$((issues + 1))
        fi
        
        if ! check_port_status; then
            issues=$((issues + 1))
        fi
        
        check_lock_files
        
        # 如果发现问题且启用自动清理
        if [ "$issues" -gt 1 ] && [ "${AUTO_CLEANUP:-false}" = "true" ]; then
            auto_cleanup
        fi
        
        sleep "$MONITOR_INTERVAL"
    done
}

# 信号处理
cleanup_on_exit() {
    echo -e "\n${YELLOW}监控已停止${NC}"
    exit 0
}

trap cleanup_on_exit SIGINT SIGTERM

# 显示帮助信息
show_help() {
    echo "WXT开发服务器监控脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --status         显示当前状态"
    echo "  --cleanup        执行一次性清理"
    echo "  --monitor        启动监控模式"
    echo "  --auto-cleanup   启动监控模式并启用自动清理"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --status           # 查看当前状态"
    echo "  $0 --cleanup          # 清理异常状态"
    echo "  $0 --monitor          # 启动监控"
    echo "  $0 --auto-cleanup     # 启动监控并自动清理"
}

# 主函数
main() {
    case "${1:---status}" in
        --status|-s)
            show_status
            ;;
        --cleanup|-c)
            auto_cleanup
            ;;
        --monitor|-m)
            monitor_loop
            ;;
        --auto-cleanup|-a)
            AUTO_CLEANUP=true
            monitor_loop
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
