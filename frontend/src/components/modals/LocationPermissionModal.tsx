import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onAllow,
  onDeny,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleAllow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAllow();
  };

  const handleDeny = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDeny();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={20} style={styles.backdrop}>
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          <View style={styles.modalContent}>
            {/* 图标容器 */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.iconBackground}
              >
                <Ionicons name="location" size={40} color="white" />
              </LinearGradient>
            </View>

            {/* 标题 */}
            <Text style={styles.title}>
              {t('location.permission_title', '开启位置服务')}
            </Text>

            {/* 说明文字 */}
            <Text style={styles.description}>
              {t(
                'location.permission_description',
                'PomeloX 想要使用您的位置信息，以便为您推荐附近的活动和精准排序'
              )}
            </Text>

            {/* 功能列表 */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>
                  {t('location.feature_nearby', '发现附近的精彩活动')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>
                  {t('location.feature_school', '优先显示您学校的活动')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>
                  {t('location.feature_smart', '智能活动排序')}
                </Text>
              </View>
            </View>

            {/* 按钮组 */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.allowButton}
                onPress={handleAllow}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.allowButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.allowButtonText}>
                    {t('location.allow', '允许定位')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.denyButton}
                onPress={handleDeny}
                activeOpacity={0.8}
              >
                <Text style={styles.denyButtonText}>
                  {t('location.later', '稍后选择')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 隐私说明 */}
            <Text style={styles.privacyNote}>
              {t(
                'location.privacy_note',
                '您的位置信息仅用于改善服务体验，我们会严格保护您的隐私'
              )}
            </Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    marginBottom: 16,
  },
  allowButton: {
    width: '100%',
    marginBottom: 12,
  },
  allowButtonGradient: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allowButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  denyButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  denyButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#666',
  },
  privacyNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});