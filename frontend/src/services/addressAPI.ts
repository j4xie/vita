/**
 * Address API Service
 * 收货地址API服务
 *
 * 基于后端API文档实现
 */

import { getCurrentToken } from './authAPI';
import { getApiUrl } from '../utils/environment';
import {
  Address,
  AddressFormData,
  AddressListResponse,
} from '../types/address';

const getBaseUrl = () => getApiUrl();

interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

class AddressAPI {
  /**
   * 通用请求方法
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 添加认证token
    const token = await getCurrentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    console.log(`📍 [Address API] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log(`✅ [Address API] 响应:`, data);

      if (data.code !== 200) {
        throw new Error(data.msg || `API Error ${data.code}`);
      }

      return data;
    } catch (error: any) {
      console.error(`❌ [Address API] 请求失败:`, error);
      throw error;
    }
  }

  /**
   * 获取地址列表
   * GET /app/address/list
   *
   * @returns 地址列表
   */
  async getAddressList(): Promise<Address[]> {
    const response = await this.request<AddressListResponse>(
      '/app/address/list',
      { method: 'GET' }
    );

    return response.rows || [];
  }

  /**
   * 添加收货地址
   * POST /app/address/add
   *
   * @param data 地址表单数据
   */
  async addAddress(data: AddressFormData): Promise<ApiResponse> {
    const params = new URLSearchParams({
      name: data.name,
      intAreaCode: data.intAreaCode,
      mobile: data.mobile,
      address: data.address,
      ...(data.detailAddr && { detailAddr: data.detailAddr }),
      ...(data.latitude && { latitude: data.latitude }),
      ...(data.longitude && { longitude: data.longitude }),
      isDefault: (data.isDefault || -1).toString(),
    });

    return this.request<ApiResponse>(
      `/app/address/add?${params}`,
      { method: 'POST' }
    );
  }

  /**
   * 编辑收货地址
   * POST /app/address/edit
   *
   * @param data 地址表单数据（必须包含id）
   */
  async editAddress(data: AddressFormData): Promise<ApiResponse> {
    if (!data.id) {
      throw new Error('编辑地址时必须提供id');
    }

    const params = new URLSearchParams({
      id: data.id.toString(),
      name: data.name,
      intAreaCode: data.intAreaCode,
      mobile: data.mobile,
      address: data.address,
      ...(data.detailAddr && { detailAddr: data.detailAddr }),
      ...(data.latitude && { latitude: data.latitude }),
      ...(data.longitude && { longitude: data.longitude }),
      isDefault: (data.isDefault || -1).toString(),
    });

    return this.request<ApiResponse>(
      `/app/address/edit?${params}`,
      { method: 'POST' }
    );
  }

  /**
   * 删除收货地址
   * POST /app/address/delete
   *
   * @param id 地址ID
   */
  async deleteAddress(id: number): Promise<ApiResponse> {
    const params = new URLSearchParams({ id: id.toString() });

    return this.request<ApiResponse>(
      `/app/address/delete?${params}`,
      { method: 'POST' }
    );
  }

  /**
   * 获取默认地址
   *
   * @returns 默认地址，如果没有则返回null
   */
  async getDefaultAddress(): Promise<Address | null> {
    const addresses = await this.getAddressList();
    return addresses.find(addr => addr.isDefault === 1) || null;
  }

  /**
   * 设置默认地址
   *
   * @param id 地址ID
   */
  async setDefaultAddress(id: number): Promise<ApiResponse> {
    // 获取当前地址
    const addresses = await this.getAddressList();
    const targetAddress = addresses.find(addr => addr.id === id);

    if (!targetAddress) {
      throw new Error('地址不存在');
    }

    // 编辑地址，设置为默认
    return this.editAddress({
      ...targetAddress,
      isDefault: 1,
    });
  }
}

export const addressAPI = new AddressAPI();
