/**
 * Points Mall API Service
 * 积分商城API服务
 *
 * 基于测试环境API文档: http://106.14.165.234:8086/apiDocumentation.html
 */

import { getCurrentToken } from './authAPI';
import { getApiUrl } from '../utils/environment';
import {
  Product,
  ProductStatus,
  ProductCategory,
  ProductListResponse,
} from '../types/pointsMall';

const getBaseUrl = () => getApiUrl();

// 后端商品数据结构
interface BackendGood {
  id: number;
  goodName: string;
  goodIcon: string;
  classifyId: number;
  classifyName: string;
  goodDesc: string | null;
  price: number;
  quantity: number | null;
  unit: string | null;
  goodDetail: string;
  createUserId: number;
  createBy?: string;
  createTime?: string;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
}

// 后端分类数据结构
interface BackendClassify {
  id: number;
  catName: string;
  catImg: string | null;
  createTime?: string;
  updateTime?: string | null;
}

// 后端API响应结构
interface BackendApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
  total?: number;
  pageNum?: number;
  pageSize?: number;
  totalPage?: number;
  rows?: T[];
}

/**
 * 分类名称映射到ProductCategory枚举
 */
const mapCategoryName = (classifyName: string): ProductCategory => {
  const mapping: Record<string, ProductCategory> = {
    '数码电子': ProductCategory.ELECTRONICS,
    '生活用品': ProductCategory.LIFESTYLE,
    '图书': ProductCategory.BOOKS,
    '代金券': ProductCategory.VOUCHERS,
    '课程': ProductCategory.COURSES,
    '酒水饮料': ProductCategory.FOOD,
    '坚果零食': ProductCategory.FOOD,
    '鲜花水果': ProductCategory.FOOD,
  };

  return mapping[classifyName] || ProductCategory.LIFESTYLE;
};

/**
 * 后端商品数据适配器 - 转换为前端Product类型
 */
const adaptBackendGoodToProduct = (backendGood: BackendGood): Product => {
  return {
    id: backendGood.id.toString(),
    name: backendGood.goodName,
    description: backendGood.goodDesc || '',
    detailedDescription: backendGood.goodDetail,
    category: mapCategoryName(backendGood.classifyName),
    status: (backendGood.quantity === null || backendGood.quantity > 0)
      ? ProductStatus.AVAILABLE
      : ProductStatus.OUT_OF_STOCK,
    pointsPrice: backendGood.price,
    marketPrice: undefined, // 后端暂无此字段
    earnPoints: undefined, // 后端暂无此字段，可以后续根据规则计算
    stock: backendGood.quantity || 0,
    images: (backendGood.goodIcon || '')
      .split(',')
      .map((url: string, idx: number) => url.trim())
      .filter(Boolean)
      .map((url: string, idx: number) => ({
        id: String(idx + 1),
        url,
        thumbnailUrl: url,
      })),
    primaryImage: backendGood.goodIcon?.split(',')[0]?.trim() || '',
    variants: undefined,
    createdAt: backendGood.createTime || new Date().toISOString(),
    updatedAt: backendGood.updateTime || backendGood.createTime || new Date().toISOString(),
    isFavorite: false, // 前端本地维护
    viewCount: undefined,
    exchangeCount: undefined,
  };
};

class PointsMallAPI {
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BackendApiResponse<T>> {
    const headers: HeadersInit = {
      ...options.headers,
    };

    // 添加认证token
    const token = await getCurrentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    console.log(`🛒 [PointsMall API] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log(`✅ [PointsMall API] 响应:`, data);

      if (data.code !== 200) {
        throw new Error(data.msg || `API Error ${data.code}`);
      }

      return data;
    } catch (error: any) {
      console.error(`❌ [PointsMall API] 请求失败:`, error);
      throw error;
    }
  }

  // ===== 商品相关接口 =====

  /**
   * 获取商品分类列表
   * POST /app/goods/classifyList
   */
  async getCategories(): Promise<BackendClassify[]> {
    const response = await this.request<BackendClassify>(
      '/app/goods/classifyList',
      { method: 'POST' }
    );

    return (response.rows as BackendClassify[]) || [];
  }

  /**
   * 获取商品列表
   * POST /app/goods/goodsList
   */
  async getProducts(params: {
    pageNum?: number;
    pageSize?: number;
    classifyId?: number;
  }): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams({
      pageNum: (params.pageNum || 1).toString(),
      pageSize: (params.pageSize || 10).toString(),
      ...(params.classifyId && { classifyId: params.classifyId.toString() }),
    });

    const response = await this.request<BackendGood>(
      `/app/goods/goodsList?${queryParams}`,
      { method: 'POST' }
    );

    // 转换后端数据为前端Product类型
    const backendGoods = (response.rows as BackendGood[]) || [];
    const products = backendGoods.map(adaptBackendGoodToProduct);

    return {
      products,
      total: response.total || 0,
      pageNum: response.pageNum || 1,
      pageSize: response.pageSize || 10,
      hasMore: (response.pageNum || 1) < (response.totalPage || 1),
    };
  }

  /**
   * 获取商品详情
   * GET /app/goods/detail/{id}
   */
  async getProductDetail(productId: string): Promise<Product> {
    const response = await this.request<BackendGood>(
      `/app/goods/detail/${productId}`,
      { method: 'GET' }
    );

    if (!response.data) {
      throw new Error('商品信息不存在');
    }

    return adaptBackendGoodToProduct(response.data);
  }
}

export const pointsMallAPI = new PointsMallAPI();
