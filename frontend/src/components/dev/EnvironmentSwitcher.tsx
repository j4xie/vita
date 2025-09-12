/**
 * App端环境切换组件（React Native）
 * 仅在开发模式下显示，用于测试不同环境
 * 注意：这是与web端完全独立的实现
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { environmentManager, Environment } from '../../utils/environment';

interface EnvironmentSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export const EnvironmentSwitcher: React.FC<EnvironmentSwitcherProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [currentEnv, setCurrentEnv] = useState(environmentManager.getCurrentEnvironment());
  
  const environments = environmentManager.getAvailableEnvironments();
  const envInfo = environmentManager.getEnvironmentInfo();

  const handleEnvironmentChange = async (env: Environment) => {
    try {
      await environmentManager.setEnvironment(env);
      setCurrentEnv(env);
      
      Alert.alert(
        '环境切换成功',
        `环境已切换到：${environmentManager.getDisplayName()}\n\n请重启应用以应用新环境配置。`,
        [
          { text: '知道了', onPress: onClose }
        ]
      );
    } catch (error) {
      Alert.alert('错误', '环境切换失败，请重试。');
    }
  };

  if (!environmentManager.canSwitchEnvironment()) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <Text style={styles.title}>🌍 环境设置</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>当前环境</Text>
            <View style={styles.currentEnv}>
              <Text style={styles.currentEnvText}>{envInfo.current}</Text>
              <Text style={styles.currentEnvUrl}>{envInfo.apiUrl}</Text>
              <Text style={styles.currentPlatform}>平台: {envInfo.platform}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>切换环境</Text>
            {environments.map((env) => (
              <TouchableOpacity
                key={env.value}
                style={[
                  styles.envOption,
                  currentEnv === env.value && styles.envOptionActive
                ]}
                onPress={() => handleEnvironmentChange(env.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.envOptionText,
                  currentEnv === env.value && styles.envOptionTextActive
                ]}>
                  {env.label}
                </Text>
                {currentEnv === env.value && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>当前</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>环境信息</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>版本: {envInfo.version}</Text>
              <Text style={styles.infoText}>平台: {envInfo.platform}</Text>
              <Text style={styles.infoText}>调试模式: {envInfo.debug ? '开启' : '关闭'}</Text>
              <Text style={styles.infoText}>构建时间: {new Date(envInfo.buildDate).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// 环境指示器组件（显示在界面顶部）
export const EnvironmentIndicator: React.FC = () => {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [currentEnv, setCurrentEnv] = useState(environmentManager.getCurrentEnvironment());
  const displayName = environmentManager.getDisplayName();

  useEffect(() => {
    // 监听环境变化
    const checkEnvironment = () => {
      setCurrentEnv(environmentManager.getCurrentEnvironment());
    };
    
    const interval = setInterval(checkEnvironment, 1000);
    return () => clearInterval(interval);
  }, []);

  // 只在开发环境或调试模式下显示
  if (!environmentManager.canSwitchEnvironment()) {
    return null;
  }

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.indicator,
          currentEnv === 'development' ? styles.indicatorDev : styles.indicatorProd
        ]}
        onPress={() => setShowSwitcher(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.indicatorText}>
          {displayName} {currentEnv === 'development' ? '🧪' : '🚀'}
        </Text>
      </TouchableOpacity>

      <EnvironmentSwitcher
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#555',
  },
  currentEnv: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentEnvText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentEnvUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentPlatform: {
    fontSize: 14,
    color: '#666',
  },
  envOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 12,
    backgroundColor: 'white',
  },
  envOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  envOptionText: {
    fontSize: 16,
    color: '#333',
  },
  envOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  indicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  indicatorDev: {
    backgroundColor: '#FF9500',
  },
  indicatorProd: {
    backgroundColor: '#34C759',
  },
  indicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EnvironmentSwitcher;