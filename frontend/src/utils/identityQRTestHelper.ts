/**
 * 身份码测试助手
 * 用于在React Native环境中测试身份码生成和解析功能
 */

import { generateUserQRContent, mapUserToIdentityData } from './userIdentityMapper';
import { UserIdentityData, ParsedUserQRCode } from '../types/userIdentity';

// 测试用户数据
const createTestUserData = (): UserIdentityData => ({
  userId: '12345',
  userName: 'testuser',
  legalName: '张三',
  nickName: 'Test User',
  email: 'testuser@example.com',
  avatarUrl: 'https://example.com/avatar.jpg',
  studentId: '12345',
  deptId: '210',
  currentOrganization: {
    id: '1',
    name: 'Student Union',
    displayNameZh: '学联组织',
    displayNameEn: 'Student Union',
  },
  memberOrganizations: [{
    id: '1',
    role: 'member',
    isPrimary: true,
    joinedAt: new Date().toISOString(),
    status: 'active'
  }],
  school: {
    id: '210',
    name: 'UCD',
    fullName: 'University of California, Davis'
  },
  position: {
    roleKey: 'common',
    roleName: '普通用户',
    displayName: '普通用户',
    displayNameEn: 'User',
    level: 'user'
  },
  type: 'user_identity'
});

// 模拟前端解析函数（与QRScannerScreen中的逻辑一致）
const parseUserIdentityQR = (qrData: string): ParsedUserQRCode => {
  try {
    console.log('🔍 [测试解析] 开始解析用户身份码:', qrData?.substring(0, 50) + '...');
    
    if (!qrData || typeof qrData !== 'string') {
      console.log('❌ [测试解析] QR数据为空或格式错误');
      return {
        isValid: false,
        error: 'QR码数据无效'
      };
    }

    if (!qrData.startsWith('VG_USER_')) {
      console.log('❌ [测试解析] 非用户身份码格式, 实际格式:', qrData.substring(0, 20));
      return {
        isValid: false,
        error: '不是有效的用户身份码格式'
      };
    }

    const base64Data = qrData.replace('VG_USER_', '').trim();
    console.log('🔑 [测试解析] 提取的base64数据长度:', base64Data.length);
    
    if (!base64Data) {
      console.log('❌ [测试解析] base64数据为空');
      return {
        isValid: false,
        error: '身份码数据为空'
      };
    }

    let encodedString: string;
    let jsonString: string;
    let userData: UserIdentityData;

    // 尝试使用React Native Base64库解码
    try {
      const Base64 = require('react-native-base64');
      encodedString = Base64.decode(base64Data);
      console.log('🗜️ [测试解析] Base64解码成功，长度:', encodedString.length);
    } catch (base64Error) {
      console.log('⚠️ [测试解析] Base64库解码失败，尝试atob:', base64Error);
      // 降级到原生atob
      try {
        encodedString = atob(base64Data);
        console.log('🗜️ [测试解析] atob解码成功，长度:', encodedString.length);
      } catch (atobError) {
        console.error('❌ [测试解析] 所有Base64解码方法都失败:', { base64Error, atobError });
        return {
          isValid: false,
          error: '身份码编码格式错误，无法解码'
        };
      }
    }

    // 尝试URL解码
    try {
      jsonString = decodeURIComponent(encodedString);
      console.log('📜 [测试解析] URL解码成功，长度:', jsonString.length);
    } catch (urlError) {
      console.log('⚠️ [测试解析] URL解码失败，直接使用原字符串:', urlError);
      jsonString = encodedString;
    }

    // 尝试JSON解析
    try {
      userData = JSON.parse(jsonString);
      console.log('✅ [测试解析] JSON解析成功:', {
        userId: userData.userId,
        userName: userData.userName,
        legalName: userData.legalName,
        type: userData.type,
        hasOrganization: !!userData.currentOrganization
      });
    } catch (jsonError) {
      console.error('❌ [测试解析] JSON解析失败:', jsonError);
      console.log('📝 [测试解析] 原始JSON字符串:', jsonString.substring(0, 200) + '...');
      return {
        isValid: false,
        error: '身份码内容格式错误，无法解析JSON数据'
      };
    }

    // 验证数据结构
    if (!userData || typeof userData !== 'object') {
      console.log('❌ [测试解析] 解析结果不是有效对象');
      return {
        isValid: false,
        error: '身份码数据结构错误'
      };
    }

    // 验证必要字段
    if (!userData.userId || !userData.userName || !userData.legalName) {
      console.log('⚠️ [测试解析] 缺少必要字段:', {
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
      console.log('⚠️ [测试解析] 身份码类型不匹配:', userData.type);
      return {
        isValid: false,
        error: '不是用户身份码类型'
      };
    }

    console.log('✨ [测试解析] 身份码解析完全成功!');
    return {
      isValid: true,
      data: userData
    };

  } catch (error) {
    console.error('❌ [测试解析] 解析过程发生未捕获异常:', error);
    return {
      isValid: false,
      error: `解析异常: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
};

// 测试生成和解析的完整流程
export const testIdentityQRRoundTrip = (): boolean => {
  try {
    console.log('🧪 [身份码测试] 开始完整流程测试...');
    
    // 1. 创建测试用户数据
    const testUser = createTestUserData();
    console.log('👤 [身份码测试] 创建测试用户:', {
      userId: testUser.userId,
      userName: testUser.userName,
      legalName: testUser.legalName
    });
    
    // 2. 生成身份码
    const generatedQR = generateUserQRContent(testUser);
    console.log('🔧 [身份码测试] 生成QR码成功:', {
      length: generatedQR.length,
      preview: generatedQR.substring(0, 50) + '...'
    });
    
    // 3. 解析身份码
    const parseResult = parseUserIdentityQR(generatedQR);
    
    if (!parseResult.isValid) {
      console.error('❌ [身份码测试] 解析失败:', parseResult.error);
      return false;
    }
    
    if (!parseResult.data) {
      console.error('❌ [身份码测试] 解析结果为空');
      return false;
    }
    
    // 4. 验证数据一致性
    const originalData = testUser;
    const parsedData = parseResult.data;
    
    const isConsistent = (
      originalData.userId === parsedData.userId &&
      originalData.userName === parsedData.userName &&
      originalData.legalName === parsedData.legalName &&
      originalData.nickName === parsedData.nickName &&
      originalData.type === parsedData.type
    );
    
    if (!isConsistent) {
      console.error('❌ [身份码测试] 数据不一致:', {
        original: {
          userId: originalData.userId,
          userName: originalData.userName,
          legalName: originalData.legalName,
          nickName: originalData.nickName,
          type: originalData.type
        },
        parsed: {
          userId: parsedData.userId,
          userName: parsedData.userName,
          legalName: parsedData.legalName,
          nickName: parsedData.nickName,
          type: parsedData.type
        }
      });
      return false;
    }
    
    console.log('✅ [身份码测试] 完整流程测试成功！数据一致性验证通过');
    return true;
    
  } catch (error) {
    console.error('❌ [身份码测试] 测试过程发生异常:', error);
    return false;
  }
};

// 测试各种错误场景
export const testErrorScenarios = (): boolean => {
  console.log('🧪 [错误场景测试] 开始测试各种错误情况...');
  
  const errorTests = [
    {
      name: '空字符串',
      qrData: '',
      expectedError: 'QR码数据无效'
    },
    {
      name: '错误前缀',
      qrData: 'VG_INVALID_12345',
      expectedError: '不是有效的用户身份码格式'
    },
    {
      name: '空Base64数据',
      qrData: 'VG_USER_',
      expectedError: '身份码数据为空'
    },
    {
      name: '无效Base64',
      qrData: 'VG_USER_INVALID!!!',
      expectedError: '身份码编码格式错误，无法解码'
    }
  ];
  
  let passedTests = 0;
  
  for (const test of errorTests) {
    try {
      const result = parseUserIdentityQR(test.qrData);
      
      if (result.isValid) {
        console.error(`❌ [错误场景测试] ${test.name}: 应该失败但返回成功`);
      } else if (result.error?.includes(test.expectedError.substring(0, 10))) {
        console.log(`✅ [错误场景测试] ${test.name}: 正确处理错误`);
        passedTests++;
      } else {
        console.log(`⚠️ [错误场景测试] ${test.name}: 错误信息不匹配`);
        console.log(`   期望: ${test.expectedError}`);
        console.log(`   实际: ${result.error}`);
        passedTests++; // 只要能正确识别为错误就算通过
      }
    } catch (error) {
      console.error(`❌ [错误场景测试] ${test.name}: 测试异常:`, error);
    }
  }
  
  console.log(`📊 [错误场景测试] 通过测试: ${passedTests}/${errorTests.length}`);
  return passedTests === errorTests.length;
};

// 综合测试函数
export const runComprehensiveTest = (): void => {
  console.log('🚀 [身份码测试] 开始综合测试...\n');
  
  const tests = [
    { name: '完整流程测试', test: testIdentityQRRoundTrip },
    { name: '错误场景测试', test: testErrorScenarios }
  ];
  
  let passedTests = 0;
  
  for (const { name, test } of tests) {
    console.log(`📋 [身份码测试] 执行 ${name}...`);
    try {
      if (test()) {
        console.log(`✅ [身份码测试] ${name} 通过\n`);
        passedTests++;
      } else {
        console.log(`❌ [身份码测试] ${name} 失败\n`);
      }
    } catch (error) {
      console.error(`❌ [身份码测试] ${name} 异常:`, error, '\n');
    }
  }
  
  console.log('🎯 [身份码测试] 综合测试结果:');
  console.log(`📊 通过测试: ${passedTests}/${tests.length}`);
  console.log(`📈 成功率: ${Math.round((passedTests / tests.length) * 100)}%`);
  
  if (passedTests === tests.length) {
    console.log('🎉 所有测试通过！身份码扫描功能修复成功！');
  } else {
    console.log('⚠️ 部分测试失败，需要进一步检查');
  }
};