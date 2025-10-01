#!/bin/bash

# 实时监控应用日志
# 这个脚本会显示Metro Bundler和应用的实时日志

echo "=============================================="
echo "📋 实时日志监控"
echo "=============================================="
echo ""
echo "正在监控以下关键字的日志:"
echo "  - [ACTIVITY-LIST]"
echo "  - [FETCH-ACTIVITIES]"
echo "  - Error"
echo "  - Warning"
echo ""
echo "按 Ctrl+C 停止监控"
echo ""
echo "=============================================="
echo ""

# 检查Metro Bundler是否运行
if ! lsof -ti:8082 > /dev/null 2>&1; then
    echo "❌ Metro Bundler未运行"
    echo "   请先运行: npm start"
    exit 1
fi

echo "✅ Metro Bundler正在运行"
echo ""
echo "开始监控日志..."
echo ""
echo "=============================================="
echo ""

# 使用xcrun simctl监控模拟器日志
# 获取当前运行的模拟器ID
DEVICE_ID=$(xcrun simctl list devices booted | grep "Booted" | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/' | head -1)

if [ -z "$DEVICE_ID" ]; then
    echo "❌ 没有运行中的模拟器"
    echo "   请先启动iOS模拟器"
    exit 1
fi

echo "✅ 找到模拟器: $DEVICE_ID"
echo ""
echo "开始监控日志 (实时)..."
echo ""

# 实时跟踪日志，过滤关键信息
xcrun simctl spawn $DEVICE_ID log stream --level debug --predicate 'senderImagePath CONTAINS "Pomelo"' 2>&1 | \
    grep --line-buffered -i -E "ACTIVITY-LIST|FETCH-ACTIVITIES|ERROR|Warning|Failed|Exception" | \
    while IFS= read -r line; do
        # 根据内容添加颜色
        if echo "$line" | grep -q "ERROR\|Failed\|Exception"; then
            echo -e "\033[31m$line\033[0m"  # 红色
        elif echo "$line" | grep -q "Warning"; then
            echo -e "\033[33m$line\033[0m"  # 黄色
        elif echo "$line" | grep -q "FETCH-ACTIVITIES"; then
            echo -e "\033[36m$line\033[0m"  # 青色
        elif echo "$line" | grep -q "ACTIVITY-LIST"; then
            echo -e "\033[32m$line\033[0m"  # 绿色
        else
            echo "$line"
        fi
    done