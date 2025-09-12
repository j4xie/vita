import { TFunction } from 'react-i18next';
import { isChinese } from './i18n';

// 简单拼音映射表 (常用汉字)
const PINYIN_MAP: { [key: string]: string } = {
  // 常见姓氏
  '李': 'li', '王': 'wang', '张': 'zhang', '刘': 'liu', '陈': 'chen', '杨': 'yang', '赵': 'zhao', '黄': 'huang',
  '周': 'zhou', '吴': 'wu', '徐': 'xu', '孙': 'sun', '胡': 'hu', '朱': 'zhu', '高': 'gao', '林': 'lin',
  '何': 'he', '郭': 'guo', '马': 'ma', '罗': 'luo', '梁': 'liang', '宋': 'song', '郑': 'zheng', '谢': 'xie',
  '韩': 'han', '唐': 'tang', '冯': 'feng', '于': 'yu', '董': 'dong', '萧': 'xiao', '程': 'cheng', '曹': 'cao',
  '袁': 'yuan', '邓': 'deng', '许': 'xu', '傅': 'fu', '沈': 'shen', '曾': 'zeng', '彭': 'peng', '吕': 'lv',
  
  // 常见名字
  '明': 'ming', '华': 'hua', '强': 'qiang', '伟': 'wei', '军': 'jun', '杰': 'jie', '涛': 'tao', '超': 'chao',
  '勇': 'yong', '磊': 'lei', '鹏': 'peng', '飞': 'fei', '辉': 'hui', '斌': 'bin', '亮': 'liang', '峰': 'feng',
  '宇': 'yu', '洋': 'yang', '博': 'bo', '浩': 'hao', '天': 'tian', '宁': 'ning', '凯': 'kai', '龙': 'long',
  '文': 'wen', '武': 'wu', '康': 'kang', '安': 'an', '乐': 'le', '欣': 'xin', '雪': 'xue', '晨': 'chen',
  '静': 'jing', '丽': 'li', '美': 'mei', '娜': 'na', '芳': 'fang', '敏': 'min', '婷': 'ting', '颖': 'ying',
  '慧': 'hui', '琳': 'lin', '萍': 'ping', '红': 'hong', '燕': 'yan', '玲': 'ling', '莉': 'li', '雅': 'ya',
  
  // 其他常用字
  '中': 'zhong', '国': 'guo', '人': 'ren', '大': 'da', '小': 'xiao', '学': 'xue', '生': 'sheng', '老': 'lao',
  '师': 'shi', '好': 'hao', '你': 'ni', '我': 'wo', '他': 'ta', '她': 'ta', '它': 'ta', '们': 'men',
  '的': 'de', '了': 'le', '在': 'zai', '是': 'shi', '不': 'bu', '有': 'you', '这': 'zhe', '个': 'ge',
  '上': 'shang', '下': 'xia', '来': 'lai', '去': 'qu', '出': 'chu', '看': 'kan', '时': 'shi', '年': 'nian',
  '月': 'yue', '日': 'ri', '今': 'jin', '明': 'ming', '昨': 'zuo', '早': 'zao', '晚': 'wan', '现': 'xian'
};

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// 文本类型枚举
export enum TextType {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  NICKNAME = 'nickname',
  COMMON_NAME = 'commonName'
}

// 中文字符检测正则 (完整Unicode范围)
const CHINESE_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+$/;

// 英文字符检测正则 (只允许字母)
const ENGLISH_REGEX = /^[a-zA-Z]+$/;

// 英文字母和数字但不允许标点符号和空格的正则
const ENGLISH_ALPHANUMERIC_ONLY_REGEX = /^[a-zA-Z]+$/;

/**
 * 验证中文文本
 * @param text 待验证文本
 * @param t 翻译函数
 * @param minLength 最小长度，默认1
 * @param maxLength 最大长度，默认10
 */
export const validateChineseText = (
  text: string, 
  t: TFunction,
  minLength: number = 1,
  maxLength: number = 10
): ValidationResult => {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      message: t('validation.name_required')
    };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < minLength) {
    return {
      isValid: false,
      message: t('validation.name_too_short', { min: minLength })
    };
  }

  if (trimmedText.length > maxLength) {
    return {
      isValid: false,
      message: t('validation.name_too_long', { max: maxLength })
    };
  }

  if (!CHINESE_REGEX.test(trimmedText)) {
    return {
      isValid: false,
      message: t('validation.chinese_only')
    };
  }

  return { isValid: true };
};

/**
 * 验证英文文本
 * @param text 待验证文本
 * @param t 翻译函数
 * @param minLength 最小长度，默认1
 * @param maxLength 最大长度，默认20
 */
export const validateEnglishText = (
  text: string, 
  t: TFunction,
  minLength: number = 1,
  maxLength: number = 20
): ValidationResult => {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      message: t('validation.name_required')
    };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < minLength) {
    return {
      isValid: false,
      message: t('validation.name_too_short', { min: minLength })
    };
  }

  if (trimmedText.length > maxLength) {
    return {
      isValid: false,
      message: t('validation.name_too_long', { max: maxLength })
    };
  }

  if (!ENGLISH_REGEX.test(trimmedText)) {
    return {
      isValid: false,
      message: t('validation.english_letters_only')
    };
  }

  return { isValid: true };
};

/**
 * 验证常用名（英文字母，不允许标点符号和空格）
 * @param text 待验证文本
 * @param t 翻译函数
 */
export const validateCommonName = (text: string, t: TFunction): ValidationResult => {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      message: t('validation.common_name_required')
    };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < 2) {
    return {
      isValid: false,
      message: t('validation.common_name_too_short')
    };
  }

  if (trimmedText.length > 20) {
    return {
      isValid: false,
      message: t('validation.common_name_too_long')
    };
  }

  if (!ENGLISH_ALPHANUMERIC_ONLY_REGEX.test(trimmedText)) {
    return {
      isValid: false,
      message: t('validation.common_name_letters_only')
    };
  }

  return { isValid: true };
};

/**
 * 简单拼音转换函数
 * @param chineseText 中文文本
 * @returns 拼音字符串
 */
export const convertToPinyin = (chineseText: string): string => {
  if (!chineseText) return '';
  
  let pinyin = '';
  for (let i = 0; i < chineseText.length; i++) {
    const char = chineseText[i];
    const pinyinChar = PINYIN_MAP[char];
    if (pinyinChar) {
      pinyin += pinyinChar;
    } else {
      // 如果找不到对应拼音，尝试使用字符的Unicode值生成
      const code = char.charCodeAt(0);
      if (code >= 0x4e00 && code <= 0x9fff) {
        // 对于未映射的中文字符，使用简化处理
        pinyin += `char${code}`;
      } else {
        pinyin += char.toLowerCase();
      }
    }
  }
  return pinyin;
};

/**
 * 检测文本是否包含中文字符
 * @param text 待检测文本
 */
export const containsChinese = (text: string): boolean => {
  if (!text) return false;
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text);
};

/**
 * 检测文本是否全为英文字符
 * @param text 待检测文本
 */
export const isAllEnglish = (text: string): boolean => {
  if (!text) return false;
  return ENGLISH_REGEX.test(text.trim());
};

/**
 * 基于系统语言的智能验证函数
 * @param text 待验证文本
 * @param textType 文本类型
 * @param t 翻译函数
 * @param currentLanguage 当前语言，可选
 */
export const validateTextByLanguage = (
  text: string,
  textType: TextType,
  t: TFunction,
  currentLanguage?: string
): ValidationResult => {
  const isChineseSystem = isChinese(currentLanguage);
  
  switch (textType) {
    case TextType.FIRST_NAME:
    case TextType.LAST_NAME:
      if (isChineseSystem) {
        // 中文系统：姓名只能是中文
        return validateChineseText(text, t, 1, 10);
      } else {
        // 英文系统：姓名可以是中文或英文
        const trimmedText = text?.trim() || '';
        if (!trimmedText) {
          return {
            isValid: false,
            message: t('validation.name_required')
          };
        }
        
        // 检测是否包含中文
        if (containsChinese(trimmedText)) {
          return validateChineseText(text, t, 1, 10);
        } else {
          return validateEnglishText(text, t, 1, 20);
        }
      }
    
    case TextType.COMMON_NAME:
      // 常用名始终要求英文字母（无论系统语言）
      return validateCommonName(text, t);
    
    case TextType.NICKNAME:
      // 昵称可以是中文或英文
      const trimmedText = text?.trim() || '';
      if (!trimmedText) {
        return {
          isValid: false,
          message: t('validation.nickname_required')
        };
      }
      
      if (containsChinese(trimmedText)) {
        return validateChineseText(text, t, 1, 20);
      } else {
        return validateEnglishText(text, t, 1, 50);
      }
    
    default:
      return {
        isValid: false,
        message: t('validation.invalid_text_type')
      };
  }
};

/**
 * 生成用于后端的姓名数据
 * @param firstName 名
 * @param lastName 姓
 * @param commonName 常用名（可选）
 * @param isStudent 是否为学生
 */
export const generateBackendNameData = (
  firstName: string,
  lastName: string,
  commonName?: string,
  isStudent: boolean = true
): {
  legalName: string;
  nickName: string;
  displayName: string;
} => {
  const trimmedFirstName = firstName?.trim() || '';
  const trimmedLastName = lastName?.trim() || '';
  const trimmedCommonName = commonName?.trim() || '';
  
  // 生成法定姓名
  const legalName = `${trimmedLastName} ${trimmedFirstName}`.trim();
  
  // 为学生生成显示名称和昵称
  if (isStudent && trimmedCommonName) {
    // 学生有常用名：常用名 + 姓氏拼音
    const lastNamePinyin = convertToPinyin(trimmedLastName);
    const nickName = `${trimmedCommonName} ${lastNamePinyin}`.trim();
    const displayName = trimmedCommonName; // 显示名称使用常用名
    
    return {
      legalName,
      nickName,
      displayName
    };
  } else {
    // 家长或无常用名：使用法定姓名
    return {
      legalName,
      nickName: legalName,
      displayName: legalName
    };
  }
};

/**
 * 格式化姓名显示
 * @param firstName 名
 * @param lastName 姓
 * @param commonName 常用名（可选）
 * @param preferCommonName 是否优先显示常用名
 */
export const formatNameDisplay = (
  firstName: string,
  lastName: string,
  commonName?: string,
  preferCommonName: boolean = true
): string => {
  const trimmedFirstName = firstName?.trim() || '';
  const trimmedLastName = lastName?.trim() || '';
  const trimmedCommonName = commonName?.trim() || '';
  
  if (preferCommonName && trimmedCommonName) {
    return trimmedCommonName;
  }
  
  return `${trimmedLastName}${trimmedFirstName}`;
};

/**
 * 输入字符过滤函数 - 防止输入不符合规则的字符
 */

/**
 * 过滤只允许中文字符的输入
 * @param text 用户输入的文本
 * @returns 过滤后只包含中文字符的文本
 */
export const filterChineseOnly = (text: string): string => {
  if (!text) return '';
  // 只保留中文字符，移除其他字符
  return text.replace(/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, '');
};

/**
 * 过滤只允许英文字母的输入
 * @param text 用户输入的文本
 * @returns 过滤后只包含英文字母的文本
 */
export const filterEnglishOnly = (text: string): string => {
  if (!text) return '';
  // 只保留英文字母，移除数字、标点符号、空格等
  return text.replace(/[^a-zA-Z]/g, '');
};

/**
 * 基于系统语言的智能输入过滤
 * @param text 用户输入的文本
 * @param textType 文本类型
 * @param currentLanguage 当前语言，可选
 * @returns 过滤后的文本
 */
export const filterTextByLanguage = (
  text: string,
  textType: TextType,
  currentLanguage?: string
): string => {
  if (!text) return '';
  
  const isChineseSystem = isChinese(currentLanguage);
  
  switch (textType) {
    case TextType.FIRST_NAME:
    case TextType.LAST_NAME:
      if (isChineseSystem) {
        // 中文系统：只允许中文字符
        return filterChineseOnly(text);
      } else {
        // 英文系统：允许中文或英文，但不允许数字和特殊字符
        return text.replace(/[^a-zA-Z\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, '');
      }
    
    case TextType.COMMON_NAME:
      // 常用名始终只允许英文字母
      return filterEnglishOnly(text);
    
    case TextType.NICKNAME:
      // 昵称允许中英文，但不允许特殊符号
      return text.replace(/[^a-zA-Z\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff0-9]/g, '');
    
    default:
      return text;
  }
};

/**
 * 实时验证函数 - 在用户输入时提供即时反馈
 */

/**
 * 创建实时验证处理器（不过滤输入，只验证）
 * @param textType 文本类型
 * @param onValidationChange 验证结果回调
 * @param currentLanguage 当前语言
 * @returns 处理输入变化的函数
 */
export const createRealtimeValidator = (
  textType: TextType,
  onValidationChange: (isValid: boolean, message?: string) => void,
  currentLanguage?: string
) => {
  return (text: string, t: TFunction): void => {
    // 验证输入文本（不过滤，保持原始输入）
    const validation = validateTextByLanguage(text, textType, t, currentLanguage);
    
    // 调用验证结果回调
    onValidationChange(validation.isValid, validation.message);
  };
};

/**
 * 获取输入提示文本
 * @param textType 文本类型
 * @param t 翻译函数
 * @param currentLanguage 当前语言
 * @returns 提示文本
 */
export const getInputPlaceholder = (
  textType: TextType,
  t: TFunction,
  currentLanguage?: string
): string => {
  const isChineseSystem = isChinese(currentLanguage);
  
  switch (textType) {
    case TextType.FIRST_NAME:
      return isChineseSystem 
        ? t('auth.register.form.first_name_placeholder_chinese', '请输入中文名字')
        : t('auth.register.form.first_name_placeholder', '请输入名字');
    
    case TextType.LAST_NAME:
      return isChineseSystem
        ? t('auth.register.form.last_name_placeholder_chinese', '请输入中文姓氏')
        : t('auth.register.form.last_name_placeholder', '请输入姓氏');
    
    case TextType.COMMON_NAME:
      return t('auth.register.form.common_name_placeholder', '请输入英文常用名（如：xiaoming）');
    
    case TextType.NICKNAME:
      return t('auth.register.form.nickname_placeholder', '请输入昵称');
    
    default:
      return '';
  }
};

// 导出所有验证函数
export {
  CHINESE_REGEX,
  ENGLISH_REGEX,
  ENGLISH_ALPHANUMERIC_ONLY_REGEX,
  PINYIN_MAP
};