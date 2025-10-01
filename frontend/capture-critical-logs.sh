#!/bin/bash

# 捕获关键日志 - 专门用于调试活动列表白屏问题

echo "=============================================="
echo "🔴 关键日志捕获工具"
echo "=============================================="
echo ""
echo "正在监听以下关键日志："
echo "  🔴 [CRITICAL] - 关键调试信息"
echo "  🔍 [ACTIVITY-LIST] - 活动列表日志"
echo "  🌐 [FETCH-ACTIVITIES] - API调用日志"
echo ""
echo "请在模拟器中："
echo "  1. 按 Cmd+D"
echo "  2. 选择 'Reload'"
echo "  3. 等待10秒"
echo ""
echo "按 Ctrl+C 停止监控"
echo ""
echo "=============================================="
echo ""

# 等待用户准备
sleep 2

# 捕获日志（如果Metro Bundler在运行）
if lsof -ti:8082 > /dev/null 2>&1; then
    echo "✅ Metro Bundler正在运行，开始捕获日志..."
    echo ""

    # 创建日志文件
    LOG_FILE="critical-logs-$(date +%Y%m%d-%H%M%S).log"

    # 实时显示和保存日志
    timeout 30 tail -f ~/.expo/logs/* 2>/dev/null | grep --line-buffered -E "CRITICAL|ACTIVITY-LIST|FETCH-ACTIVITIES|ERROR|Exception" | tee "$LOG_FILE" || \
    echo "⚠️  无法找到Expo日志文件"

    echo ""
    echo "=============================================="
    echo "日志已保存到: $LOG_FILE"
    echo "=============================================="
else
    echo "❌ Metro Bundler未运行"
    echo "   请先运行: npm start"
fi