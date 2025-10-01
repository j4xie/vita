#!/bin/bash

# 一键修复活动列表空白问题
# 这个脚本会完全清理缓存并重启应用

set -e

echo "=============================================="
echo "🔧 PomeloX 活动列表空白修复工具"
echo "=============================================="
echo ""

# 获取当前Expo进程
EXPO_PID=$(lsof -ti:8082 || echo "")

if [ ! -z "$EXPO_PID" ]; then
    echo "1️⃣ 停止现有的Expo开发服务器..."
    kill -9 $EXPO_PID 2>/dev/null || true
    echo "   ✅ 已停止 (PID: $EXPO_PID)"
else
    echo "1️⃣ 没有运行中的Expo开发服务器"
fi
echo ""

# 清理缓存
echo "2️⃣ 清理所有缓存..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
echo "   ✅ 缓存已清理"
echo ""

# 清理watchman
echo "3️⃣ 重置Watchman..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
    echo "   ✅ Watchman已重置"
else
    echo "   ⚠️  Watchman未安装 (跳过)"
fi
echo ""

# 检查模拟器
echo "4️⃣ 检查iOS模拟器..."
SIMULATOR=$(xcrun simctl list devices booted | grep "Booted" | head -1)
if [ ! -z "$SIMULATOR" ]; then
    DEVICE_ID=$(echo "$SIMULATOR" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
    echo "   发现运行中的模拟器"
    echo "   设备ID: $DEVICE_ID"

    # 尝试卸载应用
    echo "   卸载旧版本应用..."
    xcrun simctl uninstall $DEVICE_ID com.pomelotech.pomelo 2>/dev/null || true
    echo "   ✅ 已卸载"
else
    echo "   ⚠️  没有运行中的模拟器"
fi
echo ""

# 重新启动开发服务器
echo "5️⃣ 重新启动开发服务器..."
echo "   使用清理缓存模式启动"
echo ""
echo "=============================================="
echo "✅ 准备工作完成！"
echo "=============================================="
echo ""
echo "现在开发服务器将启动，请等待..."
echo ""
echo "启动后，请在模拟器中:"
echo "  1. 摇晃设备（Ctrl+Cmd+Z）"
echo "  2. 选择 'Reload'"
echo ""
echo "或者直接运行: npm run ios"
echo ""
echo "=============================================="
echo ""

# 启动开发服务器
npm start -- --clear --reset-cache