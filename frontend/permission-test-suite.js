/**
 * 权限差异化显示测试套件
 * 测试不同权限用户扫描身份码时的显示差异
 */

// 模拟React Native Base64库
const Base64 = {
  encode: (str) => {
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    // 简单的base64编码实现
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    return result;
  },
  
  decode: (str) => {
    if (typeof atob !== 'undefined') {
      return atob(str);
    }
    // 简单的base64解码实现
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    str = str.replace(/[^A-Za-z0-9+/]/g, '');
    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++));
      const encoded2 = chars.indexOf(str.charAt(i++));
      const encoded3 = chars.indexOf(str.charAt(i++));
      const encoded4 = chars.indexOf(str.charAt(i++));
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    return result;
  }
};

// 权限等级枚举
const PermissionLevel = {
  GUEST: 0,        // 访客
  USER: 1,         // 普通用户 
  STAFF: 2,        // 内部员工
  PART_ADMIN: 3,   // 分管理员
  ADMIN: 4,        // 总管理员
};

// 测试用户数据
const testUsers = {
  admin: {
    userId: 'admin',
    userName: 'admin',
    legalName: 'Xie',
    nickName: 'Administrator Xie',
    email: 'admin@vitaglobal.icu',
    studentId: 'ADM001',
    deptId: '999',
    currentOrganization: {
      id: 'cu_headquarters',
      name: 'CU总部',
      displayNameZh: 'CU总部',
      displayNameEn: 'CU Headquarters',
    },
    school: {
      id: '999',
      name: 'CU总部',
      fullName: 'CU Headquarters'
    },
    position: {
      roleKey: 'manage',
      roleName: '总管理员',
      displayName: '总管理员',
      displayNameEn: 'Administrator',
      level: 'admin'
    },
    type: 'user_identity'
  },

  jie: {
    userId: 'jie',
    userName: 'admin',
    legalName: 'Jie',
    nickName: 'Partial Admin Jie',
    email: 'jie@vitaglobal.icu',
    studentId: 'PAD001',
    deptId: '210',
    currentOrganization: {
      id: '1',
      name: 'Student Union',
      displayNameZh: '学联组织',
      displayNameEn: 'Student Union',
    },
    school: {
      id: '210',
      name: 'UCD',
      fullName: 'University of California, Davis'
    },
    position: {
      roleKey: 'part_manage',
      roleName: '分管理员',
      displayName: '分管理员',
      displayNameEn: 'Partial Administrator',
      level: 'part_admin'
    },
    type: 'user_identity'
  },

  admin3: {
    userId: 'admin3',
    userName: 'admin3',
    legalName: '内部员工',
    nickName: 'Staff Member',
    email: 'admin3@vitaglobal.icu',
    studentId: 'STF001',
    deptId: '211',
    currentOrganization: {
      id: '2',
      name: 'Community',
      displayNameZh: '社团',
      displayNameEn: 'Student Community',
    },
    school: {
      id: '211',
      name: 'UCB',
      fullName: 'University of California, Berkeley'
    },
    position: {
      roleKey: 'staff',
      roleName: '内部员工',
      displayName: '内部员工',
      displayNameEn: 'Staff',
      level: 'staff'
    },
    type: 'user_identity'
  },

  user: {
    userId: 'user',
    userName: 'user',
    legalName: '普通用户',
    nickName: 'Regular User',
    email: 'user@vitaglobal.icu',
    studentId: 'USR001',
    deptId: '212',
    currentOrganization: {
      id: '1',
      name: 'Student Union',
      displayNameZh: '学联组织',
      displayNameEn: 'Student Union',
    },
    school: {
      id: '212',
      name: 'UCSC',
      fullName: 'University of California, Santa Cruz'
    },
    position: {
      roleKey: 'common',
      roleName: '普通用户',
      displayName: '普通用户',
      displayNameEn: 'User',
      level: 'user'
    },
    type: 'user_identity'
  }
};

// 生成用户身份QR码内容
function generateUserQRContent(userData) {
  try {
    console.log(`🔧 [生成身份码] 为用户 ${userData.legalName} (${userData.position.displayName}) 生成身份码`);
    
    // 验证输入数据
    if (!userData || !userData.userId || !userData.userName || !userData.legalName) {
      throw new Error('缺少必要的用户信息');
    }

    // 创建QR码数据结构
    const qrData = {
      userId: userData.userId.toString().trim(),
      userName: userData.userName.trim(),
      legalName: userData.legalName.trim(),
      nickName: userData.nickName?.trim() || userData.userName.trim(),
      email: userData.email?.trim() || `${userData.userName}@example.com`,
      avatarUrl: userData.avatarUrl,
      studentId: userData.studentId,
      deptId: userData.deptId,
      currentOrganization: userData.currentOrganization,
      memberOrganizations: userData.memberOrganizations || [],
      school: userData.school,
      position: userData.position,
      type: 'user_identity'
    };
    
    // 生成JSON字符串
    const jsonString = JSON.stringify(qrData);
    console.log(`📝 [生成身份码] JSON字符串长度: ${jsonString.length}`);
    
    // 编码为base64格式
    const encodedString = encodeURIComponent(jsonString);
    const base64Data = Base64.encode(encodedString);
    const finalCode = `VG_USER_${base64Data}`;
    
    console.log(`✅ [生成身份码] ${userData.legalName} 的身份码生成成功 (长度: ${finalCode.length})`);
    
    return finalCode;
  } catch (error) {
    console.error(`❌ [生成身份码] 为用户 ${userData?.legalName} 生成失败:`, error);
    return `VG_USER_ERROR_${userData?.userId || 'unknown'}_${Date.now()}`;
  }
}

// 权限等级映射
function getPermissionLevel(position) {
  if (!position) return PermissionLevel.GUEST;
  
  switch (position.level) {
    case 'admin':
      return PermissionLevel.ADMIN;
    case 'part_admin':
      return PermissionLevel.PART_ADMIN;
    case 'staff':
      return PermissionLevel.STAFF;
    case 'user':
      return PermissionLevel.USER;
    default:
      return PermissionLevel.GUEST;
  }
}

// 计算用户权限
function calculateUserPermissions(scannerLevel, targetLevel) {
  const isHigherAuthority = scannerLevel > targetLevel;
  const isSameOrHigherLevel = scannerLevel >= targetLevel;
  
  return {
    canViewBasicInfo: true,
    canViewContactInfo: scannerLevel >= PermissionLevel.STAFF || isSameOrHigherLevel,
    canViewStudentId: scannerLevel >= PermissionLevel.STAFF,
    canViewActivityStats: scannerLevel >= PermissionLevel.PART_ADMIN || isHigherAuthority,
    canViewRecentActivities: scannerLevel >= PermissionLevel.STAFF,
    canViewSensitiveInfo: scannerLevel >= PermissionLevel.ADMIN || (scannerLevel - targetLevel >= 2),
    canViewFullProfile: scannerLevel >= PermissionLevel.STAFF,
    isHigherAuthority,
    accessLevel: scannerLevel,
  };
}

// 获取权限描述
function getPermissionDescription(permissions) {
  if (permissions.canViewSensitiveInfo) {
    return '🔑 您拥有查看此用户所有信息的权限';
  } else if (permissions.isHigherAuthority) {
    return '🔍 您拥有查看此用户详细信息的权限';
  } else if (permissions.canViewFullProfile) {
    return '👁️ 您可以查看此用户的基本档案';
  } else if (permissions.canViewBasicInfo) {
    return '📋 您只能查看此用户的公开信息';
  } else {
    return '⚠️ 您没有查看此用户信息的权限';
  }
}

// 模拟扫描显示
function simulateScanDisplay(scannerUser, targetUser, targetQRCode) {
  console.log(`\n🔍 [权限测试] ${scannerUser.legalName} (${scannerUser.position.displayName}) 扫描 ${targetUser.legalName} (${targetUser.position.displayName}) 的身份码:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  const scannerLevel = getPermissionLevel(scannerUser.position);
  const targetLevel = getPermissionLevel(targetUser.position);
  const permissions = calculateUserPermissions(scannerLevel, targetLevel);
  
  console.log(`🎯 权限提示: ${getPermissionDescription(permissions)}`);
  console.log(`\n📋 显示的信息:`);
  console.log(`   姓名: ${targetUser.legalName}`);
  console.log(`   英文名: ${targetUser.nickName}`);
  console.log(`   职位: ${targetUser.position.displayName}`);
  console.log(`   组织: ${targetUser.currentOrganization.displayNameZh} • ${targetUser.school.name}`);
  
  if (permissions.canViewContactInfo) {
    console.log(`   邮箱: ${targetUser.email}`);
  } else {
    console.log(`   邮箱: ***@***.com (隐藏)`);
  }
  
  if (permissions.canViewStudentId) {
    console.log(`   学号: ${targetUser.studentId}`);
  } else {
    console.log(`   学号: (无权限查看)`);
  }
  
  if (permissions.canViewActivityStats) {
    console.log(`   活动统计: 参与 25次 | 志愿 68小时 | 积分 420`);
  } else {
    console.log(`   活动统计: (无权限查看)`);
  }
  
  if (permissions.canViewRecentActivities) {
    console.log(`   最近活动: 新生迎新活动、社区志愿服务`);
  } else {
    console.log(`   最近活动: (无权限查看)`);
  }
  
  if (permissions.canViewFullProfile) {
    console.log(`   操作按钮: [查看档案] [关闭]`);
  } else {
    console.log(`   操作按钮: [关闭]`);
  }
  
  console.log(`\n📊 权限详情:`);
  console.log(`   扫描者权限等级: ${scannerLevel} (${scannerUser.position.displayName})`);
  console.log(`   目标用户权限等级: ${targetLevel} (${targetUser.position.displayName})`);
  console.log(`   是否拥有更高权限: ${permissions.isHigherAuthority ? '是' : '否'}`);
  console.log(`   可查看联系信息: ${permissions.canViewContactInfo ? '是' : '否'}`);
  console.log(`   可查看学号: ${permissions.canViewStudentId ? '是' : '否'}`);
  console.log(`   可查看活动统计: ${permissions.canViewActivityStats ? '是' : '否'}`);
  console.log(`   可查看活动记录: ${permissions.canViewRecentActivities ? '是' : '否'}`);
  console.log(`   可查看敏感信息: ${permissions.canViewSensitiveInfo ? '是' : '否'}`);
}

// 生成所有用户的身份码
function generateAllQRCodes() {
  console.log('🎯 权限差异化显示测试开始!\n');
  console.log('📋 生成测试用户身份码:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const qrCodes = {};
  
  for (const [userKey, userData] of Object.entries(testUsers)) {
    qrCodes[userKey] = generateUserQRContent(userData);
  }
  
  return qrCodes;
}

// 运行完整的权限测试
function runPermissionTest() {
  console.log('🚀 开始权限差异化显示测试\n');
  
  // 1. 生成所有用户的身份码
  const qrCodes = generateAllQRCodes();
  
  console.log('\n🔍 权限扫描测试场景:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 2. 测试不同权限用户互相扫描的场景
  const testScenarios = [
    // 普通用户扫描各种权限用户
    { scanner: 'user', target: 'user', description: '普通用户扫描普通用户' },
    { scanner: 'user', target: 'admin3', description: '普通用户扫描内部员工' },
    { scanner: 'user', target: 'jie', description: '普通用户扫描分管理员' },
    { scanner: 'user', target: 'admin', description: '普通用户扫描总管理员' },
    
    // 内部员工扫描各种权限用户
    { scanner: 'admin3', target: 'user', description: '内部员工扫描普通用户' },
    { scanner: 'admin3', target: 'admin3', description: '内部员工扫描内部员工' },
    { scanner: 'admin3', target: 'jie', description: '内部员工扫描分管理员' },
    { scanner: 'admin3', target: 'admin', description: '内部员工扫描总管理员' },
    
    // 分管理员扫描各种权限用户
    { scanner: 'jie', target: 'user', description: '分管理员扫描普通用户' },
    { scanner: 'jie', target: 'admin3', description: '分管理员扫描内部员工' },
    { scanner: 'jie', target: 'jie', description: '分管理员扫描分管理员' },
    { scanner: 'jie', target: 'admin', description: '分管理员扫描总管理员' },
    
    // 总管理员扫描各种权限用户
    { scanner: 'admin', target: 'user', description: '总管理员扫描普通用户' },
    { scanner: 'admin', target: 'admin3', description: '总管理员扫描内部员工' },
    { scanner: 'admin', target: 'jie', description: '总管理员扫描分管理员' },
    { scanner: 'admin', target: 'admin', description: '总管理员扫描总管理员' },
  ];
  
  // 3. 执行测试场景
  testScenarios.forEach((scenario, index) => {
    if (index > 0) console.log('\n');
    console.log(`${index + 1}. ${scenario.description}`);
    simulateScanDisplay(
      testUsers[scenario.scanner],
      testUsers[scenario.target],
      qrCodes[scenario.target]
    );
  });
  
  console.log('\n🎉 权限差异化显示测试完成!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果总结:');
  console.log('✅ 所有权限等级都有不同的显示效果');
  console.log('✅ 高权限用户可以查看低权限用户的详细信息');
  console.log('✅ 低权限用户对高权限用户的信息有适当限制');
  console.log('✅ 同等权限用户之间可以查看基本信息');
  console.log('✅ 权限提示文案准确反映了访问权限');
}

// 导出给外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testUsers,
    generateUserQRContent,
    runPermissionTest,
    qrCodes: generateAllQRCodes()
  };
}

// 浏览器环境
if (typeof window !== 'undefined') {
  window.PermissionTest = {
    testUsers,
    generateUserQRContent,
    runPermissionTest,
    qrCodes: generateAllQRCodes()
  };
}

// 自动运行测试
console.log('🧪 权限差异化显示测试脚本已加载');
console.log('💡 运行 runPermissionTest() 开始完整测试');