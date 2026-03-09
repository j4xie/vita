/**
 * Form Auto-Fill Utility
 * 自动从用户信息填充表单字段
 */

import { FrontendUser } from '../types/user';
import { FormField, UserProfile } from '../types/form';

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
};

// ==================== 工具函数 ====================

/**
 * 从 FrontendUser 提取 UserProfile
 */
export function extractUserProfile(user: FrontendUser | null): UserProfile {
  if (!user) {
    return {};
  }

  return {
    realName: user.legalName || user.nickName || user.userName,
    nickName: user.nickName,
    phone: user.phonenumber,
    email: user.email,
    schoolName: user.department?.deptName,
    studentId: user.studentId,
    // major 和 grade 可能需要从其他字段获取
  };
}

/**
 * 根据表单字段和用户信息，计算可自动填充的字段
 */
export function getAutoFillData(
  formSchema: FormField[],
  user: FrontendUser | null
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
      autoFilled[field.vModel] = userValue;
      if (field.label) {
        autoFilledLabels.push(field.label);
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
  user: FrontendUser | null
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
  FIELD_MAPPING,
};

export default formAutoFill;
