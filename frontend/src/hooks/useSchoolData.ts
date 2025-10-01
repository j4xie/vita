import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pomeloXAPI } from '../services/PomeloXAPI';
import { getSchoolDisplayName } from '../utils/schoolLogos';

const SCHOOL_CACHE_KEY = '@school_data_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时过期

export interface School {
  id: string;
  name: string;
  shortName: string;
  deptId: number;
  deptName: string;
  logo?: string | null | undefined;
  engName?: string | null | undefined;
  aprName?: string | null | undefined;
  parentId: number;
  children?: School[];
  isSubDepartment?: boolean;
}

interface CachedData {
  schools: School[];
  timestamp: number;
}

export const useSchoolData = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false); // 改为 false，默认不显示加载

  const loadSchools = async (forceRefresh = false) => {
    try {
      // 1. 先尝试读取缓存
      if (!forceRefresh) {
        const cachedString = await AsyncStorage.getItem(SCHOOL_CACHE_KEY);
        if (cachedString) {
          const cached: CachedData = JSON.parse(cachedString);
          const now = Date.now();

          // 检查缓存是否过期
          if (now - cached.timestamp < CACHE_EXPIRY_MS) {
            console.log('✅ 使用缓存的学校数据，数量:', cached.schools.length);
            setSchools(cached.schools);
            setLoading(false);
            // 继续后台更新
          }
        }
      }

      // 2. 后台获取最新数据
      console.log('🏫 后台获取最新学校列表...');
      const response = await pomeloXAPI.getSchoolList();
      console.log('📋 学校列表API响应:', response);
      
      if (response.code === 200 && response.data) {
        // 递归处理学校及其子部门
        const processSchoolData = (schools: any[], isSubDepartment = false): School[] => {
          return schools.map((school: any) => ({
            id: school.deptId.toString(),
            name: school.deptName,
            shortName: school.aprName || getSchoolDisplayName(school.deptId.toString()),
            deptId: school.deptId,
            deptName: school.deptName,
            logo: school.logo,
            engName: school.engName,
            aprName: school.aprName,
            parentId: school.parentId,
            isSubDepartment,
            children: school.children && school.children.length > 0 
              ? processSchoolData(school.children, true) 
              : undefined,
          }));
        };

        // 处理所有学校数据（不再过滤）
        const schoolList = processSchoolData(response.data);

        console.log('✅ 处理后的学校列表:', schoolList);
        setSchools(schoolList);

        // 3. 保存到缓存
        const cacheData: CachedData = {
          schools: schoolList,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(SCHOOL_CACHE_KEY, JSON.stringify(cacheData));
        console.log('💾 学校数据已缓存');
      } else {
        console.warn('⚠️ 获取学校列表失败:', response.msg);
        // 如果没有缓存数据，才清空
        if (schools.length === 0) {
          setSchools([]);
        }
      }
    } catch (error) {
      console.error('❌ 加载学校列表失败:', error);
      // 保留现有数据，不清空
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  return {
    schools,
    loading,
    loadSchools,
  };
};