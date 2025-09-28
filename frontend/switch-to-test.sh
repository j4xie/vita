#!/bin/bash

# 切换到测试环境并启动应用

echo "🔄 切换到测试环境..."
echo "📡 API地址: http://106.14.165.234:8085"
echo "🚀 启动iOS应用..."

export EXPO_PUBLIC_ENVIRONMENT=development
npm run ios