#!/bin/bash

# 切换到生产环境并启动应用

echo "🔄 切换到生产环境..."
echo "📡 API地址: https://www.vitaglobal.icu"
echo "🚀 启动iOS应用..."

export EXPO_PUBLIC_ENVIRONMENT=production
npm run ios