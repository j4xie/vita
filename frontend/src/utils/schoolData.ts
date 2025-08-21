// 学校数据映射表
export interface SchoolData {
  id: string; // 将从后端 /app/dept/list 获取的 deptId
  name: string; // 学校显示名称
  abbreviation: string; // 学校缩写
  emailDomain: string; // 邮箱域名
}

// 静态学校映射表（前端维护）
export const SCHOOL_EMAIL_MAPPING: Record<string, string> = {
  'UCD': 'ucdavis.edu',
  'UCB': 'berkeley.edu', 
  'UCSC': 'ucsc.edu',
  'USC': 'usc.edu',
  'UCLA': 'ucla.edu',
  'UCI': 'uci.edu',
  'UCSD': 'ucsd.edu',
  'UMN': 'umn.edu',
  'UW': 'uw.edu',
  'U Berkeley music': 'berklee.edu', // Berklee College of Music
  'UCSB': 'ucsb.edu'
};

// 学校全名映射（用于显示）
export const SCHOOL_FULL_NAMES: Record<string, string> = {
  'UCD': 'University of California, Davis',
  'UCB': 'University of California, Berkeley',
  'UCSC': 'University of California, Santa Cruz', 
  'USC': 'University of Southern California',
  'UCLA': 'University of California, Los Angeles',
  'UCI': 'University of California, Irvine',
  'UCSD': 'University of California, San Diego',
  'UMN': 'University of Minnesota',
  'UW': 'University of Washington',
  'U Berkeley music': 'Berklee College of Music',
  'UCSB': 'University of California, Santa Barbara'
};

/**
 * 根据学校缩写生成邮箱域名
 * @param schoolAbbreviation 学校缩写
 * @returns 邮箱域名
 */
export const getEmailDomainByAbbreviation = (schoolAbbreviation: string): string => {
  return SCHOOL_EMAIL_MAPPING[schoolAbbreviation] || '';
};

/**
 * 根据学校名称匹配邮箱域名
 * @param schoolName 学校名称
 * @returns 邮箱域名
 */
export const getEmailDomainByName = (schoolName: string): string => {
  // 首先尝试精确匹配缩写
  const abbreviation = Object.keys(SCHOOL_FULL_NAMES).find(
    key => SCHOOL_FULL_NAMES[key] === schoolName || key === schoolName
  );
  
  if (abbreviation) {
    return SCHOOL_EMAIL_MAPPING[abbreviation];
  }
  
  // 如果没有找到，返回空字符串
  return '';
};

/**
 * 生成完整的邮箱地址
 * @param username 用户名部分
 * @param schoolAbbreviation 学校缩写
 * @returns 完整邮箱地址
 */
export const generateEmailAddress = (username: string, schoolAbbreviation: string): string => {
  const domain = getEmailDomainByAbbreviation(schoolAbbreviation);
  if (!domain || !username) {
    return '';
  }
  return `${username}@${domain}`;
};

/**
 * 验证邮箱格式是否为.edu域名
 * @param email 邮箱地址
 * @returns 是否为有效的.edu邮箱
 */
export const validateEduEmail = (email: string): boolean => {
  const eduEmailRegex = /^[^\s@]+@[^\s@]+\.edu$/;
  return eduEmailRegex.test(email);
};

/**
 * 从后端数据创建学校数据数组
 * @param backendSchools 后端学校数据
 * @returns 前端学校数据数组
 */
export const createSchoolDataFromBackend = (backendSchools: any[]): SchoolData[] => {
  return backendSchools.map(school => {
    // 直接使用学校名称匹配我们的映射表
    const schoolName = school.deptName;
    
    // 精确匹配学校缩写
    const abbreviation = schoolName;
    const emailDomain = SCHOOL_EMAIL_MAPPING[abbreviation] || '';
    
    // 如果没有找到邮箱域名，尝试模糊匹配
    let finalEmailDomain = emailDomain;
    let finalAbbreviation = abbreviation;
    
    if (!emailDomain) {
      // 尝试从完整名称匹配
      const matchedKey = Object.keys(SCHOOL_EMAIL_MAPPING).find(key => 
        key.toLowerCase() === schoolName.toLowerCase()
      );
      if (matchedKey) {
        finalEmailDomain = SCHOOL_EMAIL_MAPPING[matchedKey];
        finalAbbreviation = matchedKey;
      }
    }
    
    return {
      id: school.deptId.toString(),
      name: schoolName,
      abbreviation: finalAbbreviation,
      emailDomain: finalEmailDomain
    };
  }).filter(school => school.emailDomain); // 只保留有邮箱域名映射的学校
};

// 类型定义已在上方定义，无需重复导出