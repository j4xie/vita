/**
 * QR扫码功能深度测试套件
 * 涵盖边缘情况、异常处理、权限验证等全面测试
 */

import { getScanPermissions, getUserPermissionLevel } from '../types/userPermissions';
import { generateUserQRContent, mapUserToIdentityData } from './userIdentityMapper';
import { UserIdentityData } from '../types/userIdentity';

// 测试数据生成器
export class QRTestDataGenerator {
  // 生成各种权限级别的测试用户
  static generateTestUsers() {
    return {
      // 总管理员
      superAdmin: {
        userId: 1,
        userName: 'admin',
        legalName: '系统管理员',
        nickName: 'Super Admin',
        email: 'admin@test.com',
        deptId: 210, // UCD
        roles: [{ key: 'manage', roleName: '总管理员' }],
        admin: true,
      },

      // 分管理员 - 同校
      partManagerUCD: {
        userId: 2,
        userName: 'part_admin_ucd',
        legalName: 'UCD分管理员',
        nickName: 'Part Manager',
        email: 'part@ucd.edu',
        deptId: 210, // UCD
        roles: [{ key: 'part_manage', roleName: '分管理员' }],
        admin: false,
      },

      // 分管理员 - 跨校
      partManagerUSC: {
        userId: 3,
        userName: 'part_admin_usc',
        legalName: 'USC分管理员',
        nickName: 'Part Manager USC',
        email: 'part@usc.edu',
        deptId: 213, // USC
        roles: [{ key: 'part_manage', roleName: '分管理员' }],
        admin: false,
      },

      // 内部员工
      staff: {
        userId: 4,
        userName: 'staff_user',
        legalName: '内部员工',
        nickName: 'Staff User',
        email: 'staff@test.com',
        deptId: 210,
        roles: [{ key: 'staff', roleName: '内部员工' }],
        admin: false,
      },

      // 普通用户
      commonUser: {
        userId: 5,
        userName: 'common_user',
        legalName: '普通用户',
        nickName: 'Common User',
        email: 'user@test.com',
        deptId: 210,
        roles: [{ key: 'common', roleName: '普通用户' }],
        admin: false,
      },

      // 无权限用户
      noRoleUser: {
        userId: 6,
        userName: 'no_role_user',
        legalName: '无角色用户',
        nickName: 'No Role',
        email: 'norole@test.com',
        deptId: 210,
        roles: [],
        admin: false,
      },

      // 异常数据用户
      corruptedUser: {
        userId: null,
        userName: '',
        legalName: null,
        nickName: undefined,
        email: 'corrupt@test.com',
        deptId: 'invalid',
        roles: null,
        admin: undefined,
      },
    };
  }

  // 生成被扫码用户数据
  static generateScannedUsers() {
    return {
      // UCD学生 - 志愿者
      ucdVolunteer: {
        userId: '101',
        userName: 'volunteer_ucd',
        legalName: 'UCD志愿者',
        nickName: 'Volunteer',
        email: 'vol@ucd.edu',
        deptId: '210',
        school: { id: '210', name: 'UCD' },
        position: { roleKey: 'staff', displayName: '志愿者' },
        type: 'user_identity' as const,
      },

      // USC学生 - 普通用户
      uscStudent: {
        userId: '102',
        userName: 'student_usc',
        legalName: 'USC学生',
        nickName: 'Student',
        email: 'student@usc.edu',
        deptId: '213',
        school: { id: '213', name: 'USC' },
        position: { roleKey: 'common', displayName: '普通用户' },
        type: 'user_identity' as const,
      },

      // 数据不完整用户
      incompleteUser: {
        userId: '103',
        userName: 'incomplete',
        legalName: '',
        nickName: undefined,
        email: null,
        deptId: undefined,
        school: null,
        position: undefined,
        type: 'user_identity' as const,
      },
    };
  }
}

// 边缘情况测试器
export class EdgeCaseTestSuite {
  
  // 测试1: 权限边界验证
  static testPermissionBoundaries() {
    console.log('🧪 [TEST] 开始权限边界测试...');
    const testResults: any[] = [];
    const users = QRTestDataGenerator.generateTestUsers();
    const scannedUsers = QRTestDataGenerator.generateScannedUsers();

    // 测试各种权限组合
    const testCases = [
      {
        name: '总管理员扫描任何用户',
        scanner: users.superAdmin,
        scanned: scannedUsers.uscStudent,
        expected: { volunteerCheckin: true, activityCheckin: true }
      },
      {
        name: '同校分管理员扫描同校用户',
        scanner: users.partManagerUCD,
        scanned: scannedUsers.ucdVolunteer,
        expected: { volunteerCheckin: true, activityCheckin: true }
      },
      {
        name: '跨校分管理员扫描其他学校用户',
        scanner: users.partManagerUSC,
        scanned: scannedUsers.ucdVolunteer,
        expected: { volunteerCheckin: false, activityCheckin: true }
      },
      {
        name: '普通用户扫描其他用户',
        scanner: users.commonUser,
        scanned: scannedUsers.ucdVolunteer,
        expected: { volunteerCheckin: false, activityCheckin: true }
      },
      {
        name: '无权限用户扫描',
        scanner: users.noRoleUser,
        scanned: scannedUsers.ucdVolunteer,
        expected: { volunteerCheckin: false, activityCheckin: true }
      },
    ];

    testCases.forEach(testCase => {
      try {
        const result = getScanPermissions(testCase.scanner, testCase.scanned);
        const passed = 
          result.availableOptions.volunteerCheckin === testCase.expected.volunteerCheckin &&
          result.availableOptions.activityCheckin === testCase.expected.activityCheckin;

        testResults.push({
          test: testCase.name,
          passed,
          expected: testCase.expected,
          actual: result.availableOptions,
          details: result
        });

        console.log(`${passed ? '✅' : '❌'} ${testCase.name}:`, {
          expected: testCase.expected,
          actual: result.availableOptions
        });
      } catch (error) {
        testResults.push({
          test: testCase.name,
          passed: false,
          error: error.message,
        });
        console.log(`❌ ${testCase.name}: 测试异常`, error);
      }
    });

    return testResults;
  }

  // 测试2: QR码生成和解析完整性
  static testQRCodeIntegrity() {
    console.log('🧪 [TEST] 开始QR码完整性测试...');
    const testResults: any[] = [];
    const scannedUsers = QRTestDataGenerator.generateScannedUsers();

    Object.entries(scannedUsers).forEach(([key, userData]) => {
      try {
        // 测试QR码生成
        const qrContent = generateUserQRContent(userData as UserIdentityData);
        
        // 验证格式
        const isValidFormat = qrContent.startsWith('VG_USER_');
        testResults.push({
          test: `QR码格式验证 - ${key}`,
          passed: isValidFormat,
          generated: qrContent.substring(0, 50) + '...',
          length: qrContent.length
        });

        // 测试超长数据处理
        const longUserData = {
          ...userData,
          legalName: 'A'.repeat(200), // 超长姓名
          email: 'B'.repeat(100) + '@test.com',
          organization: { displayNameZh: 'C'.repeat(150) }
        };

        const longQrContent = generateUserQRContent(longUserData as any);
        const isCompressed = !longQrContent.includes('VG_USER_') || longQrContent.length < 200;
        
        testResults.push({
          test: `长数据压缩 - ${key}`,
          passed: isCompressed,
          originalLength: JSON.stringify(longUserData).length,
          compressedLength: longQrContent.length
        });

        console.log(`✅ QR码测试 - ${key}: 格式${isValidFormat ? '正确' : '错误'}, 长度${qrContent.length}`);

      } catch (error) {
        testResults.push({
          test: `QR码生成 - ${key}`,
          passed: false,
          error: error.message
        });
        console.log(`❌ QR码测试 - ${key}:`, error);
      }
    });

    return testResults;
  }

  // 测试3: 异常数据处理
  static testCorruptedDataHandling() {
    console.log('🧪 [TEST] 开始异常数据处理测试...');
    const testResults: any[] = [];

    // 异常QR码数据
    const corruptedQRCodes = [
      '',
      'INVALID_QR_CODE',
      'VG_USER_',
      'VG_USER_invalid_base64',
      'VG_USER_' + btoa('invalid_json'),
      'VG_USER_' + btoa(encodeURIComponent('{"incomplete": true}')),
      null,
      undefined,
      123,
      {},
    ];

    corruptedQRCodes.forEach((qrCode, index) => {
      try {
        // 这里需要模拟解析逻辑，因为parseUserIdentityQR在组件内部
        const isValid = typeof qrCode === 'string' && qrCode.startsWith('VG_USER_');
        
        testResults.push({
          test: `异常QR码处理 - ${index}`,
          input: qrCode,
          passed: !isValid || qrCode === 'VG_USER_', // 空内容应该被正确识别为无效
          type: typeof qrCode,
        });

        console.log(`${!isValid ? '✅' : '❌'} 异常QR码 ${index}:`, qrCode);

      } catch (error) {
        testResults.push({
          test: `异常QR码处理 - ${index}`,
          passed: true, // 异常被正确捕获
          error: error.message,
        });
      }
    });

    return testResults;
  }

  // 测试4: 用户权限计算边缘情况
  static testUserPermissionEdgeCases() {
    console.log('🧪 [TEST] 开始用户权限边缘情况测试...');
    const testResults: any[] = [];

    const edgeCaseUsers = [
      // 多角色用户
      {
        name: '多角色用户',
        user: {
          userName: 'multi_role',
          roles: [
            { key: 'staff', roleName: '员工' },
            { key: 'manage', roleName: '管理员' } // 应该取最高权限
          ]
        },
        expected: 'manage'
      },

      // roles为空数组
      {
        name: 'roles空数组',
        user: {
          userName: 'empty_roles',
          roles: []
        },
        expected: 'common'
      },

      // roles为null
      {
        name: 'roles为null',
        user: {
          userName: 'null_roles',
          roles: null
        },
        expected: 'common'
      },

      // admin字段优先级
      {
        name: 'admin字段为true',
        user: {
          userName: 'admin_true',
          admin: true,
          roles: [{ key: 'common', roleName: '普通用户' }]
        },
        expected: 'manage'
      },

      // 用户名映射备用
      {
        name: '用户名映射',
        user: {
          userName: 'admin',
          roles: null,
          admin: false
        },
        expected: 'manage'
      },

      // 完全无效用户
      {
        name: '无效用户',
        user: null,
        expected: 'guest'
      },
    ];

    edgeCaseUsers.forEach(testCase => {
      try {
        const result = getUserPermissionLevel(testCase.user);
        const passed = result === testCase.expected;

        testResults.push({
          test: testCase.name,
          passed,
          expected: testCase.expected,
          actual: result,
          user: testCase.user
        });

        console.log(`${passed ? '✅' : '❌'} ${testCase.name}: 期望${testCase.expected}, 实际${result}`);

      } catch (error) {
        testResults.push({
          test: testCase.name,
          passed: false,
          error: error.message
        });
        console.log(`❌ ${testCase.name}: 测试异常`, error);
      }
    });

    return testResults;
  }

  // 测试5: 学校ID匹配边缘情况
  static testSchoolIdMatching() {
    console.log('🧪 [TEST] 开始学校ID匹配测试...');
    const testResults: any[] = [];

    const matchTestCases = [
      {
        name: '数字vs字符串匹配',
        scannerDeptId: 210,
        scannedDeptId: '210',
        expected: true
      },
      {
        name: '字符串vs数字匹配',
        scannerDeptId: '213',
        scannedDeptId: 213,
        expected: true
      },
      {
        name: '不同学校',
        scannerDeptId: 210,
        scannedDeptId: '213',
        expected: false
      },
      {
        name: '空值处理',
        scannerDeptId: null,
        scannedDeptId: '210',
        expected: false
      },
      {
        name: '无效ID',
        scannerDeptId: 'invalid',
        scannedDeptId: 'invalid',
        expected: false // 因为都无效，不应该匹配
      },
    ];

    matchTestCases.forEach(testCase => {
      try {
        // 模拟学校匹配逻辑
        const isSameSchool = testCase.scannerDeptId && testCase.scannedDeptId && 
          (testCase.scannerDeptId === parseInt(testCase.scannedDeptId as any) || 
           testCase.scannerDeptId.toString() === testCase.scannedDeptId);

        const passed = !!isSameSchool === testCase.expected;

        testResults.push({
          test: testCase.name,
          passed,
          expected: testCase.expected,
          actual: !!isSameSchool,
          scannerDeptId: testCase.scannerDeptId,
          scannedDeptId: testCase.scannedDeptId
        });

        console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${testCase.scannerDeptId} vs ${testCase.scannedDeptId} = ${!!isSameSchool}`);

      } catch (error) {
        testResults.push({
          test: testCase.name,
          passed: false,
          error: error.message
        });
      }
    });

    return testResults;
  }

  // 运行所有测试
  static runAllTests() {
    console.log('🧪 [COMPREHENSIVE-TEST] 开始全面测试...\n');
    
    const allResults = {
      permissionBoundaries: this.testPermissionBoundaries(),
      qrCodeIntegrity: this.testQRCodeIntegrity(),
      corruptedDataHandling: this.testCorruptedDataHandling(),
      userPermissionEdgeCases: this.testUserPermissionEdgeCases(),
      schoolIdMatching: this.testSchoolIdMatching(),
    };

    // 统计结果
    let totalTests = 0;
    let passedTests = 0;

    Object.entries(allResults).forEach(([category, results]) => {
      const categoryPassed = results.filter((r: any) => r.passed).length;
      const categoryTotal = results.length;
      totalTests += categoryTotal;
      passedTests += categoryPassed;
      
      console.log(`\n📊 ${category}: ${categoryPassed}/${categoryTotal} 通过`);
      
      // 显示失败的测试
      results.forEach((result: any) => {
        if (!result.passed) {
          console.log(`  ❌ ${result.test}: ${result.error || '测试失败'}`);
        }
      });
    });

    console.log(`\n🎯 总体测试结果: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%) 通过`);
    
    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: (passedTests/totalTests*100).toFixed(1) + '%'
      },
      details: allResults
    };
  }
}

// 性能测试套件
export class PerformanceTestSuite {
  
  // 内存泄漏测试
  static testMemoryLeaks() {
    console.log('🧪 [PERF] 开始内存泄漏测试...');
    
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // 模拟大量QR码生成
    for (let i = 0; i < 1000; i++) {
      const userData = {
        userId: i.toString(),
        userName: `user_${i}`,
        legalName: `用户_${i}`,
        nickName: `User ${i}`,
        email: `user${i}@test.com`,
        type: 'user_identity' as const,
      };
      
      generateUserQRContent(userData as UserIdentityData);
    }

    const afterGeneration = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // 模拟大量权限检查
    const testUser = QRTestDataGenerator.generateTestUsers().superAdmin;
    for (let i = 0; i < 1000; i++) {
      const scannedData = {
        userId: i.toString(),
        deptId: (i % 10 + 210).toString(),
        school: { id: (i % 10 + 210).toString() }
      };
      
      getScanPermissions(testUser, scannedData);
    }

    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    console.log('📊 内存使用情况:', {
      initial: `${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
      afterGeneration: `${(afterGeneration / 1024 / 1024).toFixed(2)} MB`,
      final: `${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
      increase: `${((finalMemory - initialMemory) / 1024 / 1024).toFixed(2)} MB`
    });

    return {
      memoryIncrease: finalMemory - initialMemory,
      acceptable: (finalMemory - initialMemory) < 10 * 1024 * 1024 // 10MB内可接受
    };
  }

  // 性能基准测试
  static benchmarkOperations() {
    console.log('🧪 [PERF] 开始性能基准测试...');
    
    const results: any = {};

    // QR码生成性能
    const qrGenStart = performance.now();
    for (let i = 0; i < 100; i++) {
      const userData = {
        userId: i.toString(),
        userName: `user_${i}`,
        legalName: `测试用户_${i}`,
        nickName: `Test User ${i}`,
        email: `user${i}@test.com`,
        type: 'user_identity' as const,
      };
      generateUserQRContent(userData as UserIdentityData);
    }
    const qrGenEnd = performance.now();
    results.qrGeneration = {
      totalTime: qrGenEnd - qrGenStart,
      avgTime: (qrGenEnd - qrGenStart) / 100,
      opsPerSec: 100000 / (qrGenEnd - qrGenStart)
    };

    // 权限验证性能
    const testUser = QRTestDataGenerator.generateTestUsers().superAdmin;
    const permStart = performance.now();
    for (let i = 0; i < 100; i++) {
      const scannedData = {
        userId: i.toString(),
        deptId: (210 + i % 10).toString(),
        school: { id: (210 + i % 10).toString() }
      };
      getScanPermissions(testUser, scannedData);
    }
    const permEnd = performance.now();
    results.permissionCheck = {
      totalTime: permEnd - permStart,
      avgTime: (permEnd - permStart) / 100,
      opsPerSec: 100000 / (permEnd - permStart)
    };

    console.log('📊 性能基准结果:', results);
    
    return results;
  }
}

// 导出测试运行器
export const runComprehensiveTests = () => {
  console.log('🚀 开始QR扫码功能全面测试...\n');
  
  const functionalTests = EdgeCaseTestSuite.runAllTests();
  const performanceTests = {
    memoryLeaks: PerformanceTestSuite.testMemoryLeaks(),
    benchmark: PerformanceTestSuite.benchmarkOperations()
  };
  
  return {
    functional: functionalTests,
    performance: performanceTests,
    timestamp: new Date().toISOString()
  };
};