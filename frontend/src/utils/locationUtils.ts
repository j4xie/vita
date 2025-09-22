/**
 * 地理位置工具类
 * 用于处理学校定位、距离计算、活动排序等功能
 */

export interface SchoolCoordinate {
  lat: number;
  lng: number;
  keywords: string[];
  state: string;
  city: string;
}

export interface LocationInfo {
  school?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  source?: 'gps' | 'manual' | 'userSchool';
}

// 所有学校的GPS坐标和关键词
export const SCHOOL_COORDINATES: Record<string, SchoolCoordinate> = {
  'UCI': {
    lat: 33.6405,
    lng: -117.8443,
    keywords: ['UCI', 'UC Irvine', 'Irvine', '欧文', '尔湾'],
    state: 'CA',
    city: 'Irvine'
  },
  'UCLA': {
    lat: 34.0689,
    lng: -118.4452,
    keywords: ['UCLA', 'UC Los Angeles', '洛杉矶加大', '洛加大'],
    state: 'CA',
    city: 'Los Angeles'
  },
  'USC': {
    lat: 34.0224,
    lng: -118.2851,
    keywords: ['USC', 'Southern California', '南加大', '南加州'],
    state: 'CA',
    city: 'Los Angeles'
  },
  'UCSD': {
    lat: 32.8801,
    lng: -117.2340,
    keywords: ['UCSD', 'UC San Diego', '圣地亚哥', '圣地牙哥', 'CU', 'CU总部'],
    state: 'CA',
    city: 'San Diego'
  },
  'UCB': {
    lat: 37.8716,
    lng: -122.2727,
    keywords: ['UCB', 'UC Berkeley', 'Berkeley', '伯克利', '柏克莱'],
    state: 'CA',
    city: 'Berkeley'
  },
  'UCSB': {
    lat: 34.4140,
    lng: -119.8489,
    keywords: ['UCSB', 'UC Santa Barbara', '圣塔芭芭拉', '圣巴巴拉'],
    state: 'CA',
    city: 'Santa Barbara'
  },
  'UCSC': {
    lat: 36.9914,
    lng: -122.0609,
    keywords: ['UCSC', 'UC Santa Cruz', '圣克鲁兹', '圣塔克鲁兹'],
    state: 'CA',
    city: 'Santa Cruz'
  },
  'UCD': {
    lat: 38.5382,
    lng: -121.7617,
    keywords: ['UCD', 'UC Davis', 'Davis', '戴维斯', '戴维思'],
    state: 'CA',
    city: 'Davis'
  },
  'NYU': {
    lat: 40.7295,
    lng: -73.9965,
    keywords: ['NYU', 'New York University', '纽约大学', '纽大'],
    state: 'NY',
    city: 'New York'
  },
  'UW': {
    lat: 47.6553,
    lng: -122.3035,
    keywords: ['UW', 'University of Washington', 'Washington', '华盛顿大学', '华大'],
    state: 'WA',
    city: 'Seattle'
  },
  'UMN': {
    lat: 44.9778,
    lng: -93.2650,
    keywords: ['UMN', 'Minnesota', '明尼苏达', '明大'],
    state: 'MN',
    city: 'Minneapolis'
  },
  'Rutgers': {
    lat: 40.5008,
    lng: -74.4474,
    keywords: ['Rutgers', '罗格斯', '罗格斯大学'],
    state: 'NJ',
    city: 'New Brunswick'
  },
  'Berklee': {
    lat: 42.3468,
    lng: -71.0870,
    keywords: ['Berklee', '伯克利音乐学院', 'Berklee Music'],
    state: 'MA',
    city: 'Boston'
  },
  'Cornell': {
    lat: 42.4534,
    lng: -76.4735,
    keywords: ['Cornell', 'Cornell University', 'CU', 'Ithaca', '康奈尔', '康乃尔', '伊萨卡'],
    state: 'NY',
    city: 'Ithaca'
  },
  // CU 映射到 UCSD（用于匹配 "CU总部" 等）
  'CU': {
    lat: 32.8801,
    lng: -117.2340,
    keywords: ['CU', 'CU总部', 'UCSD', 'UC San Diego', '圣地亚哥', '圣地牙哥'],
    state: 'CA',
    city: 'San Diego'
  },
  'CU总部': {
    lat: 32.8801,
    lng: -117.2340,
    keywords: ['CU总部', 'CU', 'UCSD', 'UC San Diego', '圣地亚哥', '圣地牙哥'],
    state: 'CA',
    city: 'San Diego'
  }
};

// 城市坐标接口
export interface CityCoordinate {
  lat: number;
  lng: number;
  state: string;
  schools?: string[]; // 该城市的学校列表
}

// 城市GPS坐标库
export const CITY_COORDINATES: Record<string, CityCoordinate> = {
  // 加州城市
  'Los Angeles': { lat: 34.0522, lng: -118.2437, state: 'CA', schools: ['UCLA', 'USC'] },
  'San Diego': { lat: 32.7157, lng: -117.1611, state: 'CA', schools: ['UCSD'] },
  'Irvine': { lat: 33.6846, lng: -117.8265, state: 'CA', schools: ['UCI'] },
  'Berkeley': { lat: 37.8716, lng: -122.2727, state: 'CA', schools: ['UCB'] },
  'Santa Barbara': { lat: 34.4208, lng: -119.6982, state: 'CA', schools: ['UCSB'] },
  'Santa Cruz': { lat: 36.9741, lng: -122.0308, state: 'CA', schools: ['UCSC'] },
  'Davis': { lat: 38.5449, lng: -121.7405, state: 'CA', schools: ['UCD'] },
  'San Francisco': { lat: 37.7749, lng: -122.4194, state: 'CA', schools: [] },
  'Oakland': { lat: 37.8044, lng: -122.2712, state: 'CA', schools: [] },
  'Sacramento': { lat: 38.5816, lng: -121.4944, state: 'CA', schools: [] },

  // 纽约州城市
  'New York': { lat: 40.7128, lng: -74.0060, state: 'NY', schools: ['NYU'] },
  'Ithaca': { lat: 42.4440, lng: -76.5019, state: 'NY', schools: ['Cornell'] },
  'Buffalo': { lat: 42.8864, lng: -78.8784, state: 'NY', schools: [] },
  'Rochester': { lat: 43.1566, lng: -77.6088, state: 'NY', schools: [] },
  'Albany': { lat: 42.6526, lng: -73.7562, state: 'NY', schools: [] },

  // 其他州主要城市
  'Seattle': { lat: 47.6062, lng: -122.3321, state: 'WA', schools: ['UW'] },
  'Minneapolis': { lat: 44.9778, lng: -93.2650, state: 'MN', schools: ['UMN'] },
  'New Brunswick': { lat: 40.4862, lng: -74.4518, state: 'NJ', schools: ['Rutgers'] },
  'Boston': { lat: 42.3601, lng: -71.0589, state: 'MA', schools: ['Berklee'] },
  'Chicago': { lat: 41.8781, lng: -87.6298, state: 'IL', schools: [] },
  'Philadelphia': { lat: 39.9526, lng: -75.1652, state: 'PA', schools: [] },
  'Pittsburgh': { lat: 40.4406, lng: -79.9959, state: 'PA', schools: [] },
  'Miami': { lat: 25.7617, lng: -80.1918, state: 'FL', schools: [] },
  'Atlanta': { lat: 33.7490, lng: -84.3880, state: 'GA', schools: [] },
  'Houston': { lat: 29.7604, lng: -95.3698, state: 'TX', schools: [] },
  'Dallas': { lat: 32.7767, lng: -96.7970, state: 'TX', schools: [] },
  'Austin': { lat: 30.2672, lng: -97.7431, state: 'TX', schools: [] },
  'Phoenix': { lat: 33.4484, lng: -112.0740, state: 'AZ', schools: [] },
  'Las Vegas': { lat: 36.1699, lng: -115.1398, state: 'NV', schools: [] },
  'Portland': { lat: 45.5152, lng: -122.6784, state: 'OR', schools: [] },
  'Denver': { lat: 39.7392, lng: -104.9903, state: 'CO', schools: [] },
  'Detroit': { lat: 42.3314, lng: -83.0458, state: 'MI', schools: [] },
  'Columbus': { lat: 39.9612, lng: -82.9988, state: 'OH', schools: [] },
  'Cleveland': { lat: 41.4993, lng: -81.6944, state: 'OH', schools: [] },
  'Cincinnati': { lat: 39.1031, lng: -84.5120, state: 'OH', schools: [] },
  'Milwaukee': { lat: 43.0389, lng: -87.9065, state: 'WI', schools: [] },
  'Madison': { lat: 43.0731, lng: -89.4012, state: 'WI', schools: [] },
  'Salt Lake City': { lat: 40.7608, lng: -111.8910, state: 'UT', schools: [] }
};

// 学校到城市的映射
export const SCHOOL_TO_CITY: Record<string, string> = {
  'UCI': 'Irvine',
  'UCLA': 'Los Angeles',
  'USC': 'Los Angeles',
  'UCSD': 'San Diego',
  'UCB': 'Berkeley',
  'UCSB': 'Santa Barbara',
  'UCSC': 'Santa Cruz',
  'UCD': 'Davis',
  'NYU': 'New York',
  'Cornell': 'Ithaca',
  'CU': 'San Diego', // CU 总部映射到 UCSD
  'UW': 'Seattle',
  'UMN': 'Minneapolis',
  'Rutgers': 'New Brunswick',
  'Berklee': 'Boston'
};

// 州的地理中心坐标（用于州级别的距离计算）
export const STATE_COORDINATES: Record<string, { lat: number; lng: number; neighbors: string[] }> = {
  'CA': { lat: 36.7783, lng: -119.4179, neighbors: ['OR', 'NV', 'AZ'] },
  'NY': { lat: 43.0000, lng: -75.0000, neighbors: ['NJ', 'CT', 'MA', 'PA', 'VT'] },
  'TX': { lat: 31.0000, lng: -100.0000, neighbors: ['NM', 'OK', 'AR', 'LA'] },
  'FL': { lat: 27.6648, lng: -81.5158, neighbors: ['GA', 'AL'] },
  'IL': { lat: 40.6331, lng: -89.3985, neighbors: ['WI', 'IN', 'IA', 'MO', 'KY'] },
  'PA': { lat: 41.2033, lng: -77.1945, neighbors: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'] },
  'OH': { lat: 40.4173, lng: -82.9071, neighbors: ['PA', 'WV', 'KY', 'IN', 'MI'] },
  'GA': { lat: 32.1656, lng: -82.9001, neighbors: ['FL', 'AL', 'TN', 'NC', 'SC'] },
  'NC': { lat: 35.7596, lng: -79.0193, neighbors: ['VA', 'TN', 'GA', 'SC'] },
  'MI': { lat: 44.3148, lng: -85.6024, neighbors: ['OH', 'IN', 'WI'] },
  'NJ': { lat: 40.0583, lng: -74.4057, neighbors: ['NY', 'PA', 'DE'] },
  'VA': { lat: 37.4316, lng: -78.6569, neighbors: ['MD', 'WV', 'KY', 'TN', 'NC'] },
  'WA': { lat: 47.7511, lng: -120.7401, neighbors: ['OR', 'ID'] },
  'AZ': { lat: 34.0489, lng: -111.0937, neighbors: ['CA', 'NV', 'UT', 'CO', 'NM'] },
  'MA': { lat: 42.4072, lng: -71.3824, neighbors: ['RI', 'CT', 'NH', 'VT', 'NY'] },
  'TN': { lat: 35.5175, lng: -86.5804, neighbors: ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'] },
  'IN': { lat: 40.2672, lng: -86.1349, neighbors: ['MI', 'OH', 'KY', 'IL'] },
  'MO': { lat: 37.9643, lng: -91.8318, neighbors: ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'] },
  'MD': { lat: 39.0458, lng: -76.6413, neighbors: ['PA', 'WV', 'VA', 'DE'] },
  'WI': { lat: 43.7844, lng: -88.7879, neighbors: ['MI', 'MN', 'IA', 'IL'] },
  'CO': { lat: 39.5501, lng: -105.7821, neighbors: ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'] },
  'MN': { lat: 46.7296, lng: -94.6859, neighbors: ['WI', 'IA', 'SD', 'ND'] },
  'SC': { lat: 33.8361, lng: -81.1637, neighbors: ['NC', 'GA'] },
  'AL': { lat: 32.3182, lng: -86.9023, neighbors: ['TN', 'GA', 'FL', 'MS'] },
  'LA': { lat: 30.9843, lng: -91.9623, neighbors: ['TX', 'AR', 'MS'] },
  'KY': { lat: 37.8393, lng: -84.2700, neighbors: ['IN', 'OH', 'WV', 'VA', 'TN', 'MO', 'IL'] },
  'OR': { lat: 43.8041, lng: -120.5542, neighbors: ['WA', 'ID', 'NV', 'CA'] },
  'OK': { lat: 35.0078, lng: -97.0929, neighbors: ['KS', 'MO', 'AR', 'TX', 'NM', 'CO'] },
  'CT': { lat: 41.6032, lng: -73.0877, neighbors: ['MA', 'RI', 'NY'] },
  'UT': { lat: 39.3210, lng: -111.0937, neighbors: ['ID', 'WY', 'CO', 'AZ', 'NV'] },
  'NV': { lat: 38.8026, lng: -116.4194, neighbors: ['OR', 'ID', 'UT', 'AZ', 'CA'] }
};

/**
 * 使用Haversine公式计算两个GPS坐标之间的距离
 * @param lat1 第一个点的纬度
 * @param lon1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lon2 第二个点的经度
 * @returns 距离（单位：公里）
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // 地球半径（公里）
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * 根据GPS坐标找到最近的学校
 * @param lat 纬度
 * @param lng 经度
 * @returns 最近的学校代码和距离
 */
export const findNearestSchool = (lat: number, lng: number): { school: string; distance: number } | null => {
  let minDistance = Infinity;
  let nearestSchool = null;

  for (const [schoolCode, coords] of Object.entries(SCHOOL_COORDINATES)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestSchool = schoolCode;
    }
  }

  // 如果最近的学校距离超过50km，可能不是在学校附近
  if (minDistance > 50) {
    return null;
  }

  return { school: nearestSchool, distance: minDistance };
};

/**
 * 根据GPS坐标找到最近的城市
 * @param lat 纬度
 * @param lng 经度
 * @returns 最近的城市信息
 */
export const findNearestCity = (lat: number, lng: number): {
  city: string;
  state: string;
  school?: string;
  distance: number;
} | null => {
  let minDistance = Infinity;
  let nearestCity = null;

  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = cityName;
    }
  }

  // 如果最近的城市距离超过100km，不自动选择
  if (!nearestCity || minDistance > 100) {
    return null;
  }

  const cityInfo = CITY_COORDINATES[nearestCity];
  return {
    city: nearestCity,
    state: cityInfo.state,
    school: cityInfo.schools?.[0], // 如果该城市有学校，返回第一个
    distance: minDistance
  };
};

/**
 * 从活动标题获取活动的地理位置
 * @param activityTitle 活动标题
 * @returns 活动的地理位置信息
 */
export const getActivityLocation = (activityTitle: string): {
  school?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
} | null => {
  // 1. 从标题提取学校
  const schoolCode = extractSchoolFromTitle(activityTitle);
  console.log('🏫 [活动识别]', {
    活动标题: activityTitle,
    识别出的学校: schoolCode
  });

  if (!schoolCode) return null;

  // 2. 获取学校对应的城市
  const cityName = SCHOOL_TO_CITY[schoolCode];
  if (!cityName) return null;

  // 3. 获取城市信息
  const cityInfo = CITY_COORDINATES[cityName];
  if (!cityInfo) return null;

  const result = {
    school: schoolCode,
    city: cityName,
    state: cityInfo.state,
    lat: cityInfo.lat,
    lng: cityInfo.lng
  };

  console.log('📍 [位置信息]', {
    活动标题: activityTitle,
    位置结果: result
  });

  return result;
};

/**
 * 从活动标题中识别学校
 * @param title 活动标题
 * @param schoolCode 学校代码（可以是字符串或对象）
 * @returns 是否匹配
 */
export const matchSchool = (title: string, schoolCode: string | object | undefined): boolean => {
  if (!schoolCode || !title) return false;

  // 处理对象类型的学校信息（如 {id: "223", name: "CU总部"}）
  let schoolStr: string | undefined;
  if (typeof schoolCode === 'object') {
    schoolStr = (schoolCode as any).name;
    // 如果对象的name字段还包含"总部"等后缀，尝试提取学校代码
    if (schoolStr && schoolStr.includes('总部')) {
      // 例如 "CU总部" -> "CU"
      schoolStr = schoolStr.replace('总部', '').trim();
    }
  } else {
    schoolStr = schoolCode;
  }

  // 特殊处理：如果学校是CU总部或CU，映射到UCSD
  if (schoolStr === 'CU总部' || schoolStr === 'CU') {
    console.log('🔄 [CU映射] 将CU总部/CU映射到UCSD进行匹配');
    schoolStr = 'UCSD';
  }

  if (!schoolStr) return false;

  const school = SCHOOL_COORDINATES[schoolStr];
  if (!school) return false;

  const titleLower = title.toLowerCase();
  return school.keywords.some(keyword =>
    titleLower.includes(keyword.toLowerCase())
  );
};

/**
 * 增强版学校匹配 - 支持标题、地址和地理位置匹配
 * @param activity 活动对象（包含标题和地址）
 * @param schoolCode 学校代码
 * @returns 是否匹配选中的学校
 */
export const matchSchoolEnhanced = (
  activity: { title?: string; location?: string },
  schoolCode: string | object | undefined
): boolean => {
  if (!schoolCode || !activity) return false;

  // 处理对象类型的学校信息
  let schoolStr: string | undefined;
  if (typeof schoolCode === 'object') {
    schoolStr = (schoolCode as any).name;
    if (schoolStr && schoolStr.includes('总部')) {
      schoolStr = schoolStr.replace('总部', '').trim();
    }
  } else {
    schoolStr = schoolCode;
  }

  // 特殊处理：如果学校是CU总部或CU，映射到UCSD
  if (schoolStr === 'CU总部' || schoolStr === 'CU') {
    console.log('🔄 [增强匹配-CU映射] 将CU总部/CU映射到UCSD进行匹配');
    schoolStr = 'UCSD';
  }

  if (!schoolStr) return false;

  const school = SCHOOL_COORDINATES[schoolStr];
  if (!school) return false;

  console.log('🔍 [增强匹配]', {
    活动: activity.title,
    地址: activity.location,
    目标学校: schoolStr,
    学校城市: school.city,
    学校关键词: school.keywords
  });

  // 1. 优先匹配活动标题
  const title = activity.title || '';
  const titleLower = title.toLowerCase();
  const titleMatch = school.keywords.some(keyword =>
    titleLower.includes(keyword.toLowerCase())
  );

  if (titleMatch) {
    console.log('✅ [标题匹配] 匹配成功:', title);
    return true;
  }

  // 2. 匹配活动地址
  const address = activity.location || '';
  const addressLower = address.toLowerCase();

  // 检查地址中是否包含学校关键词
  const addressSchoolMatch = school.keywords.some(keyword =>
    addressLower.includes(keyword.toLowerCase())
  );

  if (addressSchoolMatch) {
    console.log('✅ [地址学校匹配] 匹配成功:', address);
    return true;
  }

  // 3. 检查地址中是否包含学校所在城市
  const cityMatch = addressLower.includes(school.city.toLowerCase());

  if (cityMatch) {
    console.log('✅ [城市匹配] 匹配成功:', {
      地址: address,
      学校城市: school.city
    });
    return true;
  }

  // 4. 检查是否包含城市的中文名称或别名
  const cityKeywords: Record<string, string[]> = {
    'Los Angeles': ['洛杉矶', 'la', 'los angeles', '洛杉磯'],
    'Irvine': ['尔湾', '欧文', 'irvine', '爾灣'],
    'San Diego': ['圣地亚哥', 'san diego', '聖地亞哥'],
    'Berkeley': ['伯克利', 'berkeley', '柏克萊'],
    'Santa Barbara': ['圣塔芭芭拉', '圣巴巴拉', 'santa barbara', '聖塔芭芭拉'],
    'New York': ['纽约', 'new york', 'ny', 'nyc', '紐約'],
    'Ithaca': ['伊萨卡', 'ithaca', '伊薩卡'],
    'Seattle': ['西雅图', 'seattle', '西雅圖'],
    'Boston': ['波士顿', 'boston', '波士頓']
  };

  const cityAliases = cityKeywords[school.city] || [];
  const cityAliasMatch = cityAliases.some(alias =>
    addressLower.includes(alias.toLowerCase())
  );

  if (cityAliasMatch) {
    console.log('✅ [城市别名匹配] 匹配成功:', {
      地址: address,
      匹配的别名: cityAliases.find(alias => addressLower.includes(alias.toLowerCase()))
    });
    return true;
  }

  console.log('❌ [匹配失败]', {
    活动: title,
    地址: address,
    目标学校: schoolStr,
    学校城市: school.city,
    检查的关键词: [...school.keywords, ...cityAliases]
  });

  return false;
};

/**
 * 提取活动标题中的学校信息
 * @param title 活动标题
 * @returns 学校代码或null
 */
export const extractSchoolFromTitle = (title: string): string | null => {
  if (!title) return null;

  const titleLower = title.toLowerCase();

  for (const [schoolCode, school] of Object.entries(SCHOOL_COORDINATES)) {
    const matched = school.keywords.some(keyword =>
      titleLower.includes(keyword.toLowerCase())
    );
    if (matched) {
      return schoolCode;
    }
  }

  return null;
};

/**
 * 计算活动到用户位置的距离权重
 * @param activityTitle 活动标题
 * @param userLocation 用户位置信息
 * @returns 距离权重（越小越近）
 */
export const calculateActivityDistanceWeight = (
  activityTitle: string,
  userLocation: LocationInfo | null
): number => {
  if (!userLocation) return 1000; // 没有位置信息，权重最低

  // 提取活动的学校信息
  const activitySchool = extractSchoolFromTitle(activityTitle);
  if (!activitySchool) return 999; // 活动没有学校信息

  const activityCoords = SCHOOL_COORDINATES[activitySchool];
  if (!activityCoords) return 998; // 找不到学校坐标

  // 如果用户位置有GPS坐标，计算实际距离
  if (userLocation.lat && userLocation.lng) {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      activityCoords.lat,
      activityCoords.lng
    );

    // 转换距离为权重
    if (distance < 10) return 1;      // 同一个学校/城市（<10km）
    if (distance < 50) return 10;     // 临近城市（<50km）
    if (distance < 200) return 20;    // 同一地区（<200km）
    if (distance < 500) return 50;    // 同一州（<500km）
    return 100 + Math.floor(distance / 100); // 远距离
  }

  // 如果只有学校/城市信息，使用简化的权重
  if (userLocation.school === activitySchool) return 1;
  if (userLocation.city === activityCoords.city) return 10;
  if (userLocation.state === activityCoords.state) return 30;

  // 检查是否是邻近州
  const userState = userLocation.state;
  if (userState && STATE_COORDINATES[userState]) {
    const neighbors = STATE_COORDINATES[userState].neighbors;
    if (neighbors.includes(activityCoords.state)) {
      return 60; // 邻近州
    }
  }

  return 200; // 其他地区
};

/**
 * 检查活动是否已结束
 */
const isActivityEnded = (activity: any): boolean => {
  const now = new Date();

  // 尝试不同的时间字段
  let endTimeStr = activity.endDate || activity.date || activity.activityTime;

  // 如果没有时间信息，默认为未结束
  if (!endTimeStr) {
    console.log('⚠️ [过期检查] 活动无时间信息:', activity.title);
    return false;
  }

  let endTime: Date;

  // 如果有 endDate 字段，这通常是只有日期的字符串（如 "2024-08-21"）
  if (activity.endDate) {
    // 对于日期字符串，需要设置为当天的 23:59:59 才算活动结束
    if (activity.endDate.length === 10 && activity.endDate.includes('-')) {
      // 格式如 "2024-08-21"，添加时间到一天的结束
      endTime = new Date(activity.endDate + ' 23:59:59');
    } else {
      // 如果已经包含时间信息，直接解析
      endTime = new Date(activity.endDate);
    }
  } else {
    // 使用其他时间字段
    endTime = new Date(endTimeStr);
  }

  // 检查时间是否有效
  if (isNaN(endTime.getTime())) {
    console.log('⚠️ [过期检查] 无效的时间格式:', endTimeStr, '活动:', activity.title);
    return false;
  }

  const isEnded = endTime < now;

  // 详细日志：显示每个活动的过期判断
  console.log('🕐 [过期检查]', {
    活动: activity.title,
    使用的时间字段: endTimeStr,
    原始endDate: activity.endDate,
    解析后时间: endTime.toLocaleString('zh-CN'),
    当前时间: now.toLocaleString('zh-CN'),
    是否过期: isEnded
  });

  return isEnded;
};

/**
 * 计算活动学校与选中学校的距离
 * @param activity 活动对象
 * @param selectedSchool 选中的学校代码
 * @returns 距离（公里），如果无法计算返回999999
 */
const calculateDistanceToSelectedSchool = (activity: any, selectedSchool: string): number => {
  // 处理特殊学校映射
  let mappedSchool = selectedSchool;
  if (selectedSchool === 'CU总部' || selectedSchool === 'CU') {
    // CU总部使用自己的坐标条目
    mappedSchool = selectedSchool;
  }

  // 获取选中学校的坐标
  const selectedSchoolCoords = SCHOOL_COORDINATES[mappedSchool];
  if (!selectedSchoolCoords) {
    console.warn('🚫 [距离计算] 选中学校坐标未找到:', selectedSchool, '映射后:', mappedSchool);
    return 999999;
  }

  // 方法1: 首先尝试提取活动的学校信息
  const activitySchool = extractSchoolFromTitle(activity.title);
  if (activitySchool) {
    const activitySchoolCoords = SCHOOL_COORDINATES[activitySchool];
    if (activitySchoolCoords) {
      // 计算学校间距离
      const distance = calculateDistance(
        selectedSchoolCoords.lat,
        selectedSchoolCoords.lng,
        activitySchoolCoords.lat,
        activitySchoolCoords.lng
      );

      console.log('📏 [距离计算-学校]', {
        活动: activity.title.substring(0, 20) + '...',
        活动学校: activitySchool,
        选中学校: selectedSchool,
        距离: `${distance.toFixed(1)}km`
      });

      return distance;
    }
  }

  // 方法2: 如果无法从标题提取学校，尝试使用地址信息
  const activityLocation = getActivityLocation(activity.title);
  if (activityLocation?.lat && activityLocation?.lng) {
    const distance = calculateDistance(
      selectedSchoolCoords.lat,
      selectedSchoolCoords.lng,
      activityLocation.lat,
      activityLocation.lng
    );

    console.log('📏 [距离计算-位置]', {
      活动: activity.title.substring(0, 20) + '...',
      活动位置: activityLocation,
      选中学校: selectedSchool,
      距离: `${distance.toFixed(1)}km`
    });

    return distance;
  }

  // 方法3: 尝试通过活动地址中的城市信息来估算距离
  if (activity.location) {
    for (const [cityName, cityCoords] of Object.entries(CITY_COORDINATES)) {
      const cityKeywords = [cityName.toLowerCase()];

      if (cityKeywords.some(keyword =>
        activity.location.toLowerCase().includes(keyword)
      )) {
        const distance = calculateDistance(
          selectedSchoolCoords.lat,
          selectedSchoolCoords.lng,
          cityCoords.lat,
          cityCoords.lng
        );

        console.log('📏 [距离计算-城市]', {
          活动: activity.title.substring(0, 20) + '...',
          活动地址: activity.location,
          匹配城市: cityName,
          选中学校: selectedSchool,
          距离: `${distance.toFixed(1)}km`
        });

        return distance;
      }
    }
  }

  // 最后: 无法确定位置，返回中等距离而不是超大距离
  // 这样这些活动会按其他因素（如时间、用户学校）排序
  console.log('⚠️ [距离计算-默认]', {
    活动: activity.title.substring(0, 20) + '...',
    地址: activity.location,
    选中学校: selectedSchool,
    使用默认距离: '500km'
  });

  return 500; // 使用中等距离，而不是999999
};

/**
 * 排序活动（通用函数，用于排序非选中学校的活动）
 * 注意：选中学校的活动已在主函数中处理，这里只处理其他活动
 */
const sortActiveActivities = (
  activities: any[],
  userSchool: string | object | undefined,
  currentLocation: LocationInfo | null
): any[] => {
  if (activities.length === 0) return activities;

  // 修复：处理userSchool可能是对象的情况
  const userSchoolStr = typeof userSchool === 'object'
    ? (userSchool as any)?.name
    : userSchool;

  console.log('🔄 [活动排序] 开始排序非选中学校活动', {
    活动数量: activities.length,
    原始用户学校: userSchool,
    处理后用户学校: userSchoolStr,
    当前位置: currentLocation
  });

  return activities.sort((a, b) => {
    // 1. 优先：如果有选中学校，按距离选中学校的远近排序
    if (currentLocation?.school) {
      const aDist = calculateDistanceToSelectedSchool(a, currentLocation.school);
      const bDist = calculateDistanceToSelectedSchool(b, currentLocation.school);

      // 如果距离差异明显（>5km），按距离排序
      if (Math.abs(aDist - bDist) > 5) {
        console.log('🎯 [距离排序] 按选中学校距离排序:', {
          活动A: a.title.substring(0, 15) + '...',
          活动B: b.title.substring(0, 15) + '...',
          距离A: `${aDist.toFixed(1)}km`,
          距离B: `${bDist.toFixed(1)}km`,
          选中学校: currentLocation.school
        });
        return aDist - bDist;
      }
    }

    // 2. 备用：用户学校活动优先（处理CU总部特殊情况）
    if (userSchoolStr) {
      // 如果用户学校是CU总部，映射到UCSD进行匹配
      const mappedUserSchool = userSchoolStr === 'CU总部' ? 'UCSD' : userSchoolStr;

      const aIsUserSchool = matchSchoolEnhanced(a, mappedUserSchool);
      const bIsUserSchool = matchSchoolEnhanced(b, mappedUserSchool);

      if (aIsUserSchool && !bIsUserSchool) return -1;
      if (!aIsUserSchool && bIsUserSchool) return 1;

      // 同为用户学校活动，按时间排序（最近的在前）
      if (aIsUserSchool && bIsUserSchool) {
        const aTime = new Date(a.startTime || a.date || a.activityTime).getTime();
        const bTime = new Date(b.startTime || b.date || b.activityTime).getTime();
        return aTime - bTime;
      }
    }

    // 3. 备用：按GPS距离排序
    if (currentLocation?.lat && currentLocation?.lng) {
      const aLoc = getActivityLocation(a.title);
      const bLoc = getActivityLocation(b.title);

      if (aLoc?.lat && aLoc?.lng && bLoc?.lat && bLoc?.lng) {
        const aDist = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          aLoc.lat, aLoc.lng
        );
        const bDist = calculateDistance(
          currentLocation.lat, currentLocation.lng,
          bLoc.lat, bLoc.lng
        );

        // 如果距离差异明显，按距离排序
        if (Math.abs(aDist - bDist) > 10) {
          return aDist - bDist;
        }
      }
    } else if (currentLocation?.city) {
      // 只有城市信息，比较城市级别
      const aLoc = getActivityLocation(a.title);
      const bLoc = getActivityLocation(b.title);

      if (aLoc && bLoc) {
        // 同城市优先
        const aSameCity = aLoc.city === currentLocation.city;
        const bSameCity = bLoc.city === currentLocation.city;
        if (aSameCity && !bSameCity) return -1;
        if (!aSameCity && bSameCity) return 1;

        // 同州优先
        const aSameState = aLoc.state === currentLocation.state;
        const bSameState = bLoc.state === currentLocation.state;
        if (aSameState && !bSameState) return -1;
        if (!aSameState && bSameState) return 1;
      }
    }

    // 3. 距离相同或无法计算距离时，按时间排序
    const aTime = new Date(a.startTime || a.date || a.activityTime).getTime();
    const bTime = new Date(b.startTime || b.date || b.activityTime).getTime();
    return aTime - bTime;
  });
};

/**
 * 排序已结束的活动（选中学校优先，然后按距离排序）
 */
const sortEndedActivities = (
  activities: any[],
  userSchool: string | object | undefined,
  currentLocation: LocationInfo | null
): any[] => {
  if (activities.length === 0) return activities;

  console.log('📋 [已过期活动排序] 开始排序', {
    活动数量: activities.length,
    选中学校: currentLocation?.school
  });

  return activities.sort((a, b) => {
    // 1. 如果有选中学校，选中学校的过期活动优先
    if (currentLocation?.school) {
      const selectedSchool = currentLocation.school;

      const aIsSelected = matchSchoolEnhanced(a, selectedSchool);
      const bIsSelected = matchSchoolEnhanced(b, selectedSchool);

      console.log('🎯 [过期活动-学校匹配]', {
        活动A: a.title.substring(0, 15) + '...',
        活动B: b.title.substring(0, 15) + '...',
        A是选中学校: aIsSelected,
        B是选中学校: bIsSelected,
        选中学校: selectedSchool
      });

      if (aIsSelected && !bIsSelected) return -1;
      if (!aIsSelected && bIsSelected) return 1;

      // 如果都是选中学校或都不是，按距离排序
      const aDist = calculateDistanceToSelectedSchool(a, selectedSchool);
      const bDist = calculateDistanceToSelectedSchool(b, selectedSchool);

      if (Math.abs(aDist - bDist) > 5) {
        return aDist - bDist;
      }
    }

    // 2. 备用：按时间排序（最近结束的在前）
    const aTime = new Date(a.startTime || a.date || a.activityTime).getTime();
    const bTime = new Date(b.startTime || b.date || b.activityTime).getTime();
    return bTime - aTime; // 倒序，最近的在前
  });
};

/**
 * 对活动列表进行地理位置排序（完整复杂版）
 * @param activities 活动列表
 * @param userSchool 用户归属学校
 * @param currentLocation 当前位置
 * @returns 排序后的活动列表
 */
export const sortActivitiesByLocation = (
  activities: any[],
  userSchool: string | object | undefined,
  currentLocation: LocationInfo | null
): any[] => {
  if (!activities || activities.length === 0) return activities;

  // 修复：处理userSchool可能是对象的情况
  const userSchoolStr = typeof userSchool === 'object'
    ? (userSchool as any)?.name
    : userSchool;

  console.log('🎯 [活动排序] 开始复杂排序', {
    总活动数: activities.length,
    处理后用户学校: userSchoolStr,
    当前位置学校: currentLocation?.school
  });

  // Step 1: 分离已结束和未结束的活动
  const activeActivities: any[] = [];
  const endedActivities: any[] = [];

  activities.forEach(activity => {
    if (isActivityEnded(activity)) {
      endedActivities.push(activity);
    } else {
      activeActivities.push(activity);
    }
  });

  console.log('📊 [活动分离]', {
    未结束活动: activeActivities.length,
    已结束活动: endedActivities.length
  });

  // Step 2: 如果用户选择了特定学校，进一步分组
  if (currentLocation?.school) {
    const selectedSchool = currentLocation.school;

    console.log('🏫 [学校分组] 选中学校:', selectedSchool);

    // 分离选中学校的活动 - 使用增强匹配
    const selectedActiveActivities = activeActivities.filter(activity =>
      matchSchoolEnhanced(activity, selectedSchool)
    );
    const otherActiveActivities = activeActivities.filter(activity =>
      !matchSchoolEnhanced(activity, selectedSchool)
    );

    const selectedEndedActivities = endedActivities.filter(activity =>
      matchSchoolEnhanced(activity, selectedSchool)
    );
    const otherEndedActivities = endedActivities.filter(activity =>
      !matchSchoolEnhanced(activity, selectedSchool)
    );

    console.log('📋 [分组结果]', {
      选中学校未结束: selectedActiveActivities.length,
      其他未结束: otherActiveActivities.length,
      选中学校已结束: selectedEndedActivities.length,
      其他已结束: otherEndedActivities.length
    });

    // Step 3: 对每组分别排序
    const sortedSelectedActive = sortActiveActivities(selectedActiveActivities, userSchoolStr, currentLocation);
    const sortedOtherActive = sortActiveActivities(otherActiveActivities, userSchoolStr, currentLocation);
    const sortedSelectedEnded = sortEndedActivities(selectedEndedActivities, userSchoolStr, currentLocation);
    const sortedOtherEnded = sortEndedActivities(otherEndedActivities, userSchoolStr, currentLocation);

    // Step 4: 按优先级合并（时间优先：未过期 → 已过期）
    const finalResult = [
      ...sortedSelectedActive,  // 组1: 选中学校的未结束活动
      ...sortedOtherActive,     // 组2: 其他学校的未结束活动（按距离排序）
      ...sortedSelectedEnded,   // 组3: 选中学校的已结束活动
      ...sortedOtherEnded       // 组4: 其他学校的已结束活动（按距离排序）
    ];

    console.log('✅ [排序完成] 最终分组结果（时间优先）:', {
      组1_选中学校未结束: sortedSelectedActive.length,
      组2_其他未结束: sortedOtherActive.length,
      组3_选中学校已结束: sortedSelectedEnded.length,
      组4_其他已结束: sortedOtherEnded.length,
      选中学校: selectedSchool,
      总计: finalResult.length,
      分组逻辑: '未过期优先，已过期次之'
    });

    return finalResult;
  }

  // 没有选中学校，只分离已结束/未结束
  console.log('📝 [简单分组] 没有选中学校，只按结束状态分组');

  const sortedActiveActivities = sortActiveActivities(activeActivities, userSchoolStr, currentLocation);
  const sortedEndedActivities = sortEndedActivities(endedActivities, userSchoolStr, currentLocation);

  const finalResult = [
    ...sortedActiveActivities,  // 未结束活动优先
    ...sortedEndedActivities    // 已结束活动在后
  ];

  console.log('✅ [排序完成] 简单分组结果:', {
    未结束活动: sortedActiveActivities.length,
    已结束活动: sortedEndedActivities.length,
    总计: finalResult.length
  });

  return finalResult;
};

/**
 * 根据州代码获取州名
 */
export const getStateName = (stateCode: string): string => {
  const stateNames: Record<string, string> = {
    'CA': 'California',
    'NY': 'New York',
    'TX': 'Texas',
    'FL': 'Florida',
    'IL': 'Illinois',
    'PA': 'Pennsylvania',
    'OH': 'Ohio',
    'GA': 'Georgia',
    'NC': 'North Carolina',
    'MI': 'Michigan',
    'NJ': 'New Jersey',
    'VA': 'Virginia',
    'WA': 'Washington',
    'AZ': 'Arizona',
    'MA': 'Massachusetts',
    'TN': 'Tennessee',
    'IN': 'Indiana',
    'MO': 'Missouri',
    'MD': 'Maryland',
    'WI': 'Wisconsin',
    'CO': 'Colorado',
    'MN': 'Minnesota',
    'SC': 'South Carolina',
    'AL': 'Alabama',
    'LA': 'Louisiana',
    'KY': 'Kentucky',
    'OR': 'Oregon',
    'OK': 'Oklahoma',
    'CT': 'Connecticut',
    'UT': 'Utah',
    'NV': 'Nevada'
  };
  return stateNames[stateCode] || stateCode;
};