import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WellbeingPlanContent } from '../../components/wellbeing/WellbeingPlanContent';
import { theme } from '../../theme';

export const WellbeingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          '#FFFFFF', // 上部分：纯白色
          '#F8F9FA', // 渐变到浅灰
          '#F8F9FA', // 下部分：回到中性灰
          '#F1F3F4'  // 底部：灰色
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.6, 1]}
      />

      <WellbeingPlanContent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
});