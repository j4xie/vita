#!/bin/bash

# PomeloX环境切换脚本
# 用法: ./switch-env.sh [test|prod|status]

set -e

ENV_ARG=${1:-"status"}

case $ENV_ARG in
  "test"|"dev"|"development")
    echo "🔄 切换到测试环境..."
    cp .env.development .env
    echo "📡 API地址: http://106.14.165.234:8085"
    echo "🔧 环境: development"
    echo "✅ 测试环境配置已激活"
    echo ""
    echo "🚀 启动应用: npm run ios"
    ;;

  "prod"|"production")
    echo "🔄 切换到生产环境..."
    cp .env.production .env
    echo "📡 API地址: https://www.vitaglobal.icu"
    echo "🔧 环境: production"
    echo "✅ 生产环境配置已激活"
    echo ""
    echo "🚀 启动应用: npm run ios"
    ;;

  "status"|"check")
    echo "🔍 当前环境状态:"
    echo ""
    if [ -f .env ]; then
      CURRENT_ENV=$(grep "EXPO_PUBLIC_ENVIRONMENT=" .env | cut -d'=' -f2)
      CURRENT_API=$(grep "EXPO_PUBLIC_API_URL=" .env | cut -d'=' -f2)
      echo "🌍 当前环境: $CURRENT_ENV"
      echo "📡 API地址: $CURRENT_API"

      if [ "$CURRENT_ENV" = "development" ]; then
        echo "🧪 模式: 测试环境"
        echo "📋 期望看到的活动: 中秋国庆预热活动, UMN免费接机, UCSB免费接机"
      else
        echo "🏭 模式: 生产环境"
        echo "📋 期望看到的活动: UMN中秋嘉年华, UCLA 2025新生活动, UCSD开学大典"
      fi
    else
      echo "❌ 未找到.env文件"
    fi
    echo ""
    echo "💡 切换环境:"
    echo "   ./switch-env.sh test  # 切换到测试环境"
    echo "   ./switch-env.sh prod  # 切换到生产环境"
    ;;

  *)
    echo "❌ 无效参数: $ENV_ARG"
    echo ""
    echo "📖 用法:"
    echo "   ./switch-env.sh test     # 切换到测试环境"
    echo "   ./switch-env.sh prod     # 切换到生产环境"
    echo "   ./switch-env.sh status   # 查看当前环境状态"
    exit 1
    ;;
esac