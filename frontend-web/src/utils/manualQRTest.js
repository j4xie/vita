/**
 * 手动QR权限测试
 * 在控制台直接调用测试函数
 */

// 导入必要的权限函数
const { getUserPermissionLevel, getScanPermissions } = require('../types/userPermissions.ts');

// 基本测试函数
const manualTestQRPermissions = () => {
  console.log('🧪 [MANUAL-QR-TEST] 开始手动权限测试');
  console.log('=' .repeat(60));

  // 模拟用户数据（基于实际运行的用户）
  const testUsers = {
    staff: {
      userName: 'tester5',
      role: { roleKey: 'staff', roleName: '内部员工' },
      roles: [],
      deptId: 211 // 加州大学伯克利分校
    },
    admin: {
      userName: 'admin Xie', 
      role: { roleKey: 'manage', roleName: '总管理员' },
      roles: [],
      deptId: 223 // CU总部
    }
  };

  // 被扫码用户
  const scannedUser = {
    userId: '100',
    legalName: '测试被扫用户',
    deptId: '211', // 同校
    school: { id: '211', name: '加州大学伯克利分校' }
  };

  // 测试每个用户的权限
  Object.entries(testUsers).forEach(([userType, user]) => {
    console.log(`\n📋 测试 ${userType} 用户: ${user.userName}`);
    
    try {
      const permissionLevel = getUserPermissionLevel(user);
      const scanPermissions = getScanPermissions(user, {
        userId: scannedUser.userId,
        deptId: scannedUser.deptId,
        school: scannedUser.school
      });

      console.log(`   权限级别: ${permissionLevel}`);
      console.log(`   是否同校: ${scanPermissions.isSameSchool}`);
      console.log(`   志愿者管理: ${scanPermissions.availableOptions.volunteerCheckin}`);
      console.log(`   活动签到: ${scanPermissions.availableOptions.activityCheckin}`);

      // 判断预期行为
      const hasAnyOption = scanPermissions.availableOptions.volunteerCheckin || scanPermissions.availableOptions.activityCheckin;
      const expectedBehavior = hasAnyOption ? '显示操作按钮' : '仅显示身份信息';
      console.log(`   预期UI: ${expectedBehavior}`);
      
      // 验证是否符合预期
      const isCorrect = (permissionLevel === 'manage') ? hasAnyOption : 
                       (permissionLevel === 'staff') ? !hasAnyOption : true;
      console.log(`   权限正确: ${isCorrect ? '✅' : '❌'}`);

    } catch (error) {
      console.error(`   测试失败: ${error.message}`);
    }
  });

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 [MANUAL-QR-TEST] 测试完成');
};

// 添加到全局对象以便控制台调用
if (typeof global !== 'undefined') {
  global.manualTestQR = manualTestQRPermissions;
}

// 立即执行一次测试
setTimeout(() => {
  manualTestQRPermissions();
}, 1000);

console.log('🧪 手动QR权限测试工具已加载');
console.log('💡 使用 manualTestQR() 手动运行测试');