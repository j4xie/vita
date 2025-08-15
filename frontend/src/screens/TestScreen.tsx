/**
 * 测试屏幕 - 用于验证主题系统和性能监控
 * 这个屏幕可以在开发期间快速验证功能是否正常
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThemeSystemTest } from '../test/ThemeSystemTest';

export const TestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ThemeSystemTest />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});