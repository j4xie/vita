#!/bin/bash

# TestFlight发布脚本 (开发环境)
# 用法: ./scripts/testflight-release.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要工具
check_dependencies() {
    print_status "检查依赖工具..."

    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI 未安装。请运行: npm install -g @expo/eas-cli"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，将跳过版本检查"
    fi

    print_success "依赖检查完成"
}

# 检查当前版本
check_version() {
    print_status "检查当前版本..."

    if command -v jq &> /dev/null; then
        VERSION=$(jq -r '.version' package.json)
        BUILD_NUMBER=$(jq -r '.expo.ios.buildNumber' app.json)
        print_status "当前版本: ${VERSION} (Build: ${BUILD_NUMBER})"
    fi
}

# 运行预检查
run_prechecks() {
    print_status "运行发布前检查..."

    # TypeScript检查
    print_status "检查TypeScript..."
    if npm run type-check; then
        print_success "TypeScript检查通过"
    else
        print_error "TypeScript检查失败"
        exit 1
    fi

    # ESLint检查
    print_status "检查代码规范..."
    if npm run lint; then
        print_success "代码规范检查通过"
    else
        print_error "代码规范检查失败"
        exit 1
    fi

    print_success "预检查完成"
}

# 确认发布
confirm_release() {
    print_warning "即将发布到TestFlight (开发环境):"
    echo "  - API服务器: http://106.14.165.234:8085"
    echo "  - 环境标识: development"
    echo "  - 目标平台: TestFlight"
    echo ""

    read -p "确认继续发布? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "发布已取消"
        exit 0
    fi
}

# 构建应用
build_app() {
    print_status "开始构建iOS应用 (staging profile)..."

    if eas build --platform ios --profile staging --non-interactive; then
        print_success "应用构建完成"
    else
        print_error "应用构建失败"
        exit 1
    fi
}

# 提交到TestFlight
submit_to_testflight() {
    print_status "提交到TestFlight..."

    if eas submit --platform ios --profile staging --latest --non-interactive; then
        print_success "已成功提交到TestFlight"
        print_status "请查看邮件确认上传状态"
        print_status "TestFlight通常需要30-60分钟处理"
    else
        print_error "提交到TestFlight失败"
        exit 1
    fi
}

# 主函数
main() {
    echo "🚀 PomeloX TestFlight 发布脚本"
    echo "================================"

    check_dependencies
    check_version
    run_prechecks
    confirm_release
    build_app
    submit_to_testflight

    echo ""
    print_success "🎉 TestFlight发布流程完成!"
    print_status "📱 请在TestFlight中测试应用功能"
    print_status "🔗 App Store Connect: https://appstoreconnect.apple.com"
}

# 执行主函数
main "$@"