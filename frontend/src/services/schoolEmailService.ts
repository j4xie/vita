/**
 * 统一的学校邮箱域名服务
 * 
 * 设计原则：
 * 1. 优先使用后端提供的邮箱域名（将来扩展）
 * 2. Fallback到静态映射表
 * 3. 支持中英文学校名称匹配
 * 4. 为后端扩展预留清晰接口
 */

// 统一的学校邮箱域名映射表（基于后端API实际返回数据）
const UNIFIED_SCHOOL_EMAIL_MAPPING: Record<string, string> = {
  // === 基于后端API的 engName 字段映射 ===
  'University of California, Berkeley': 'berkeley.edu',
  'University of California, Santa Cruz': 'ucsc.edu',  
  'University of Southern California': 'usc.edu',
  'University of California, Los Angeles': 'ucla.edu',
  'University of California, Irvine': 'uci.edu',
  'University of California, San Diego': 'ucsd.edu',
  'University of Minnesota': 'umn.edu',
  'University of Washington': 'uw.edu',
  'Berklee College of Music': 'berklee.edu',
  'University of California, Santa Barbara': 'ucsb.edu',
  'University of California, Davis': 'ucdavis.edu',
  'Rutgers, The State University of New Jersey': 'rutgers.edu',
  'New York University': 'nyu.edu',
  'Chinese Union Headquarters': 'chineseunion.org',
  'CU Headquarters': 'chineseunion.org',
  'CU Headquarter': 'chineseunion.org', // API中的engName拼写变体
  
  // === 基于后端API的 deptName 字段映射 ===
  '加州大学伯克利分校': 'berkeley.edu',
  '加州大学圣克鲁兹分校': 'ucsc.edu',
  '南加州大学': 'usc.edu',
  '加州大学洛杉矶分校': 'ucla.edu',
  '加州大学欧文分校': 'uci.edu', // API中的实际中文名
  '加州大学尔湾分校': 'uci.edu', // 别名支持
  '加州大学圣地亚哥分校': 'ucsd.edu',
  '明尼苏达大学': 'umn.edu',
  '华盛顿大学': 'uw.edu',
  '伯克利音乐学院': 'berklee.edu',
  '加州大学圣塔芭芭拉分校': 'ucsb.edu', // API中的实际中文名
  '加州大学圣巴巴拉分校': 'ucsb.edu', // 别名支持
  '加州大学戴维斯分校': 'ucdavis.edu',
  '罗格斯大学': 'rutgers.edu',
  '纽约大学': 'nyu.edu',
  'CU总部': 'chineseunion.org',
  
  // === 基于后端API的 aprName 字段映射 ===
  'UCB': 'berkeley.edu',
  'UCSC': 'ucsc.edu',
  'USC': 'usc.edu',
  'UCLA': 'ucla.edu',
  'UCI': 'uci.edu',
  'UCSD': 'ucsd.edu',
  'UMN': 'umn.edu',
  'UW': 'uw.edu',
  'Berklee': 'berklee.edu',
  'UCSB': 'ucsb.edu',
  'UCD': 'ucdavis.edu',
  'Rutgers': 'rutgers.edu',
  'NYU': 'nyu.edu',
  'CU': 'chineseunion.org',
  'CU HQ.': 'chineseunion.org' // API中的aprName变体
};

// 后端学校数据接口（预留emailDomain字段）
export interface APISchoolData {
  createBy?: string;
  createTime?: string;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
  deptId: number;
  parentId?: number;
  ancestors?: string;
  deptName: string;          // 中文名称
  orderNum?: number;
  leader?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  delFlag?: string;
  parentName?: string | null;
  logo?: string | null;
  engName: string;          // 英文名称
  aprName: string;          // 缩写名称
  children?: APISchoolData[];
  emailDomain?: string;     // 🚀 预留：将来后端提供的邮箱域名字段
}

/**
 * 学校邮箱域名服务类
 */
export class SchoolEmailService {
  
  /**
   * 获取学校的邮箱域名
   * @param school 后端返回的学校数据
   * @returns 邮箱域名，如 'berkeley.edu' 或空字符串
   */
  static getEmailDomain(school: APISchoolData): string {
    // 🚀 优先使用后端提供的邮箱域名（将来扩展）
    if (school.emailDomain && school.emailDomain.trim()) {
      return school.emailDomain.trim();
    }
    
    // Fallback到静态映射表，按优先级尝试匹配
    return this.getStaticEmailDomain(school);
  }
  
  /**
   * 从静态映射表获取邮箱域名
   * @param school 学校数据
   * @returns 邮箱域名或空字符串
   */
  private static getStaticEmailDomain(school: APISchoolData): string {
    // 1. 尝试匹配英文名称（最准确）
    if (school.engName && UNIFIED_SCHOOL_EMAIL_MAPPING[school.engName]) {
      return UNIFIED_SCHOOL_EMAIL_MAPPING[school.engName];
    }
    
    // 2. 尝试匹配中文名称
    if (school.deptName && UNIFIED_SCHOOL_EMAIL_MAPPING[school.deptName]) {
      return UNIFIED_SCHOOL_EMAIL_MAPPING[school.deptName];
    }
    
    // 3. 尝试匹配缩写名称
    if (school.aprName && UNIFIED_SCHOOL_EMAIL_MAPPING[school.aprName]) {
      return UNIFIED_SCHOOL_EMAIL_MAPPING[school.aprName];
    }
    
    // 如果都没匹配到，返回空字符串
    return '';
  }
  
  /**
   * 根据学校名称字符串获取邮箱域名（兼容旧接口）
   * @param schoolName 学校名称（中文、英文或缩写）
   * @returns 邮箱域名或空字符串
   */
  static getEmailDomainByName(schoolName: string): string {
    if (!schoolName || !schoolName.trim()) {
      return '';
    }
    
    const trimmedName = schoolName.trim();
    return UNIFIED_SCHOOL_EMAIL_MAPPING[trimmedName] || '';
  }
  
  /**
   * 生成完整的邮箱地址
   * @param username 用户名部分（邮箱@前面的部分）
   * @param school 学校数据
   * @returns 完整邮箱地址，如 'john@berkeley.edu'
   */
  static generateEmailAddress(username: string, school: APISchoolData): string {
    if (!username || !username.trim()) {
      return '';
    }
    
    const domain = this.getEmailDomain(school);
    if (!domain) {
      return '';
    }
    
    return `${username.trim()}@${domain}`;
  }
  
  /**
   * 验证邮箱是否为支持的教育域名
   * @param email 完整邮箱地址
   * @returns 是否为有效的教育邮箱
   */
  static validateEducationEmail(email: string): boolean {
    if (!email || !email.trim()) {
      return false;
    }
    
    // 基本邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // 提取域名部分
    const domain = email.split('@')[1];
    if (!domain) {
      return false;
    }
    
    // 检查是否为支持的教育域名
    const supportedDomains = Object.values(UNIFIED_SCHOOL_EMAIL_MAPPING);
    return supportedDomains.includes(domain);
  }
  
  /**
   * 获取所有支持的学校数量
   * @returns 支持的学校总数
   */
  static getSupportedSchoolCount(): number {
    // 去重计算，因为同一个域名可能对应多个名称
    const uniqueDomains = new Set(Object.values(UNIFIED_SCHOOL_EMAIL_MAPPING));
    return uniqueDomains.size;
  }
  
  /**
   * 检查学校是否支持邮箱验证
   * @param school 学校数据
   * @returns 是否支持邮箱验证
   */
  static isEmailVerificationSupported(school: APISchoolData): boolean {
    return this.getEmailDomain(school) !== '';
  }
}

// 导出默认实例（便于使用）
export default SchoolEmailService;