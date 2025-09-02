#!/bin/bash

# 一键发布到TestFlight脚本
# 自动处理版本递增、构建、提交的完整流程

set -e  # 遇到错误立即退出

echo "🚀 开始PomeloX一键发布流程..."

# 1. 自动递增版本号
echo "📝 Step 1/4: 自动递增版本号"
node scripts/update-version.js patch

# 2. 构建iOS版本
echo "🔨 Step 2/4: 构建iOS版本"
export EXPO_APPLE_ID="dev@americanpromotioncompany.com"
eas build --platform ios --profile production --non-interactive --wait

# 3. 提交到TestFlight
echo "📱 Step 3/4: 提交到TestFlight"
eas submit --platform ios --profile production --latest --non-interactive

# 4. 完成通知
echo "✅ Step 4/4: 发布完成!"
echo ""
echo "🎉 新版本已成功构建并提交到TestFlight!"
echo "📱 预计5-10分钟后在TestFlight中可用"
echo "📧 Apple处理完成后会发送邮件通知"

# 显示版本信息
NEW_VERSION=$(node -p "require('./app.json').expo.version")
echo "📊 发布版本: $NEW_VERSION"