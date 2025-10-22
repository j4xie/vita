/**
 * 用户 API 服务
 *
 * 提供用户相关的数据接口（积分、个人信息等）
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';

const getBaseUrl = () => getApiUrl();

interface ApiResponse<T = any> {
  msg: string;
  code: number;
  point?: number; // 积分字段
  data?: T;
}

class UserAPI {
  /**
   * 查询用户积分
   * POST /app/user/userPoint
   */
  async getUserPoints(): Promise<number> {
    try {
      const url = `${getBaseUrl()}/app/user/userPoint`;

      console.log('💰 [UserAPI] 查询用户积分:', url);

      const token = await getCurrentToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.code !== 200) {
        console.error('❌ [UserAPI] 查询积分失败:', result.msg);
        throw new Error(result.msg || '查询积分失败');
      }

      const points = result.point || 0;
      console.log('✅ [UserAPI] 用户当前积分:', points);

      return points;
    } catch (error) {
      console.error('❌ [UserAPI] 查询用户积分异常:', error);
      throw error;
    }
  }
}

export const userAPI = new UserAPI();
export default userAPI;
