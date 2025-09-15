import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Pressable,
  Platform,
} from 'react-native';
import { ForceNativeInput } from '../../components/web/ForceNativeInput';
import { WebTextInput } from '../../components/web/WebTextInput';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { WebSchoolSelector } from '../../components/web/WebSchoolSelector';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { 
  RegistrationStep1Data, 
  ValidationErrors 
} from '../../types/registration';
import { 
  SchoolData, 
  createSchoolDataFromBackend 
} from '../../utils/schoolData';
import SchoolEmailService from '../../services/schoolEmailService';
import { 
  fetchSchoolList,
  validatePhoneNumber 
} from '../../services/registrationAPI';

export const InvitationStudentRegisterStep1Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();

  // 智能输入组件选择器 - Web环境使用ForceNativeInput，保证输入正常工作
  const SmartTextInput = Platform.OS === 'web' ? ForceNativeInput : WebTextInput;

  // Web专用区号选择器组件
  const AreaCodeSelector = ({ areaCode, onPress, style, textStyle }: any) => {
    const displayText = areaCode === '86' ? t('auth.register.form.phone_china') : t('auth.register.form.phone_usa');
    
    if (Platform.OS === 'web') {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Native button clicked');
            onPress();
          }}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '16px',
            paddingBottom: '16px',
            backgroundColor: '#F9FAFB',
            borderTopWidth: '0px',
            borderRightWidth: '1px',
            borderBottomWidth: '0px',
            borderLeftWidth: '0px',
            borderRightColor: '#E5E7EB',
            borderStyle: 'solid',
            cursor: 'pointer',
            outline: 'none',
            border: 'none',
            borderRight: '1px solid #E5E7EB',
          }}
        >
          <span style={{ 
            fontSize: '14px',
            color: '#374151',
            fontWeight: '500',
            marginRight: '4px'
          }}>
            {displayText}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5z" fill="#6B7280"/>
          </svg>
        </button>
      );
    }
    
    return (
      <TouchableOpacity style={style} onPress={onPress}>
        <Text style={textStyle}>{displayText}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  // 获取邀请码相关参数
  const referralCode = route.params?.referralCode;
  const hasReferralCode = route.params?.hasReferralCode ?? !!referralCode;
  const registrationType = route.params?.registrationType || 'phone'; // 'phone' 或 'invitation'
  const detectedRegion = route.params?.detectedRegion || 'zh';

  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  
  const [formData, setFormData] = useState<RegistrationStep1Data & { areaCode: '86' | '1' }>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    selectedSchool: null,
    generatedEmail: '',
    areaCode: detectedRegion === 'zh' ? '86' : '1', // 根据地理检测设置默认区号
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [emailUsername, setEmailUsername] = useState('');
  const [showAreaCodeOptions, setShowAreaCodeOptions] = useState(false);

  // 加载学校列表
  useEffect(() => {
    loadSchools();
  }, []);

  // 生成邮箱地址
  useEffect(() => {
    if (emailUsername && formData.selectedSchool) {
      // 使用统一的邮箱域名服务生成邮箱地址
      const emailDomain = formData.selectedSchool.emailDomain;
      // emailDomain现在已经包含@符号（来自后端mailDomain字段），直接拼接
      const generatedEmail = emailDomain ? `${emailUsername}${emailDomain}` : '';
      setFormData(prev => ({ ...prev, generatedEmail }));
    } else {
      setFormData(prev => ({ ...prev, generatedEmail: '' }));
    }
  }, [emailUsername, formData.selectedSchool]);

  const loadSchools = async () => {
    try {
      setSchoolsLoading(true);
      const response = await fetchSchoolList();
      
      if (response.code === 200 && response.data) {
        const schoolData = createSchoolDataFromBackend(response.data);
        setSchools(schoolData);
      } else {
        console.error('加载学校列表失败:', response);
        Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
      }
    } catch (error) {
      console.error('加载学校列表失败:', error);
      Alert.alert(t('common.error'), t('auth.register.errors.school_load_failed'));
    } finally {
      setSchoolsLoading(false);
    }
  };

  const updateFormData = <K extends keyof RegistrationStep1Data>(
    field: K, 
    value: RegistrationStep1Data[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  // 中文字符验证函数
  const isChineseCharacters = (text: string): boolean => {
    return /^[\u4e00-\u9fff]+$/.test(text);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const isChinese = i18n.language === 'zh-CN';

    // 验证姓名
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.first_name_required');
    } else if (isChinese && !isChineseCharacters(formData.firstName.trim())) {
      newErrors.firstName = t('validation.chinese_name_required');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.last_name_required');
    } else if (isChinese && !isChineseCharacters(formData.lastName.trim())) {
      newErrors.lastName = t('validation.chinese_name_required');
    }

    // 验证手机号（学生注册必填）
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = t('validation.phone_required');
    } else if (!validatePhoneNumber(formData.phoneNumber, formData.areaCode)) {
      newErrors.phoneNumber = formData.areaCode === '86' 
        ? t('validation.phone_china_invalid')
        : t('validation.phone_us_invalid');
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.university_required');
    }

    // 验证邮箱用户名（学生注册必填）
    if (!emailUsername.trim()) {
      newErrors.email = t('validation.email_username_required');
    } else if (emailUsername.length < 3) {
      newErrors.email = t('validation.email_username_too_short');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(emailUsername)) {
      newErrors.email = t('validation.email_username_invalid');
    }

    // 验证完整邮箱是否正确生成（只要有emailUsername和selectedSchool就应该能生成）
    if (emailUsername && formData.selectedSchool && !formData.generatedEmail) {
      newErrors.email = t('validation.email_generation_failed');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // 导航到第二步，传递第一步的数据、邀请码信息和地理检测结果
      navigation.navigate('InvitationStudentRegisterStep2', { 
        step1Data: {
          ...formData,
          legalName: `${formData.lastName} ${formData.firstName}`.trim(),
        },
        referralCode,
        hasReferralCode,
        registrationType,
        // 传递从RegisterChoiceScreen获得的地理检测结果
        detectedRegion: route.params?.detectedRegion,
        detectionResult: route.params?.detectionResult
      });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSchoolPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.university_label')}</Text>
      <WebSchoolSelector
        schools={schools}
        selectedSchool={formData.selectedSchool}
        onSchoolSelect={(school) => updateFormData('selectedSchool', school)}
        placeholder={t('auth.register.form.university_placeholder')}
        loading={schoolsLoading}
        error={!!errors.selectedSchool}
        accessibilityLabel={t('auth.register.form.university_label')}
      />
      {errors.selectedSchool && <Text style={styles.errorText}>{errors.selectedSchool}</Text>}
    </View>
  );

  const renderEmailPreview = () => {
    if (!formData.selectedSchool) return null;

    return (
      <View style={styles.emailPreviewContainer}>
        <Text style={styles.label}>{t('auth.register.form.school_email_preview')}</Text>
        <View style={styles.emailInputWrapper}>
          <SmartTextInput
            style={[styles.emailUsernameInput, errors.email && styles.inputError]}
            placeholder={t('auth.register.form.email_username_placeholder')}
            value={emailUsername}
            onChangeText={setEmailUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.colors.text.disabled}
          />
          <Text style={styles.emailDomain}>{formData.selectedSchool.emailDomain}</Text>
        </View>
        {formData.generatedEmail && (
          <Text style={styles.emailPreview}>
            {t('auth.register.form.complete_email')}: {formData.generatedEmail}
          </Text>
        )}
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      <View style={styles.contentView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('auth.register.form.register')}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>{t('auth.register.form.progress', { current: 1, total: 2 })}</Text>
        </View>

        <Pressable onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          <View style={styles.formContainer}>
            <Text style={styles.stepTitle}>{t('auth.register.form.basic_info')}</Text>
            <Text style={styles.stepSubtitle}>
              {t('auth.register.form.step1_description')}
            </Text>

            {/* 邀请码提示 */}
            {hasReferralCode && (
              <View style={styles.referralBadge}>
                <Ionicons name="gift" size={20} color={theme.colors.primary} />
                <Text style={styles.referralText}>
                  {t('auth.register.form.referral_code', { code: referralCode })}
                </Text>
              </View>
            )}

            {/* 姓名输入 */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.last_name_label')}</Text>
                <SmartTextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder={t('auth.register.form.last_name_placeholder')}
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.first_name_label')}</Text>
                <SmartTextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder={t('auth.register.form.first_name_placeholder')}
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
            </View>

            {/* 手机号输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('auth.register.form.phone_label')}
              </Text>
              <View style={styles.phoneInputWrapper}>
                <AreaCodeSelector
                  areaCode={formData.areaCode}
                  onPress={() => {
                    console.log('🖱️ Area code selector onPress triggered');
                    
                    // 🔧 Web端修复：支持中美手机号切换，与App端保持一致
                    if (formData.areaCode === '86') {
                      // 切换到美国区号
                      updateFormData('areaCode', '1');
                      console.log('📱 Area code switched to: US (+1)');
                    } else {
                      // 切换回中国区号  
                      updateFormData('areaCode', '86');
                      console.log('📱 Area code switched to: China (+86)');
                    }
                  }}
                  style={styles.areaCodeSelector}
                  textStyle={styles.areaCodeText}
                />
                <SmartTextInput
                  style={[styles.phoneInput, errors.phoneNumber && styles.inputError]}
                  placeholder={formData.areaCode === '86' ? '13812345678' : '(555) 123-4567'}
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateFormData('phoneNumber', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* 学校选择 */}
            {renderSchoolPicker()}

            {/* 邮箱预览 */}
            {renderEmailPreview()}
            {/* Next Step Button - inside form like parent registration */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {t('auth.register.form.next_step')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: 400, // Large padding to accommodate dropdown (7 items × 52px + margin)
  },
  formContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    padding: theme.spacing.lg,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
  },
  stepTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  stepSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing[5],
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing[1],
  },
  emailPreviewContainer: {
    marginBottom: theme.spacing[5],
    width: '100%',
    ...(Platform.OS === 'web' && {
      overflow: 'visible',
    }),
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'transparent',
    width: '100%',
    ...(Platform.OS === 'web' && {
      overflow: 'visible',
      minHeight: 48,
    }),
  },
  emailUsernameInput: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minWidth: 0, // 确保flex元素可以缩小但不会过度压缩内容
    ...(Platform.OS === 'web' && {
      boxSizing: 'border-box',
      outline: 'none',
      border: 'none',
      backgroundColor: 'transparent',
    }),
  },
  emailDomain: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emailPreview: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
    width: '100%',
    flexShrink: 0,
    textAlign: 'left',
    ...(Platform.OS === 'web' && {
      whiteSpace: 'normal', // 允许换行，避免截断
      overflow: 'visible',
      textOverflow: 'unset',
      wordBreak: 'break-all', // 确保长邮箱地址能正确换行显示
      lineHeight: '1.4',
    }),
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    // Web环境下确保容器不阻挡点击事件
    ...(Platform.OS === 'web' && {
      pointerEvents: 'auto',
    }),
  },
  phonePrefix: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  bottomContainer: {
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  referralBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[4],
  },
  referralText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
  },
  areaCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.background.tertiary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    // Web环境下确保可点击
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
      pointerEvents: 'auto',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
      zIndex: 10,
      position: 'relative',
    }),
  },
  areaCodeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing[1],
  },
});