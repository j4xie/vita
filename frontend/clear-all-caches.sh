#!/bin/bash

# 优惠券功能翻译修复 - 清除所有缓存脚本
# 使用方法: ./clear-all-caches.sh

echo "🧹 开始清除所有缓存..."

# 1. 清除Metro bundler缓存
echo "📦 清除Metro bundler缓存..."
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 2. 清除Expo缓存
echo "🎯 清除Expo缓存..."
rm -rf .expo

# 3. 清除watchman缓存
echo "👁️  清除watchman缓存..."
watchman watch-del-all 2>/dev/null || echo "watchman未安装，跳过"

# 4. 清除iOS构建缓存
echo "📱 清除iOS构建缓存..."
rm -rf ios/build

# 5. 清除yarn/npm缓存（可选）
echo "📦 清除包管理器缓存..."
npm cache clean --force 2>/dev/null || echo "跳过npm缓存清理"
yarn cache clean 2>/dev/null || echo "跳过yarn缓存清理"

echo ""
echo "✅ 所有缓存已清除！"
echo ""
echo "📋 下一步操作:"
echo "1. 运行: npx react-native start --reset-cache"
echo "2. 在新终端运行: npm run ios:dev"
echo "3. 在模拟器中完全关闭并重新打开应用"
echo ""
