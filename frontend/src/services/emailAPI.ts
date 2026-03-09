/**
 * 邮件 API 服务
 *
 * 提供邮件发送和邮箱验证相关的接口
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';

const getBaseUrl = () => getApiUrl();

// 邮件验证码发送参数
export interface EmailVerificationCodeParams {
  email: string; // 邮箱地址
  userId?: number; // 用户ID（可选）
  type?: 'register' | 'reset_password' | 'verify_email'; // 验证码类型
}

// 邮件验证码验证参数
export interface VerifyEmailCodeParams {
  email: string; // 邮箱地址
  code: string; // 验证码
  userId?: number; // 用户ID
}

// 邮箱验证状态
export interface EmailVerificationStatus {
  email: string;
  isVerified: boolean; // 是否已验证
  verifiedAt?: string; // 验证时间
  canResend: boolean; // 是否可以重新发送
  resendAfter?: number; // 多少秒后可以重新发送
}

// API响应结构
interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

class EmailAPI {
  /**
   * 发送邮箱验证码（匹配后端实际API）
   * GET /email/vercodeEmail?email=xxx
   * 返回: { code: "353702", errorCode: 0, message: "OK", messageId, submittedAt, to }
   */
  async sendEmailVercode(email: string): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/email/vercodeEmail?email=${encodeURIComponent(email)}`;

      console.log('📧 [EmailAPI] 发送邮箱验证码:', { email });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 邮箱验证码响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 发送邮箱验证码失败:', error);
      throw error;
    }
  }

  /**
   * 发送邮箱验证码（旧接口，保留兼容）
   * POST /app/email/sendVerificationCode
   */
  async sendVerificationCode(params: EmailVerificationCodeParams): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/email/sendVerificationCode`;

      console.log('📧 [EmailAPI] 发送邮箱验证码:', {
        email: params.email,
        type: params.type,
      });

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 验证码发送响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 发送验证码失败:', error);
      throw error;
    }
  }

  /**
   * 验证邮箱验证码
   * POST /app/email/verifyCode
   */
  async verifyEmailCode(params: VerifyEmailCodeParams): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/email/verifyCode`;

      console.log('📧 [EmailAPI] 验证邮箱验证码:', {
        email: params.email,
      });

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 验证码验证响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 验证码验证失败:', error);
      throw error;
    }
  }

  /**
   * 获取邮箱验证状态
   * GET /app/email/verificationStatus
   */
  async getVerificationStatus(params: {
    email: string;
    userId?: number;
  }): Promise<ApiResponse<EmailVerificationStatus>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('email', params.email);
      if (params.userId) {
        queryParams.append('userId', params.userId.toString());
      }

      const url = `${getBaseUrl()}/app/email/verificationStatus?${queryParams.toString()}`;

      console.log('📧 [EmailAPI] 获取邮箱验证状态:', params.email);

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 验证状态响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 获取验证状态失败:', error);
      throw error;
    }
  }

  /**
   * 绑定邮箱（发送验证码并验证）
   * POST /app/email/bind
   */
  async bindEmail(params: {
    userId: number;
    email: string;
    code: string; // 验证码
  }): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/email/bind`;

      console.log('📧 [EmailAPI] 绑定邮箱:', {
        userId: params.userId,
        email: params.email,
      });

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 绑定邮箱响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 绑定邮箱失败:', error);
      throw error;
    }
  }

  /**
   * 解绑邮箱
   * POST /app/email/unbind
   */
  async unbindEmail(params: {
    userId: number;
    email: string;
  }): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/email/unbind`;

      console.log('📧 [EmailAPI] 解绑邮箱:', {
        userId: params.userId,
        email: params.email,
      });

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 解绑邮箱响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 解绑邮箱失败:', error);
      throw error;
    }
  }

  /**
   * 发送密码重置邮件
   * POST /app/email/sendResetPassword
   */
  async sendResetPasswordEmail(params: {
    email: string;
  }): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/email/sendResetPassword`;

      console.log('📧 [EmailAPI] 发送密码重置邮件:', params.email);

      // 密码重置不需要登录，所以不需要token
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 密码重置邮件响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 发送密码重置邮件失败:', error);
      throw error;
    }
  }

  /**
   * 测试邮件服务连接
   * GET /app/email/test
   */
  async testEmailService(): Promise<ApiResponse> {
    try {
      const url = `${getBaseUrl()}/app/email/test`;

      console.log('📧 [EmailAPI] 测试邮件服务');

      const token = await getCurrentToken();
      if (!token) throw new Error('未登录');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 [EmailAPI] 测试服务响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [EmailAPI] 测试服务失败:', error);
      throw error;
    }
  }

  /**
   * 邮箱验证快捷方法：发送验证码 + 60秒倒计时提示
   */
  async sendVerificationCodeWithCooldown(params: EmailVerificationCodeParams): Promise<{
    success: boolean;
    message: string;
    canResendAfter?: number;
  }> {
    try {
      const response = await this.sendVerificationCode(params);

      if (response.code === 200) {
        return {
          success: true,
          message: '验证码已发送，请查收邮件',
          canResendAfter: 60, // 60秒后可重发
        };
      } else {
        return {
          success: false,
          message: response.msg || '发送失败，请稍后重试',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '网络错误，请检查网络连接',
      };
    }
  }
}

export const emailAPI = new EmailAPI();
export default emailAPI;
