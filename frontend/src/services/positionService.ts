/**
 * 职位/岗位管理服务
 */

import { pomeloXAPI } from './PomeloXAPI';
import { i18n } from '../utils/i18n';

// 职位接口定义
export interface Position {
  postId: number;
  postCode: string;
  postName: string;
  postSort: number;
  status: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

// 职位映射类型
export interface PositionMapping {
  code: string;
  zhName: string;
  enName: string;
  level: number; // 职位级别，用于排序
}

// 预定义的职位映射（根据用户要求）
export const POSITION_MAPPINGS: Record<string, PositionMapping> = {
  president: {
    code: 'president',
    zhName: '主席',
    enName: 'President',
    level: 1
  },
  vice_president: {
    code: 'vice_president', 
    zhName: '副主席',
    enName: 'Vice President',
    level: 2
  },
  eb: {
    code: 'eb',
    zhName: '执行委员会',
    enName: 'Executive Board',
    level: 3
  },
  officer: {
    code: 'officer',
    zhName: '干事',
    enName: 'Officer', 
    level: 4
  },
  hq_member: {
    code: 'hq_member',
    zhName: '总部成员',
    enName: 'HQ Member',
    level: 5
  }
};

class PositionService {
  private positionCache: Position[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取职位列表（带缓存）
   */
  async getPositions(): Promise<Position[]> {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (this.positionCache && (now - this.lastFetchTime) < this.CACHE_TTL) {
      console.log('📋 使用缓存的职位列表');
      return this.positionCache;
    }

    try {
      console.log('🌐 从API获取职位列表');
      const response = await pomeloXAPI.getPostList();
      
      if (response.code === 200 && response.data) {
        this.positionCache = response.data;
        this.lastFetchTime = now;
        console.log('✅ 职位列表获取成功，数量:', response.data.length);
        return response.data;
      } else {
        console.warn('⚠️ 职位列表API返回异常:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ 获取职位列表失败:', error);
      return [];
    }
  }

  /**
   * 根据用户的roles或postIds获取职位显示名称
   * @returns 岗位信息对象，如果用户无岗位分配则返回null（不显示在志愿者列表中）
   */
  async getUserPositionDisplay(userData: any): Promise<{ level: string; major: string } | null> {
    try {
      console.log('🔍 [POSITION-SERVICE] 开始处理用户岗位:', userData?.userName);

      const currentLanguage = i18n?.language || 'zh-CN';
      const isEnglish = currentLanguage === 'en-US';

      // 🚨 新逻辑：只基于roleKey判断，移除用户名fallback
      // 🔧 兼容两种后端返回格式：roles数组 或 role对象
      let roles = userData?.roles || [];
      let roleKey: string | undefined;

      if (Array.isArray(roles) && roles.length > 0) {
        // 格式1: roles数组（字段名为key）
        const primaryRole = roles[0];
        roleKey = primaryRole?.key || primaryRole?.roleKey;
      } else if (userData?.role) {
        // 格式2: 单个role对象（字段名为roleKey）
        roleKey = userData.role.roleKey;
        console.log('🔍 [POSITION-SERVICE] 使用role对象:', roleKey);
      }

      if (!roleKey) {
        console.log('❌ [POSITION-SERVICE] 用户无有效角色信息，不显示');
        return null;
      }

      // 只有manage/part_manage/staff用户才显示
      if (!['manage', 'part_manage', 'staff'].includes(roleKey)) {
        console.log('❌ [POSITION-SERVICE] roleKey不符合条件，不显示:', roleKey);
        return null;
      }

      console.log('👤 用户有有效角色信息:', roleKey);

      // 🎯 全面支持所有可能的岗位字段格式

      // 🐛 详细的调试日志
      console.log('📊 [POSITION-DEBUG] 用户原始数据:', {
        userName: userData?.userName,
        完整userData: userData
      });

      // 方式1: 直接从顶层postName字段获取
      if (userData?.postName) {
        console.log('✅ [POSITION-SERVICE] 从顶层postName返回岗位:', userData.postName);
        return {
          level: userData.postName,
          major: userData.postName
        };
      }

      // 方式2: 单个post对象（/app/user/info返回格式）
      if (userData?.post && userData.post.postName) {
        console.log('✅ [POSITION-SERVICE] 基于post对象返回岗位:', userData.post.postName);
        return {
          level: userData.post.postName,
          major: userData.post.postName
        };
      }

      // 方式3: posts数组 + postIds数组（/system/user/list可能的格式）
      const postIds = userData?.postIds || [];
      const posts = userData?.posts || [];

      if (Array.isArray(postIds) && postIds.length > 0 && Array.isArray(posts) && posts.length > 0) {
        const userPost = posts.find(post => postIds.includes(post.postId));
        console.log('🔎 [POSITION-MATCH] 从posts数组匹配结果:', userPost);

        if (userPost && userPost.postName) {
          console.log('✅ [POSITION-SERVICE] 基于postIds返回具体岗位:', userPost.postName);
          return {
            level: userPost.postName,
            major: userPost.postName
          };
        }
      }

      // 方式4: 从postCode字段推断
      if (userData?.postCode) {
        console.log('⚠️ [POSITION-SERVICE] 从postCode推断岗位:', userData.postCode);
        // 这里可以添加postCode到岗位名称的映射
      }

      console.log('⚠️ [POSITION-SERVICE] 所有岗位字段都为空，使用roleKey备用逻辑');
      
      // 备用：基于roleKey显示
      const positionDisplay = this.mapRoleToPositionSimple(roleKey, isEnglish);
      if (positionDisplay) {
        console.log('✅ [POSITION-SERVICE] 基于roleKey返回备用岗位:', positionDisplay);
        return positionDisplay;
      }
      
      console.log('❌ [POSITION-SERVICE] 无法确定岗位信息');
      return null;
      
    } catch (error) {
      console.error('❌ [POSITION-SERVICE] 处理失败:', error);
      return null;
    }
  }

  /**
   * 根据roleKey映射到具体岗位名称 (President、Vice President、EB等)
   */
  private mapRoleToPositionSimple(roleKey: string, isEnglish: boolean): { level: string; major: string } | null {
    switch (roleKey) {
      case 'manage':
        return {
          level: isEnglish ? 'President' : '主席',
          major: isEnglish ? 'President' : '主席'
        };
      case 'part_manage':
        return {
          level: isEnglish ? 'Vice President' : '副主席',
          major: isEnglish ? 'Vice President' : '副主席'
        };
      case 'staff':
        return {
          level: isEnglish ? 'EB' : 'EB',  // EB在中英文都保持一致
          major: isEnglish ? 'EB' : 'EB'
        };
      default:
        return null;
    }
  }

  /**
   * 根据roleKey映射岗位显示信息 (旧版本，保留备用)
   */
  private mapRoleToPosition(roleKey: string, roleName: string, isEnglish: boolean): { level: string; major: string } | null {
    switch (roleKey) {
      case 'manage':
        return {
          level: isEnglish ? 'General Manager' : '总管理员',
          major: isEnglish ? 'Management' : '管理工作'
        };
      case 'part_manage':
        return {
          level: isEnglish ? 'Department Manager' : '分管理员',
          major: isEnglish ? 'Department Management' : '部门管理'
        };
      case 'staff':
        return {
          level: isEnglish ? 'Staff' : '内部员工',
          major: isEnglish ? 'Internal Operations' : '内部运营'
        };
      case 'common':
        // 普通用户不显示在志愿者列表中
        return null;
      default:
        // 未知角色，使用roleName
        return {
          level: roleName || (isEnglish ? 'Staff' : '员工'),
          major: isEnglish ? 'Organization' : '组织管理'
        };
    }
  }

  /**
   * 查找职位代码对应的映射
   */
  private findPositionMapping(postCode: string): PositionMapping | null {
    // 直接匹配
    if (POSITION_MAPPINGS[postCode]) {
      return POSITION_MAPPINGS[postCode];
    }

    // 模糊匹配（忽略大小写和下划线）
    const normalizedCode = postCode.toLowerCase().replace(/_/g, '');
    for (const [key, mapping] of Object.entries(POSITION_MAPPINGS)) {
      if (key.toLowerCase().replace(/_/g, '') === normalizedCode) {
        return mapping;
      }
    }

    // 部分匹配
    const codeUpperCase = postCode.toUpperCase();
    if (codeUpperCase.includes('PRESIDENT')) {
      if (codeUpperCase.includes('VICE')) {
        return POSITION_MAPPINGS.vice_president;
      }
      return POSITION_MAPPINGS.president;
    }

    if (codeUpperCase.includes('EB') || codeUpperCase.includes('EXECUTIVE')) {
      return POSITION_MAPPINGS.eb;
    }

    if (codeUpperCase.includes('OFFICER') || codeUpperCase.includes('干事')) {
      return POSITION_MAPPINGS.officer;
    }

    if (codeUpperCase.includes('HQ') || codeUpperCase.includes('总部')) {
      return POSITION_MAPPINGS.hq_member;
    }

    console.warn('⚠️ 无法匹配职位代码:', postCode);
    return null;
  }

  /**
   * 清除缓存（用于测试或强制刷新）
   */
  clearCache(): void {
    this.positionCache = null;
    this.lastFetchTime = 0;
    console.log('🧹 职位缓存已清理');
  }
}

export const positionService = new PositionService();
export default positionService;