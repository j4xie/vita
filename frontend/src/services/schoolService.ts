// School Service - 学校数据管理
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pomeloXAPI } from './PomeloXAPI';
import { getApiUrl, getImagesCdnUrl } from '../utils/environment';

interface SchoolData {
  deptId: number;
  deptName: string;
  engName?: string;
  aprName?: string;
  logo?: string;
  children: SchoolData[];
}

class SchoolService {
  private schoolCache: SchoolData[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存
  private readonly CACHE_VERSION = 'v2'; // 🔧 版本号，更新时强制清除缓存

  /**
   * 获取学校列表（带缓存）
   */
  async getSchoolList(): Promise<SchoolData[]> {
    // 🔧 检查缓存版本，版本不匹配时强制清除
    try {
      const cachedVersion = await AsyncStorage.getItem('school_cache_version');
      if (cachedVersion !== this.CACHE_VERSION) {
        console.log(`🔄 [schoolService] 缓存版本不匹配 (${cachedVersion} -> ${this.CACHE_VERSION})，清除旧缓存`);
        await this.clearCache();
        await AsyncStorage.setItem('school_cache_version', this.CACHE_VERSION);
      }
    } catch (e) {
      console.warn('⚠️ [schoolService] 版本检查失败:', e);
    }

    // 检查内存缓存
    if (this.schoolCache && (Date.now() - this.cacheTimestamp < this.CACHE_DURATION)) {
      console.log('📦 [schoolService] 使用内存缓存，学校数:', this.schoolCache.length);
      return this.schoolCache;
    }

    // 检查本地存储缓存
    try {
      const cachedData = await AsyncStorage.getItem('school_list_cache');
      const cachedTime = await AsyncStorage.getItem('school_list_cache_time');

      if (cachedData && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < this.CACHE_DURATION) {
          this.schoolCache = JSON.parse(cachedData);
          this.cacheTimestamp = parseInt(cachedTime);
          console.log('📦 [schoolService] 使用本地存储缓存，学校数:', this.schoolCache?.length);
          return this.schoolCache!;
        }
      }
    } catch (e) {
      console.warn('⚠️ [schoolService] 读取缓存失败:', e);
    }

    try {

      // 从API获取
      console.log('🔄 从API获取学校列表');
      const response = await pomeloXAPI.getSchoolList();

      if (response.code === 200 && response.data) {
        const schools = response.data;

        // 🔍 详细调试日志 - 检查logo字段
        console.log('📊 [schoolService] 后端返回学校数据详情:');
        schools.forEach((school, index) => {
          console.log(`  学校${index + 1}: ${school.deptName} (ID:${school.deptId})`);
          console.log(`    - 英文名: ${school.engName || 'N/A'}`);
          console.log(`    - 缩写: ${school.aprName || 'N/A'}`);
          console.log(`    - Logo: ${school.logo || '❌ 无logo'}`);
          console.log(`    - 子学校数: ${school.children?.length || 0}`);
        });

        // 保存到缓存
        this.schoolCache = schools;
        this.cacheTimestamp = Date.now();

        // 保存到本地存储
        await AsyncStorage.setItem('school_list_cache', JSON.stringify(schools));
        await AsyncStorage.setItem('school_list_cache_time', this.cacheTimestamp.toString());

        return schools;
      }

      console.error('❌ 获取学校列表失败:', response);
      return [];
    } catch (error: any) {
      console.error('❌ 学校列表API异常:', error.message);
      return [];
    }
  }

  // 建筑名称/地标到学校的映射
  private readonly BUILDING_TO_SCHOOL: Record<string, string[]> = {
    // University of Minnesota (UMN)
    'umn': ['bruininks', 'coffman', 'northrop', 'tate hall', 'walter library', 'minneapolis'],
    // UC Berkeley
    'ucb': ['sproul', 'sather', 'dwinelle', 'berkeley'],
    // UCLA
    'ucla': ['royce', 'powell library', 'westwood', 'bruin'],
    // UC San Diego
    'ucsd': ['geisel', 'price center', 'la jolla'],
    // UC Santa Barbara
    'ucsb': ['storke tower', 'isla vista', 'santa barbara'],
    // UC Irvine
    'uci': ['aldrich', 'langson', 'irvine'],
    // UC Davis
    'ucd': ['memorial union', 'shields library', 'davis'],
    // UC Santa Cruz
    'ucsc': ['mchenry', 'quarry plaza', 'santa cruz'],
    // USC
    'usc': ['doheny', 'bovard', 'tommy trojan', 'exposition'],
    // Cornell
    'cornell': ['ithaca', 'mcgraw tower', 'uris'],
    // NYU
    'nyu': ['bobst', 'washington square', 'kimmel'],
    // Rutgers
    'rutgers': ['new brunswick', 'college avenue'],
    // University of Washington
    'uw': ['suzzallo', 'red square', 'seattle'],
    // Berklee
    'berklee': ['berklee', 'boston'],
  };

  /**
   * 根据位置字符串匹配学校
   * 例如: "Ithaca, NY" 或 "Ithaca" -> Cornell University
   * 或: "Bruininks Hall 432" -> University of Minnesota
   */
  async findSchoolByLocation(location: string): Promise<SchoolData | null> {
    if (!location) return null;

    const schools = await this.getSchoolList();
    console.log('🔍 [schoolService] 学校列表数量:', schools.length);

    if (schools.length > 0) {
      console.log('🔍 [schoolService] 第一个学校示例:', {
        deptName: schools[0].deptName,
        engName: schools[0].engName,
        aprName: schools[0].aprName,
        logo: schools[0].logo,
        hasLogo: !!schools[0].logo
      });
    }

    const locationLower = location.toLowerCase();
    console.log('🔍 [schoolService] 尝试匹配位置:', locationLower);

    // 首先尝试精确匹配学校名称
    for (const school of schools) {
      const names = [
        school.deptName?.toLowerCase(),
        school.engName?.toLowerCase(),
        school.aprName?.toLowerCase(),
      ].filter(Boolean);

      if (names.some(name => name === locationLower || locationLower.includes(name || ''))) {
        console.log('✅ [schoolService] 精确匹配学校:', school.deptName, 'logo:', school.logo);
        return school;
      }
    }

    // 模糊匹配：检查location是否包含学校名称的一部分
    for (const school of schools) {
      const schoolName = school.engName || school.deptName;
      if (schoolName && locationLower.includes(schoolName.toLowerCase())) {
        console.log('✅ [schoolService] 模糊匹配学校:', school.deptName, 'logo:', school.logo);
        return school;
      }
    }

    // 建筑名称/地标匹配
    for (const [schoolKey, buildings] of Object.entries(this.BUILDING_TO_SCHOOL)) {
      const hasMatch = buildings.some(building => locationLower.includes(building));
      if (hasMatch) {
        // 根据schoolKey找到对应的学校
        const matchedSchool = schools.find(school => {
          const aprName = school.aprName?.toLowerCase() || '';
          const engName = school.engName?.toLowerCase() || '';
          const deptName = school.deptName?.toLowerCase() || '';

          // 匹配缩写或名称关键词
          return aprName === schoolKey ||
                 aprName.includes(schoolKey) ||
                 engName.includes(this.getSchoolKeyword(schoolKey)) ||
                 deptName.includes(this.getSchoolKeyword(schoolKey));
        });

        if (matchedSchool) {
          console.log('✅ [schoolService] 建筑名称匹配学校:', matchedSchool.deptName, '(通过建筑:', buildings.find(b => locationLower.includes(b)), ')');
          return matchedSchool;
        }
      }
    }

    console.warn('⚠️ [schoolService] 未找到匹配的学校:', location, '可用学校:', schools.map(s => `${s.deptName}(${s.engName})`).join(' | '));
    return null;
  }

  /**
   * 获取学校关键词用于匹配
   */
  private getSchoolKeyword(key: string): string {
    const keywords: Record<string, string> = {
      'umn': 'minnesota',
      'ucb': 'berkeley',
      'ucla': 'los angeles',
      'ucsd': 'san diego',
      'ucsb': 'santa barbara',
      'uci': 'irvine',
      'ucd': 'davis',
      'ucsc': 'santa cruz',
      'usc': 'southern california',
      'cornell': 'cornell',
      'nyu': 'new york',
      'rutgers': 'rutgers',
      'uw': 'washington',
      'berklee': 'berklee',
    };
    return keywords[key] || key;
  }

  /**
   * 根据deptId获取学校信息
   */
  async getSchoolById(deptId: number): Promise<SchoolData | null> {
    const schools = await this.getSchoolList();
    const school = this.findSchoolInTree(schools, deptId);

    // 🧪 临时测试：为没有logo的学校添加测试logo
    if (school && !school.logo) {
      const testLogos: { [key: number]: string } = {
        1: 'https://via.placeholder.com/200/FF6B6B/FFFFFF?text=School1',
        2: 'https://via.placeholder.com/200/4ECDC4/FFFFFF?text=School2',
        3: 'https://via.placeholder.com/200/45B7D1/FFFFFF?text=School3',
        4: 'https://via.placeholder.com/200/FFA07A/FFFFFF?text=School4',
        5: 'https://via.placeholder.com/200/98D8C8/FFFFFF?text=School5',
      };

      if (testLogos[deptId]) {
        console.log(`🧪 [TEST] 为 deptId=${deptId} 添加测试logo`);
        school.logo = testLogos[deptId];
      }
    }

    return school;
  }

  /**
   * 在树形结构中查找学校
   */
  private findSchoolInTree(schools: SchoolData[], deptId: number): SchoolData | null {
    // 🔧 确保deptId是数字类型
    const targetId = typeof deptId === 'string' ? parseInt(deptId, 10) : deptId;

    console.log(`🔍 [schoolService] findSchoolInTree 搜索 deptId=${targetId}，学校列表长度: ${schools.length}`);

    for (const school of schools) {
      // 🔧 同时比较数字和字符串形式
      const schoolId = typeof school.deptId === 'string' ? parseInt(school.deptId, 10) : school.deptId;

      if (schoolId === targetId) {
        console.log(`🎯 [schoolService] 找到学校: ${school.deptName} (ID:${school.deptId}), Logo: ${school.logo || '❌ 无'}`);
        return school;
      }
      if (school.children && school.children.length > 0) {
        const found = this.findSchoolInTree(school.children, targetId);
        if (found) return found;
      }
    }

    // 🔧 调试：打印所有可用的学校ID
    const availableIds = schools.map(s => s.deptId).join(', ');
    console.warn(`⚠️ [schoolService] 未在树形结构中找到 deptId=${targetId} 的学校。可用ID: ${availableIds}`);
    return null;
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    this.schoolCache = null;
    this.cacheTimestamp = 0;
    await AsyncStorage.removeItem('school_list_cache');
    await AsyncStorage.removeItem('school_list_cache_time');
    console.log('🗑️ 学校缓存已清除');
  }

  /**
   * 获取学校logo URL
   */
  getSchoolLogoUrl(school: SchoolData | null): string {
    if (!school) {
      console.warn('❌ [schoolService] school为null，返回默认logo');
      const baseUrl = getApiUrl();
      return `${baseUrl}/assets/logos/default.png`;
    }

    console.log(`📍 [schoolService] getSchoolLogoUrl 学校: ${school.deptName}, rawLogo: ${school.logo || 'undefined'}`);

    if (!school.logo) {
      // 默认logo（使用CDN）
      const baseUrl = getApiUrl();
      console.log(`⚠️ [schoolService] 学校"${school.deptName}"没有logo，使用默认logo`);
      return `${baseUrl}/assets/logos/default.png`;
    }

    // 如果是相对路径，使用CDN地址
    if (school.logo.startsWith('/')) {
      const cdnUrl = getImagesCdnUrl();
      const url = `${cdnUrl}${school.logo}`;
      console.log(`✅ [schoolService] 相对路径logo: ${url}`);
      return url;
    }

    // 如果是完整URL，直接返回
    if (school.logo.startsWith('http')) {
      console.log(`✅ [schoolService] 完整URL logo: ${school.logo}`);
      return school.logo;
    }

    // 否则，假设是相对路径，使用CDN地址
    const cdnUrl = getImagesCdnUrl();
    const url = `${cdnUrl}/${school.logo}`;
    console.log(`✅ [schoolService] 构建logo URL: ${url}`);
    return url;
  }

  /**
   * 获取学校显示名称
   */
  getSchoolDisplayName(school: SchoolData | null): string {
    if (!school) return 'Unknown University';
    return school.engName || school.deptName || 'Unknown University';
  }
}

export const schoolService = new SchoolService();
