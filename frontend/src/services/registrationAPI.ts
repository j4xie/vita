// 注册相关API服务

import { 
  RegistrationAPIRequest, 
  APIResponse, 
  OrganizationData, 
  SMSVerificationResponse 
} from '../types/registration';

// API基础URL配置
const BASE_URL = 'http://106.14.165.234:8085';

/**
 * 发送短信验证码
 * @param phoneNumber 手机号
 * @returns 短信验证码响应
 */
export const sendSMSVerificationCode = async (phoneNumber: string): Promise<SMSVerificationResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/sms/vercodeSms?phone=${phoneNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('发送短信验证码失败:', error);
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
    const response = await fetch(`${BASE_URL}/app/dept/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
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
    const response = await fetch(`${BASE_URL}/app/organization/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
    // 构建form-data格式的请求体
    const formData = new URLSearchParams();
    Object.entries(registrationData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(`${BASE_URL}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('用户注册失败:', error);
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
    const response = await fetch(`${BASE_URL}/app/user/checkUserName?userName=${userName}`, {
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
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message?: string }> => {
  try {
    if (!validateEmailFormat(email)) {
      return { available: false, message: '邮箱格式不正确' };
    }

    // 调用后端接口检查邮箱是否已被注册
    const response = await fetch(`${BASE_URL}/app/user/checkEmail?email=${encodeURIComponent(email)}`, {
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
        return { available: false, message: data.msg || '邮箱检查失败' };
      }
    } else {
      // 如果接口不存在，只做格式验证
      console.warn('邮箱检查接口不存在，只进行格式验证');
      return { available: true };
    }
  } catch (error) {
    console.error('检查邮箱可用性失败:', error);
    // 网络错误时默认通过
    return { available: true };
  }
};

/**
 * 验证邀请码是否有效
 * @param invCode 邀请码
 * @returns 验证结果和邀请码信息
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
    const response = await fetch(`${BASE_URL}/app/invitation/validate?invCode=${invCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200) {
        return {
          valid: true,
          data: data.data,
        };
      } else {
        return {
          valid: false,
          message: data.msg || '邀请码无效',
        };
      }
    } else {
      // 如果接口不存在，假设邀请码有效（开发阶段）
      console.warn('邀请码验证接口不存在');
      return {
        valid: true,
        data: {
          inviterName: '测试推荐人',
          organizationName: '学联组织',
          organizationId: 1,
        },
      };
    }
  } catch (error) {
    console.error('验证邀请码失败:', error);
    // 网络错误时假设有效
    return { valid: true };
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
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
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