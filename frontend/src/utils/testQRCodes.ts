/**
 * 测试用QR码生成工具
 * 用于生成模拟的商家QR码，方便测试扫描功能
 */

// ==================== 测试用商家QR码 ====================

export const TEST_QR_CODES = {
  // Starbucks - 两个组织都有权限
  STARBUCKS: 'vitaglobal://merchant/merchant_starbucks?location=broadway&timestamp=' + Date.now(),
  
  // McDonald's - 仅Columbia CU有权限
  MCDONALDS: 'vitaglobal://merchant/merchant_mcdonalds?location=columbia&timestamp=' + Date.now(),
  
  // Subway - 仅CSSA有权限  
  SUBWAY: 'vitaglobal://merchant/merchant_subway?location=manhattan&timestamp=' + Date.now(),
  
  // 测试用推荐码
  REFERRAL_CODE: 'VG_REF_TEST123',
  
  // 测试用活动核销码
  EVENT_CHECKIN: 'VG_EVENT_ACTIVITY001_USER123',
};

// ==================== QR码生成函数 ====================

export const generateMerchantQR = (
  merchantId: string, 
  locationId?: string, 
  campaignId?: string
): string => {
  const baseUrl = `vitaglobal://merchant/${merchantId}`;
  const params = new URLSearchParams({
    timestamp: Date.now().toString()
  });
  
  if (locationId) {
    params.set('location', locationId);
  }
  
  if (campaignId) {
    params.set('campaign', campaignId);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

export const generateUserIdentityQR = (userData: {
  userId: string;
  userName: string;
  legalName: string;
  nickName: string;
  email: string;
  organizationId: string;
  organizationName: string;
}): string => {
  const qrData = {
    ...userData,
    type: 'user_identity',
    generatedAt: Date.now(),
  };
  
  try {
    return `VG_USER_${btoa(JSON.stringify(qrData))}`;
  } catch (error) {
    console.error('Error generating user identity QR:', error);
    return `VG_USER_ERROR_${userData.userId}`;
  }
};

// ==================== 测试用模拟数据 ====================

export const MOCK_TEST_DATA = {
  users: [
    {
      userId: 'user_123',
      userName: 'testuser',
      legalName: '张三',
      nickName: 'zhangsan',
      email: 'zhangsan@columbia.edu',
      organizationId: 'org_columbia_cu',
      organizationName: '哥伦比亚大学中国学联'
    },
    {
      userId: 'user_456', 
      userName: 'testuser2',
      legalName: '李四',
      nickName: 'lisi',
      email: 'lisi@nyu.edu',
      organizationId: 'org_cssa',
      organizationName: '中国学生学者联谊会'
    }
  ],
  
  merchants: [
    {
      id: 'merchant_starbucks',
      name: 'Starbucks Coffee',
      location: 'Broadway店',
      address: '2920 Broadway, New York, NY 10025'
    },
    {
      id: 'merchant_mcdonalds',
      name: "McDonald's",
      location: 'Columbia店',
      address: '2881 Broadway, New York, NY 10025'
    },
    {
      id: 'merchant_subway',
      name: 'Subway',
      location: 'Manhattan店', 
      address: '2872 Broadway, New York, NY 10025'
    }
  ]
};

// ==================== 测试辅助函数 ====================

export const getTestQRForMerchant = (merchantId: string): string => {
  const merchant = MOCK_TEST_DATA.merchants.find(m => m.id === merchantId);
  if (!merchant) {
    return generateMerchantQR('unknown_merchant');
  }
  
  return generateMerchantQR(
    merchantId,
    merchant.location.toLowerCase().replace(/[^a-z]/g, '')
  );
};

export const getTestUserIdentityQR = (userIndex: number = 0): string => {
  const user = MOCK_TEST_DATA.users[userIndex];
  if (!user) {
    return 'VG_USER_ERROR_NO_USER';
  }
  
  return generateUserIdentityQR(user);
};

// ==================== 控制台调试辅助 ====================

export const printTestQRCodes = (): void => {
  console.log('=== VitaGlobal 测试用QR码 ===');
  console.log('\n🏪 商家QR码:');
  console.log('Starbucks (两个组织都可访问):', TEST_QR_CODES.STARBUCKS);
  console.log('McDonald\'s (仅Columbia CU可访问):', TEST_QR_CODES.MCDONALDS);
  console.log('Subway (仅CSSA可访问):', TEST_QR_CODES.SUBWAY);
  
  console.log('\n👤 用户身份码:');
  MOCK_TEST_DATA.users.forEach((user, index) => {
    console.log(`${user.legalName} (${user.organizationName}):`, getTestUserIdentityQR(index));
  });
  
  console.log('\n📱 其他测试码:');
  console.log('推荐码:', TEST_QR_CODES.REFERRAL_CODE);
  console.log('活动核销码:', TEST_QR_CODES.EVENT_CHECKIN);
  
  console.log('\n使用方法: 将上述QR码内容手动输入或生成二维码图片进行扫描测试');
};

// 开发环境自动打印
if (__DEV__) {
  // 延迟打印，确保应用完全启动后显示
  setTimeout(() => {
    printTestQRCodes();
  }, 3000);
}