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
      console.log('🔐 [MerchantAPI] Token状态:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [MerchantAPI] HTTP响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const result = await response.json();

      // 检查业务层面的错误（即使HTTP状态是200）
      if (result.code !== 200) {
        console.error('❌ [MerchantAPI] 业务错误:', {
          code: result.code,
          msg: result.msg,
        });

        // 检查是否为认证错误
        if (result.msg?.includes('认证失败') || result.msg?.includes('无法访问系统资源') || result.code === 401) {
          throw new Error('AUTH_FAILED: ' + (result.msg || '认证失败，请重新登录'));
        }

        throw new Error(result.msg || `API错误: ${result.code}`);
      }

      // HTTP错误处理
      if (!response.ok) {
        console.error('❌ [MerchantAPI] HTTP错误:', {
          status: response.status,
          message: result.msg,
        });

        if (response.status === 401) {
          throw new Error('AUTH_FAILED: 认证失败，请重新登录');
        }

        throw new Error(result.msg || `HTTP ${response.status}`);
      }

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
  async getMerchantDetail(id: number): Promise<ApiResponse<Merchant>> {
    try {
      const url = `${getBaseUrl()}/app/merchant/detail?id=${id}`;

      console.log('🏪 [MerchantAPI] 获取商家详情:', id);

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
   * 获取所有商家（不按学校筛选）
   * 注意：后端API不支持按deptId筛选，返回所有商家
   */
  async getAllMerchants(): Promise<Merchant[]> {
    try {
      // 不传递任何参数，获取所有商家
      const response = await this.getMerchantList({});

      console.log('🏪 [MerchantAPI] 获取所有商家响应:', {
        code: response.code,
        dataType: typeof response.data,
        rowsType: typeof response.rows,
        dataCount: Array.isArray(response.data) ? response.data.length : 0,
        rowsCount: Array.isArray(response.rows) ? response.rows.length : 0,
      });

      if (response.code === 200) {
        // 处理可能的两种数据格式
        const merchants = response.data || response.rows || [];
        const merchantList = Array.isArray(merchants) ? merchants : [];

        console.log(`✅ [MerchantAPI] 成功获取 ${merchantList.length} 个商家`);
        return merchantList;
      }

      console.warn('⚠️ [MerchantAPI] 获取商家失败:', response.msg);
      return [];
    } catch (error) {
      console.error('❌ [MerchantAPI] 获取所有商家失败:', error);
      return [];
    }
  }

  /**
   * 按学校获取商家（废弃）
   * @deprecated 后端API不支持按学校筛选，请使用 getAllMerchants() 并在前端过滤
   */
  async getMerchantsBySchool(deptId: number): Promise<Merchant[]> {
    console.warn('⚠️ [MerchantAPI] getMerchantsBySchool已废弃，使用getAllMerchants代替');
    return this.getAllMerchants();
  }
}

export const merchantAPI = new MerchantAPI();
export default merchantAPI;
