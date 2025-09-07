/**
 * Web端存储抽象层
 * 统一localStorage和sessionStorage接口，与移动端AsyncStorage保持一致
 */

export type StorageType = 'local' | 'session';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

class WebStorageService implements StorageAdapter {
  private storage: Storage;

  constructor(type: StorageType = 'local') {
    this.storage = type === 'session' ? sessionStorage : localStorage;
  }

  /**
   * 获取存储项
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.error('获取存储项失败:', error);
      return null;
    }
  }

  /**
   * 设置存储项
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.error('设置存储项失败:', error);
      // 可能是存储空间不足，尝试清理过期数据
      await this.cleanupExpiredData();
      try {
        this.storage.setItem(key, value);
      } catch (retryError) {
        console.error('重试设置存储项仍然失败:', retryError);
        throw retryError;
      }
    }
  }

  /**
   * 移除存储项
   */
  async removeItem(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('移除存储项失败:', error);
    }
  }

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('清空存储失败:', error);
    }
  }

  /**
   * 获取所有存储键名
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('获取存储键名失败:', error);
      return [];
    }
  }

  /**
   * 获取JSON对象
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('获取JSON对象失败:', error);
      return null;
    }
  }

  /**
   * 设置JSON对象
   */
  async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.setItem(key, jsonString);
    } catch (error) {
      console.error('设置JSON对象失败:', error);
      throw error;
    }
  }

  /**
   * 检查存储项是否存在
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * 获取存储空间使用情况
   */
  getStorageInfo(): { used: number; available: number; total: number } {
    try {
      // 估算已使用存储空间
      let used = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const value = this.storage.getItem(key);
          used += key.length + (value?.length || 0);
        }
      }

      // Web存储通常有5-10MB限制
      const total = 5 * 1024 * 1024; // 5MB估算
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * 清理过期数据（通过命名约定）
   */
  private async cleanupExpiredData(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const expiredKeys: string[] = [];

      // 查找带有过期时间的缓存项
      for (const key of keys) {
        if (key.includes('_cache') || key.includes('_temp')) {
          const value = await this.getObject(key);
          if (value && typeof value === 'object' && value.timestamp) {
            const now = Date.now();
            const age = now - value.timestamp;
            // 清理超过24小时的缓存
            if (age > 24 * 60 * 60 * 1000) {
              expiredKeys.push(key);
            }
          }
        }
      }

      // 批量删除过期项
      for (const key of expiredKeys) {
        await this.removeItem(key);
      }

      if (expiredKeys.length > 0) {
        console.log(`🗑️ 清理了 ${expiredKeys.length} 个过期缓存项`);
      }
    } catch (error) {
      console.error('清理过期数据失败:', error);
    }
  }

  /**
   * 检查Web存储是否可用
   */
  static isStorageAvailable(type: StorageType = 'local'): boolean {
    try {
      const storage = type === 'session' ? sessionStorage : localStorage;
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn(`${type}Storage 不可用:`, error);
      return false;
    }
  }
}

// 创建默认实例
export const webLocalStorage = new WebStorageService('local');
export const webSessionStorage = new WebStorageService('session');

// 导出兼容AsyncStorage的接口
export const WebAsyncStorage = {
  getItem: (key: string) => webLocalStorage.getItem(key),
  setItem: (key: string, value: string) => webLocalStorage.setItem(key, value),
  removeItem: (key: string) => webLocalStorage.removeItem(key),
  clear: () => webLocalStorage.clear(),
  getAllKeys: () => webLocalStorage.getAllKeys(),
  // 额外的便利方法
  getObject: <T = any>(key: string) => webLocalStorage.getObject<T>(key),
  setObject: (key: string, value: any) => webLocalStorage.setObject(key, value),
  hasItem: (key: string) => webLocalStorage.hasItem(key),
};

export default WebStorageService;