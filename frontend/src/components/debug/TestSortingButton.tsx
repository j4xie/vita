/**
 * 测试按钮组件 - 用于在应用内测试排序功能
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { runFullSortingTest } from '../../utils/testLocationSorting';

export const TestSortingButton: React.FC = () => {
  const handleRunTest = () => {
    console.log('🚀 开始运行排序测试...');

    try {
      // 捕获console.log输出
      const originalLog = console.log;
      let testOutput = '';

      console.log = (...args) => {
        testOutput += args.join(' ') + '\n';
        originalLog(...args);
      };

      // 运行测试
      runFullSortingTest();

      // 恢复console.log
      console.log = originalLog;

      // 显示简要结果
      Alert.alert(
        '测试完成',
        '排序测试已完成，请查看控制台日志获取详细结果。',
        [
          { text: '查看日志', onPress: () => console.log('请在Metro终端查看完整测试结果') },
          { text: '关闭', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert('测试失败', `错误: ${error}`);
      console.error('测试运行失败:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleRunTest}>
      <Text style={styles.buttonText}>🧪 运行排序测试</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});