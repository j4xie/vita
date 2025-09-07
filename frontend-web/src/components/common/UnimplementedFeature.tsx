import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { theme } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UnimplementedFeatureProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
  message?: string;
}

export const UnimplementedFeature: React.FC<UnimplementedFeatureProps> = ({
  visible,
  onClose,
  featureName = '该功能',
  message
}) => {
  const defaultMessage = `${featureName}正在开发中，敬请期待！`;
  const displayMessage = message || defaultMessage;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.95)',
              'rgba(248, 250, 255, 0.9)'
            ]}
            style={styles.content}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryPressed]}
                style={styles.iconBackground}
              >
                <Ionicons 
                  name="construct-outline" 
                  size={32} 
                  color="white" 
                />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t('common.feature_developing')}</Text>

            {/* Message */}
            <Text style={styles.message}>{displayMessage}</Text>

            {/* Additional Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={theme.colors.text.secondary} 
                />
                <Text style={styles.infoText}>{t('common.estimated_development_time')}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons 
                  name="notifications-outline" 
                  size={16} 
                  color={theme.colors.text.secondary} 
                />
                <Text style={styles.infoText}>{t('common.will_notify_when_ready')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>{t('common.got_it')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// Hook for easy usage
export const useUnimplementedFeature = () => {
  const [visible, setVisible] = React.useState(false);
  const [featureName, setFeatureName] = React.useState('该功能');
  const [message, setMessage] = React.useState<string | undefined>();

  const showFeature = (name?: string, customMessage?: string) => {
    if (name) setFeatureName(name);
    if (customMessage) setMessage(customMessage);
    setVisible(true);
  };

  const hideFeature = () => {
    setVisible(false);
    // Reset after animation
    setTimeout(() => {
      setFeatureName('该功能');
      setMessage(undefined);
    }, 300);
  };

  const FeatureModal = () => (
    <UnimplementedFeature
      visible={visible}
      onClose={hideFeature}
      featureName={featureName}
      message={message}
    />
  );

  return {
    showFeature,
    hideFeature,
    FeatureModal,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24, // 24pt圆角规范
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    padding: theme.spacing[6],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing[4],
  },
  iconBackground: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.button,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.5,
    marginBottom: theme.spacing[5],
  },
  infoContainer: {
    width: '100%',
    marginBottom: theme.spacing[6],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
    flex: 1,
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 50,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
});