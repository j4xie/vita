// 注册相关API服务

import {
  RegistrationAPIRequest,
  APIResponse,
  OrganizationData,
  SMSVerificationResponse
} from '../types/registration';
import { getApiUrl } from '../utils/environment';

// API基础URL配置
// 🔧 使用环境管理器统一管理API地址 - 动态获取
const getBaseUrl = () => getApiUrl();

/**
 * 发送短信验证码
 * @param phoneNumber 手机号
 * @param areaCode 国际区号
 * @returns 短信验证码响应
 */
export const sendSMSVerificationCode = async (phoneNumber: string, areaCode: '86' | '1' = '86'): Promise<SMSVerificationResponse> => {
  const url = `${getBaseUrl()}/sms/vercodeSms?phoneNum=${phoneNumber}&areaCode=${areaCode}`;
  console.log('📱 [sendSMSVerificationCode] 发送短信验证码请求:', {
    phoneNumber: phoneNumber,
    areaCode: areaCode,
    fullUrl: url,
    baseUrl: getBaseUrl()
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📱 [sendSMSVerificationCode] 后端响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📱 [sendSMSVerificationCode] HTTP错误响应内容:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('📱 [sendSMSVerificationCode] 后端原始响应:', responseText);

    if (!responseText || responseText.trim() === '') {
      console.error('📱 [sendSMSVerificationCode] 后端返回空响应');
      throw new Error('Server returned empty response, please try again later');
    }

    const data = JSON.parse(responseText);
    console.log('📱 [sendSMSVerificationCode] 后端返回数据:', data);
    return data;
  } catch (error) {
    console.error('📱 [sendSMSVerificationCode] 发送短信验证码失败:', error);
    throw error;
  }
};

/**
 * 获取学校列表
 * @returns 学校列表
 */
export const fetchSchoolList = async (): Promise<APIResponse<any[]>> => {
  try {
    // 学校列表接口无需认证，可以直接调用
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch(`${getBaseUrl()}/app/dept/list`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 学校列表获取成功:', { count: data.data?.length || 0 });
    return data;
  } catch (error) {
    console.error('获取学校列表失败:', error);
    throw error;
  }
};

/**
 * 获取组织列表
 * @returns 组织列表
 */
export const fetchOrganizationList = async (): Promise<APIResponse<OrganizationData[]>> => {
  try {
    const response = await fetch(`${getBaseUrl()}/app/organization/list`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 适配后端响应格式：{ total, rows, code, msg }
    return {
      code: data.code,
      msg: data.msg,
      data: data.rows // 将rows映射到data字段
    };
  } catch (error) {
    console.error('获取组织列表失败:', error);
    // 网络错误时返回默认组织列表
    return {
      code: 200,
      msg: '获取成功',
      data: [
        { id: 1, name: '学联组织' },
        { id: 2, name: '社团' },
        { id: 4, name: 'Chinese Union' },
        { id: 5, name: 'CSSA' }
      ]
    };
  }
};

/**
 * 用户注册
 * @param registrationData 注册数据
 * @returns 注册结果
 */
export const registerUser = async (registrationData: RegistrationAPIRequest): Promise<APIResponse> => {
  try {
    // 🔧 添加30秒超时保护 - 防止并发时永久卡住
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // 构建form-data格式的请求体
    const formData = new URLSearchParams();
    Object.entries(registrationData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(`${getBaseUrl()}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('用户注册失败:', error);
    // 🔧 增强超时错误提示
    if ((error as Error).name === 'AbortError') {
      throw new Error('Registration request timed out, please check your network and try again');
    }
    throw error;
  }
};

/**
 * 验证用户名是否可用
 * @param userName 用户名
 * @returns 是否可用
 */
export const checkUserNameAvailability = async (userName: string): Promise<{ available: boolean; message?: string }> => {
  try {
    // 基础格式验证
    const userNameRegex = /^[a-zA-Z0-9]{6,20}$/;
    if (!userNameRegex.test(userName)) {
      return { available: false, message: 'Invalid username format' };
    }

    // 🔧 调用后端POST接口检查用户名是否已存在
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const body = new URLSearchParams();
    body.append('userName', userName);

    const response = await fetch(`${getBaseUrl()}/app/user/checkUserName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        return { available: true };
      } else if (data.code === 500) {
        // code 500 表示已存在
        return { available: false, message: data.msg || 'Username already exists' };
      } else {
        console.warn(`checkUserName接口返回code=${data.code}，降级放行`);
        return { available: true };
      }
    } else {
      console.warn('用户名检查接口不存在，只进行格式验证');
      return { available: true };
    }
  } catch (error) {
    console.error('检查用户名可用性失败:', error);
    // 网络错误时默认通过
    return { available: true };
  }
};

/**
 * 验证邮箱是否已被注册
 * @param email 邮箱地址
 * @returns 是否可用
 */
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message?: string; skipValidation?: boolean }> => {
  try {
    if (!validateEmailFormat(email)) {
      return { available: false, message: 'Invalid email format' };
    }

    // 🔧 添加10秒超时保护 - 防止实时验证卡住
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // 🔧 调用后端POST接口检查邮箱是否已被注册
    const body = new URLSearchParams();
    body.append('email', email);

    const response = await fetch(`${getBaseUrl()}/app/user/checkEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        return { available: true };
      } else if (data.code === 500) {
        // code 500 表示已存在
        return { available: false, message: data.msg || 'Email already registered' };
      } else {
        console.warn(`checkEmail接口返回code=${data.code}，降级放行`);
        return { available: true, skipValidation: true };
      }
    } else if (response.status === 404) {
      console.warn('⚠️ checkEmail接口不存在(404)，跳过实时验证');
      return { available: true, skipValidation: true };
    } else {
      console.warn(`checkEmail接口错误(${response.status})，跳过实时验证`);
      return { available: true };
    }
  } catch (error) {
    console.error('检查邮箱可用性失败:', error);
    // 🔧 超时或网络错误时默认通过，不阻塞用户
    if ((error as Error).name === 'AbortError') {
      console.warn('邮箱检查超时，跳过验证');
    }
    return { available: true };
  }
};

/**
 * 验证手机号是否已被注册
 * @param phone 手机号
 * @returns 是否可用
 */
export const checkPhoneAvailability = async (phone: string): Promise<{ available: boolean; message?: string }> => {
  try {
    if (!phone || phone.trim().length < 6) {
      return { available: true }; // 格式不完整时不检查
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // 🔧 调用后端POST接口检查手机号是否已被注册
    const body = new URLSearchParams();
    body.append('phonenumber', phone);

    const response = await fetch(`${getBaseUrl()}/app/user/checkPhonenumber`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        return { available: true };
      } else if (data.code === 500) {
        // code 500 表示已存在
        return { available: false, message: data.msg || 'Phone number already registered' };
      }
      console.warn(`checkPhone接口返回code=${data.code}，降级放行`);
      return { available: true };
    } else if (response.status === 404) {
      console.warn('⚠️ checkPhone接口不存在(404)，跳过实时验证');
      return { available: true };
    }
    return { available: true };
  } catch (error) {
    console.warn('检查手机号可用性失败:', error);
    return { available: true }; // 网络错误不阻塞
  }
};

/**
 * 验证邀请码格式
 * @param invCode 邀请码
 * @returns 验证结果
 * 
 * 注意：根据API文档，邀请码的实际有效性验证在注册时进行
 * 接口14 (/app/invitation/invInfo) 需要管理员权限，普通用户无法调用
 * 因此这里只进行格式验证，真实验证交给注册接口处理
 */
export const validateInvitationCode = async (invCode: string): Promise<{
  valid: boolean;
  data?: {
    inviterName?: string;
    organizationName?: string;
    organizationId?: number;
    usageCount?: number;
    maxUsage?: number;
  };
  message?: string;
}> => {
  try {
    // 邀请码格式验证：支持8-15位大写字母+数字组合（根据API文档要求）
    const isValidFormat = /^[A-Z0-9]{8,15}$/.test(invCode);
    if (!isValidFormat) {
      return {
        valid: false,
        message: '邀请码格式不正确，应为8-15位大写字母数字组合'
      };
    }

    // 格式验证通过，真实有效性将在注册时由后端验证
    // 如果邀请码不存在或已过期，注册接口会返回相应错误
    console.log('🔍 邀请码格式验证通过:', invCode);
    return {
      valid: true,
      message: '邀请码格式正确，将在注册时验证有效性'
    };
  } catch (error) {
    console.error('验证邀请码失败:', error);
    return { 
      valid: false, 
      message: '邀请码验证出错，请重试' 
    };
  }
};

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否为有效邮箱格式
 */
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国大陆手机号）
 * @param phoneNumber 手机号
 * @returns 是否为有效手机号
 */
export const validatePhoneNumber = (phoneNumber: string, areaCode: '86' | '1' = '86'): boolean => {
  console.log('🔍 [validatePhoneNumber] 开始验证电话号码:', {
    originalPhone: phoneNumber,
    areaCode: areaCode,
    phoneLength: phoneNumber.length
  });

  if (areaCode === '86') {
    // 中国手机号验证：1开头，第二位3-9，总共11位
    const chinaPhoneRegex = /^1[3-9]\d{9}$/;
    const result = chinaPhoneRegex.test(phoneNumber);
    console.log('🇨🇳 [validatePhoneNumber] 中国手机号验证结果:', result);
    return result;
  } else {
    // 美国手机号验证：支持多种格式
    // 1234567890, (123) 456-7890, 123-456-7890, 123.456.7890
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // 移除所有非数字字符
    const usPhoneRegex = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/; // 美国手机号格式

    console.log('🇺🇸 [validatePhoneNumber] 美国手机号验证详情:', {
      originalPhone: phoneNumber,
      cleanPhone: cleanPhone,
      cleanLength: cleanPhone.length,
      regexPattern: usPhoneRegex.toString(),
      regexTest: usPhoneRegex.test(cleanPhone)
    });

    const result = cleanPhone.length === 10 && usPhoneRegex.test(cleanPhone);
    console.log('🇺🇸 [validatePhoneNumber] 美国手机号最终验证结果:', result);
    return result;
  }
};

/**
 * 验证密码强度
 * @param password 密码
 * @returns 验证结果和提示信息
 */
export const validatePassword = (password: string, t?: (key: string, options?: any) => string): { isValid: boolean; message: string } => {
  const tr = (key: string, fallback: string) => t ? t(key, { defaultValue: fallback }) : fallback;
  if (password.length < 6) {
    return { isValid: false, message: tr('validation.password_min_length', 'Password must be at least 6 characters') };
  }
  if (password.length > 20) {
    return { isValid: false, message: tr('validation.password_length_6_20', 'Password must be 6-20 characters') };
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, message: tr('auth.register.errors.password_format', 'Password must contain both letters and numbers') };
  }
  return { isValid: true, message: '' };
};