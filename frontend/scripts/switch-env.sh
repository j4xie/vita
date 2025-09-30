#!/bin/bash
# =====================================================
# PomeloX 环境切换脚本 (Environment Switcher)
# 作者: Claude Code Assistant
# 用途: 一键切换开发/生产环境配置
# =====================================================

# 定义颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查环境状态
check_env_status() {
    log_info "检查当前环境状态..."

    if [ -f .env.development ]; then
        ENV_TYPE="development"
        ENV_NAME="开发环境"
        API_URL="http://106.14.165.234:8085"
        ENV_DISPLAY="测试环境"
    else
        ENV_TYPE="production"
        ENV_NAME="生产环境"
        API_URL="https://www.vitaglobal.icu"
        ENV_DISPLAY="正式环境"
    fi

    echo -e "\n📊 当前环境状态:"
    echo -e "   环境类型: ${ENV_NAME} (${ENV_TYPE})"
    echo -e "   API地址: ${API_URL}"
    echo -e "   显示名称: ${ENV_DISPLAY}"
    echo ""
}

# 停止运行中的 Expo 服务器
stop_expo_server() {
    log_info "检测运行中的 Expo 服务器..."

    # 查找 expo start 进程
    EXPO_PIDS=$(ps aux | grep "expo start\|expo run\|metro" | grep -v grep | awk '{print $2}')

    if [ -n "$EXPO_PIDS" ]; then
        log_info "发现运行中的 Expo 进程，正在停止..."
        echo "$EXPO_PIDS" | xargs kill -9 2>/dev/null
        sleep 2
        log_success "已停止 Expo 服务器"
    else
        log_info "没有检测到运行中的 Expo 服务器"
    fi
}

# 重启 Expo 服务器
restart_expo_server() {
    log_info "重启 Expo 服务器..."

    # 清理缓存
    clean_cache

    log_info "启动 Expo 服务器 (后台运行)..."
    echo -e "   端口: 8082"
    echo -e "   命令: npx expo start --port 8082 --clear --reset-cache"
    echo ""

    # 在后台启动 Expo
    nohup npx expo start --port 8082 --clear --reset-cache > expo-server.log 2>&1 &
    EXPO_PID=$!

    sleep 3

    # 检查进程是否成功启动
    if ps -p $EXPO_PID > /dev/null; then
        log_success "Expo 服务器已启动 (PID: $EXPO_PID)"
        log_info "日志输出: expo-server.log"
        echo ""
        log_warning "等待 Metro 打包完成 (约20-30秒)..."
        log_info "完成后可访问: http://localhost:8082"
    else
        log_error "Expo 服务器启动失败，请检查 expo-server.log"
        exit 1
    fi
}

# 切换到开发环境
switch_to_dev() {
    log_info "切换到开发环境..."

    # 恢复开发环境文件
    if [ -f .env.development.backup ]; then
        mv .env.development.backup .env.development
        log_success "已恢复开发环境配置文件"
    elif [ ! -f .env.development ]; then
        log_error "找不到开发环境配置文件 (.env.development 或 .env.development.backup)"
        log_error "请检查环境文件是否存在"
        exit 1
    fi

    # 应用开发环境配置
    cp .env.development .env
    log_success "已应用开发环境配置"

    # 检查是否需要自动重启
    if [ "$AUTO_RESTART" = true ]; then
        log_info "自动重启模式已启用"
        stop_expo_server
        restart_expo_server
    else
        # 提示需要重启
        log_warning "请重启 Expo 开发服务器以应用新配置:"
        echo -e "   ${YELLOW}1. 停止当前服务 (Ctrl+C)${NC}"
        echo -e "   ${YELLOW}2. 运行: npx expo start --clear --reset-cache${NC}"
        echo -e "   ${YELLOW}或直接运行: npm run dev:full${NC}"
    fi

    log_success "开发环境切换完成! 🔧"
    echo -e "   API服务器: http://106.14.165.234:8085"
    echo -e "   环境标识: 测试环境"
}

# 切换到生产环境
switch_to_prod() {
    log_info "切换到生产环境..."

    # 备份开发环境文件
    if [ -f .env.development ]; then
        mv .env.development .env.development.backup
        log_success "已备份开发环境配置文件"
    fi

    # 应用生产环境配置
    if [ ! -f .env.production ]; then
        log_error "找不到生产环境配置文件 (.env.production)"
        log_error "请检查环境文件是否存在"
        exit 1
    fi

    cp .env.production .env
    log_success "已应用生产环境配置"

    # 检查是否需要自动重启
    if [ "$AUTO_RESTART" = true ]; then
        log_info "自动重启模式已启用"
        stop_expo_server
        restart_expo_server
    else
        # 提示需要重启
        log_warning "请重启 Expo 开发服务器以应用新配置:"
        echo -e "   ${YELLOW}1. 停止当前服务 (Ctrl+C)${NC}"
        echo -e "   ${YELLOW}2. 运行: npx expo start --clear --reset-cache${NC}"
        echo -e "   ${YELLOW}或直接运行: npm run prod:full${NC}"
    fi

    log_success "生产环境切换完成! 🚀"
    echo -e "   API服务器: https://www.vitaglobal.icu"
    echo -e "   环境标识: 正式环境"
}

# 清理缓存
clean_cache() {
    log_info "清理项目缓存..."

    # 清理 Expo 缓存
    if [ -d .expo ]; then
        rm -rf .expo
        log_success "已清理 Expo 缓存"
    fi

    # 清理 Node.js 缓存
    if [ -d node_modules/.cache ]; then
        rm -rf node_modules/.cache
        log_success "已清理 Node.js 缓存"
    fi

    # 清理其他缓存文件
    if [ -f .tsbuildinfo ]; then
        rm -f .tsbuildinfo
        log_success "已清理 TypeScript 缓存"
    fi

    if [ -f .eslintcache ]; then
        rm -f .eslintcache
        log_success "已清理 ESLint 缓存"
    fi

    log_success "缓存清理完成! 🧹"
}

# 显示帮助信息
show_help() {
    echo -e "\n🔄 PomeloX 环境切换工具"
    echo -e "=========================="
    echo ""
    echo -e "${GREEN}用法:${NC}"
    echo -e "  ./scripts/switch-env.sh <命令>"
    echo ""
    echo -e "${GREEN}可用命令:${NC}"
    echo -e "  ${BLUE}dev${NC}, ${BLUE}development${NC}    切换到开发环境 (测试服务器)"
    echo -e "  ${BLUE}prod${NC}, ${BLUE}production${NC}    切换到生产环境 (正式服务器)"
    echo -e "  ${BLUE}status${NC}               显示当前环境状态"
    echo -e "  ${BLUE}clean${NC}                清理项目缓存"
    echo -e "  ${BLUE}help${NC}                 显示此帮助信息"
    echo ""
    echo -e "${GREEN}示例:${NC}"
    echo -e "  ./scripts/switch-env.sh dev      # 切换到开发环境"
    echo -e "  ./scripts/switch-env.sh prod     # 切换到生产环境"
    echo -e "  ./scripts/switch-env.sh status   # 查看当前环境"
    echo -e "  ./scripts/switch-env.sh clean    # 清理缓存"
    echo ""
    echo -e "${YELLOW}注意事项:${NC}"
    echo -e "  - 切换环境后需要重启 Expo 开发服务器"
    echo -e "  - 建议在切换前清理缓存以避免配置冲突"
    echo -e "  - 确保 .env.development 和 .env.production 文件存在"
    echo ""
}

# 主程序逻辑
main() {
    # 检查是否在正确的目录
    if [ ! -f package.json ] || [ ! -f .env.production ]; then
        log_error "请在 PomeloX frontend 项目根目录下运行此脚本"
        log_error "当前目录: $(pwd)"
        exit 1
    fi

    # 检查是否有 --auto-restart 参数
    AUTO_RESTART=false
    if [ "$2" = "--auto-restart" ]; then
        AUTO_RESTART=true
    fi

    case "$1" in
        dev|development)
            switch_to_dev
            ;;
        prod|production)
            switch_to_prod
            ;;
        status)
            check_env_status
            ;;
        clean)
            clean_cache
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            log_error "请指定操作命令"
            show_help
            exit 1
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主程序
main "$1" "$2"