/**
 * 身份码扫描功能测试脚本
 * 用于验证身份码生成和解析功能是否正常工作
 */

// 模拟 React Native Base64 库
const Base64 = {
  encode: (str) => {
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    // 简单的 base64 编码实现
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
    // 简单的 base64 解码实现
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

// 调试日志函数
const debugLog = (message, data) => {
  console.log(`[测试] ${message}`, data || '');
};

// 组织信息映射
const ORGANIZATION_MAPPING = {
  1: {
    id: '1',
    name: 'Student Union',
    displayNameZh: '学联组织',
    displayNameEn: 'Student Union',
  },
  2: {
    id: '2', 
    name: 'Community',
    displayNameZh: '社团',
    displayNameEn: 'Student Community',
  }
};

// 学校信息映射
const SCHOOL_MAPPING = {
  210: { name: 'UCD', fullName: 'University of California, Davis' },
  211: { name: 'UCB', fullName: 'University of California, Berkeley' }
};

// 生成用户身份QR码内容（简化版本）
function generateUserQRContent(userData) {
  try {
    debugLog('🔧 开始生成用户身份码:', userData.userId);
    
    // 验证输入数据
    if (!userData) {
      throw new Error('用户数据不能为空');
    }
    
    if (!userData.userId || !userData.userName || !userData.legalName) {
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
    
    // 验证关键数据字段
    if (!qrData.type || qrData.type !== 'user_identity') {
      throw new Error('身份码类型设置错误');
    }

    // 生成JSON字符串
    const jsonString = JSON.stringify(qrData);
    debugLog('📝 JSON字符串长度:', jsonString.length);
    
    // 编码为base64格式
    const encodedString = encodeURIComponent(jsonString);
    debugLog('🔗 URL编码完成，长度:', encodedString.length);
    
    const base64Data = Base64.encode(encodedString);
    debugLog('🔐 Base64编码完成，长度:', base64Data.length);
    
    const finalCode = `VG_USER_${base64Data}`;
    
    debugLog('✅ 身份码生成成功:', {
      finalCodeLength: finalCode.length,
      finalCodePreview: finalCode.substring(0, 50) + '...'
    });
    
    return finalCode;
  } catch (error) {
    console.error('❌ 生成QR码内容失败:', error);
    return `VG_USER_ERROR_${userData?.userId || 'unknown'}_${Date.now()}`;
  }
}

// 解析用户身份QR码（简化版本）
function parseUserIdentityQR(qrData) {
  try {
    debugLog('🔍 开始解析用户身份码:', qrData?.substring(0, 50) + '...');
    
    if (!qrData || typeof qrData !== 'string') {
      debugLog('❌ QR数据为空或格式错误');
      return {
        isValid: false,
        error: 'QR码数据无效'
      };
    }

    if (!qrData.startsWith('VG_USER_')) {
      debugLog('❌ 非用户身份码格式, 实际格式:', qrData.substring(0, 20));
      return {
        isValid: false,
        error: '不是有效的用户身份码格式'
      };
    }

    const base64Data = qrData.replace('VG_USER_', '').trim();
    debugLog('🔑 提取的base64数据长度:', base64Data.length);
    
    if (!base64Data) {
      debugLog('❌ base64数据为空');
      return {
        isValid: false,
        error: '身份码数据为空'
      };
    }

    let encodedString;
    let jsonString;
    let userData;

    // 尝试使用Base64解码
    try {
      encodedString = Base64.decode(base64Data);
      debugLog('🗜️ Base64解码成功，长度:', encodedString.length);
    } catch (base64Error) {
      debugLog('⚠️ Base64解码失败:', base64Error);
      return {
        isValid: false,
        error: '身份码编码格式错误，无法解码'
      };
    }

    // 尝试URL解码
    try {
      jsonString = decodeURIComponent(encodedString);
      debugLog('📜 URL解码成功，长度:', jsonString.length);
    } catch (urlError) {
      debugLog('⚠️ URL解码失败，直接使用原字符串:', urlError);
      jsonString = encodedString;
    }

    // 尝试JSON解析
    try {
      userData = JSON.parse(jsonString);
      debugLog('✅ JSON解析成功:', {
        userId: userData.userId,
        userName: userData.userName,
        legalName: userData.legalName,
        type: userData.type
      });
    } catch (jsonError) {
      console.error('❌ JSON解析失败:', jsonError);
      debugLog('📝 原始JSON字符串:', jsonString.substring(0, 200) + '...');
      return {
        isValid: false,
        error: '身份码内容格式错误，无法解析JSON数据'
      };
    }

    // 验证数据结构
    if (!userData || typeof userData !== 'object') {
      debugLog('❌ 解析结果不是有效对象');
      return {
        isValid: false,
        error: '身份码数据结构错误'
      };
    }

    // 验证必要字段
    if (!userData.userId || !userData.userName || !userData.legalName) {
      debugLog('⚠️ 缺少必要字段:', {
        hasUserId: !!userData.userId,
        hasUserName: !!userData.userName,
        hasLegalName: !!userData.legalName,
        actualFields: Object.keys(userData)
      });
      return {
        isValid: false,
        error: '身份码缺少必要信息（用户ID、用户名或姓名）'
      };
    }

    // 验证数据类型
    if (userData.type !== 'user_identity') {
      debugLog('⚠️ 身份码类型不匹配:', userData.type);
      return {
        isValid: false,
        error: '不是用户身份码类型'
      };
    }

    debugLog('✨ 身份码解析完全成功!');
    return {
      isValid: true,
      data: userData
    };

  } catch (error) {
    console.error('❌ 解析过程发生未捕获异常:', error);
    return {
      isValid: false,
      error: `解析异常: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 创建测试用户数据
function createTestUserData() {
  return {
    userId: '12345',
    userName: 'testuser',
    legalName: '张三',
    nickName: 'Test User',
    email: 'testuser@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    studentId: '12345',
    deptId: '210',
    currentOrganization: ORGANIZATION_MAPPING[1],
    memberOrganizations: [{
      id: '1',
      role: 'member',
      isPrimary: true,
      joinedAt: new Date().toISOString(),
      status: 'active'
    }],
    school: {
      id: '210',
      name: SCHOOL_MAPPING[210].name,
      fullName: SCHOOL_MAPPING[210].fullName
    },
    position: {
      roleKey: 'common',
      roleName: '普通用户',
      displayName: '普通用户',
      displayNameEn: 'User',
      level: 'user'
    },
    type: 'user_identity'
  };
}

// 运行测试
function runTests() {
  console.log('🧪 开始身份码扫描功能测试...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // 测试1: 正常生成和解析
  console.log('📋 测试1: 正常身份码生成和解析');
  totalTests++;
  try {
    const testUser = createTestUserData();
    const generatedQR = generateUserQRContent(testUser);
    console.log('✅ QR码生成成功:', generatedQR.substring(0, 50) + '...');
    
    const parsedResult = parseUserIdentityQR(generatedQR);
    if (parsedResult.isValid && parsedResult.data) {
      console.log('✅ QR码解析成功:', {
        userId: parsedResult.data.userId,
        userName: parsedResult.data.userName,
        legalName: parsedResult.data.legalName
      });
      passedTests++;
    } else {
      console.log('❌ QR码解析失败:', parsedResult.error);
    }
  } catch (error) {
    console.log('❌ 测试1异常:', error.message);
  }
  console.log('');
  
  // 测试2: 错误格式测试
  console.log('📋 测试2: 错误格式处理');
  totalTests++;
  const invalidQRs = [
    'INVALID_FORMAT',
    'VG_USER_',
    'VG_USER_INVALID_BASE64',
    'VG_OTHER_12345'
  ];
  
  let errorTestPassed = true;
  for (const invalidQR of invalidQRs) {
    const result = parseUserIdentityQR(invalidQR);
    if (result.isValid) {
      console.log('❌ 应该识别为无效但返回有效:', invalidQR);
      errorTestPassed = false;
    } else {
      console.log('✅ 正确识别为无效:', invalidQR, '-', result.error);
    }
  }
  
  if (errorTestPassed) {
    passedTests++;
    console.log('✅ 错误格式测试通过');
  } else {
    console.log('❌ 错误格式测试失败');
  }
  console.log('');
  
  // 测试3: 缺少字段测试
  console.log('📋 测试3: 缺少必要字段处理');
  totalTests++;
  try {
    const incompleteUser = {
      userId: '12345',
      userName: '', // 缺少用户名
      legalName: '张三',
      type: 'user_identity'
    };
    
    const generatedQR = generateUserQRContent(incompleteUser);
    console.log('⚠️ 不完整数据生成的QR码:', generatedQR.substring(0, 50) + '...');
    
    if (generatedQR.startsWith('VG_USER_ERROR_')) {
      console.log('✅ 正确处理了不完整数据');
      passedTests++;
    } else {
      console.log('❌ 应该返回错误码但没有');
    }
  } catch (error) {
    console.log('✅ 正确捕获了不完整数据异常:', error.message);
    passedTests++;
  }
  console.log('');
  
  // 测试4: 大数据测试
  console.log('📋 测试4: 大数据处理');
  totalTests++;
  try {
    const bigUser = createTestUserData();
    // 添加大量数据
    bigUser.description = 'A'.repeat(500); // 添加大量描述
    bigUser.extraData = Array(100).fill({ key: 'value', data: 'test'.repeat(10) });
    
    const generatedQR = generateUserQRContent(bigUser);
    console.log('📊 大数据QR码长度:', generatedQR.length);
    
    if (generatedQR.includes('VG_USER_SIMPLE_') || generatedQR.length < 2000) {
      console.log('✅ 正确处理了大数据（使用简化格式或保持合理长度）');
      passedTests++;
    } else {
      console.log('❌ 大数据处理可能有问题，QR码过长');
    }
  } catch (error) {
    console.log('❌ 大数据测试异常:', error.message);
  }
  console.log('');
  
  // 输出测试结果
  console.log('🎯 测试结果汇总:');
  console.log(`📊 通过测试: ${passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！身份码扫描功能工作正常');
  } else {
    console.log('⚠️ 部分测试失败，需要进一步检查');
  }
  
  return { passedTests, totalTests };
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateUserQRContent,
    parseUserIdentityQR,
    runTests,
    createTestUserData
  };
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.IdentityQRTest = {
    generateUserQRContent,
    parseUserIdentityQR,
    runTests,
    createTestUserData
  };
}

// 自动运行测试
console.log('🚀 身份码扫描功能测试脚本已加载');
console.log('💡 运行 runTests() 开始测试');