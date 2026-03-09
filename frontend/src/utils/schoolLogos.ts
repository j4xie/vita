export const schoolLogos = {
  ucd: require('../../assets/images/schools/ucd-logo.png'),
  ucb: require('../../assets/images/schools/ucb-logo.png'),
  ucsc: require('../../assets/images/schools/ucsc-logo.png'),
  usc: require('../../assets/images/schools/usc-logo.png'),
  ucla: require('../../assets/images/schools/ucla-logo.png'),
  uci: require('../../assets/images/schools/uci-logo.png'),
  ucsd: require('../../assets/images/schools/ucsd-logo.png'),
  umn: require('../../assets/images/schools/umn-logo.png'),
  uw: require('../../assets/images/schools/uw-logo.png'),
  ucsb: require('../../assets/images/schools/ucsb-logo.png'),
} as const;

export const getSchoolLogo = (schoolId: string) => {
  try {
    // 处理不同的学校ID格式
    let logoKey = schoolId?.toLowerCase();
    
    // 映射学校名称到logo键名
    const nameMapping: Record<string, keyof typeof schoolLogos> = {
      // 数字ID映射（完整覆盖）
      '210': 'ucd',
      '211': 'ucb', 
      '212': 'ucsc',
      '213': 'usc',
      '214': 'ucla',
      '215': 'uci',
      '216': 'ucsd',
      '217': 'umn',
      '218': 'uw',
      '219': 'ucsb', // 可能的ID变化
      '220': 'ucsb',
      '221': 'ucd', // 备用映射
      '222': 'ucla', // 备用映射
      // 名称映射
      'ucd': 'ucd',
      'ucb': 'ucb',
      'ucla': 'ucla',
      'usc': 'usc',
      'uci': 'uci',
      'ucsd': 'ucsd',
      'ucsb': 'ucsb',
      'ucsc': 'ucsc',
      'uw': 'uw',
      'umn': 'umn',
      // 添加更多可能的变体
      'berkeley': 'ucb',
      'davis': 'ucd',
      'irvine': 'uci',
      'losangeles': 'ucla',
      'sandiego': 'ucsd',
      'santabarbara': 'ucsb',
      'santacruz': 'ucsc',
      'southerncalifornia': 'usc',
      'minnesota': 'umn',
      'washington': 'uw',
    };
    
    const mappedKey = nameMapping[logoKey];
    return mappedKey ? schoolLogos[mappedKey] : null;
  } catch (error) {
    console.warn('获取学校logo失败:', error);
    return null;
  }
};

// 获取学校显示名称（用于无logo时的文字显示）
export const getSchoolDisplayName = (schoolId: string): string => {
  const nameMapping: Record<string, string> = {
    '210': 'UCD', '211': 'UCB', '212': 'UCSC', '213': 'USC',
    '214': 'UCLA', '215': 'UCI', '216': 'UCSD', '217': 'UMN', 
    '218': 'UW', '220': 'UCSB', '219': 'Berklee',
    'uw': 'UW', 'usc': 'USC', 'ucd': 'UCD', 'ucsc': 'UCSC',
    'ucla': 'UCLA', 'uci': 'UCI', 'ucsb': 'UCSB', 'umn': 'UMN',
    'ucsd': 'UCSD', 'ucb': 'UCB',
  };
  
  return nameMapping[schoolId?.toLowerCase()] || schoolId?.toUpperCase() || 'School';
};

/**
 * 从活动标题/地点文本中匹配学校，返回本地 bundled logo asset
 * 按缩写长度降序匹配，防止 "USC" 误匹配 "UCSC"
 */
const SCHOOL_TEXT_PATTERNS: { pattern: RegExp; key: keyof typeof schoolLogos }[] = [
  // 按缩写长度降序排列
  { pattern: /(?:^|[^a-z])ucsb(?:$|[^a-z])/i, key: 'ucsb' },
  { pattern: /(?:^|[^a-z])ucsc(?:$|[^a-z])/i, key: 'ucsc' },
  { pattern: /(?:^|[^a-z])ucsd(?:$|[^a-z])/i, key: 'ucsd' },
  { pattern: /(?:^|[^a-z])ucla(?:$|[^a-z])/i, key: 'ucla' },
  { pattern: /(?:^|[^a-z])ucb(?:$|[^a-z])/i, key: 'ucb' },
  { pattern: /(?:^|[^a-z])ucd(?:$|[^a-z])/i, key: 'ucd' },
  { pattern: /(?:^|[^a-z])uci(?:$|[^a-z])/i, key: 'uci' },
  { pattern: /(?:^|[^a-z])umn(?:$|[^a-z])/i, key: 'umn' },
  { pattern: /(?:^|[^a-z])usc(?:$|[^a-z])/i, key: 'usc' },
  { pattern: /(?:^|[^a-z])uw(?:$|[^a-z])/i, key: 'uw' },
  // 英文名匹配
  { pattern: /santa cruz/i, key: 'ucsc' },
  { pattern: /santa barbara/i, key: 'ucsb' },
  { pattern: /san diego/i, key: 'ucsd' },
  { pattern: /berkeley/i, key: 'ucb' },
  { pattern: /los angeles/i, key: 'ucla' },
  { pattern: /irvine/i, key: 'uci' },
  { pattern: /davis/i, key: 'ucd' },
  { pattern: /minnesota/i, key: 'umn' },
  { pattern: /washington/i, key: 'uw' },
  { pattern: /southern california/i, key: 'usc' },
];

export const getLocalSchoolLogo = (title: string, location?: string): number | null => {
  const text = `${title} ${location || ''}`;
  for (const { pattern, key } of SCHOOL_TEXT_PATTERNS) {
    if (pattern.test(text)) {
      return schoolLogos[key];
    }
  }
  return null;
};

/**
 * 通过 deptId 获取本地 bundled logo asset
 */
export const getLocalLogoByDeptId = (deptId: number): number | null => {
  const mapped = getSchoolLogo(deptId.toString());
  return mapped ?? null;
};

export default schoolLogos;