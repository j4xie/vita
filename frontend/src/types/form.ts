/**
 * 统一的表单类型定义
 * 合并了 useAIFormFilling, DynamicFormRenderer 中的重复定义
 */

// ==================== 基础类型 ====================

/**
 * 表单字段选项
 */
export interface FormFieldOption {
  label: string;
  value: string;
}

/**
 * 用户信息（用于表单自动填充）
 */
export interface UserProfile {
  realName?: string;
  nickName?: string;
  phone?: string;
  email?: string;
  schoolName?: string;
  studentId?: string;
  major?: string;
  grade?: string;
}

// ==================== 表单字段类型 ====================

/**
 * 基础表单字段（用于简单场景）
 */
export interface FormField {
  vModel: string;
  label: string;
  tag: string;
  required?: boolean;
  options?: FormFieldOption[];
  placeholder?: string;
  type?: string;
}

/**
 * 完整的表单字段模式（用于动态表单渲染）
 * 扩展自基础 FormField，添加更多配置选项
 */
export interface FormFieldSchema extends FormField {
  // 输入类型
  tag: 'el-input' | 'el-textarea' | 'el-radio-group' | 'el-checkbox-group' | 'upload' | string;
  type?: 'text' | 'textarea' | 'password' | 'email' | 'phone';

  // 输入限制
  maxlength?: number;
  showWordLimit?: boolean;
  min?: number;
  max?: number;
  step?: number;

  // 状态
  readonly?: boolean;
  disabled?: boolean;
  clearable?: boolean;

  // 图标和修饰
  prepend?: string;
  append?: string;
  prefixIcon?: string;
  suffixIcon?: string;

  // 默认值
  defaultValue?: unknown;

  // 上传相关
  accept?: 'image' | 'video' | 'image,video' | 'file';
  limit?: number;

  // 颜色选择器
  colors?: string[];
  showAlpha?: boolean;

  // 开关
  activeText?: string;
  inactiveText?: string;

  // 评分
  allowHalf?: boolean;

  // 验证
  regList?: { pattern: string; message: string }[];

  // 日期格式
  format?: string;
}

// ==================== 表单状态类型 ====================

/**
 * 表单数据
 */
export type FormData = Record<string, unknown>;

/**
 * 表单错误
 */
export type FormErrors = Record<string, string>;

/**
 * 表单验证结果
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

// ==================== 工具函数 ====================

/**
 * 检查字段是否为空
 */
export function isFieldEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * 验证必填字段
 */
export function validateRequiredFields(
  fields: FormField[],
  data: FormData
): FormValidationResult {
  const errors: FormErrors = {};
  let isValid = true;

  fields.forEach(field => {
    if (field.required && isFieldEmpty(data[field.vModel])) {
      errors[field.vModel] = `${field.label}是必填项`;
      isValid = false;
    }
  });

  return { isValid, errors };
}
