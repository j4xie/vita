// 学校数据映射表
export interface SchoolData {
  id: string; // 将从后端 /app/dept/list 获取的 deptId
  name: string; // 学校显示名称
  abbreviation: string; // 学校缩写
  emailDomain: string; // 邮箱域名
}

// 静态学校映射表（前端维护）- 与RegisterFormScreen和后端API同步更新
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
  'Berklee': 'berklee.edu', // Berklee College of Music (修正为API中的aprName)
  'UCSB': 'ucsb.edu',
  'Rutgers': 'rutgers.edu', // 罗格斯大学
  'NYU': 'nyu.edu', // 纽约大学
  'CU': 'chineseunion.org' // CU总部/Chinese Union Headquarters
};

// 学校全名映射（英文，用于显示）
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
  'Berklee': 'Berklee College of Music',
  'UCSB': 'University of California, Santa Barbara',
  'Rutgers': 'Rutgers, The State University of New Jersey',
  'NYU': 'New York University',
  'CU': 'Chinese Union Headquarters'
};

// 学校中文名称映射
export const SCHOOL_CHINESE_NAMES: Record<string, string> = {
  'UCD': '加州大学戴维斯分校',
  'UCB': '加州大学伯克利分校',
  'UCSC': '加州大学圣克鲁兹分校',
  'USC': '南加州大学',
  'UCLA': '加州大学洛杉矶分校',
  'UCI': '加州大学欧文分校', // 修正为API中的实际中文名
  'UCSD': '加州大学圣地亚哥分校',
  'UMN': '明尼苏达大学', // 修正为API中的实际中文名
  'UW': '华盛顿大学',
  'Berklee': '伯克利音乐学院',
  'UCSB': '加州大学圣塔芭芭拉分校', // 修正为API中的实际中文名
  'Rutgers': '罗格斯大学',
  'NYU': '纽约大学',
  'CU': 'CU总部'
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
 * 根据学校名称匹配邮箱域名（支持中英文）
 * @param schoolName 学校名称（中文或英文）
 * @returns 邮箱域名
 */
export const getEmailDomainByName = (schoolName: string): string => {
  // 1. 首先尝试精确匹配缩写
  if (SCHOOL_EMAIL_MAPPING[schoolName]) {
    return SCHOOL_EMAIL_MAPPING[schoolName];
  }
  
  // 2. 尝试匹配英文名称
  const abbreviationByEng = Object.keys(SCHOOL_FULL_NAMES).find(
    key => SCHOOL_FULL_NAMES[key] === schoolName
  );
  if (abbreviationByEng) {
    return SCHOOL_EMAIL_MAPPING[abbreviationByEng];
  }
  
  // 3. 尝试匹配中文名称
  const abbreviationByCh = Object.keys(SCHOOL_CHINESE_NAMES).find(
    key => SCHOOL_CHINESE_NAMES[key] === schoolName
  );
  if (abbreviationByCh) {
    return SCHOOL_EMAIL_MAPPING[abbreviationByCh];
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
 * 从后端学校数据中获取邮箱域名（兼容RegisterFormScreen的映射）
 * @param school 后端返回的学校对象，包含deptName(中文)和engName(英文)字段
 * @returns 邮箱域名
 */
export const getEmailDomainFromBackendSchool = (school: any): string => {
  if (!school) return '';
  
  // 尝试使用中文名称匹配
  if (school.deptName) {
    const domain = getEmailDomainByName(school.deptName);
    if (domain) return domain;
  }
  
  // 尝试使用英文名称匹配  
  if (school.engName) {
    const domain = getEmailDomainByName(school.engName);
    if (domain) return domain;
  }
  
  // 如果都没有找到，返回空字符串
  return '';
};

/**
 * 验证邮箱格式是否为.edu域名
 * @param email 邮箱地址
 * @returns 是否为有效的.edu邮箱
 */
export const validateEduEmail = (email: string): boolean => {
  // 支持 .edu 和 chineseunion.org 邮箱
  const eduEmailRegex = /^[^\s@]+@[^\s@]+\.edu$/;
  const chineseUnionRegex = /^[^\s@]+@chineseunion\.org$/;
  return eduEmailRegex.test(email) || chineseUnionRegex.test(email);
};

/**
 * 从后端数据创建学校数据数组
 * @param backendSchools 后端学校数据
 * @returns 前端学校数据数组
 */
export const createSchoolDataFromBackend = (backendSchools: any[]): SchoolData[] => {
  return backendSchools.map(school => {
    // 使用统一的邮箱域名获取函数，支持中英文匹配
    const emailDomain = getEmailDomainFromBackendSchool(school);
    
    // 获取学校显示名称（优先中文）
    const displayName = school.deptName || school.engName || '';
    
    // 使用后端返回的缩写，如果没有则使用显示名称
    const abbreviation = school.aprName || displayName;
    
    return {
      id: school.deptId.toString(),
      name: displayName,
      abbreviation: abbreviation,
      emailDomain: emailDomain
    };
  }).filter(school => school.emailDomain); // 只保留有邮箱域名映射的学校
};

// 类型定义已在上方定义，无需重复导出