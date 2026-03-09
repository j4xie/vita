/**
 * 学校Logo缓存Hook
 * 提供学校Logo的获取和匹配功能
 */

import { useState, useEffect, useCallback } from 'react';
import { pomeloXAPI } from '../services/PomeloXAPI';
import { getImagesCdnUrl } from '../utils/environment';

// 学校数据接口
interface SchoolData {
  deptId: number;
  deptName: string;
  engName?: string;
  aprName?: string; // 缩写名称
  logo?: string | null;
}

// 全局缓存 - 避免重复请求
let schoolsCache: SchoolData[] | null = null;
let cachePromise: Promise<SchoolData[]> | null = null;

/**
 * 获取学校数据（带缓存）
 */
const fetchSchoolsWithCache = async (): Promise<SchoolData[]> => {
  // 如果已有缓存，直接返回
  if (schoolsCache) {
    return schoolsCache;
  }

  // 如果正在请求中，等待现有请求完成
  if (cachePromise) {
    return cachePromise;
  }

  // 发起新请求
  cachePromise = (async () => {
    try {
      const response = await pomeloXAPI.getSchoolList();
      if (response.code === 200 && Array.isArray(response.data)) {
        schoolsCache = response.data.map((school: any) => ({
          deptId: school.deptId,
          deptName: school.deptName,
          engName: school.engName,
          aprName: school.aprName,
          logo: school.logo,
        }));
        console.log('🏫 [SchoolLogos] 学校数据已缓存:', schoolsCache.length, '所学校');
        return schoolsCache;
      }
      return [];
    } catch (error) {
      console.error('❌ [SchoolLogos] 获取学校数据失败:', error);
      return [];
    } finally {
      cachePromise = null;
    }
  })();

  return cachePromise;
};

/**
 * 根据文本匹配学校
 * 尝试匹配学校中文名、英文名或缩写
 */
const matchSchool = (text: string, schools: SchoolData[]): SchoolData | null => {
  if (!text || !schools.length) return null;

  const textLower = text.toLowerCase();

  for (const school of schools) {
    // 匹配中文名
    if (school.deptName && text.includes(school.deptName)) {
      return school;
    }
    // 匹配英文名
    if (school.engName && textLower.includes(school.engName.toLowerCase())) {
      return school;
    }
    // 匹配缩写
    if (school.aprName && textLower.includes(school.aprName.toLowerCase())) {
      return school;
    }
  }

  return null;
};

/**
 * useSchoolLogos Hook
 * 提供学校Logo的获取和匹配功能
 */
export const useSchoolLogos = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载学校数据
  useEffect(() => {
    const loadSchools = async () => {
      setLoading(true);
      const data = await fetchSchoolsWithCache();
      setSchools(data);
      setLoading(false);
    };
    loadSchools();
  }, []);

  /**
   * 根据地点或活动名称获取学校Logo
   */
  const getSchoolLogo = useCallback((location: string, title?: string): string | null => {
    // 优先匹配地点
    let matched = matchSchool(location, schools);

    // 如果地点未匹配，尝试匹配标题
    if (!matched && title) {
      matched = matchSchool(title, schools);
    }

    return matched?.logo || null;
  }, [schools]);

  /**
   * 根据学校ID获取Logo
   */
  const getLogoByDeptId = useCallback((deptId: number): string | null => {
    const school = schools.find(s => s.deptId === deptId);
    return school?.logo || null;
  }, [schools]);

  /**
   * 获取所有有Logo的学校
   */
  const getSchoolsWithLogos = useCallback((): SchoolData[] => {
    return schools.filter(s => s.logo);
  }, [schools]);

  return {
    schools,
    loading,
    getSchoolLogo,
    getLogoByDeptId,
    getSchoolsWithLogos,
  };
};

/**
 * 根据学校ID同步获取Logo（推荐方式）
 * 直接使用活动的deptId获取对应学校logo
 * 🔧 返回完整URL，不是相对路径
 */
export const getLogoByDeptIdSync = (deptId?: number): string | null => {
  if (!schoolsCache || !deptId) return null;

  const school = schoolsCache.find(s => s.deptId === deptId);
  return buildFullLogoUrl(school?.logo);
};

/**
 * 根据学校ID同步获取学校名称
 * 用于显示活动所属学校而非创建者部门
 */
export const getSchoolNameByDeptIdSync = (deptId?: number, language?: 'zh' | 'en'): string | null => {
  if (!schoolsCache || !deptId) return null;

  const school = schoolsCache.find(s => s.deptId === deptId);
  if (!school) return null;

  if (language === 'en') {
    return school.engName || school.deptName || null;
  }
  return school.deptName || null;
};

/**
 * 辅助函数：将相对路径转换为完整URL
 * 使用 Cloudflare R2 CDN 加速图片加载（美国用户 <100ms）
 */
const buildFullLogoUrl = (logo: string | null | undefined): string | null => {
  if (!logo) return null;

  // 如果已经是完整URL，直接返回
  if (logo.startsWith('http')) {
    return logo;
  }

  // 使用 R2 CDN URL
  const cdnUrl = getImagesCdnUrl();
  const cleanPath = logo.startsWith('/') ? logo.slice(1) : logo;
  return `${cdnUrl}/${cleanPath}`;
};

/**
 * 同步获取学校Logo（用于适配器等非Hook场景）
 * 注意：首次调用时可能返回null，因为数据可能尚未加载
 * 🔧 返回完整URL，不是相对路径
 */
export const getSchoolLogoSync = (location: string, title?: string): string | null => {
  if (!schoolsCache) return null;

  const textLower = location.toLowerCase();
  const titleLower = title?.toLowerCase() || '';

  // 按缩写长度降序排列，防止 "USC" 在 "UCSC" 之前误匹配
  const sorted = [...schoolsCache].sort((a, b) =>
    (b.aprName?.length || 0) - (a.aprName?.length || 0)
  );

  for (const school of sorted) {
    // 匹配中文名
    if (school.deptName && (location.includes(school.deptName) || (title && title.includes(school.deptName)))) {
      return buildFullLogoUrl(school.logo);
    }
    // 匹配英文名
    if (school.engName) {
      const engLower = school.engName.toLowerCase();
      if (textLower.includes(engLower) || titleLower.includes(engLower)) {
        return buildFullLogoUrl(school.logo);
      }
    }
    // 匹配缩写（用单词边界避免 USC 匹配 UCSC）
    if (school.aprName) {
      const aprLower = school.aprName.toLowerCase();
      const aprRegex = new RegExp(`(?:^|[^a-z])${aprLower}(?:$|[^a-z])`, 'i');
      if (aprRegex.test(textLower) || aprRegex.test(titleLower)) {
        return buildFullLogoUrl(school.logo);
      }
    }
  }

  return null;
};

/**
 * 预加载学校数据
 * 应用启动时调用，确保数据尽早可用
 */
export const preloadSchoolData = async (): Promise<void> => {
  await fetchSchoolsWithCache();
};

export default useSchoolLogos;
