/**
 * Web端环境切换组件
 * 仅在开发模式下显示，用于测试不同环境
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
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

  const handleEnvironmentChange = (env: Environment) => {
    environmentManager.setEnvironment(env);
    setCurrentEnv(env);
    
    // 提示用户重新加载页面以应用新环境
    if (typeof window !== 'undefined') {
      const shouldReload = window.confirm(
        `环境已切换到：${environmentManager.getDisplayName()}\n\n是否立即重新加载页面以应用新环境？`
      );
      if (shouldReload) {
        window.location.reload();
      }
    }
  };

  if (!environmentManager.canSwitchEnvironment()) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🌍 环境设置</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>当前环境</Text>
            <View style={styles.currentEnv}>
              <Text style={styles.currentEnvText}>{envInfo.current}</Text>
              <Text style={styles.currentEnvUrl}>{envInfo.apiUrl}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>切换环境</Text>
            {environments.map((env) => (
              <Pressable
                key={env.value}
                style={[
                  styles.envOption,
                  currentEnv === env.value && styles.envOptionActive
                ]}
                onPress={() => handleEnvironmentChange(env.value)}
              >
                <Text style={[
                  styles.envOptionText,
                  currentEnv === env.value && styles.envOptionTextActive
                ]}>
                  {env.label}
                </Text>
                {currentEnv === env.value && (
                  <Text style={styles.currentBadge}>当前</Text>
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>环境信息</Text>
            <Text style={styles.infoText}>版本: {envInfo.version}</Text>
            <Text style={styles.infoText}>调试模式: {envInfo.debug ? '开启' : '关闭'}</Text>
            <Text style={styles.infoText}>构建时间: {new Date(envInfo.buildDate).toLocaleString()}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>关闭</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 环境指示器组件（显示在界面顶部）
export const EnvironmentIndicator: React.FC = () => {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const currentEnv = environmentManager.getCurrentEnvironment();
  const displayName = environmentManager.getDisplayName();

  // 只在开发环境或调试模式下显示
  if (!environmentManager.canSwitchEnvironment()) {
    return null;
  }

  return (
    <>
      <Pressable 
        style={[
          styles.indicator,
          currentEnv === 'development' ? styles.indicatorDev : styles.indicatorProd
        ]}
        onPress={() => setShowSwitcher(true)}
      >
        <Text style={styles.indicatorText}>
          {displayName} {currentEnv === 'development' ? '🧪' : '🚀'}
        </Text>
      </Pressable>

      <EnvironmentSwitcher
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  currentEnv: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  currentEnvText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentEnvUrl: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  envOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
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
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: 4,
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