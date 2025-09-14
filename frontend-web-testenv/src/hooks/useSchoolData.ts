import { useState, useEffect } from 'react';
import { pomeloXAPI } from '../services/PomeloXAPI';
import { getSchoolDisplayName } from '../utils/schoolLogos';

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

export const useSchoolData = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchools = async () => {
    try {
      setLoading(true);
      console.log('🏫 开始获取学校列表...');
      
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
      } else {
        console.warn('⚠️ 获取学校列表失败:', response.msg);
        setSchools([]);
      }
    } catch (error) {
      console.error('❌ 加载学校列表失败:', error);
      setSchools([]);
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