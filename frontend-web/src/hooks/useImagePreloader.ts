import { useEffect, useRef } from 'react';
import { imageCacheManager } from '../utils/ImageCacheManager';

interface Activity {
  id: string;
  image?: string;
}

/**
 * 🚀 图片预加载Hook
 * 智能预加载活动列表中的图片，优化用户体验
 */
export const useImagePreloader = (activities: Activity[], enabled: boolean = true) => {
  const preloadedActivities = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !activities?.length) {
      return;
    }

    // 提取需要预加载的图片URI
    const imageUris = activities
      .filter(activity => 
        activity.image && 
        !preloadedActivities.current.has(activity.id)
      )
      .map(activity => activity.image!)
      .filter(Boolean);

    if (imageUris.length === 0) {
      return;
    }

    console.log(`🚀 [IMAGE-PRELOADER] 开始预加载 ${imageUris.length} 张活动图片`);

    // 批量预加载图片
    imageCacheManager.preloadImages(imageUris).then(() => {
      // 标记这些活动为已预加载
      activities.forEach(activity => {
        if (activity.image) {
          preloadedActivities.current.add(activity.id);
        }
      });
      
      console.log('✅ [IMAGE-PRELOADER] 活动图片预加载完成');
    });

    // 清理函数 - 避免内存泄漏
    return () => {
      // 如果组件卸载，我们保留预加载标记，因为图片缓存仍然有效
    };
  }, [activities, enabled]);

  // 预加载单个活动图片的辅助函数
  const preloadActivityImage = (activity: Activity) => {
    if (activity.image && !preloadedActivities.current.has(activity.id)) {
      imageCacheManager.preloadImage(activity.image).then(() => {
        preloadedActivities.current.add(activity.id);
      });
    }
  };

  // 获取缓存统计信息
  const getCacheStats = () => {
    return imageCacheManager.getCacheStats();
  };

  return {
    preloadActivityImage,
    getCacheStats,
    preloadedCount: preloadedActivities.current.size,
  };
};