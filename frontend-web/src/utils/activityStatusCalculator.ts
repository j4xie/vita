/**
 * 统一的活动状态计算工具
 * 解决多套分类逻辑冲突问题
 */

export interface ActivityTimeData {
  startTime: string;
  endTime: string;
  signStatus?: number; // 0-未报名，-1-已报名未签到，1-已签到
  type?: number; // -1-即将开始，1-已开始，2-已结束（后端状态）
}

export type ActivityStatus = 'available' | 'ended' | 'registered' | 'checked_in';

/**
 * 安全的时间解析函数 - 兼容Safari
 * @param timeString 时间字符串
 * @returns Date对象
 */
export const safeParseDate = (timeString: string): Date => {
  try {
    // 如果是ISO格式，直接使用
    if (timeString.includes('T')) {
      return new Date(timeString);
    }
    
    // 转换为ISO格式 "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
    const isoString = timeString.replace(' ', 'T');
    const date = new Date(isoString);
    
    // 验证解析结果
    if (isNaN(date.getTime())) {
      console.warn(`[ActivityStatusCalculator] 时间解析失败: ${timeString}`);
      // 降级到原始解析
      return new Date(timeString);
    }
    
    return date;
  } catch (error) {
    console.error(`[ActivityStatusCalculator] 时间解析异常: ${timeString}`, error);
    return new Date(); // 返回当前时间作为fallback
  }
};

/**
 * 统一的活动状态计算函数
 * @param activity 活动时间数据
 * @returns 活动状态
 */
export const calculateActivityStatus = (activity: ActivityTimeData): ActivityStatus => {
  // 第一优先级：用户的报名/签到状态
  if (activity.signStatus !== undefined && activity.signStatus !== null) {
    switch (activity.signStatus) {
      case -1: return 'registered';   // 已报名未签到
      case 1: return 'checked_in';    // 已签到
      case 0: 
      default:
        // 继续基于时间计算
        break;
    }
  }
  
  // 第二优先级：后端计算的type字段（如果可信）
  if (activity.type !== undefined && activity.type !== null) {
    switch (activity.type) {
      case -1: return 'available';  // 即将开始
      case 1: return 'available';   // 已开始（但仍可报名）
      case 2: return 'ended';       // 已结束
      default:
        // 继续基于时间计算
        break;
    }
  }
  
  // 第三优先级：基于当前时间实时计算
  try {
    const now = new Date();
    const startTime = safeParseDate(activity.startTime);
    const endTime = safeParseDate(activity.endTime);
    
    // 验证时间有效性
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.warn('[ActivityStatusCalculator] 无效的时间数据，默认为available', activity);
      return 'available';
    }
    
    // 时间状态判断 - 简化为两种状态
    if (endTime < now) {
      return 'ended';     // 已结束
    } else {
      return 'available'; // 可报名（包括未开始和进行中）
    }
  } catch (error) {
    console.error('[ActivityStatusCalculator] 状态计算失败:', error, activity);
    return 'available'; // 默认状态
  }
};

/**
 * 批量计算活动状态
 * @param activities 活动列表
 * @returns 带状态的活动列表
 */
export const batchCalculateActivityStatus = <T extends ActivityTimeData>(
  activities: T[]
): (T & { calculatedStatus: ActivityStatus })[] => {
  return activities.map(activity => ({
    ...activity,
    calculatedStatus: calculateActivityStatus(activity)
  }));
};

/**
 * 按状态过滤活动
 * @param activities 活动列表
 * @param filterStatus 过滤状态
 * @returns 过滤后的活动列表
 */
export const filterActivitiesByStatus = <T extends ActivityTimeData>(
  activities: T[],
  filterStatus: ActivityStatus | 'all'
): T[] => {
  if (filterStatus === 'all') {
    return activities;
  }
  
  return activities.filter(activity => 
    calculateActivityStatus(activity) === filterStatus
  );
};

/**
 * 获取活动状态的显示文本
 * @param status 活动状态
 * @param t 翻译函数
 * @returns 状态文本
 */
export const getActivityStatusText = (
  status: ActivityStatus,
  t: (key: string) => string
): string => {
  switch (status) {
    case 'available': return t('activities.status.available');




