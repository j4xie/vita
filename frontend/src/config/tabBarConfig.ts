// TabBar显示配置 - 白名单机制
// 只有列在这里的页面会显示TabBar，其他页面都隐藏

export const TAB_BAR_VISIBLE_PAGES = {
  // 主要Tab页面 - 这些是TabBar的根页面，必须显示
  TAB_ROOTS: [
    'Explore',      // 探索Tab根页面
    'Community',    // 社区Tab根页面
    'Rewards',      // 会员Tab根页面
    'Wellbeing',    // 安心Tab根页面
    'Profile',      // 个人Tab根页面
  ],
  
  // Stack页面 - 这些是Tab内的子页面，需要显示TabBar的页面
  STACK_PAGES: [
    'ActivityList',    // 活动列表页面 (Explore Tab内)
    'WellbeingHome',   // 安心首页 (Wellbeing Tab内)
    'ProfileHome',     // 个人首页 (Profile Tab内)
    'CommunityHome',   // 社区首页 (Community Tab内)
    'RewardsHome',     // 积分商城首页 (Rewards Tab内)
    // 商家Tab页面
    'MerchantDashboard',      // 商家工作台
    'MerchantActivitiesHome', // 商家活动列表
  ],
} as const;

/**
 * 检查指定页面是否应该显示TabBar
 * @param routeName 当前页面路由名
 * @returns 是否显示TabBar
 */
export const shouldShowTabBar = (routeName: string): boolean => {
  // 🚨 严格安全检查：null/undefined路由名默认隐藏
  if (!routeName || routeName === 'undefined' || routeName === 'null') {
    console.log('⚠️ [TAB-CONFIG] 无效路由名，默认隐藏TabBar:', routeName);
    return false;
  }
  
  // 检查是否是Tab根页面
  if (TAB_BAR_VISIBLE_PAGES.TAB_ROOTS.includes(routeName as any)) {
    console.log('✅ [TAB-CONFIG] Tab根页面，显示TabBar:', routeName);
    return true;
  }
  
  // 检查是否是允许显示TabBar的Stack页面
  if (TAB_BAR_VISIBLE_PAGES.STACK_PAGES.includes(routeName as any)) {
    console.log('✅ [TAB-CONFIG] 允许的Stack页面，显示TabBar:', routeName);
    return true;
  }
  
  // 🛡️ 强制隐藏：所有其他页面
  console.log('❌ [TAB-CONFIG] 其他页面，强制隐藏TabBar:', routeName);
  return false;
};

/**
 * 强制检查页面是否必须隐藏TabBar（用于关键页面的双重保护）
 * @param routeName 当前页面路由名
 * @returns 是否必须隐藏TabBar
 */
export const mustHideTabBar = (routeName: string): boolean => {
  // 🚨 关键页面强制隐藏（防止意外显示）
  const criticalHiddenPages = [
    'ActivityDetail',
    'ActivityRegistrationForm',
    'EditProfile',
    'QRScanner',
    'Search',
    'Login',
    'Register',
    'SchoolDetail',
    'CommunityEvents',  // 社区活动列表页面
    'MerchantDetail',   // 商家详情页面
    'PVSACertificateApplication', // PVSA证书申请向导
  ];
  
  return criticalHiddenPages.includes(routeName);
};

/**
 * 隐藏TabBar的页面列表 - 用于调试和文档
 */
export const HIDDEN_TAB_BAR_PAGES = [
  // 活动相关页面
  'ActivityDetail',              // 活动详情
  'ActivityRegistrationForm',    // 活动报名表单
  
  // 认证页面
  'Login',                      // 登录
  'Register',                   // 注册相关页面
  'ForgotPassword',             // 忘记密码
  'Verification',               // 验证页面
  
  // 个人资料页面
  'EditProfile',                // 编辑个人资料
  'CertificateList',            // 证书申请列表
  'PVSACertificateApplication', // PVSA证书申请向导
  'Notifications',              // 通知设置
  'General',                    // 通用设置
  'AboutSupport',               // 关于和支持
  'LanguageSelection',          // 语言设置
  'ActivityLayoutSelection',    // 布局选择
  'MyCards',                    // 我的卡片
  
  // 安心功能页面
  'SchoolDetail',               // 学校详情
  
  // 通用功能页面
  'QRScanner',                  // 二维码扫描
  'Search',                     // 搜索页面
  'Terms',                      // 条款页面

  // 探索页面
  'ExploreScreen',              // 探索页面

  // 社区页面
  'CommunityEvents',            // 社区活动列表
  'MerchantDetail',             // 商家详情

  // 积分商城子页面
  'MyCoupons',                  // 我的优惠券
] as const;

// 导出类型定义
export type TabBarVisiblePage = 
  | typeof TAB_BAR_VISIBLE_PAGES.TAB_ROOTS[number] 
  | typeof TAB_BAR_VISIBLE_PAGES.STACK_PAGES[number];

export type HiddenTabBarPage = typeof HIDDEN_TAB_BAR_PAGES[number];