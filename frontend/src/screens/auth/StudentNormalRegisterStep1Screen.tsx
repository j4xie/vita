import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import {
  RegistrationStep1Data,
  ValidationErrors,
  OrganizationData
} from '../../types/registration';
import {
  SchoolData,
  createSchoolDataFromBackend,
  validateEduEmail,
  SCHOOL_EMAIL_MAPPING,
  getEmailDomainFromBackendSchool
} from '../../utils/schoolData';
import { SchoolSelector } from '../../components/common/SchoolSelector';
import { OrganizationSelector } from '../../components/common/OrganizationSelector';
import SchoolEmailService from '../../services/schoolEmailService';
import {
  fetchSchoolList,
  validatePhoneNumber,
  validatePassword
} from '../../services/registrationAPI';
import RegionDetectionService from '../../services/RegionDetectionService';
import UserRegionPreferences from '../../services/UserRegionPreferences';
import { 
  validateTextByLanguage,
  TextType,
  createRealtimeValidator,
  getInputPlaceholder
} from '../../utils/textValidation';
import { isChinese, i18n } from '../../utils/i18n';

export const StudentNormalRegisterStep1Screen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  // 获取地理检测参数
  const detectedRegion = route.params?.detectedRegion || 'zh';

  const [loading, setLoading] = useState(false);

  // UCLA学生类型选择
  const [studentType, setStudentType] = useState<'undergraduate' | 'graduate'>('undergraduate');
  
  // 扩展 formData 以包含新字段
  interface ExtendedFormData extends RegistrationStep1Data {
    nickName: string;
    password: string;
    confirmPassword: string;
    sex: '0' | '1' | '2';
    selectedOrganization: OrganizationData | null;
    // SchoolSelector需要的字段
    selectedSchoolId: string;
    selectedSchoolName: string;
    // OrganizationSelector需要的字段
    selectedOrganizationId: string;
    selectedOrganizationName: string;
  }

  const [formData, setFormData] = useState<ExtendedFormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    selectedSchool: null,
    generatedEmail: '',
    nickName: '',
    password: '',
    confirmPassword: '',
    sex: '2', // 默认未知
    selectedOrganization: null,
    // SchoolSelector需要的字段
    selectedSchoolId: '',
    selectedSchoolName: '',
    // OrganizationSelector需要的字段
    selectedOrganizationId: '',
    selectedOrganizationName: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [emailUsername, setEmailUsername] = useState('');
  
  // 实时验证状态
  const [realtimeErrors, setRealtimeErrors] = useState<ValidationErrors>({});
  
  // 检查是否有任何验证错误 - 使用 useMemo 优化性能
  const hasValidationErrors = useMemo(() => {
    return Object.keys(realtimeErrors).some(key =>
      realtimeErrors[key as keyof ValidationErrors]
    ) || Object.keys(errors).some(key =>
      errors[key as keyof ValidationErrors]
    );
  }, [realtimeErrors, errors]);
  
  // 调试：检查当前系统语言
  useEffect(() => {
    console.log('🌍 RegisterStep1Screen - 当前语言检测:', {
      currentLanguage: i18n.language,
      isChinese: isChinese(),
      detectedRegion: detectedRegion
    });
  }, []);
  
  // 创建实时验证处理器
  const handleFirstNameChange = createRealtimeValidator(
    TextType.FIRST_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        firstName: isValid ? undefined : message
      }));
    }
  );

  const handleLastNameChange = createRealtimeValidator(
    TextType.LAST_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        lastName: isValid ? undefined : message
      }));
    }
  );

  const handleNickNameChange = createRealtimeValidator(
    TextType.COMMON_NAME,
    (isValid, message) => {
      setRealtimeErrors(prev => ({
        ...prev,
        nickName: isValid ? undefined : message
      }));
    }
  );


  // 生成邮箱地址
  useEffect(() => {
    if (emailUsername && formData.selectedSchool) {
      // 使用统一的邮箱域名服务生成邮箱地址
      // emailDomain 格式是 @berkeley.edu，直接拼接用户名
      const emailDomain = formData.selectedSchool.emailDomain;
      const generatedEmail = emailDomain ? `${emailUsername}${emailDomain}` : '';
      setFormData(prev => ({ ...prev, generatedEmail }));
    } else {
      setFormData(prev => ({ ...prev, generatedEmail: '' }));
    }
  }, [emailUsername, formData.selectedSchool]);


  const updateFormData = <K extends keyof ExtendedFormData>(
    field: K,
    value: ExtendedFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除相关错误
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ValidationErrors]: undefined }));
    }
  };

  // 处理学校选择
  const handleSchoolSelect = (school: any) => {
    // 为UCLA生成动态邮箱域名
    const getUCLAEmailDomain = (studentType: 'undergraduate' | 'graduate') => {
      return studentType === 'graduate' ? '@g.ucla.edu' : '@ucla.edu';
    };

    // 获取邮箱域名的完整逻辑
    const getEmailDomain = () => {
      // 1. 优先处理UCLA特殊情况
      if (school.aprName === 'UCLA' || school.deptName?.includes('UCLA') || school.deptName?.includes('洛杉矶')) {
        return getUCLAEmailDomain(studentType);
      }

      // 2. 使用后端返回的mailDomain
      if (school.mailDomain && school.mailDomain.trim()) {
        return school.mailDomain;
      }

      // 3. 备用：使用前端映射表
      const abbreviation = school.aprName || '';
      if (abbreviation && SCHOOL_EMAIL_MAPPING[abbreviation]) {
        return `@${SCHOOL_EMAIL_MAPPING[abbreviation]}`;
      }

      // 4. 最后备用：根据学校名称匹配
      return getEmailDomainFromBackendSchool(school);
    };

    // 构建SchoolData对象以保持兼容性
    const schoolData: SchoolData = {
      id: school.deptId.toString(),
      name: school.deptName,
      abbreviation: school.aprName || school.deptName,
      emailDomain: getEmailDomain()
    };

    // 更新相关状态
    setFormData(prev => ({
      ...prev,
      selectedSchool: schoolData,
      selectedSchoolId: school.deptId.toString(),
      selectedSchoolName: school.deptName
    }));

    // 清除学校选择相关错误
    if (errors.selectedSchool) {
      setErrors(prev => ({ ...prev, selectedSchool: undefined }));
    }
  };

  // 处理组织选择
  const handleOrganizationSelect = (organization: any) => {
    // 更新相关状态
    setFormData(prev => ({
      ...prev,
      selectedOrganization: organization,
      selectedOrganizationId: organization.id.toString(),
      selectedOrganizationName: organization.name
    }));

    // 清除组织选择相关错误
    if (errors.selectedOrganization) {
      setErrors(prev => ({ ...prev, selectedOrganization: undefined }));
    }
  };

  // 处理学生类型变化（仅影响UCLA）
  const handleStudentTypeChange = (newType: 'undergraduate' | 'graduate') => {
    setStudentType(newType);

    // 如果当前选择的是UCLA，重新生成邮箱域名
    if (formData.selectedSchool &&
        (formData.selectedSchool.abbreviation === 'UCLA' ||
         formData.selectedSchool.name?.includes('UCLA') ||
         formData.selectedSchool.name?.includes('洛杉矶'))) {

      const newEmailDomain = newType === 'graduate' ? '@g.ucla.edu' : '@ucla.edu';
      setFormData(prev => ({
        ...prev,
        selectedSchool: prev.selectedSchool ? {
          ...prev.selectedSchool,
          emailDomain: newEmailDomain
        } : null
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 使用智能姓名验证（基于系统语言）
    const firstNameValidation = validateTextByLanguage(
      formData.firstName,
      TextType.FIRST_NAME,
      t
    );
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.message;
    }

    const lastNameValidation = validateTextByLanguage(
      formData.lastName,
      TextType.LAST_NAME,
      t
    );
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.message;
    }

    // 验证常用名
    const nickNameValidation = validateTextByLanguage(
      formData.nickName,
      TextType.COMMON_NAME,
      t
    );
    if (!nickNameValidation.isValid) {
      newErrors.nickName = nickNameValidation.message;
    }

    // 验证密码
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // 验证确认密码
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }

    // 验证组织选择
    if (!formData.selectedOrganization) {
      newErrors.selectedOrganization = t('validation.organization_required');
    }

    // 验证学校
    if (!formData.selectedSchool) {
      newErrors.selectedSchool = t('validation.university_required');
    }

    // 验证邮箱用户名（普通注册必填）
    if (!emailUsername.trim()) {
      newErrors.email = t('validation.email_username_required');
    } else if (emailUsername.length < 3) {
      newErrors.email = t('validation.email_username_too_short');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(emailUsername)) {
      newErrors.email = t('validation.email_username_invalid');
    }

    // 验证生成的邮箱格式（接受任何后缀）
    if (formData.generatedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.generatedEmail)) {
        newErrors.email = t('validation.email_format_error');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        // 执行地理位置检测（用于初始化区域偏好）
        console.log('注册流程：开始地理位置检测...');
        const detectionResult = await RegionDetectionService.detectRegion();
        console.log('注册流程：地理位置检测结果:', detectionResult);
        
        // 初始化用户区域偏好
        await UserRegionPreferences.initializePreferences(detectionResult.region);
        console.log('注册流程：用户区域偏好初始化完成');
        
        // 导航到第二步，传递第一步的数据和地理检测结果
        navigation.navigate('StudentNormalRegisterStep2', {
          step1Data: {
            ...formData,
            legalName: `${formData.lastName} ${formData.firstName}`.trim(),
          },
          regionDetection: detectionResult, // 传递地理检测结果
        });
      } catch (error) {
        console.error('注册流程地理位置检测失败:', error);
        // 即使地理检测失败也继续注册流程，使用默认设置
        navigation.navigate('StudentNormalRegisterStep2', {
          step1Data: {
            ...formData,
            legalName: `${formData.lastName} ${formData.firstName}`.trim(),
          },
          regionDetection: null, // 检测失败
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSchoolSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t('auth.register.form.university_label')} *</Text>
      <SchoolSelector
        value={formData.selectedSchoolName}
        selectedId={formData.selectedSchoolId}
        onSelect={handleSchoolSelect}
        placeholder={t('auth.register.form.university_placeholder')}
        error={errors.selectedSchool}
      />
    </View>
  );

  // UCLA学生类型选择器（仅UCLA时显示）
  const renderStudentTypeSelector = () => {
    const isUCLA = formData.selectedSchool &&
      (formData.selectedSchool.abbreviation === 'UCLA' ||
       formData.selectedSchool.name?.includes('UCLA') ||
       formData.selectedSchool.name?.includes('洛杉矶'));

    if (!isUCLA) return null;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('auth.register.form.student_type_label')} *</Text>
        <View style={styles.studentTypeContainer}>
          <TouchableOpacity
            style={[styles.studentTypeButton, studentType === 'undergraduate' && styles.studentTypeButtonActive]}
            onPress={() => handleStudentTypeChange('undergraduate')}
          >
            <Text style={[styles.studentTypeButtonText, studentType === 'undergraduate' && styles.studentTypeButtonTextActive]}>
              {t('auth.register.form.undergraduate')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.studentTypeButton, studentType === 'graduate' && styles.studentTypeButtonActive]}
            onPress={() => handleStudentTypeChange('graduate')}
          >
            <Text style={[styles.studentTypeButtonText, studentType === 'graduate' && styles.studentTypeButtonTextActive]}>
              {t('auth.register.form.graduate')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmailPreview = () => {
    if (!formData.selectedSchool) return null;

    return (
      <View style={styles.emailPreviewContainer}>
        <Text style={styles.label}>{t('auth.register.form.school_email_preview')}</Text>
        <Text style={styles.emailHelpText}>
          {t('auth.register.form.email_help_text')}
        </Text>
        <View style={styles.emailInputWrapper}>
          <TextInput
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
          <View style={styles.completeEmailContainer}>
            <Text style={styles.completeEmailLabel}>{t('auth.register.form.complete_email')}:</Text>
            <Text style={styles.completeEmailValue}>{formData.generatedEmail}</Text>
          </View>
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

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

            {/* 姓名输入 */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.last_name_label')}</Text>
                <TextInput
                  style={[
                    styles.input, 
                    (errors.lastName || realtimeErrors.lastName) && styles.inputError
                  ]}
                  placeholder={getInputPlaceholder(TextType.LAST_NAME, t)}
                  value={formData.lastName}
                  onChangeText={(text) => {
                    handleLastNameChange(text, t);
                    updateFormData('lastName', text);
                  }}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {(errors.lastName || realtimeErrors.lastName) && (
                  <Text style={styles.errorText}>
                    {errors.lastName || realtimeErrors.lastName}
                  </Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <Text style={styles.label}>{t('auth.register.form.first_name_label')}</Text>
                <TextInput
                  style={[
                    styles.input, 
                    (errors.firstName || realtimeErrors.firstName) && styles.inputError
                  ]}
                  placeholder={getInputPlaceholder(TextType.FIRST_NAME, t)}
                  value={formData.firstName}
                  onChangeText={(text) => {
                    handleFirstNameChange(text, t);
                    updateFormData('firstName', text);
                  }}
                  placeholderTextColor={theme.colors.text.disabled}
                />
                {(errors.firstName || realtimeErrors.firstName) && (
                  <Text style={styles.errorText}>
                    {errors.firstName || realtimeErrors.firstName}
                  </Text>
                )}
              </View>
            </View>

            {/* 学校选择 */}
            {renderSchoolSelector()}

            {/* UCLA学生类型选择（仅UCLA时显示） */}
            {renderStudentTypeSelector()}

            {/* 邮箱预览 */}
            {renderEmailPreview()}

            {/* 常用名输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.nickname_label')}</Text>
              <TextInput
                style={[
                  styles.input,
                  (errors.nickName || realtimeErrors.nickName) && styles.inputError
                ]}
                placeholder={getInputPlaceholder(TextType.COMMON_NAME, t)}
                value={formData.nickName}
                onChangeText={(text) => {
                  handleNickNameChange(text, t);
                  updateFormData('nickName', text);
                }}
                placeholderTextColor={theme.colors.text.disabled}
              />
              {(errors.nickName || realtimeErrors.nickName) && (
                <Text style={styles.errorText}>
                  {errors.nickName || realtimeErrors.nickName}
                </Text>
              )}
            </View>

            {/* 密码输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.password_label')} *</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder={t('auth.register.form.password_placeholder')}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                autoComplete="off"
                textContentType="none"
                passwordRules=""
                placeholderTextColor={theme.colors.text.disabled}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* 确认密码 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.confirm_password_label')} *</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder={t('auth.register.form.confirm_password_placeholder')}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
                autoComplete="off"
                textContentType="none"
                passwordRules=""
                placeholderTextColor={theme.colors.text.disabled}
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* 性别选择 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.gender_label')}</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, formData.sex === '1' && styles.genderButtonActive]}
                  onPress={() => updateFormData('sex', '1')}
                >
                  <Text style={[styles.genderButtonText, formData.sex === '1' && styles.genderButtonTextActive]}>
                    {t('auth.register.form.gender_male')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, formData.sex === '0' && styles.genderButtonActive]}
                  onPress={() => updateFormData('sex', '0')}
                >
                  <Text style={[styles.genderButtonText, formData.sex === '0' && styles.genderButtonTextActive]}>
                    {t('auth.register.form.gender_female')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, formData.sex === '2' && styles.genderButtonActive]}
                  onPress={() => updateFormData('sex', '2')}
                >
                  <Text style={[styles.genderButtonText, formData.sex === '2' && styles.genderButtonTextActive]}>
                    {t('auth.register.form.gender_other')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 组织选择 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.register.form.organization_label')} *</Text>
              <OrganizationSelector
                value={formData.selectedOrganizationName}
                selectedId={formData.selectedOrganizationId}
                onSelect={handleOrganizationSelect}
                placeholder={t('auth.register.form.organization_placeholder')}
                error={errors.selectedOrganization}
              />
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>

      {/* Fixed Bottom Button */}
      <View style={styles.fixedBottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (loading || hasValidationErrors) && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={loading || hasValidationErrors}
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
    paddingBottom: 120, // 增加更多空间避免键盘遮挡内容
  },
  formContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    padding: theme.spacing.lg,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow.light],
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
    paddingVertical: theme.spacing[4], // 增加垂直内边距
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 52, // 设置最小高度，让输入框更舒适
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
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emailUsernameInput: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  emailDomain: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
  },
  emailHelpText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    fontStyle: 'italic',
  },
  completeEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[2],
    padding: theme.spacing[2],
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
  },
  completeEmailLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing[2],
  },
  completeEmailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  studentTypeContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  studentTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  studentTypeButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  studentTypeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  studentTypeButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3], // 减少垂直间距
    paddingBottom: theme.spacing[3] + 20, // 显著减少底部间距，更贴近底部
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  genderContainer: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  genderButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  genderButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  genderButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  selectorInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  selectorPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  modalLoading: {
    padding: theme.spacing[8],
  },
  organizationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '20',
  },
  organizationName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
}) as any;