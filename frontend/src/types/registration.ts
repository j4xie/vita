// 注册表单数据类型定义

export interface RegistrationStep1Data {
  firstName: string; // 名
  lastName: string; // 姓
  phoneNumber: string; // 手机号
  selectedSchool: {
    id: string; // deptId
    name: string; // 学校名称
    abbreviation: string; // 学校缩写
    emailDomain: string; // 邮箱域名
  } | null;
  generatedEmail: string; // 生成的学校邮箱
}

export interface RegistrationStep2Data {
  email: string; // 完整邮箱地址
  userName: string; // 用户名
  nickName: string; // 昵称/英文名
  password: string; // 密码
  confirmPassword: string; // 确认密码
  verificationCode: string; // 手机验证码
  selectedOrganization: {
    id: number;
    name: string;
  } | null; // 选择的组织
  sex: '0' | '1' | '2'; // 性别：0-男 1-女 2-未知
}

export interface RegistrationFormData extends RegistrationStep1Data, RegistrationStep2Data {
  legalName: string; // 合并后的姓名
  deptId: number; // 学校ID
  orgId: number; // 组织ID
}

// 后端注册接口请求参数
export interface RegistrationAPIRequest {
  userName: string;
  legalName: string;
  nickName: string;
  password: string;
  phonenumber?: string; // 注意：后端字段名是 phonenumber（邀请码注册时可选）
  email?: string; // 邀请码注册时可选
  sex: string;
  deptId: number;
  verCode?: string; // 手机验证码（短信服务未配置时可选）
  invCode?: string; // 邀请码（邀请码注册时必填）
  bizId?: string; // 短信验证码接口返回的字段（短信服务未配置时可选）
  orgId?: number; // 组织ID
  area?: string; // 地理检测结果：'zh'-中国, 'en'-美国（只读，由系统检测）
  areaCode?: string; // 区号
}

// 组织数据类型
export interface OrganizationData {
  id: number;
  name: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

// 短信验证码接口响应
export interface SMSVerificationResponse {
  bizId: string;
  code: string;
  message: string;
  requestId: string;
}

// API响应基础类型
export interface APIResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

// 表单验证错误类型
export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  selectedSchool?: string;
  email?: string;
  userName?: string;
  nickName?: string;
  password?: string;
  confirmPassword?: string;
  verificationCode?: string;
  selectedOrganization?: string;
  terms?: string; // 服务条款同意验证
  sms?: string; // 短信通知同意验证
}

// 注册流程状态
export type RegistrationStep = 1 | 2;

export interface RegistrationState {
  currentStep: RegistrationStep;
  step1Data: RegistrationStep1Data;
  step2Data: RegistrationStep2Data;
  isLoading: boolean;
  errors: ValidationErrors;
  isSubmitting: boolean;
}