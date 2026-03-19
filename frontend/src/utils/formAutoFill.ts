/**
 * Form Auto-Fill Utility
 * 自动从用户信息填充表单字段
 */

import { FormField, FormFieldOption, UserProfile } from '../types/form';

// ==================== 字段映射 ====================

/**
 * 表单字段名到用户属性的映射
 * 支持多种常见命名方式
 */
const FIELD_MAPPING: Record<string, keyof UserProfile> = {
  // 姓名相关
  'name': 'realName',
  'realName': 'realName',
  'legalName': 'realName',
  'fullName': 'realName',
  'userName': 'realName',
  'xingming': 'realName',
  '姓名': 'realName',

  // 昵称相关
  'nickName': 'nickName',
  'nickname': 'nickName',
  'displayName': 'nickName',
  '昵称': 'nickName',

  // 电话相关
  'phone': 'phone',
  'phonenumber': 'phone',
  'phoneNumber': 'phone',
  'mobile': 'phone',
  'mobilePhone': 'phone',
  'tel': 'phone',
  'telephone': 'phone',
  '电话': 'phone',
  '手机': 'phone',

  // 邮箱相关
  'email': 'email',
  'emailAddress': 'email',
  'mail': 'email',
  '邮箱': 'email',

  // 学校相关
  'school': 'schoolName',
  'schoolName': 'schoolName',
  'university': 'schoolName',
  'college': 'schoolName',
  '学校': 'schoolName',
  '大学': 'schoolName',

  // 学号相关
  'studentId': 'studentId',
  'studentNumber': 'studentId',
  'stuId': 'studentId',
  '学号': 'studentId',

  // 专业相关
  'major': 'major',
  'profession': 'major',
  '专业': 'major',

  // 年级相关
  'grade': 'grade',
  'year': 'grade',
  '年级': 'grade',

  // 性别相关
  'gender': 'gender',
  'sex': 'gender',
  '性别': 'gender',

  // 微信相关
  'wechatId': 'wechatId',
  'wechat': 'wechatId',
  'weixin': 'wechatId',
  '微信': 'wechatId',
  '微信号': 'wechatId',
};

// ==================== 选项智能匹配 ====================

/**
 * 性别值到常见选项文本的映射
 */
const GENDER_MAP: Record<string, string[]> = {
  'male': ['男', '男性', '男 Male', 'Male', '男生'],
  'female': ['女', '女性', '女 Female', 'Female', '女生'],
};

/**
 * 学校简称到全称的映射
 */
const SCHOOL_ALIASES: Record<string, string[]> = {
  'UCSD': ['UC San Diego', 'University of California San Diego', '加州大学圣地亚哥分校'],
  'UCLA': ['UC Los Angeles', 'University of California Los Angeles', '加州大学洛杉矶分校'],
  'UCSB': ['UC Santa Barbara', 'University of California Santa Barbara', '加州大学圣塔芭芭拉分校'],
  'UMN': ['University of Minnesota', '明尼苏达大学'],
  'USC': ['University of Southern California', '南加州大学'],
  'UCI': ['UC Irvine', 'University of California Irvine', '加州大学欧文分校'],
  'UCB': ['UC Berkeley', 'University of California Berkeley', '加州大学伯克利分校'],
  'UCD': ['UC Davis', 'University of California Davis', '加州大学戴维斯分校'],
  'UCSC': ['UC Santa Cruz', 'University of California Santa Cruz', '加州大学圣克鲁兹分校'],
  'UW': ['University of Washington', '华盛顿大学'],
  'NYU': ['New York University', '纽约大学'],
  'Rutgers': ['Rutgers University', '罗格斯大学'],
};

/**
 * 智能匹配用户值到选项值
 * 处理场景：
 *   gender='male' → opt.value='男' or '男 Male'
 *   schoolName='UCSD' → opt.value='UC San Diego' or 'UCSD'
 */
function matchOptionValue(
  userValue: string,
  options: FormFieldOption[]
): string | number | null {
  if (!userValue || !options?.length) return null;

  // 1. 精确匹配
  const exact = options.find(o => String(o.value) === userValue);
  if (exact) return exact.value;

  // 2. 忽略大小写匹配
  const caseInsensitive = options.find(
    o => String(o.value).toLowerCase() === userValue.toLowerCase()
  );
  if (caseInsensitive) return caseInsensitive.value;

  // 3. 性别特殊映射
  if (GENDER_MAP[userValue]) {
    const genderMatch = options.find(o =>
      GENDER_MAP[userValue].some(g =>
        String(o.value) === g || o.label === g
      )
    );
    if (genderMatch) return genderMatch.value;
  }

  // 4. 包含匹配（学校名等）
  const contains = options.find(o => {
    const sv = String(o.value);
    return sv.includes(userValue) || userValue.includes(sv) ||
      (o.label && (o.label.includes(userValue) || userValue.includes(o.label)));
  });
  if (contains) return contains.value;

  // 5. 学校简称映射
  const directAliases = SCHOOL_ALIASES[userValue];
  if (directAliases) {
    for (const alias of directAliases) {
      const match = options.find(o =>
        String(o.value).includes(alias) || (o.label && o.label.includes(alias))
      );
      if (match) return match.value;
    }
  }
  // 反向查找：用户值是全称，选项是简称
  for (const [abbr, fullNames] of Object.entries(SCHOOL_ALIASES)) {
    if (fullNames.includes(userValue)) {
      const match = options.find(o =>
        String(o.value).includes(abbr) || (o.label && o.label.includes(abbr))
      );
      if (match) return match.value;
    }
  }

  return null;
}

// ==================== 工具函数 ====================

/**
 * 从用户对象提取 UserProfile
 * 兼容 FrontendUser (types/user.ts) 和 FrontendUser (userAdapter.ts) 两种类型
 */
export function extractUserProfile(user: any | null): UserProfile {
  if (!user) {
    return {};
  }

  return {
    realName: user.legalName || user.nickName || user.userName,
    nickName: user.nickName,
    phone: user.phonenumber || user.phone,
    email: user.email,
    schoolName: user.department?.deptName || user.dept?.deptName || user.school?.name,
    studentId: user.studentId,
    gender: user.gender || (user.sex === '0' ? 'male' : user.sex === '1' ? 'female' : undefined),
    wechatId: user.wechatId,
  };
}

/**
 * 根据表单字段和用户信息，计算可自动填充的字段
 */
export function getAutoFillData(
  formSchema: FormField[],
  user: any | null
): {
  autoFilled: Record<string, unknown>;
  remainingFields: FormField[];
  autoFilledLabels: string[];
} {
  const userProfile = extractUserProfile(user);
  const autoFilled: Record<string, unknown> = {};
  const remainingFields: FormField[] = [];
  const autoFilledLabels: string[] = [];

  for (const field of formSchema) {
    // 跳过没有 vModel 的字段（如按钮、行布局等）
    if (!field.vModel) {
      continue;
    }

    // 尝试通过 vModel 查找映射
    const vModelLower = field.vModel.toLowerCase();
    let userKey = FIELD_MAPPING[field.vModel] || FIELD_MAPPING[vModelLower];

    // 如果 vModel 没有匹配到，尝试通过 label（字段标签）匹配
    if (!userKey && field.label) {
      const labelLower = field.label.toLowerCase();
      userKey = FIELD_MAPPING[field.label] || FIELD_MAPPING[labelLower];
    }

    const userValue = userKey ? userProfile[userKey] : null;

    if (userValue) {
      // 选择类组件需要匹配选项值
      if (field.options?.length && (field.tag === 'el-radio-group' || field.tag === 'el-select')) {
        const matchedValue = matchOptionValue(String(userValue), field.options);
        if (matchedValue) {
          autoFilled[field.vModel] = matchedValue;
          if (field.label) {
            autoFilledLabels.push(field.label);
          }
        } else {
          remainingFields.push(field);
        }
      } else {
        // 文本类组件直接赋值
        autoFilled[field.vModel] = userValue;
        if (field.label) {
          autoFilledLabels.push(field.label);
        }
      }
    } else {
      remainingFields.push(field);
    }
  }

  return { autoFilled, remainingFields, autoFilledLabels };
}

/**
 * 判断是否推荐使用 AI 填表
 */
export function shouldRecommendAI(
  formSchema: FormField[],
  user: any | null
): {
  recommend: boolean;
  reason: string;
} {
  const { remainingFields } = getAutoFillData(formSchema, user);

  // 没有剩余字段需要填写
  if (remainingFields.length === 0) {
    return {
      recommend: false,
      reason: 'all_auto_filled',
    };
  }

  // 有 textarea 类型字段 (大段文字)
  const hasTextarea = remainingFields.some(f => f.tag === 'el-textarea');
  if (hasTextarea) {
    return {
      recommend: true,
      reason: 'has_textarea',
    };
  }

  // 有开放性问题
  const openKeywords = [
    '为什么', '原因', '描述', '介绍', '说明', '期望', '想法',
    'why', 'reason', 'describe', 'explain', 'about', 'tell',
  ];
  const hasOpenQuestion = remainingFields.some(f =>
    openKeywords.some(kw => f.label?.toLowerCase().includes(kw.toLowerCase()))
  );
  if (hasOpenQuestion) {
    return {
      recommend: true,
      reason: 'has_open_question',
    };
  }

  // 剩余 3 个以上需要填写的字段
  if (remainingFields.length >= 3) {
    return {
      recommend: true,
      reason: 'multiple_fields',
    };
  }

  // 字段较少，传统表单更合适
  return {
    recommend: false,
    reason: 'simple_form',
  };
}

/**
 * 计算表单填写进度
 */
export function calculateProgress(
  formSchema: FormField[],
  formData: Record<string, unknown>
): number {
  if (formSchema.length === 0) return 100;

  const requiredFields = formSchema.filter(f => f.required);
  const totalFields = requiredFields.length > 0 ? requiredFields : formSchema;

  const filledCount = totalFields.filter(f => {
    const value = formData[f.vModel];
    return value !== undefined && value !== null && value !== '';
  }).length;

  return Math.round((filledCount / totalFields.length) * 100);
}

/**
 * 检查必填字段是否都已填写
 */
export function checkRequiredFields(
  formSchema: FormField[],
  formData: Record<string, unknown>
): {
  isComplete: boolean;
  missingFields: string[];
} {
  const requiredFields = formSchema.filter(f => f.required);
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = formData[field.vModel];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field.label);
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

// ==================== 导出 ====================

const formAutoFill = {
  extractUserProfile,
  getAutoFillData,
  shouldRecommendAI,
  calculateProgress,
  checkRequiredFields,
  matchOptionValue,
  FIELD_MAPPING,
};

export default formAutoFill;
