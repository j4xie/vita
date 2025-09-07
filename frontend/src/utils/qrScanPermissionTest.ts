/**
 * QR扫码权限测试工具
 * 用于验证不同权限级别用户的扫码行为
 */

import { getUserPermissionLevel, getScanPermissions } from '../types/userPermissions';

// 模拟用户数据
const mockUsers = {
  totalAdmin: {
    userName: 'admin Xie',
    role: { roleKey: 'manage', roleName: '总管理员' },
    roles: [],
    deptId: 223 // CU总部
  },
  partAdmin: {
    userName: 'admin Jie', 
    role: { roleKey: 'part_manage', roleName: '分管理员' },
    roles: [],
    deptId: 211 // 加州大学伯克利分校
  },
  staff: {
    userName: 'tester5',
    role: { roleKey: 'staff', roleName: '内部员工' },
    roles: [],
    deptId: 211 // 加州大学伯克利分校
  },
  common: {
    userName: 'test001',
    role: { roleKey: 'common', roleName: '普通用户' },
    roles: [],
    deptId: 211 // 加州大学伯克利分校
  }
};

// 模拟被扫码用户
const mockScannedUsers = {
  sameSchoolUser: {
    userId: '100',
    legalName: '同校用户',
    deptId: '211', // 加州大学伯克利分校
    school: { id: '211', name: '加州大学伯克利分校' }
  },
  differentSchoolUser: {
    userId: '200', 
    legalName: '外校用户',
    deptId: '212', // 加州大学圣克鲁兹分校
    school: { id: '212', name: '加州大学圣克鲁兹分校' }
  }
};

/**
 * 测试所有权限组合
 */
export const testAllPermissionCombinations = () => {
  console.log('🧪 [QR-PERMISSION-TEST] 开始完整权限测试');
  console.log('=' .repeat(80));

  const results: any[] = [];

  // 遍历所有扫码者
  Object.entries(mockUsers).forEach(([scannerType, scanner]) => {
    // 遍历所有被扫码者
    Object.entries(mockScannedUsers).forEach(([scannedType, scanned]) => {
      const scannerLevel = getUserPermissionLevel(scanner);
      const permissions = getScanPermissions(scanner, {
        userId: scanned.userId,
        deptId: scanned.deptId,
        school: scanned.school
      });

      const result = {
        测试场景: `${scannerType} 扫码 ${scannedType}`,
        扫码者: scanner.userName,
        扫码者权限: scannerLevel,
        被扫用户: scanned.legalName,
        是否同校: permissions.isSameSchool,
        志愿者管理权限: permissions.availableOptions.volunteerCheckin,
        活动签到权限: permissions.availableOptions.activityCheckin,
        预期行为: getExpectedBehavior(scannerLevel, permissions)
      };

      results.push(result);
      
      console.log(`📋 ${result.测试场景}:`);
      console.log(`   扫码者: ${result.扫码者} (${result.扫码者权限})`);
      console.log(`   被扫用户: ${result.被扫用户} (同校: ${result.是否同校})`);
      console.log(`   权限: 志愿者=${result.志愿者管理权限} | 活动=${result.活动签到权限}`);
      console.log(`   行为: ${result.预期行为}`);
      console.log('');
    });
  });

  console.log('=' .repeat(80));
  console.log('🎯 [QR-PERMISSION-TEST] 测试完成');
  
  return results;
};

/**
 * 获取预期行为描述
 */
const getExpectedBehavior = (scannerLevel: string, permissions: any): string => {
  const hasVolunteer = permissions.availableOptions.volunteerCheckin;
  const hasActivity = permissions.availableOptions.activityCheckin;

  if (scannerLevel === 'manage') {
    return hasVolunteer && hasActivity ? '显示完整操作选项' : '总管理员权限异常';
  }

  if (scannerLevel === 'part_manage') {
    if (permissions.isSameSchool) {
      return hasVolunteer && hasActivity ? '显示完整操作选项' : '分管理员同校权限异常';
    } else {
      return !hasVolunteer && hasActivity ? '仅显示活动签到选项' : '分管理员跨校权限异常';
    }
  }

  if (['staff', 'common'].includes(scannerLevel)) {
    return !hasVolunteer && !hasActivity ? '仅显示身份信息，无操作权限' : '非管理员权限异常';
  }

  return '未知权限级别';
};

/**
 * 验证特定场景
 */
export const testSpecificScenario = (
  scannerType: keyof typeof mockUsers,
  scannedType: keyof typeof mockScannedUsers
) => {
  const scanner = mockUsers[scannerType];
  const scanned = mockScannedUsers[scannedType];
  
  if (!scanner || !scanned) {
    console.error('❌ 无效的测试场景参数');
    return;
  }

  console.log(`🎯 [测试场景] ${scannerType} 扫码 ${scannedType}`);
  
  const scannerLevel = getUserPermissionLevel(scanner);
  const permissions = getScanPermissions(scanner, {
    userId: scanned.userId,
    deptId: scanned.deptId,
    school: scanned.school
  });

  console.log('📊 测试结果:');
  console.log(`   扫码者权限级别: ${scannerLevel}`);
  console.log(`   是否同校: ${permissions.isSameSchool}`);
  console.log(`   志愿者管理: ${permissions.availableOptions.volunteerCheckin}`);
  console.log(`   活动签到: ${permissions.availableOptions.activityCheckin}`);
  console.log(`   预期UI: ${getExpectedBehavior(scannerLevel, permissions)}`);

  return {
    scannerLevel,
    permissions,
    expectedBehavior: getExpectedBehavior(scannerLevel, permissions)
  };
};

// 在全局作用域添加测试函数，方便在控制台调用
declare global {
  var testQRPermissions: () => void;
  var testQRScenario: (scanner: string, scanned: string) => void;
}

if (typeof global !== 'undefined') {
  global.testQRPermissions = testAllPermissionCombinations;
  global.testQRScenario = (scanner: string, scanned: string) => 
    testSpecificScenario(scanner as keyof typeof mockUsers, scanned as keyof typeof mockScannedUsers);
}

console.log('🧪 QR权限测试工具已加载');
console.log('💡 使用 testQRPermissions() 运行完整测试');
console.log('💡 使用 testQRScenario("totalAdmin", "sameSchoolUser") 测试特定场景');