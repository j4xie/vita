import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onClose,
  type,
}) => {
  const { t } = useTranslation();
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;
    
    const progress = scrollHeight > 0 ? Math.min(scrollY / scrollHeight, 1) : 1;
    setScrollProgress(progress);
  };

  const handleModalShow = () => {
    setScrollProgress(0);
  };

  const isTerms = type === 'terms';
  const title = isTerms ? t('legal.terms.title') : t('legal.privacy.title');
  const content = isTerms ? t('legal.terms.full_content') : t('legal.privacy.full_content');
  
  const legalContent = isTerms ? 
    t('legal.terms.full_content') :
    t('legal.privacy.full_content');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onShow={handleModalShow}
    >
      <BlurView intensity={dmBlur.intensity} tint={dmBlur.tint} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.container}>
          <View style={styles.overlay}>
            <View style={[styles.modalContainer, dmStyles.modal.container]}>
              {/* Header */}
              <View style={[styles.header, dmStyles.modal.header]}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: isDarkMode ? 'rgba(255, 138, 101, 0.16)' : 'rgba(255, 107, 53, 0.15)' }
                ]}>
                  <Ionicons 
                    name={isTerms ? "document-text" : "shield-checkmark"} 
                    size={24} 
                    color={dmIcons.brand} 
                  />
                </View>
                <Text style={[styles.title, dmStyles.text.title]}>{title}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color={dmIcons.secondary} />
                </TouchableOpacity>
              </View>

              {/* Scroll Progress Indicator */}
              <View style={styles.progressIndicatorContainer}>
                <View style={styles.progressIndicator}>
                  <View style={[styles.progressBar, { width: `${scrollProgress * 100}%` }]} />
                </View>
              </View>

              {/* Content */}
              <View style={[styles.contentScrollView, dmStyles.modal.content]}>
                <Text style={[styles.contentText, dmStyles.text.primary]}>
                  {legalContent}
                </Text>
              </View>

              {/* Close Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.closeActionButton, dmStyles.button.primary]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeButtonText}>
                    {t('common.close')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    padding: theme.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    marginHorizontal: theme.spacing[4],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScrollView: {
    flex: 1,
    padding: theme.spacing[4],
  },
  contentContainer: {
    padding: theme.spacing[6],
  },
  contentText: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.fontSize.base * 1.6,
    padding: theme.spacing[2],
    marginVertical: theme.spacing[1],
  },
  buttonContainer: {
    padding: theme.spacing[6],
  },
  closeActionButton: {
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  progressIndicatorContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
  },
  progressIndicator: {
    height: 3,
    backgroundColor: theme.colors.border.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  debugText: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing[2],
    padding: theme.spacing[1],
  },
});