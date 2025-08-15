import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { i18n } from '../../utils/i18n';

// 简化的导航屏幕
const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={[styles.title, { color: theme.colors.text.primary }]}>
      主页 - 西柚
    </Text>
    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
      语言: {i18n.language} | 导航系统就绪 ✅
    </Text>
    <View style={[styles.card, { backgroundColor: theme.liquidGlass.card.background }]}>
      <Text style={[styles.cardText, { color: theme.colors.text.primary }]}>
        🏠 简化导航测试成功
      </Text>
    </View>
  </View>
);

const ExploreScreen = () => (
  <View style={styles.screen}>
    <Text style={[styles.title, { color: theme.colors.text.primary }]}>
      探索 - 活动发现
    </Text>
    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
      这里将显示活动列表
    </Text>
    <View style={[styles.card, { backgroundColor: theme.liquidGlass.card.background }]}>
      <Text style={[styles.cardText, { color: theme.colors.text.primary }]}>
        🔍 探索功能模块
      </Text>
    </View>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={[styles.title, { color: theme.colors.text.primary }]}>
      个人中心
    </Text>
    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
      用户个人信息与设置
    </Text>
    <View style={[styles.card, { backgroundColor: theme.liquidGlass.card.background }]}>
      <Text style={[styles.cardText, { color: theme.colors.text.primary }]}>
        👤 个人信息模块
      </Text>
    </View>
  </View>
);

const screens = [
  { key: 'home', title: '主页', icon: '🏠', component: HomeScreen },
  { key: 'explore', title: '探索', icon: '🔍', component: ExploreScreen },
  { key: 'profile', title: '个人', icon: '👤', component: ProfileScreen },
];

export const SimpleNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  
  const CurrentScreen = screens.find(s => s.key === currentScreen)?.component || HomeScreen;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Screen Content */}
      <View style={styles.content}>
        <CurrentScreen />
      </View>
      
      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.background.secondary }]}>
        {screens.map((screen) => (
          <TouchableOpacity
            key={screen.key}
            style={[
              styles.tab,
              currentScreen === screen.key && {
                backgroundColor: theme.colors.primary + '20',
              }
            ]}
            onPress={() => setCurrentScreen(screen.key)}
          >
            <Text style={styles.tabIcon}>{screen.icon}</Text>
            <Text 
              style={[
                styles.tabText,
                {
                  color: currentScreen === screen.key 
                    ? theme.colors.primary 
                    : theme.colors.text.secondary
                }
              ]}
            >
              {screen.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
});