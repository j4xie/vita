#!/bin/bash

# App Store发布脚本 (生产环境)
# 用法: ./scripts/appstore-release.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_important() {
    echo -e "${PURPLE}[IMPORTANT]${NC} $1"
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

        # 检查是否为生产版本
        if [[ $VERSION == *"beta"* ]] || [[ $VERSION == *"alpha"* ]]; then
            print_warning "检测到测试版本号: $VERSION"
            print_warning "App Store发布建议使用正式版本号"
        fi
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

# 环境安全检查
check_production_environment() {
    print_status "检查生产环境配置..."

    # 检查API URL配置
    if grep -q "106.14.165.234" eas.json; then
        print_error "检测到测试环境API地址仍在配置中"
        print_error "请确保production profile使用生产环境API"
        exit 1
    fi

    # 检查调试模式
    if grep -q '"EXPO_PUBLIC_DEBUG_MODE": "true"' eas.json; then
        if grep -A 10 '"production":' eas.json | grep -q '"EXPO_PUBLIC_DEBUG_MODE": "true"'; then
            print_error "生产环境不应启用调试模式"
            exit 1
        fi
    fi

    print_success "生产环境配置检查通过"
}

# 生产发布确认
confirm_production_release() {
    print_important "⚠️  即将发布到App Store (生产环境) ⚠️"
    echo ""
    print_warning "生产发布配置:"
    echo "  - API服务器: https://www.vitaglobal.icu"
    echo "  - 环境标识: production"
    echo "  - 调试模式: 关闭"
    echo "  - 目标平台: App Store"
    echo ""
    print_important "此操作将提交应用到App Store审核队列!"
    print_warning "一旦提交，无法撤回，请确保:"
    echo "  ✓ 已在TestFlight充分测试"
    echo "  ✓ 所有功能正常工作"
    echo "  ✓ 版本号和发布说明正确"
    echo "  ✓ 符合App Store审核标准"
    echo ""

    read -p "确认提交到App Store审核? (输入 'YES' 确认): " -r
    if [[ $REPLY != "YES" ]]; then
        print_warning "App Store发布已取消"
        print_status "如需发布，请重新运行脚本并输入 'YES'"
        exit 0
    fi
}

# 构建生产版本
build_production() {
    print_status "开始构建iOS生产版本 (production profile)..."

    if eas build --platform ios --profile production --non-interactive; then
        print_success "生产版本构建完成"
    else
        print_error "生产版本构建失败"
        exit 1
    fi
}

# 提交到App Store
submit_to_appstore() {
    print_status "提交到App Store审核..."

    if eas submit --platform ios --profile production --latest --non-interactive; then
        print_success "🎉 已成功提交到App Store审核!"
        echo ""
        print_important "后续步骤:"
        echo "  1. 查看邮件确认提交状态"
        echo "  2. 登录App Store Connect完善应用信息"
        echo "  3. 等待审核结果 (通常24-48小时)"
        echo "  4. 审核通过后可选择立即发布或手动发布"
        echo ""
        print_status "🔗 App Store Connect: https://appstoreconnect.apple.com"
        print_status "📱 审核状态查看: My Apps > PomeloX > App Store"
    else
        print_error "提交到App Store失败"
        exit 1
    fi
}

# 主函数
main() {
    echo "🏪 PomeloX App Store 发布脚本"
    echo "============================="

    check_dependencies
    check_version
    check_production_environment
    run_prechecks
    confirm_production_release
    build_production
    submit_to_appstore

    echo ""
    print_success "🎊 App Store发布流程完成!"
    print_important "请密切关注审核状态和邮件通知"
}

# 执行主函数
main "$@"