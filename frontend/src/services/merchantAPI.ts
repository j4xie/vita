/**
 * 商家 API 服务
 *
 * 提供商家相关的数据接口
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';

const getBaseUrl = () => getApiUrl();

export interface Merchant {
  id: number;
  merchantName: string; // 商家名称
  logo?: string | null; // 商家Logo
  shopImg?: string | null; // 商家图片
  merchantDesc?: string; // 商家描述
  merchantAddress?: string; // 商家地址
  merchantType?: number; // 商家类型
  userId?: number;
  userName?: string;
  legalName?: string;
  phonenumber?: string;
  email?: string;
  ein?: string | null;
  legalPerCard?: string;
  accountName?: string;
  bankAccount?: string;
  openingBank?: string | null;
  ssn?: string;
  rn?: string;
  acHolderName?: string;
  zipcode?: string;
  businessLicense?: string;
  permitLicense?: string | null;
  principalType?: number;
  status?: number;
  reason?: string | null;
  createBy?: string | null;
  createTime?: string;
  updateBy?: string | null;
  updateTime?: string;
  remark?: string | null;
  createById?: number;
  createByName?: string;
  // UI 辅助字段
  earnPoints?: number;
  category?: string;
  price?: string;
}

interface MerchantListParams {
  deptId?: number; // 按学校筛选
  category?: string; // 商家类别
  pageNum?: number;
  pageSize?: number;
}

interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
  total?: number;
  rows?: T;
}

class MerchantAPI {
  /**
   * 获取商家列表
   * GET /app/merchant/list
   */
  async getMerchantList(params: MerchantListParams = {}): Promise<ApiResponse<Merchant[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.deptId) queryParams.append('deptId', params.deptId.toString());
      if (params.category) queryParams.append('category', params.category);
      if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

      const queryString = queryParams.toString();
      const url = `${getBaseUrl()}/app/merchant/list${queryString ? `?${queryString}` : ''}`;

      console.log('🏪 [MerchantAPI] 获取商家列表:', url);

      const token = await getCurrentToken();
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

      // 详细日志 - 查看返回的数据结构
      console.log('📋 [MerchantAPI] 商家列表响应:', {
        code: result.code,
        msg: result.msg,
        hasData: !!result.data,
        hasRows: !!result.rows,
        dataType: typeof result.data,
        dataCount: Array.isArray(result.data) ? result.data.length : (result.rows?.length || 0),
      });

      // 如果有数据，打印第一个商家的所有字段
      const merchants = result.data || result.rows || [];
      if (merchants.length > 0) {
        console.log('🏪 [MerchantAPI] 第一个商家数据示例:', {
          fields: Object.keys(merchants[0]),
          sample: merchants[0],
        });
      }

      return result;
    } catch (error) {
      console.error('❌ [MerchantAPI] 获取商家列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取商家详情
   * GET /app/merchant/detail
   */
  async getMerchantDetail(merchantId: number): Promise<ApiResponse<Merchant>> {
    try {
      const url = `${getBaseUrl()}/app/merchant/detail?merchantId=${merchantId}`;

      console.log('🏪 [MerchantAPI] 获取商家详情:', merchantId);

      const token = await getCurrentToken();
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
      console.log('📋 [MerchantAPI] 商家详情响应:', result);

      return result;
    } catch (error) {
      console.error('❌ [MerchantAPI] 获取商家详情失败:', error);
      throw error;
    }
  }

  /**
   * 按学校获取商家
   */
  async getMerchantsBySchool(deptId: number): Promise<Merchant[]> {
    try {
      const response = await this.getMerchantList({ deptId });

      if (response.code === 200) {
        // 处理可能的两种数据格式
        const merchants = response.data || response.rows || [];
        return Array.isArray(merchants) ? merchants : [];
      }

      return [];
    } catch (error) {
      console.error('❌ [MerchantAPI] 按学校获取商家失败:', error);
      return [];
    }
  }
}

export const merchantAPI = new MerchantAPI();
export default merchantAPI;
