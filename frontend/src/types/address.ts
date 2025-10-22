/**
 * Address Type Definitions
 * 收货地址类型定义
 *
 * 基于后端API: /app/address/*
 */

/**
 * 收货地址
 */
export interface Address {
  /** 地址ID */
  id: number;
  /** 收件人姓名 */
  name: string;
  /** 国家/地区代码 (如 "86" 代表中国, "1" 代表美国) */
  intAreaCode: string;
  /** 手机号 */
  mobile: string;
  /** 地址（地图选取的地址） */
  address: string;
  /** 详细地址（精确到门牌号） */
  detailAddr?: string;
  /** 经度 */
  longitude?: string;
  /** 纬度 */
  latitude?: string;
  /** 是否默认地址: 1-是, -1-否 */
  isDefault: 1 | -1;
  /** 创建人ID */
  createById?: number;
  /** 创建人姓名 */
  createByName?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 添加/编辑地址的请求参数
 */
export interface AddressFormData {
  /** 地址ID (编辑时必传) */
  id?: number;
  /** 收件人姓名 */
  name: string;
  /** 国家/地区代码 */
  intAreaCode: string;
  /** 手机号 */
  mobile: string;
  /** 地址 */
  address: string;
  /** 详细地址 */
  detailAddr?: string;
  /** 经度 */
  longitude?: string;
  /** 纬度 */
  latitude?: string;
  /** 是否默认地址 */
  isDefault?: 1 | -1;
}

/**
 * 地址列表API响应
 */
export interface AddressListResponse {
  code: number;
  msg: string;
  pageNum: number;
  pageSize: number;
  total: number;
  totalPage: number;
  rows: Address[];
}

/**
 * 常用国家/地区代码
 */
export const COUNTRY_CODES = [
  { code: '1', name: 'United States', nameZh: '美国', flag: '🇺🇸' },
  { code: '86', name: 'China', nameZh: '中国', flag: '🇨🇳' },
  { code: '44', name: 'United Kingdom', nameZh: '英国', flag: '🇬🇧' },
  { code: '81', name: 'Japan', nameZh: '日本', flag: '🇯🇵' },
  { code: '82', name: 'South Korea', nameZh: '韩国', flag: '🇰🇷' },
  { code: '33', name: 'France', nameZh: '法国', flag: '🇫🇷' },
  { code: '49', name: 'Germany', nameZh: '德国', flag: '🇩🇪' },
  { code: '61', name: 'Australia', nameZh: '澳大利亚', flag: '🇦🇺' },
  { code: '65', name: 'Singapore', nameZh: '新加坡', flag: '🇸🇬' },
  { code: '852', name: 'Hong Kong', nameZh: '香港', flag: '🇭🇰' },
] as const;
