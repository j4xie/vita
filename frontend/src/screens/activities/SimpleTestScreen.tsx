/**
 * 超简单的测试页面 - 用于验证路由和渲染是否正常
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

export const SimpleTestScreen = () => {
  useEffect(() => {
    console.log('🟢 SimpleTestScreen 已渲染');
    Alert.alert('测试', 'SimpleTestScreen已加载！这说明路由正常工作。');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ 测试页面</Text>
      <Text style={styles.text}>如果你能看到这个页面，说明：</Text>
      <Text style={styles.text}>1. 路由配置正常</Text>
      <Text style={styles.text}>2. 组件渲染正常</Text>
      <Text style={styles.text}>3. Metro Bundler工作正常</Text>
      <Text style={styles.text}>
        {'\n'}现在需要检查ActivityListScreen为什么不工作
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
    color: '#666',
    textAlign: 'center',
  },
});