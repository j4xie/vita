import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  DeviceEventEmitter,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { ForceNativeInput } from '../../components/web/ForceNativeInput';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';

interface RegistrationFormData {
  legalName: string;
  nickName: string;
  phone: string;
  email: string;
  schoolName: string;
}

export const ActivityRegistrationFormScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useUser();
  const activity = route.params?.activity;

  const [formData, setFormData] = useState<RegistrationFormData>({
    legalName: '',
    nickName: '',
    phone: '',
    email: '',
    schoolName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  // 🛡️ TabBar状态守护：确保报名表单页面TabBar始终隐藏
  useTabBarVerification('ActivityRegistrationForm', { debugLogs: false });

  // 🔧 Web环境表单调试初始化
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('🌐 [表单调试] 活动报名表单页面初始化:', {
        activityId: activity?.id,
        activityTitle: activity?.title || activity?.name,
        userId: user?.id,
        userName: user?.legalName,
        timestamp: new Date().toLocaleTimeString(),
        formData: {
          legalName: formData.legalName,
          nickName: formData.nickName,
          phone: formData.phone,
          email: formData.email,
          schoolName: formData.schoolName,
        }
      });
      
      // 添加全局表单调试标记
      window.PomeloXFormDebug = {
        currentForm: 'ActivityRegistrationForm',
        formData,
        errors,
        loading,
        updateFormField,
      };
    }
  }, [activity, user, formData, errors, loading]);

  // 自动填充用户信息
  useEffect(() => {
    if (user) {
      setFormData({
        legalName: user.legalName || '',
        nickName: user.nickName || '',
        phone: user.phonenumber || '',
        email: user.email || '',
        schoolName: user.dept?.deptName || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};

    if (!formData.legalName.trim()) {
      newErrors.legalName = t('validation.errors.legal_name_required');
    }
    if (!formData.nickName.trim()) {
      newErrors.nickName = t('validation.errors.nickname_required');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.errors.phone_required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.errors.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.errors.email_format');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // 🔧 增强报名API调用日志
      const activityIdInt = parseInt(activity.id);
      const userIdInt = parseInt(user?.id || '0');
      
      console.log('🚨 [Web调试] 准备调用API:', { activityIdInt, userIdInt });
      
      console.log('🚀 [报名] 开始调用后端API:', {
        activityId: activityIdInt,
        userId: userIdInt,
        activityTitle: activity.title,
        apiUrl: `/app/activity/enroll?activityId=${activityIdInt}&userId=${userIdInt}`,
        timestamp: new Date().toISOString(),
        userInfo: {
          legalName: formData.legalName,
          nickName: formData.nickName,
          phone: formData.phone,
          email: formData.email
        }
      });

      // 调用现有的报名接口
      const result = await pomeloXAPI.enrollActivity(activityIdInt, userIdInt);
      
      console.log('✅ [报名] 后端API响应:', {
        result,
        success: result.code === 200,
        hasData: !!result.data,
        message: result.msg,
        timestamp: new Date().toISOString()
      });

      if (result.code === 200) {
        console.log('🎉 [报名] 报名成功，准备发送事件和返回页面');
        
        // 🌐 Web端：先发送事件，确保状态更新，然后延迟返回页面
        console.log('📡 [报名] 发送activityRegistered事件:', { activityId: activity.id });
        DeviceEventEmitter.emit('activityRegistered', { activityId: activity.id });
        
        // 🔧 发送活动报名完成事件，用于TabBar位置修复
        DeviceEventEmitter.emit('activityRegistrationCompleted', { 
          activityId: activity.id,
          userId: user?.id,
          timestamp: Date.now()
        });
        
        // 🔄 延迟返回页面，确保事件处理完成
        setTimeout(() => {
          console.log('🔙 [报名] 延迟返回活动详情页面，确保状态已更新');
          
          // 🔧 发送页面跳转完成事件
          DeviceEventEmitter.emit('navigationCompleted', { 
            from: 'ActivityRegistrationForm',
            to: 'ActivityDetail',
            timestamp: Date.now()
          });
          
          navigation.goBack();
        }, 100); // 延迟100毫秒确保状态更新
      } else {
        console.error('❌ [报名] 报名失败:', {
          code: result.code,
          message: result.msg,
          data: result.data
        });
        
        Alert.alert(
          t('activities.registration.failed_title'),
          result.msg || t('activities.registration.failed_message')
        );
      }
    } catch (error: any) {
      console.error('💥 [报名] API调用异常:', {
        error: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      Alert.alert(
        t('activities.registration.failed_title'),
        t('common.network_error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const updateFormField = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 智能输入组件选择器 - Web环境使用ForceNativeInput，其他环境使用TextInput
  const TextInput = Platform.OS === 'web' ? ForceNativeInput : TextInput;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('activities.registration.form_title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Activity Info */}
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activity?.title || activity?.name}</Text>
          <View style={styles.activityMeta}>
            <Ionicons name="calendar" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.activityTime}>{activity?.date}</Text>
            <Ionicons name="location" size={16} color={theme.colors.text.secondary} style={{ marginLeft: 16 }} />
            <Text style={styles.activityLocation}>{activity?.location || activity?.address}</Text>
          </View>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('activities.registration.personal_info')}</Text>
            <Text style={styles.formSubtitle}>{t('activities.registration.form_subtitle')}</Text>

            {/* Legal Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.register.form.legal_name_label')}</Text>
              <TextInput
                style={[styles.input, errors.legalName && styles.inputError]}
                value={formData.legalName}
                onChangeText={(value) => {
                  console.log('🏷️ [表单调试] Legal Name输入:', value);
                  updateFormField('legalName', value);
                }}
                onFocus={() => {
                  console.log('🎯 [表单调试] Legal Name输入框获得焦点');
                }}
                onBlur={() => {
                  console.log('👋 [表单调试] Legal Name输入框失去焦点，当前值:', formData.legalName);
                }}
                placeholder={t('auth.register.form.legal_name_placeholder')}
                placeholderTextColor={theme.colors.text.disabled}
                // Web优化属性
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                editable={true}
                accessibilityRole="textbox"
                accessible={true}
              />
              {errors.legalName && <Text style={styles.errorText}>{errors.legalName}</Text>}
            </View>

            {/* Nickname */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.register.form.nickname_label')}</Text>
              <TextInput
                style={[styles.input, errors.nickName && styles.inputError]}
                value={formData.nickName}
                onChangeText={(value) => {
                  console.log('🏷️ [表单调试] Nickname输入:', value);
                  updateFormField('nickName', value);
                }}
                onFocus={() => {
                  console.log('🎯 [表单调试] Nickname输入框获得焦点');
                }}
                onBlur={() => {
                  console.log('👋 [表单调试] Nickname输入框失去焦点，当前值:', formData.nickName);
                }}
                placeholder={t('auth.register.form.nickname_placeholder')}
                placeholderTextColor={theme.colors.text.disabled}
                // Web优化属性
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                editable={true}
                accessibilityRole="textbox"
                accessible={true}
              />
              {errors.nickName && <Text style={styles.errorText}>{errors.nickName}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.register.form.phone_label')}</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(value) => {
                  console.log('📱 [表单调试] Phone输入:', value);
                  updateFormField('phone', value);
                }}
                onFocus={() => {
                  console.log('🎯 [表单调试] Phone输入框获得焦点');
                }}
                onBlur={() => {
                  console.log('👋 [表单调试] Phone输入框失去焦点，当前值:', formData.phone);
                }}
                placeholder={t('auth.register.form.phone_placeholder')}
                placeholderTextColor={theme.colors.text.disabled}
                keyboardType="phone-pad"
                // Web优化属性
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                editable={true}
                accessibilityRole="textbox"
                accessible={true}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.register.form.email_label')}</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => {
                  console.log('📧 [表单调试] Email输入:', value);
                  updateFormField('email', value);
                }}
                onFocus={() => {
                  console.log('🎯 [表单调试] Email输入框获得焦点');
                }}
                onBlur={() => {
                  console.log('👋 [表单调试] Email输入框失去焦点，当前值:', formData.email);
                }}
                placeholder={t('auth.register.form.email_placeholder')}
                placeholderTextColor={theme.colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
                // Web优化属性
                autoCorrect={false}
                spellCheck={false}
                editable={true}
                accessibilityRole="textbox"
                accessible={true}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* School */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.register.form.school_label')}</Text>
              <TextInput
                style={[styles.input, errors.schoolName && styles.inputError]}
                value={formData.schoolName}
                onChangeText={(value) => {
                  console.log('🏫 [表单调试] School输入:', value);
                  updateFormField('schoolName', value);
                }}
                onFocus={() => {
                  console.log('🎯 [表单调试] School输入框获得焦点');
                }}
                onBlur={() => {
                  console.log('👋 [表单调试] School输入框失去焦点，当前值:', formData.schoolName);
                }}
                placeholder={t('auth.register.form.school_placeholder')}
                placeholderTextColor={theme.colors.text.disabled}
                editable={true}
                // Web优化属性
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                accessibilityRole="textbox"
                accessible={true}
              />
            </View>

            <Text style={styles.note}>
              {t('activities.registration.info_note')}
            </Text>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>

      {/* Fixed Submit Button */}
      <View style={styles.fixedBottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t('common.loading') : t('activities.registration.submit_button')}
            </Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  activityInfo: {
    padding: theme.spacing[4],
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  activityLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  contentView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[4] + 120, // 为固定按钮留出空间
  },
  formTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  formSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: theme.spacing[4],
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
    minHeight: 52, // 设置最小高度，让输入框更舒适
    // Web环境特定优化
    ...(Platform.OS === 'web' && {
      cursor: 'text',
      userSelect: 'text',
      WebkitUserSelect: 'text',
      pointerEvents: 'auto',
      zIndex: 10,
      position: 'relative',
      WebkitAppearance: 'none',
      MozAppearance: 'textfield',
      touchAction: 'manipulation',
      boxSizing: 'border-box',
      // outline: 'none', // React Native Web 不支持这个属性
      WebkitTapHighlightColor: 'transparent',
    }),
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  note: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
    marginTop: theme.spacing[4],
    textAlign: 'center',
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3], // 减少垂直间距
    paddingBottom: theme.spacing[3] + 20, // 显著减少底部间距，更贴近底部
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});

export default ActivityRegistrationFormScreen;