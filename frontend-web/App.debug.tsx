// 调试用简化版App组件
import React from 'react';
import { View, Text, Platform } from 'react-native';

// Web端全局CSS样式注入
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: #f8f9fa;
    }
    #root {
      width: 100vw;
      height: 100vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      padding: 20
    }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
        🎉 PomeloX Web版本
      </Text>
      <Text style={{ fontSize: 16, textAlign: 'center' }}>
        调试模式 - 基础组件渲染测试
      </Text>
      <Text style={{ fontSize: 14, marginTop: 20, color: '#666' }}>
        平台: {Platform.OS}
      </Text>
    </View>
  );
}