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

    const data = await response.json();
    console.log('📱 [sendSMSVerificationCode] 后端返回数据:', data);
    return data;
  } catch (error) {
    console.error('📱 [sendSMSVerificationCode] 发送短信验证码失败:', error);
    throw error;
  }
};

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 * @param token 用户token（已登录用户验证邮箱时需要，注册场景无需token）
 * @returns 邮箱验证码响应（包含后端返回的验证码code字段用于前端对比）
 */
export const sendEmailVerificationCode = async (
  email: string,
  token?: string
): Promise<SMSVerificationResponse> => {
  const url = `${getBaseUrl()}/email/vercodeEmail?email=${encodeURIComponent(email)}`;
  console.log('📧 [sendEmailVerificationCode] 发送邮箱验证码请求:', {
    email: email,
    fullUrl: url,
    baseUrl: getBaseUrl(),
    hasToken: !!token
  });

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // 如果提供了token，添加Authorization头（用于已登录用户验证邮箱）
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('📧 [sendEmailVerificationCode] 后端响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📧 [sendEmailVerificationCode] HTTP错误响应内容:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    console.log('📧 [sendEmailVerificationCode] 后端返回数据:', data);

    // 🔧 适配Email API的响应格式
    // Email API响应: { code: "353702", errorCode: 0, message: "OK", messageId: "...", to: "..." }
    // SMS API响应: { code: "OK", bizId: "...", message: "..." }
    if (data.errorCode === 0 && data.messageId) {
      // 成功：转换为统一格式
      console.log('✅ [sendEmailVerificationCode] 邮箱验证码发送成功:', {
        verificationCode: data.code,
        messageId: data.messageId,
        to: data.to,
        hasVerifyParam: !!verify
      });

      return {
        code: 'OK',
        bizId: data.messageId, // 使用messageId作为bizId
        message: data.message || '验证码已发送',
        requestId: data.messageId,
        verificationCode: data.code, // 🔑 保留验证码用于前端对比（注册场景需要）
      };
    } else if (data.errorCode !== 0) {
      // 失败：返回错误信息
      console.error('❌ [sendEmailVerificationCode] 邮箱验证码发送失败:', data);
      return {
        code: 'ERROR',
        bizId: '',
        message: data.message || '邮件发送失败',
        requestId: ''
      };
    } else {
      // 未知格式
      console.warn('⚠️ [sendEmailVerificationCode] 未知响应格式:', data);
      return data;
    }
  } catch (error) {
    console.error('📧 [sendEmailVerificationCode] 发送邮箱验证码失败:', error);
    throw error;
  }
};

/**
 * 验证邮箱验证码
 * @param email 邮箱地址
 * @param verCode 验证码（6位数字）
 * @param bizId 邮件bizId（从sendEmailVerificationCode返回）
 * @returns 验证结果
 */
export const verifyEmailCode = async (params: {
  email: string;
  verCode: string;
  bizId: string;
}): Promise<APIResponse> => {
  console.log('🔐 [verifyEmailCode] 开始验证邮箱验证码:', {
    email: params.email,
    verCodeLength: params.verCode.length,
    bizId: params.bizId,
    baseUrl: getBaseUrl()
  });

  try {
    // 使用form-data格式（与/app/user/add保持一致）
    const formData = new URLSearchParams();
    formData.append('email', params.email);
    formData.append('verCode', params.verCode);
    formData.append('bizId', params.bizId);

    const response = await fetch(`${getBaseUrl()}/app/user/verifyEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('🔐 [verifyEmailCode] 后端响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔐 [verifyEmailCode] HTTP错误响应:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔐 [verifyEmailCode] 后端返回数据:', data);

    if (data.code === 200) {
      console.log('✅ [verifyEmailCode] 邮箱验证码验证成功');
    } else {
      console.error('❌ [verifyEmailCode] 邮箱验证码验证失败:', data.msg);
    }

    return data;
  } catch (error) {
    console.error('🔐 [verifyEmailCode] 验证邮箱验证码失败:', error);
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
      throw new Error('注册请求超时，请检查网络后重试');
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
      return { available: false, message: '用户名格式不正确' };
    }

    // 调用后端接口检查用户名是否已存在
    const response = await fetch(`${getBaseUrl()}/app/user/checkUserName?userName=${userName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        return { available: data.available !== false };
      } else {
        return { available: false, message: data.msg || '用户名检查失败' };
      }
    } else {
      // 如果接口不存在，只做格式验证
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
      return { available: false, message: '邮箱格式不正确' };
    }

    // 🔧 添加10秒超时保护 - 防止实时验证卡住
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // 调用后端接口检查邮箱是否已被注册
    const response = await fetch(`${getBaseUrl()}/app/user/checkEmail?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        return { available: data.available !== false };
      } else {
        return { available: false, message: data.msg || '邮箱检查失败' };
      }
    } else if (response.status === 404) {
      // 🔧 接口不存在 - 优雅降级，不阻塞注册流程
      console.warn('⚠️ checkEmail接口不存在(404)，跳过实时验证');
      return { available: true, skipValidation: true };
    } else {
      // 其他HTTP错误
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
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: '密码长度至少6位' };
  }
  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过20位' };
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, message: '密码必须包含字母和数字' };
  }
  return { isValid: true, message: '' };
};