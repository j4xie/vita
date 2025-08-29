/**
 * 活动统计服务
 * 基于现有API聚合计算用户活动统计数据
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { pomeloXAPI } from './PomeloXAPI';

// 用户活动统计类型
export interface UserActivityStats {
  notParticipated: number;   // 未参加（已报名但未签到）
  participated: number;      // 已参加（已签到）
  bookmarked: number;        // 收藏
  pendingReview: number;     // 待评价
}

// 活动状态类型
type ActivityRegistrationStatus = 0 | -1 | 1; // 0=未报名, -1=已报名未签到, 1=已签到

// 基于用户ID的存储键生成函数
const getUserStorageKey = (userId: string, key: string) => {
  return `@pomelo_user_${userId}_${key}`;
};

class ActivityStatsService {
  private static instance: ActivityStatsService;
  
  static getInstance(): ActivityStatsService {
    if (!ActivityStatsService.instance) {
      ActivityStatsService.instance = new ActivityStatsService();
    }
    return ActivityStatsService.instance;
  }

  /**
   * 获取用户活动统计
   * @param userId 用户ID，用于数据隔离
   */
  async getUserActivityStats(userId: string): Promise<UserActivityStats> {
    try {
      console.log('📊 开始获取用户活动统计，用户ID:', userId);
      
      // 直接使用userId参数（API需要明确的userId才能返回数据）
      const numericUserId = parseInt(userId);
      if (isNaN(numericUserId)) {
        console.error('📊 ❌ 用户ID格式错误:', userId);
        return this.getEmptyStats();
      }
      
      console.log('📊 🚀 调用getUserActivityList:', { userId: numericUserId, signStatus: -1 });
      let activitiesResponse = await pomeloXAPI.getUserActivityList(numericUserId, -1);
      console.log('📊 📨 API响应:', { 
        code: activitiesResponse?.code, 
        hasRows: !!activitiesResponse?.rows,
        rowsLength: activitiesResponse?.rows?.length,
        activities: activitiesResponse?.rows?.map(a => ({ id: a.id, name: a.name, signStatus: a.signStatus })) || []
      });
      
      // 检查getUserActivityList是否返回了数据 - 注意API返回结构是 { total, rows, code, msg }
      if (activitiesResponse.code === 200 && activitiesResponse.rows && activitiesResponse.rows.length > 0) {
        console.log('📊 ✅ getUserActivityList返回了数据，活动数量:', activitiesResponse.rows.length);
      } else if (activitiesResponse.code === 200 && (!activitiesResponse.rows || activitiesResponse.rows.length === 0)) {
        console.log('📊 ℹ️ getUserActivityList返回空数据，用户没有已报名的活动');
        return this.getEmptyStats();
      }
      
      console.log('📊 getUserActivityList完整响应:', JSON.stringify(activitiesResponse, null, 2));
      
      // 直接使用getUserActivityList的返回数据 - 注意API返回结构中rows在顶层
      let activities: any[] = [];
      
      if (activitiesResponse.code === 200) {
        // userActivitylist API的响应结构：{ total, rows, code, msg }
        if (activitiesResponse.rows && Array.isArray(activitiesResponse.rows)) {
          activities = activitiesResponse.rows;
          console.log('📊 ✅ 获取到用户活动数据，活动数量:', activities.length);
        } else {
          console.log('📊 ℹ️ getUserActivityList返回空活动列表');
          return this.getEmptyStats();
        }
      } else {
        console.warn('📊 ❌ API响应错误:', {
          code: activitiesResponse.code,
          msg: activitiesResponse.msg
        });
        return this.getEmptyStats();
      }
      
      // 获取收藏和评价的本地数据（基于用户ID）
      const bookmarkedIds = await this.getBookmarkedActivityIds(userId);
      const reviewedIds = await this.getReviewedActivityIds(userId);
      
      // 聚合统计
      const stats: UserActivityStats = {
        notParticipated: 0,
        participated: 0,
        bookmarked: bookmarkedIds.length,
        pendingReview: 0,
      };

      activities.forEach((activity: any) => {
        const registrationStatus = activity.signStatus || 0;
        
        console.log('📊 处理活动:', {
          id: activity.id,
          name: activity.name,
          signStatus: activity.signStatus,
          registrationStatus: registrationStatus
        });
        
        switch (registrationStatus) {
          case -1: // 已报名未签到
            stats.notParticipated++;
            console.log('📊 ➕ 未签到活动计数 +1');
            break;
          case 1: // 已签到
            stats.participated++;
            console.log('📊 ➕ 已签到活动计数 +1');
            // 如果活动已结束且未评价，计入待评价
            if (this.isActivityEnded(activity) && !reviewedIds.includes(activity.id.toString())) {
              stats.pendingReview++;
              console.log('📊 ➕ 待评价活动计数 +1');
            }
            break;
          default: // 0 = 未报名，不计入统计
            console.log('📊 ➡️ 未报名活动，跳过');
            break;
        }
        
        // 补充：已结束但未签到的活动也可能需要评价
        if (registrationStatus === -1 && this.isActivityEnded(activity) && !reviewedIds.includes(activity.id.toString())) {
          stats.pendingReview++;
          console.log('📊 ➕ 未签到但需评价活动计数 +1');
        }
      });

      console.log('📊 最终用户活动统计结果:', stats);
      return stats;
      
    } catch (error) {
      console.error('📊 ❌ 获取活动统计失败:', error);
      console.error('📊 ❌ 错误详情:', {
        name: error.name,
        message: error.message,
        userId: userId
      });
      return this.getEmptyStats();
    }
  }

  /**
   * 判断活动是否已结束 - 使用后端type字段
   */
  private isActivityEnded(activity: any): boolean {
    // 优先使用后端type字段，更高效
    if (activity.type !== undefined) {
      return activity.type === 2; // 2-已结束
    }
    
    // fallback到前端计算（兼容旧数据）
    if (!activity.endTime) return false;
    
    try {
      const endTime = new Date(activity.endTime);
      return endTime < new Date();
    } catch {
      return false;
    }
  }

  /**
   * 获取收藏的活动ID列表
   * @param userId 用户ID
   */
  async getBookmarkedActivityIds(userId: string): Promise<string[]> {
    try {
      const storageKey = getUserStorageKey(userId, 'bookmarked_activities');
      const bookmarksJson = await AsyncStorage.getItem(storageKey);
      return bookmarksJson ? JSON.parse(bookmarksJson) : [];
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  }

  /**
   * 添加/移除收藏
   * @param userId 用户ID
   * @param activityId 活动ID
   */
  async toggleBookmark(userId: string, activityId: string): Promise<boolean> {
    try {
      const bookmarked = await this.getBookmarkedActivityIds(userId);
      const index = bookmarked.indexOf(activityId);
      
      if (index > -1) {
        // 取消收藏
        bookmarked.splice(index, 1);
      } else {
        // 添加收藏
        bookmarked.push(activityId);
      }
      
      const storageKey = getUserStorageKey(userId, 'bookmarked_activities');
      await AsyncStorage.setItem(storageKey, JSON.stringify(bookmarked));
      return index === -1; // 返回是否为新增收藏
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取已评价的活动ID列表
   * @param userId 用户ID
   */
  async getReviewedActivityIds(userId: string): Promise<string[]> {
    try {
      const storageKey = getUserStorageKey(userId, 'reviewed_activities');
      const reviewsJson = await AsyncStorage.getItem(storageKey);
      return reviewsJson ? JSON.parse(reviewsJson) : [];
    } catch (error) {
      console.error('获取评价列表失败:', error);
      return [];
    }
  }

  /**
   * 标记活动已评价
   * @param userId 用户ID
   * @param activityId 活动ID
   */
  async markAsReviewed(userId: string, activityId: string): Promise<void> {
    try {
      const reviewed = await this.getReviewedActivityIds(userId);
      if (!reviewed.includes(activityId)) {
        reviewed.push(activityId);
        const storageKey = getUserStorageKey(userId, 'reviewed_activities');
        await AsyncStorage.setItem(storageKey, JSON.stringify(reviewed));
      }
    } catch (error) {
      console.error('标记评价失败:', error);
      throw error;
    }
  }

  /**
   * 检查活动是否已收藏
   * @param userId 用户ID
   * @param activityId 活动ID
   */
  async isActivityBookmarked(userId: string, activityId: string): Promise<boolean> {
    const bookmarked = await this.getBookmarkedActivityIds(userId);
    return bookmarked.includes(activityId);
  }

  /**
   * 检查活动是否已评价
   * @param userId 用户ID
   * @param activityId 活动ID
   */
  async isActivityReviewed(userId: string, activityId: string): Promise<boolean> {
    const reviewed = await this.getReviewedActivityIds(userId);
    return reviewed.includes(activityId);
  }

  /**
   * 获取空统计数据
   */
  private getEmptyStats(): UserActivityStats {
    return {
      notParticipated: 0,
      participated: 0,
      bookmarked: 0,
      pendingReview: 0,
    };
  }

  /**
   * 清除指定用户的本地统计数据（用于退出登录）
   * @param userId 用户ID
   */
  async clearUserLocalData(userId: string): Promise<void> {
    try {
      const bookmarksKey = getUserStorageKey(userId, 'bookmarked_activities');
      const reviewsKey = getUserStorageKey(userId, 'reviewed_activities');
      
      await Promise.all([
        AsyncStorage.removeItem(bookmarksKey),
        AsyncStorage.removeItem(reviewsKey),
      ]);
      console.log(`✅ 清除用户 ${userId} 的活动统计数据成功`);
    } catch (error) {
      console.error('清除用户本地数据失败:', error);
      throw error;
    }
  }

  /**
   * 清除所有本地统计数据（用于测试或重置）
   */
  async clearAllLocalData(): Promise<void> {
    try {
      // 获取所有相关的存储键
      const allKeys = await AsyncStorage.getAllKeys();
      const targetKeys = allKeys.filter(key => 
        key.includes('@pomelo_user_') && 
        (key.includes('bookmarked_activities') || key.includes('reviewed_activities'))
      );
      
      await AsyncStorage.multiRemove(targetKeys);
      console.log('✅ 清除所有用户的活动统计数据成功');
    } catch (error) {
      console.error('清除本地数据失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const activityStatsService = ActivityStatsService.getInstance();
export default ActivityStatsService;