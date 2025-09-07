#!/bin/bash

# PomeloX Console 监控器启动脚本
# 用于快速启动实时console监控

echo "🎭 PomeloX Console 实时监控器"
echo "================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules/chrome-remote-interface" ]; then
    echo "⚠️  chrome-remote-interface 未安装，正在安装..."
    npm install chrome-remote-interface
fi

# 获取参数
URL=${1:-"http://localhost:8081"}
PORT=${2:-9222}

echo "🌐 监控地址: $URL"
echo "🔌 调试端口: $PORT"
echo ""

# 检查是否有Chrome进程在指定端口运行
if lsof -i :$PORT &> /dev/null; then
    echo "✅ 检测到Chrome调试端口已开启"
    echo "🚀 直接连接到现有Chrome实例..."
    node console-monitor.js "$URL" --port="$PORT" --no-auto-launch
else
    echo "🔍 未检测到Chrome调试端口"
    echo "🚀 自动启动Chrome并连接..."
    node console-monitor.js "$URL" --port="$PORT"
fi