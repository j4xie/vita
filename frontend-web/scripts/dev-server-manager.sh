#!/bin/bash
# 开发服务器管理脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PomeloX 开发服务器管理工具${NC}"
echo "=================================="

# 函数：检查端口使用情况
check_ports() {
    echo -e "${YELLOW}📊 检查端口使用情况...${NC}"
    for port in 8081 8082 8083 8084 8085; do
        if lsof -ti:$port > /dev/null 2>&1; then
            pid=$(lsof -ti:$port)
            echo -e "${RED}❌ 端口 $port 被占用 (PID: $pid)${NC}"
        else
            echo -e "${GREEN}✅ 端口 $port 可用${NC}"
        fi
    done
    echo ""
}

# 函数：清理所有开发服务器
cleanup_all() {
    echo -e "${YELLOW}🧹 清理所有开发服务器进程...${NC}"
    
    # 清理特定端口
    for port in 8081 8082 8083 8084 8085; do
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "正在终止端口 $port 上的进程..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # 清理Expo和Metro进程
    echo -e "正在清理Expo和Metro进程..."
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "metro" 2>/dev/null || true
    pkill -f "node_modules/.bin/expo" 2>/dev/null || true
    
    echo -e "${GREEN}✅ 清理完成${NC}"
    echo ""
}

# 函数：启动干净的开发服务器
start_clean() {
    echo -e "${YELLOW}🚀 启动干净的开发服务器...${NC}"
    cleanup_all
    sleep 2
    
    echo -e "正在启动Expo开发服务器..."
    npx expo start --clear --port 8081
}

# 函数：快速重启
restart() {
    echo -e "${YELLOW}🔄 快速重启开发服务器...${NC}"
    cleanup_all
    sleep 1
    start_clean
}

# 主菜单
case "$1" in
    "check")
        check_ports
        ;;
    "cleanup"|"clean")
        cleanup_all
        ;;
    "start")
        start_clean
        ;;
    "restart")
        restart
        ;;
    *)
        echo "使用方法:"
        echo "  $0 check    - 检查端口使用情况"
        echo "  $0 cleanup  - 清理所有开发服务器进程"
        echo "  $0 start    - 启动干净的开发服务器"
        echo "  $0 restart  - 快速重启开发服务器"
        echo ""
        check_ports
        ;;
esac