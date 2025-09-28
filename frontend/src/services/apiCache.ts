/**
 * API响应缓存服务
 * 避免短时间内重复调用相同的API
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expireTime: number;
}

class APICacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5分钟默认TTL

  /**
   * 生成缓存键
   */
  private generateKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expireTime;
  }

  /**
   * 获取缓存数据
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || this.isExpired(item)) {
      if (item) {
        this.cache.delete(key); // 清理过期缓存
      }
      return null;
    }
    return item.data;
  }

  /**
   * 设置缓存数据
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expireTime = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expireTime
    });
  }

  /**
   * 包装API调用，自动处理缓存
   */
  async cachedCall<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 检查缓存
    const cached = this.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // 执行API调用
    const result = await apiCall();

    // 缓存结果
    this.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [CACHE] 清理了 ${cleaned} 个过期缓存项`);
    }
    
    return cleaned;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ [CACHE] 清空了 ${size} 个缓存项`);
  }

  /**
   * 清空所有缓存（兼容别名）
   */
  clearAll(): void {
    this.clear();
  }

  /**
   * 按模式清除缓存键
   * @param pattern 要匹配的键模式（例如 "volunteerRecord:*"）
   */
  clearByPattern(pattern: string): number {
    let cleared = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🗑️ [CACHE] 清除了 ${cleared} 个匹配 "${pattern}" 的缓存项`);
    }

    return cleared;
  }

  /**
   * 清除特定键的缓存
   */
  clearKey(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ [CACHE] 清除了缓存键: ${key}`);
    }
    return deleted;
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例
export const apiCache = new APICacheService();

// 导出缓存TTL常量
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1分钟 - 用于频繁变化的数据
  MEDIUM: 5 * 60 * 1000,     // 5分钟 - 用于一般数据
  LONG: 15 * 60 * 1000,      // 15分钟 - 用于相对静态的数据
  USER_INFO: 10 * 60 * 1000, // 10分钟 - 用户信息
  VOLUNTEER_RECORDS: 2 * 60 * 1000, // 2分钟 - 志愿者记录
};