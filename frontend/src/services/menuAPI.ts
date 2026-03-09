/**
 * Menu API Service
 *
 * Provides menu data for merchants
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';

const getBaseUrl = () => getApiUrl();

export interface MenuItem {
  id: number;
  menuName?: string;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  merchantId?: number;
  status?: number;
  sortOrder?: number;
}

interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
  rows?: T;
  total?: number;
}

class MenuAPI {
  /**
   * Get menu items by merchant
   * GET /app/merchant/menu/list
   */
  async getMenuByMerchant(merchantId: number): Promise<MenuItem[]> {
    try {
      const url = `${getBaseUrl()}/app/merchant/menu/list?merchantId=${merchantId}`;

      console.log('🍽️ [MenuAPI] Getting menu for merchant:', merchantId);

      const token = await getCurrentToken();
      if (!token) return [];
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

      const result: ApiResponse<MenuItem[]> = await response.json();
      console.log('📋 [MenuAPI] Menu response:', {
        code: result.code,
        count: (result.data?.length || result.rows?.length || 0),
      });

      if (result.code === 200) {
        const items = result.data || result.rows || [];
        return Array.isArray(items) ? items : [];
      }

      return [];
    } catch (error) {
      console.error('❌ [MenuAPI] Failed to get menu:', error);
      return [];
    }
  }
}

export const menuAPI = new MenuAPI();
export default menuAPI;
