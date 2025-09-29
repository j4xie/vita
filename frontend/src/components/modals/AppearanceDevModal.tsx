import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';

interface AppearanceDevModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const AppearanceDevModal: React.FC<AppearanceDevModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Show/hide animations
  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Animated backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: backdropOpacity }
          ]}
        >
          <View style={styles.blurContainer}>
            {Platform.OS === 'ios' ? (
              <BlurView 
                intensity={15}
                style={StyleSheet.absoluteFill}
                tint="light"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { 
                backgroundColor: 'rgba(0,0,0,0.44)'
              }]} />
            )}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Modal content */}
      <View style={[styles.centeredView, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.modalContent,
              styles.modalContentGlass,
              {
                opacity: contentOpacity,
                transform: [{ scale: contentScale }],
              },
            ]}
          >
            <View style={[styles.contentGradient, styles.contentGlass]}>
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#8e8e93"
                />
              </TouchableOpacity>

              {/* Header with development icon */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons
                    name="color-palette-outline"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={[
                  styles.title,
                  { color: '#000000' }
                ]}>
                  {t('common.feature_developing')}
                </Text>
              </View>

              {/* Main message */}
              <View style={styles.messageSection}>
                <Text style={[
                  styles.mainMessage,
                  { color: '#1d1d1f' }
                ]}>
                  {t('profile.general.appearanceDevelopmentTitle')}
                </Text>
                <Text style={[
                  styles.description,
                  { color: '#8e8e93' }
                ]}>
                  {t('profile.general.appearanceDevelopmentMessage')}
                </Text>
              </View>

              {/* Feature preview */}
              <View style={styles.featureSection}>
                <Text style={[
                  styles.featureTitle,
                  { color: '#1d1d1f' }
                ]}>
                  {t('profile.general.appearanceComingFeatures')}
                </Text>
                <View style={styles.featureList}>
                  {[
                    { icon: 'sunny-outline', text: t('profile.general.lightModeCustomization') },
                    { icon: 'moon-outline', text: t('profile.general.darkModeCustomization') },
                    { icon: 'sparkles-outline', text: t('profile.general.accentColorSelection') },
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name={feature.icon as any}
                        size={20}
                        color={theme.colors.primary}
                        style={styles.featureIcon}
                      />
                      <Text style={[
                        styles.featureText,
                        { color: '#6d6d70' }
                      ]}>
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <View style={styles.primaryButtonGlass}>
                    <Text style={styles.primaryButtonText}>
                      {t('common.iKnow')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurContainer: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  contentGradient: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '100%',
  },
  messageSection: {
    marginBottom: 24,
  },
  mainMessage: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 280,
  },
  featureSection: {
    marginBottom: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureList: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    minHeight: 28,
    justifyContent: 'center',
    maxWidth: 200,
  },
  featureIcon: {
    marginRight: 12,
    width: 22,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
    textAlignVertical: 'center',
  },
  buttonSection: {
    gap: 12,
  },
  primaryButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    ...theme.shadows.xs,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContentGlass: {
    backgroundColor: LIQUID_GLASS_LAYERS.L3.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L3.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L3.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L3.borderRadius.modal,
    ...theme.shadows.lg,
  },
  contentGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

export default AppearanceDevModal;