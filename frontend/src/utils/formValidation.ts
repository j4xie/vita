/**
 * 通用表单验证工具函数
 * 用于登录、注册等界面的表单验证
 */

// 简化的翻译函数类型，避免i18next版本冲突
type TranslateFunction = (key: string, options?: any) => string;

export interface ValidationResult {
  isValid: boolean;
  errorKey?: string;
  errorMessage?: string;
  suggestion?: string;
  example?: string;
}

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean;
}

/**
 * 邮箱验证
 */
export const validateEmail = (email: string, t: TranslateFunction): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.email_required',
      errorMessage: t('auth.errors.form_validation.email_required'),
    };
  }

  // 基本邮箱格式验证
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.email_format_invalid',
      errorMessage: t('auth.errors.form_validation.email_format_invalid'),
      suggestion: t('auth.errors.form_validation.email_format_hint'),
      example: t('auth.errors.form_validation.email_example'),
    };
  }

  return { isValid: true };
};

/**
 * 密码验证
 */
export const validatePassword = (password: string, t: TranslateFunction): ValidationResult => {
  if (!password || password.trim().length === 0) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.password_required',
      errorMessage: t('auth.errors.form_validation.password_required'),
    };
  }

  // 密码格式验证：至少6位，包含字母和数字
  if (password.length < 6) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.password_format_invalid',
      errorMessage: t('auth.errors.form_validation.password_format_invalid'),
      suggestion: t('auth.errors.form_validation.password_format_hint'),
      example: t('auth.errors.form_validation.password_example'),
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.password_format_invalid',
      errorMessage: t('auth.errors.form_validation.password_format_invalid'),
      suggestion: t('auth.errors.form_validation.password_format_hint'),
      example: t('auth.errors.form_validation.password_example'),
    };
  }

  return { isValid: true };
};

/**
 * 确认密码验证
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
  t: TranslateFunction
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim().length === 0) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.confirm_password_required',
      errorMessage: t('auth.errors.form_validation.confirm_password_required'),
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.password_mismatch',
      errorMessage: t('auth.errors.form_validation.password_mismatch'),
      suggestion: t('auth.errors.form_validation.password_mismatch_hint'),
    };
  }

  return { isValid: true };
};

/**
 * 手机号验证
 */
export const validatePhone = (
  phone: string,
  areaCode: string,
  t: TranslateFunction
): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.phone_required',
      errorMessage: t('auth.errors.form_validation.phone_required'),
    };
  }

  // 中国手机号验证
  if (areaCode === 'CN' || areaCode === '+86' || areaCode === '86') {
    const cnPhoneRegex = /^1[3-9]\d{9}$/;
    if (!cnPhoneRegex.test(phone)) {
      return {
        isValid: false,
        errorKey: 'auth.errors.form_validation.phone_format_invalid_cn',
        errorMessage: t('auth.errors.form_validation.phone_format_invalid_cn'),
        suggestion: t('auth.errors.form_validation.phone_format_hint_cn'),
        example: t('auth.errors.form_validation.phone_example_cn'),
      };
    }
  }
  // 美国手机号验证
  else if (areaCode === 'US' || areaCode === '+1' || areaCode === '1') {
    const usPhoneRegex = /^\d{10}$/;
    if (!usPhoneRegex.test(phone)) {
      return {
        isValid: false,
        errorKey: 'auth.errors.form_validation.phone_format_invalid_us',
        errorMessage: t('auth.errors.form_validation.phone_format_invalid_us'),
        suggestion: t('auth.errors.form_validation.phone_format_hint_us'),
        example: t('auth.errors.form_validation.phone_example_us'),
      };
    }
  }

  return { isValid: true };
};

/**
 * 用户名验证
 */
export const validateUsername = (username: string, t: TranslateFunction): ValidationResult => {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.username_required',
      errorMessage: t('auth.errors.form_validation.username_required'),
    };
  }

  // 用户名格式验证：6-20位字母和数字组合
  if (username.length < 6 || username.length > 20) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.username_format_invalid',
      errorMessage: t('auth.errors.form_validation.username_format_invalid'),
      suggestion: t('auth.errors.form_validation.username_format_hint'),
      example: t('auth.errors.form_validation.username_example'),
    };
  }

  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.username_format_invalid',
      errorMessage: t('auth.errors.form_validation.username_format_invalid'),
      suggestion: t('auth.errors.form_validation.username_format_hint'),
      example: t('auth.errors.form_validation.username_example'),
    };
  }

  return { isValid: true };
};

/**
 * 验证码验证
 */
export const validateVerificationCode = (
  code: string,
  t: TranslateFunction
): ValidationResult => {
  if (!code || code.trim().length === 0) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.verification_code_required',
      errorMessage: t('auth.errors.form_validation.verification_code_required'),
    };
  }

  const codeRegex = /^\d{6}$/;
  if (!codeRegex.test(code)) {
    return {
      isValid: false,
      errorKey: 'auth.errors.form_validation.verification_code_format_invalid',
      errorMessage: t('auth.errors.form_validation.verification_code_format_invalid'),
      suggestion: t('auth.errors.form_validation.verification_code_format_hint'),
      example: t('auth.errors.form_validation.verification_code_example'),
    };
  }

  return { isValid: true };
};

/**
 * 通用验证函数
 */
export const validateField = (
  value: string,
  options: ValidationOptions,
  t: TranslateFunction,
  fieldName: string
): ValidationResult => {
  if (options.required && (!value || value.trim().length === 0)) {
    return {
      isValid: false,
      errorMessage: `${fieldName}是必填项`,
    };
  }

  if (options.minLength && value.length < options.minLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName}至少需要${options.minLength}个字符`,
    };
  }

  if (options.maxLength && value.length > options.maxLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName}不能超过${options.maxLength}个字符`,
    };
  }

  if (options.pattern && !options.pattern.test(value)) {
    return {
      isValid: false,
      errorMessage: `${fieldName}格式不正确`,
    };
  }

  if (options.customValidator && !options.customValidator(value)) {
    return {
      isValid: false,
      errorMessage: `${fieldName}验证失败`,
    };
  }

  return { isValid: true };
};

/**
 * 获取密码强度
 */
export const getPasswordStrength = (password: string, t: TranslateFunction) => {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 2) {
    return {
      level: 'weak' as const,
      color: '#ef4444',
      text: t('auth.password.strength.weak'),
    };
  }
  if (strength <= 4) {
    return {
      level: 'medium' as const,
      color: '#f59e0b',
      text: t('auth.password.strength.medium'),
    };
  }
  return {
    level: 'strong' as const,
    color: '#10b981',
    text: t('auth.password.strength.strong'),
  };
};

/**
 * 解析API错误并返回用户友好的错误信息
 */
export const parseApiError = (
  error: any,
  errorType: 'login' | 'register' | 'general',
  t: TranslateFunction
) => {
  const errorMessage = error?.message || error?.msg || '';
  const errorCode = error?.code;

  // 网络错误和超时
  if (
    errorMessage.includes('Network') ||
    errorMessage.includes('网络') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('超时') ||
    errorMessage.includes('连接')
  ) {
    return {
      title: '🌐 网络错误',
      message: errorMessage.includes('超时') || errorMessage.includes('timeout')
        ? '注册请求超时（30秒无响应），可能是网络不稳定或服务器繁忙'
        : t('auth.errors.network.connection_failed'),
      suggestion: '建议：✓ 检查WiFi/数据连接 ✓ 稍后重试 ✓ 联系客服',
      action: t('auth.errors.actions.retry'),
    };
  }

  // 根据错误类型和消息内容返回具体错误
  if (errorType === 'login') {
    if (errorMessage.includes('用户不存在') || errorMessage.includes('user not found')) {
      return {
        title: t('auth.errors.login_failed'),
        message: t('auth.errors.user_not_found'),
        suggestion: t('auth.errors.actions.check_input'),
      };
    }
    if (errorMessage.includes('密码错误') || errorMessage.includes('password')) {
      return {
        title: t('auth.errors.login_failed'),
        message: t('auth.errors.invalid_password'),
        suggestion: t('auth.errors.actions.check_input'),
      };
    }
  }

  if (errorType === 'register') {
    // 🔧 邮箱重复错误 - 增强识别（支持多种格式）
    const emailConflictPatterns = [
      /邮箱.*存在/i,
      /email.*exist/i,
      /email.*taken/i,
      /email.*occupied/i,
      /duplicate.*email/i,
      /email.*unique/i,
      /email.*constraint/i,
      /duplicate entry.*@.*for key/i, // MySQL错误: Duplicate entry 'xxx@xxx' for key 'email'
    ];

    // 检查是否匹配任何邮箱冲突模式
    const isEmailConflict = emailConflictPatterns.some(pattern => pattern.test(errorMessage));

    // 特殊检查：如果错误消息包含@符号，很可能是邮箱冲突
    const containsEmailAddress = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(errorMessage);

    if (isEmailConflict || containsEmailAddress) {
      return {
        title: '📧 邮箱已注册',
        message: '此邮箱已经注册过账号，您可能已经有账户了',
        suggestion: '建议：✓ 使用此邮箱直接登录 ✓ 点击"忘记密码"重置密码 ✓ 使用其他邮箱注册',
        action: '去登录',
        actionType: 'login',
      };
    }

    // 用户名重复错误（排除邮箱情况）
    if ((errorMessage.includes('用户名') || errorMessage.includes('username')) && !containsEmailAddress) {
      return {
        title: t('auth.errors.registration.registration_failed'),
        message: t('auth.errors.registration.username_taken'),
        suggestion: t('auth.errors.registration.username_taken_suggestion'),
        action: t('auth.errors.actions.go_to_login'),
        actionType: 'login',
      };
    }

    // 手机号重复错误
    if (errorMessage.includes('手机号') || errorMessage.includes('phone')) {
      return {
        title: t('auth.errors.registration.registration_failed'),
        message: t('auth.errors.registration.phone_taken'),
        suggestion: t('auth.errors.registration.phone_taken_suggestion'),
        action: t('auth.errors.actions.go_to_login'),
        actionType: 'login',
      };
    }

    // 验证码错误
    if (errorMessage.includes('验证码') || errorMessage.includes('verification')) {
      return {
        title: t('auth.errors.registration.registration_failed'),
        message: t('auth.errors.registration.verification_code_invalid'),
        suggestion: t('auth.errors.registration.verification_code_suggestion'),
        action: t('auth.errors.actions.get_new_code'),
      };
    }
  }

  // 默认错误
  return {
    title: t('common.error'),
    message: errorMessage || t('auth.errors.unknown_error'),
    suggestion: t('auth.errors.actions.contact_support'),
  };
};