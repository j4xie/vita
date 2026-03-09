/**
 * Address API Service
 * 收货地址API服务
 *
 * 支持收货地址的增删改查
 */

import { getCurrentToken } from './authAPI';
import { getApiUrl } from '../utils/environment';

const getBaseUrl = () => getApiUrl();

// ==================== 类型定义 ====================

// 收货地址信息
export interface Address {
  id: number;
  name: string;           // 收件人姓名
  intAreaCode: string;    // 国家代码，如 "86"
  mobile: string;         // 手机号
  address: string;        // 街道地址
  detailAddr?: string;    // 详细地址 (Apt/Suite/Unit)
  city?: string;          // 城市
  state?: string;         // 州 (美国地址)
  zipCode?: string;       // 邮编
  longitude?: string;     // 经度
  latitude?: string;      // 纬度
  isDefault: number;      // 是否默认地址：1是 -1否
  createById?: number;
  createByName?: string;
  createTime?: string;
  updateTime?: string;
}

// 添加地址参数
export interface AddAddressParams {
  name: string;           // 收件人姓名 (必需)
  intAreaCode: string;    // 国家代码 (必需)
  mobile: string;         // 手机号 (必需)
  address: string;        // 街道地址 (必需)
  detailAddr?: string;    // 详细地址 (可选)
  city?: string;          // 城市 (可选 - 后端待支持)
  state?: string;         // 州 (可选 - 后端待支持)
  zipCode?: string;       // 邮编 (可选 - 后端待支持)
  latitude?: string;      // 经度 (可选)
  longitude?: string;     // 纬度 (可选)
  isDefault?: string;     // 是否默认地址：1是 -1否 (可选)
}

// 修改地址参数
export interface UpdateAddressParams extends AddAddressParams {
  id: string;             // 收货地址ID (必需)
}

// API响应结构
interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

// 列表响应结构
interface ListResponse<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  totalPage: number;
  rows: T[];
  code: number;
  msg: string;
}

// ==================== 辅助函数 ====================

/**
 * 构建请求头
 */
const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const token = await getCurrentToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// ==================== API 函数 ====================

/**
 * 获取收货地址列表
 * GET /app/address/list
 *
 * @returns 地址列表
 */
export const getAddressList = async (): Promise<Address[]> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    const url = `${baseUrl}/app/address/list`;

    console.log('[AddressAPI] 获取收货地址列表');

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ListResponse<Address> = await response.json();
    console.log('[AddressAPI] 地址列表:', result);

    if (result.code === 200 && result.rows) {
      return result.rows;
    }
    return [];
  } catch (error) {
    console.error('[AddressAPI] 获取地址列表失败:', error);
    throw error;
  }
};

/**
 * 获取默认收货地址
 *
 * @returns 默认地址或null
 */
export const getDefaultAddress = async (): Promise<Address | null> => {
  try {
    const addresses = await getAddressList();
    const defaultAddr = addresses.find(addr => addr.isDefault === 1);
    return defaultAddr || (addresses.length > 0 ? addresses[0] : null);
  } catch (error) {
    console.error('[AddressAPI] 获取默认地址失败:', error);
    return null;
  }
};

/**
 * 添加收货地址
 * POST /app/address/add
 *
 * @param params 地址参数
 * @returns 添加结果
 */
export const addAddress = async (params: AddAddressParams): Promise<ApiResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    // 构建Query参数
    const queryParams = new URLSearchParams();
    queryParams.append('name', params.name);
    queryParams.append('intAreaCode', params.intAreaCode);
    queryParams.append('mobile', params.mobile);
    queryParams.append('address', params.address);

    if (params.detailAddr) {
      queryParams.append('detailAddr', params.detailAddr);
    }
    if (params.city) {
      queryParams.append('city', params.city);
    }
    if (params.state) {
      queryParams.append('state', params.state);
    }
    if (params.zipCode) {
      queryParams.append('zipCode', params.zipCode);
    }
    if (params.latitude) {
      queryParams.append('latitude', params.latitude);
    }
    if (params.longitude) {
      queryParams.append('longitude', params.longitude);
    }
    if (params.isDefault) {
      queryParams.append('isDefault', params.isDefault);
    }

    const url = `${baseUrl}/app/address/add?${queryParams.toString()}`;

    console.log('[AddressAPI] 添加收货地址:', {
      name: params.name,
      address: params.address,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AddressAPI] HTTP错误:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    console.log('[AddressAPI] 添加地址结果:', result);

    return result;
  } catch (error) {
    console.error('[AddressAPI] 添加地址失败:', error);
    throw error;
  }
};

/**
 * 修改收货地址
 * POST /app/address/edit
 *
 * @param params 地址参数（含ID）
 * @returns 修改结果
 */
export const updateAddress = async (params: UpdateAddressParams): Promise<ApiResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    // 构建Query参数
    const queryParams = new URLSearchParams();
    queryParams.append('id', params.id);
    queryParams.append('name', params.name);
    queryParams.append('intAreaCode', params.intAreaCode);
    queryParams.append('mobile', params.mobile);
    queryParams.append('address', params.address);

    if (params.detailAddr) {
      queryParams.append('detailAddr', params.detailAddr);
    }
    if (params.city) {
      queryParams.append('city', params.city);
    }
    if (params.state) {
      queryParams.append('state', params.state);
    }
    if (params.zipCode) {
      queryParams.append('zipCode', params.zipCode);
    }
    if (params.latitude) {
      queryParams.append('latitude', params.latitude);
    }
    if (params.longitude) {
      queryParams.append('longitude', params.longitude);
    }
    if (params.isDefault) {
      queryParams.append('isDefault', params.isDefault);
    }

    const url = `${baseUrl}/app/address/edit?${queryParams.toString()}`;

    console.log('[AddressAPI] 修改收货地址:', {
      id: params.id,
      name: params.name,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    console.log('[AddressAPI] 修改地址结果:', result);

    return result;
  } catch (error) {
    console.error('[AddressAPI] 修改地址失败:', error);
    throw error;
  }
};

/**
 * 删除收货地址
 * GET /app/address/delete
 *
 * @param id 地址ID
 * @returns 删除结果
 */
export const deleteAddress = async (id: string): Promise<ApiResponse> => {
  try {
    const baseUrl = getBaseUrl();
    const headers = await getHeaders();

    const url = `${baseUrl}/app/address/delete?id=${id}`;

    console.log('[AddressAPI] 删除收货地址:', id);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    console.log('[AddressAPI] 删除地址结果:', result);

    return result;
  } catch (error) {
    console.error('[AddressAPI] 删除地址失败:', error);
    throw error;
  }
};

/**
 * 设置默认地址
 *
 * @param id 地址ID
 * @returns 设置结果
 */
export const setDefaultAddress = async (id: string, address: Address): Promise<ApiResponse> => {
  return updateAddress({
    id,
    name: address.name,
    intAreaCode: address.intAreaCode,
    mobile: address.mobile,
    address: address.address,
    detailAddr: address.detailAddr,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: '1',
  });
};

// ==================== 导出 ====================

const addressAPI = {
  getAddressList,
  getDefaultAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

export default addressAPI;
