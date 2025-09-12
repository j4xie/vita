// frontend-web/src/utils/textValidation.ts
// Web端独立的姓名验证工具 - 严格代码隔离，不共享App端文件

import { i18n } from './i18n';

/**
 * 中文汉字验证正则表达式
 * 匹配所有中文字符（包括繁体字）
 */
const CHINESE_REGEX = /^[\u4e00-\u9fff]+$/;

/**
 * 英文字母验证正则表达式
 * 只允许英文字母，不允许数字、空格、标点符号
 */
const ENGLISH_LETTERS_ONLY_REGEX = /^[a-zA-Z]+$/;

/**
 * 拼音映射表 - 常用汉字拼音转换
 */
const PINYIN_MAP: Record<string, string> = {
  // 百家姓常用姓氏
  '李': 'li', '王': 'wang', '张': 'zhang', '刘': 'liu',
  '陈': 'chen', '杨': 'yang', '赵': 'zhao', '黄': 'huang',
  '周': 'zhou', '吴': 'wu', '徐': 'xu', '孙': 'sun',
  '胡': 'hu', '朱': 'zhu', '高': 'gao', '林': 'lin',
  '何': 'he', '郭': 'guo', '马': 'ma', '罗': 'luo',
  '梁': 'liang', '宋': 'song', '郑': 'zheng', '谢': 'xie',
  '韩': 'han', '唐': 'tang', '冯': 'feng', '于': 'yu',
  '董': 'dong', '萧': 'xiao', '程': 'cheng', '柴': 'chai',
  '袁': 'yuan', '邓': 'deng', '许': 'xu', '傅': 'fu',
  '沈': 'shen', '曾': 'zeng', '彭': 'peng', '吕': 'lv',
  '苏': 'su', '卢': 'lu', '蒋': 'jiang', '蔡': 'cai',
  '贾': 'jia', '丁': 'ding', '魏': 'wei', '薛': 'xue',
  '叶': 'ye', '阎': 'yan', '余': 'yu', '潘': 'pan',
  '杜': 'du', '戴': 'dai', '夏': 'xia', '钟': 'zhong',
  '汪': 'wang', '田': 'tian', '任': 'ren', '姜': 'jiang',
  '范': 'fan', '方': 'fang', '石': 'shi', '姚': 'yao',
  '谭': 'tan', '廖': 'liao', '邹': 'zou', '熊': 'xiong',
  
  // 常用名字字符
  '伟': 'wei', '芳': 'fang', '娜': 'na', '敏': 'min',
  '静': 'jing', '丽': 'li', '强': 'qiang', '磊': 'lei',
  '军': 'jun', '洋': 'yang', '勇': 'yong', '艳': 'yan',
  '杰': 'jie', '娟': 'juan', '涛': 'tao', '明': 'ming',
  '超': 'chao', '秀': 'xiu', '霞': 'xia', '平': 'ping',
  '刚': 'gang', '桂': 'gui', '英': 'ying', '华': 'hua',
  '玉': 'yu', '梅': 'mei', '鹏': 'peng', '辉': 'hui',
  '婷': 'ting', '雷': 'lei', '健': 'jian', '波': 'bo',
  '宁': 'ning', '福': 'fu', '亮': 'liang', '友': 'you',
  '佳': 'jia', '慧': 'hui', '红': 'hong', '萍': 'ping',
  '建': 'jian', '丹': 'dan', '燕': 'yan', '云': 'yun',
  '龙': 'long', '雪': 'xue', '文': 'wen', '琴': 'qin',
  '博': 'bo', '晨': 'chen', '阳': 'yang', '月': 'yue',
  '天': 'tian', '飞': 'fei', '心': 'xin', '鑫': 'xin',
  '欣': 'xin', '悦': 'yue', '晶': 'jing', '钰': 'yu',
  '琪': 'qi', '璐': 'lu', '瑶': 'yao', '萱': 'xuan',
  '睿': 'rui', '涵': 'han', '轩': 'xuan', '宇': 'yu',
  '浩': 'hao', '晓': 'xiao', '颖': 'ying', '婕': 'jie',
};

/**
 * 文本类型枚举
 */
export enum TextType {
  FIRST_NAME = 'firstName',     // 名字
  LAST_NAME = 'lastName',       // 姓氏
  COMMON_NAME = 'commonName'    // 常用名（英文昵称）
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 检查文本是否为中文字符
 */
export const isChineseCharacters = (text: string): boolean => {
  return CHINESE_REGEX.test(text.trim());
};

/**
 * 检查文本是否为纯英文字母
 */
export const isEnglishLettersOnly = (text: string): boolean => {
  return ENGLISH_LETTERS_ONLY_REGEX.test(text.trim());
};

/**
 * 将中文字符转换为拼音
 */
export const convertToPinyin = (chineseText: string): string => {
  return chineseText
    .split('')
    .map(char => PINYIN_MAP[char] || char.toLowerCase())
    .join('');
};

/**
 * 获取当前系统语言
 */
export const getCurrentLanguage = (): 'zh-CN' | 'en-US' => {
  return i18n.language as 'zh-CN' | 'en-US';
};

/**
 * 智能姓名验证函数
 * 根据系统语言和文本类型进行验证
 */
export const validateTextByLanguage = (
  text: string,
  textType: TextType,
  t: (key: string, options?: any) => string,
  currentLanguage?: string
): ValidationResult => {
  const lang = currentLanguage || getCurrentLanguage();
  const isChinese = lang === 'zh-CN';
  const trimmedText = text.trim();

  // 空值检查
  if (!trimmedText) {
    switch (textType) {
      case TextType.FIRST_NAME:
        return { isValid: false, errorMessage: t('validation.first_name_required') };
      case TextType.LAST_NAME:
        return { isValid: false, errorMessage: t('validation.last_name_required') };
      case TextType.COMMON_NAME:
        return { isValid: false, errorMessage: t('validation.common_name_required') };
      default:
        return { isValid: false, errorMessage: t('validation.field_required') };
    }
  }

  // 常用名验证：无论什么系统语言，都只能输入英文字母
  if (textType === TextType.COMMON_NAME) {
    if (!isEnglishLettersOnly(trimmedText)) {
      return {
        isValid: false,
        errorMessage: t('validation.common_name_letters_only')
      };
    }
    return { isValid: true };
  }

  // 姓名字段验证
  if (textType === TextType.FIRST_NAME || textType === TextType.LAST_NAME) {
    if (isChinese) {
      // 中文系统：只能输入中文
      if (!isChineseCharacters(trimmedText)) {
        return {
          isValid: false,
          errorMessage: t('validation.please_enter_chinese')
        };
      }
    }
    // 英文系统：可以输入中文或英文，不做限制
    return { isValid: true };
  }

  return { isValid: true };
};

/**
 * 创建实时验证处理器
 * 返回一个函数，用于处理文本变化时的验证
 */
export const createRealtimeValidator = (
  textType: TextType,
  onValidationChange: (result: ValidationResult) => void
) => {
  return (text: string, t: (key: string, options?: any) => string, currentLanguage?: string) => {
    const result = validateTextByLanguage(text, textType, t, currentLanguage);
    onValidationChange(result);
    return result;
  };
};

/**
 * 生成后端姓名数据
 * 根据是否是学生以及系统语言生成最终的后端数据
 */
export const generateBackendNameData = (
  firstName: string,
  lastName: string,
  commonName: string,
  isStudent: boolean
) => {
  if (!isStudent) {
    // 家长：简单拼接
    return {
      legalName: `${lastName.trim()} ${firstName.trim()}`.trim(),
      nickName: commonName.trim() || firstName.trim(),
    };
  }

  // 学生：复杂处理
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedCommonName = commonName.trim();

  // 生成法定姓名
  const legalName = `${trimmedLastName} ${trimmedFirstName}`.trim();

  // 生成昵称：常用名 + 空格 + 姓氏拼音
  let nickName = trimmedCommonName;
  if (isChineseCharacters(trimmedLastName)) {
    // 如果姓氏是中文，转换为拼音
    const lastNamePinyin = convertToPinyin(trimmedLastName);
    nickName = `${trimmedCommonName} ${lastNamePinyin}`.trim();
  } else {
    // 如果姓氏是英文，直接使用
    nickName = `${trimmedCommonName} ${trimmedLastName.toLowerCase()}`.trim();
  }

  return {
    legalName,
    nickName,
  };
};

/**
 * 验证表单所有姓名字段
 */
export const validateAllNameFields = (
  data: {
    firstName: string;
    lastName: string;
    commonName?: string;
  },
  t: (key: string, options?: any) => string,
  isStudent: boolean = true,
  currentLanguage?: string
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // 验证姓氏
  const lastNameResult = validateTextByLanguage(
    data.lastName,
    TextType.LAST_NAME,
    t,
    currentLanguage
  );
  if (!lastNameResult.isValid) {
    errors.lastName = lastNameResult.errorMessage!;
  }

  // 验证名字
  const firstNameResult = validateTextByLanguage(
    data.firstName,
    TextType.FIRST_NAME,
    t,
    currentLanguage
  );
  if (!firstNameResult.isValid) {
    errors.firstName = firstNameResult.errorMessage!;
  }

  // 验证常用名（仅学生需要）
  if (isStudent && data.commonName !== undefined) {
    const commonNameResult = validateTextByLanguage(
      data.commonName,
      TextType.COMMON_NAME,
      t,
      currentLanguage
    );
    if (!commonNameResult.isValid) {
      errors.commonName = commonNameResult.errorMessage!;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 获取字段验证状态
 * 用于控制按钮禁用状态
 */
export const getFieldValidationStatus = (
  data: {
    firstName: string;
    lastName: string;
    commonName?: string;
  },
  t: (key: string, options?: any) => string,
  isStudent: boolean = true,
  currentLanguage?: string
): boolean => {
  const validation = validateAllNameFields(data, t, isStudent, currentLanguage);
  return validation.isValid;
};