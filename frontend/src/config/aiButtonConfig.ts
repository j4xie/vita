// AI按钮显示配置 - 白名单机制
// 只有列在这里的页面会显示AI按钮，详情页等全屏内容页面隐藏

export const AI_BUTTON_VISIBLE_PAGES = {
  // 主要Tab页面 - TabBar的根页面，显示AI按钮
  TAB_ROOTS: [
    'Explore',      // 探索Tab
    'Community',    // 社区Tab
    'Wellbeing',    // 安心Tab
    'Profile',      // 个人Tab
  ],

  // Stack页面 - Tab内的列表页面，显示AI按钮
  STACK_PAGES: [
    'ActivityList',       // 活动列表
    'WellbeingHome',      // 安心首页
    'ProfileHome',        // 个人首页
    'CommunityHome',      // 社区首页
    'RewardsHome',        // 积分商城首页
    'VolunteerHome',      // 志愿者首页
    'MyCards',            // 我的卡片
  ],
} as const;

/**
 * 强制隐藏AI按钮的页面（详情页、表单页等全屏内容）
 */
export const AI_BUTTON_HIDDEN_PAGES = [
  // 活动相关详情页
  'ActivityDetail',              // 活动详情
  'ActivityRegistrationForm',    // 活动报名表单

  // 认证页面
  'Login',
  'Register',
  'ForgotPassword',
  'Verification',

  // 功能页面
  'QRScanner',                   // 二维码扫描
  'QRScanResult',                // 扫描结果
  'Search',                      // 搜索页面
  'EditProfile',                 // 编辑资料

  // 安心功能详情页
  'SchoolDetail',                // 学校详情
  'VolunteerSchoolDetail',       // 志愿者学校详情
  'VolunteerHistory',            // 志愿者历史
  'TimeEntry',                   // 时间录入

  // 社区详情页
  'CommunityEvents',             // 社区活动列表

  // 其他全屏页面
  'Terms',                       // 条款
  'Notifications',               // 通知设置
  'General',                     // 通用设置
  'AboutSupport',                // 关于
  'LanguageSelection',           // 语言选择
  'ActivityLayoutSelection',     // 布局选择
  'PersonalQR',                  // 个人二维码

  // AI聊天页面（自己不显示AI按钮）
  'AIChat',
] as const;

/**
 * 检查指定页面是否应该显示AI按钮
 * @param routeName 当前页面路由名
 * @returns 是否显示AI按钮
 */
export const shouldShowAIButton = (routeName: string | undefined): boolean => {
  // 安全检查：null/undefined默认隐藏
  if (!routeName || routeName === 'undefined' || routeName === 'null') {
    return false;
  }

  // 强制隐藏页面
  if (AI_BUTTON_HIDDEN_PAGES.includes(routeName as any)) {
    console.log('❌ [AI-BUTTON] 详情页/表单页，隐藏AI按钮:', routeName);
    return false;
  }

  // Tab根页面
  if (AI_BUTTON_VISIBLE_PAGES.TAB_ROOTS.includes(routeName as any)) {
    console.log('✅ [AI-BUTTON] Tab根页面，显示AI按钮:', routeName);
    return true;
  }

  // 允许的Stack页面
  if (AI_BUTTON_VISIBLE_PAGES.STACK_PAGES.includes(routeName as any)) {
    console.log('✅ [AI-BUTTON] 列表页面，显示AI按钮:', routeName);
    return true;
  }

  // 默认隐藏
  console.log('🔒 [AI-BUTTON] 未配置页面，默认隐藏:', routeName);
  return false;
};

// 导出类型定义
export type AIButtonVisiblePage =
  | typeof AI_BUTTON_VISIBLE_PAGES.TAB_ROOTS[number]
  | typeof AI_BUTTON_VISIBLE_PAGES.STACK_PAGES[number];

export type AIButtonHiddenPage = typeof AI_BUTTON_HIDDEN_PAGES[number];
