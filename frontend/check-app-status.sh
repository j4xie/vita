#!/bin/bash

# 活动列表状态检查脚本
# 用于快速检查应用和开发服务器的状态

echo "=============================================="
echo "🔍 PomeloX 应用状态检查"
echo "=============================================="
echo ""

# 1. 检查Expo开发服务器
echo "📡 1. Expo开发服务器状态"
if curl -s http://localhost:8082/status > /dev/null 2>&1; then
    echo "   ✅ 开发服务器正在运行 (端口8082)"
    echo "   URL: http://localhost:8082"
else
    echo "   ❌ 开发服务器未运行或无法访问"
fi
echo ""

# 2. 检查模拟器
echo "📱 2. iOS模拟器状态"
SIMULATOR=$(xcrun simctl list devices booted | grep "Booted" | head -1)
if [ ! -z "$SIMULATOR" ]; then
    echo "   ✅ 模拟器正在运行:"
    echo "   $SIMULATOR"
else
    echo "   ❌ 没有运行中的模拟器"
fi
echo ""

# 3. 检查PomeloX应用
echo "📦 3. PomeloX应用状态"
APP_RUNNING=$(xcrun simctl listapps booted | grep -i pomelo 2>/dev/null | head -1)
if [ ! -z "$APP_RUNNING" ]; then
    echo "   ✅ PomeloX应用已安装"
else
    echo "   ⚠️  无法确认应用状态"
fi
echo ""

# 4. 检查API连接
echo "🌐 4. 后端API连接测试"
echo -n "   测试生产环境API... "
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.vitaglobal.icu/app/activity/list?pageNum=1&pageSize=1" --connect-timeout 5)
if [ "$PROD_STATUS" = "200" ]; then
    echo "✅ 正常 (HTTP $PROD_STATUS)"
else
    echo "❌ 失败 (HTTP $PROD_STATUS)"
fi

echo -n "   测试测试环境API... "
TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://106.14.165.234:8085/app/activity/list?pageNum=1&pageSize=1" --connect-timeout 5)
if [ "$TEST_STATUS" = "200" ]; then
    echo "✅ 正常 (HTTP $TEST_STATUS)"
else
    echo "❌ 失败 (HTTP $TEST_STATUS)"
fi
echo ""

# 5. 检查环境配置
echo "⚙️  5. 环境配置"
if [ -f ".env" ]; then
    ENV=$(grep "EXPO_PUBLIC_ENVIRONMENT=" .env | cut -d'=' -f2)
    API_URL=$(grep "EXPO_PUBLIC_API_URL=" .env | cut -d'=' -f2)
    echo "   环境: $ENV"
    echo "   API URL: $API_URL"
else
    echo "   ⚠️  .env文件不存在"
fi
echo ""

# 6. 最近的日志
echo "📋 6. 最近的应用日志 (调试用)"
echo "   请在运行应用的终端窗口中查找以下关键日志:"
echo ""
echo "   🔍 [ACTIVITY-LIST] 初始化骨架屏定时器"
echo "   🚀 [ACTIVITY-LIST] 组件挂载，开始初始数据加载"
echo "   🌐 [FETCH-ACTIVITIES] ========== 开始获取活动数据 =========="
echo ""

# 7. 建议操作
echo "=============================================="
echo "💡 建议操作"
echo "=============================================="
echo ""

if [ "$PROD_STATUS" != "200" ] && [ "$TEST_STATUS" != "200" ]; then
    echo "❌ 两个环境的API都无法访问"
    echo "   1. 检查网络连接"
    echo "   2. 检查VPN设置"
    echo "   3. 联系后端团队确认服务器状态"
elif [ "$PROD_STATUS" != "200" ]; then
    echo "⚠️  生产环境API无法访问"
    echo "   建议切换到测试环境:"
    echo "   npm run ios:dev"
else
    echo "✅ API连接正常"
    echo ""
    echo "如果界面仍然空白，请尝试:"
    echo "   1. 在模拟器中摇晃设备，选择 'Reload'"
    echo "   2. 或在模拟器中摇晃设备，选择 'Clear Bundler Cache and Reload'"
    echo "   3. 或重启开发服务器: npm run start:cache"
    echo ""
    echo "   查看终端日志以获取更多信息"
fi
echo ""

echo "=============================================="
echo "检查完成 ✅"
echo "=============================================="