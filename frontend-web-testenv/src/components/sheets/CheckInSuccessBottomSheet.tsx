import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LinearGradient } from '../web/WebLinearGradient';
import { BlurView } from '../web/WebBlurView';

interface CheckInSuccessBottomSheetProps {
  visible: boolean;
  onReturn: () => void;
  activityTitle?: string;
  returnTarget?: 'list' | 'profile'; // 返回目标：活动列表或Profile
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CheckInSuccessBottomSheet: React.FC<CheckInSuccessBottomSheetProps> = ({
  visible,
  onReturn,
  activityTitle,
  returnTarget = 'list'
}) => {
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  const getReturnText = () => {
    return returnTarget === 'profile' 
      ? t('common.back_to_profile', '返回个人中心')
      : t('common.back', '返回');
  };

  return (
    <View style={[styles.overlay, { zIndex: 99999 }]}>
      {/* 背景遮罩 */}
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onReturn}
      />
      
      {/* Bottom Sheet */}
      <View style={styles.sheetContainer}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <LinearGradient
            colors={[
              theme.colors.background.primary + 'F0',
              theme.colors.background.secondary + 'F0'
            ]}
            style={styles.sheetContent}
          >
            {/* 拖拽指示器 */}
            <View style={styles.dragIndicator} />
            
            {/* 成功图标和标题 */}
            <View style={styles.successHeader}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#0891B2" />
              </View>
              
              <Text style={styles.successTitle}>
                {t('activityDetail.checkin_success', '签到成功')}
              </Text>
              
              <Text style={styles.successSubtitle}>
                {activityTitle 
                  ? t('activityDetail.checkin_activity_success', '您已成功签到活动：{{title}}', { title: activityTitle })
                  : t('activityDetail.checkin_success_message', '您已成功签到！')
                }
              </Text>
            </View>

            {/* 返回按钮 */}
            <TouchableOpacity 
              style={styles.returnButton} 
              onPress={onReturn}
              activeOpacity={0.8}
            >
              <Text style={styles.returnButtonText}>
                {getReturnText()}
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color="#FFFFFF" 
                style={styles.returnButtonIcon}
              />
            </TouchableOpacity>
          </LinearGradient>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  
  blurContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  
  sheetContent: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: Platform.OS === 'ios' ? theme.spacing[8] : theme.spacing[6],
    minHeight: 280,
  },
  
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.text.disabled,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing[6],
    opacity: 0.3,
  },
  
  successHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  
  successIconContainer: {
    marginBottom: theme.spacing[4],
  },
  
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing[4],
  },
  
  returnButton: {
    backgroundColor: '#0891B2',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[2],
    shadowColor: '#0891B2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  returnButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: theme.spacing[2],
  },
  
  returnButtonIcon: {
    marginLeft: theme.spacing[1],
  },
});