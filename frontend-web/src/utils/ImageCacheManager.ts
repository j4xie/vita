import { Platform } from 'react-native';

interface CacheEntry {
  uri: string;
  timestamp: number;
  preloaded: boolean;
}

/**
 * 🚀 图片缓存管理器
 * 智能管理图片缓存，提升加载体验
 */
class ImageCacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 50; // 最大缓存数量
  private maxCacheAge = 30 * 60 * 1000; // 30分钟缓存时间
  private preloadQueue = new Set<string>();
  
  /**
   * 🔍 检查图片是否已缓存
   */
  isCached(uri: string): boolean {
    const entry = this.cache.get(uri);
    if (!entry) return false;
    
    // 检查缓存是否过期
    const isExpired = Date.now() - entry.timestamp > this.maxCacheAge;
    if (isExpired) {
      this.cache.delete(uri);
      return false;
    }
    
    return true;
  }

  /**
   * 🚀 预加载图片
   */
  async preloadImage(uri: string): Promise<boolean> {
    if (!uri || this.preloadQueue.has(uri) || this.isCached(uri)) {
      return true;
    }

    this.preloadQueue.add(uri);
    
    try {
      if (Platform.OS === 'web') {
        // Web平台预加载
        await this.preloadImageWeb(uri);
      } else {
        // React Native平台预加载
        await this.preloadImageNative(uri);
      }
      
      // 添加到缓存
      this.addToCache(uri, true);
      console.log('✅ 图片预加载成功:', uri);
      return true;
    } catch (error) {
      console.warn('⚠️ 图片预加载失败:', uri, error);
      return false;
    } finally {
      this.preloadQueue.delete(uri);
    }
  }

  /**
   * 🌐 Web平台预加载
   */
  private preloadImageWeb(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = uri;
      
      // 5秒超时
      setTimeout(() => reject(new Error('Image preload timeout')), 5000);
    });
  }

  /**
   * 📱 React Native平台预加载
   */
  private async preloadImageNative(uri: string): Promise<void> {
    const { Image } = await import('react-native');
    return Image.prefetch(uri);
  }

  /**
   * 📝 添加到缓存
   */
  private addToCache(uri: string, preloaded: boolean = false): void {
    // 检查缓存大小，清理旧缓存
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanOldCache();
    }

    this.cache.set(uri, {
      uri,
      timestamp: Date.now(),
      preloaded,
    });
  }

  /**
   * 🧹 清理过期缓存
   */
  private cleanOldCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // 找出过期的缓存项
    this.cache.forEach((entry, uri) => {
      if (now - entry.timestamp > this.maxCacheAge) {
        entriesToDelete.push(uri);
      }
    });

    // 如果过期项不够，删除最旧的项
    if (entriesToDelete.length === 0) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const deleteCount = Math.floor(this.maxCacheSize * 0.2); // 删除20%最旧的
      entriesToDelete.push(...sortedEntries.slice(0, deleteCount).map(([uri]) => uri));
    }

    // 删除缓存项
    entriesToDelete.forEach(uri => {
      this.cache.delete(uri);
    });

    console.log(`🧹 清理了 ${entriesToDelete.length} 个过期缓存项`);
  }

  /**
   * 📊 批量预加载图片
   */
  async preloadImages(uris: string[]): Promise<void> {
    const validUris = uris.filter(uri => uri && !this.isCached(uri));
    
    if (validUris.length === 0) {
      console.log('📋 没有需要预加载的图片');
      return;
    }

    console.log(`🚀 开始批量预加载 ${validUris.length} 张图片`);
    
    // 限制并发数量，避免网络拥塞
    const concurrency = 3;
    const chunks = this.chunkArray(validUris, concurrency);
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(uri => this.preloadImage(uri))
      );
    }
    
    console.log('✅ 批量预加载完成');
  }

  /**
   * 🔄 数组分块工具
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 📊 获取缓存统计信息
   */
  getCacheStats(): {
    size: number;
    preloadedCount: number;
    maxSize: number;
  } {
    const preloadedCount = Array.from(this.cache.values())
      .filter(entry => entry.preloaded).length;
    
    return {
      size: this.cache.size,
      preloadedCount,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * 🧹 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.preloadQueue.clear();
    console.log('🧹 图片缓存已清空');
  }
}

// 全局单例
export const imageCacheManager = new ImageCacheManager();