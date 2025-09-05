// i18n configuration for web version
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// 翻译资源
const resources = {
  'zh-CN': {
    translation: {
      // 通用
      common: {
        loading: '加载中...',
        error: '错误',
        success: '成功',
        confirm: '确认',
        cancel: '取消',
        save: '保存',
        back: '返回',
        next: '下一步',
        previous: '上一步',
        retry: '重试',
        submit: '提交',
        refresh: '刷新',
        search: '搜索',
        filter: '筛选',
        clear: '清除',
        select: '选择',
        upload: '上传',
        download: '下载',
        edit: '编辑',
        delete: '删除',
        view: '查看',
        close: '关闭',
      },
      
      // 认证相关
      auth: {
        login: {
          title: '登录',
          welcome: '欢迎回来',
          subtitle: '请输入您的账号信息',
          username: '用户名',
          password: '密码',
          remember: '记住我',
          forgot_password: '忘记密码？',
          login_button: '登录',
          no_account: '还没有账号？',
          register_link: '立即注册',
          login_success: '登录成功',
          login_failed: '登录失败',
        },
        register: {
          title: '注册',
          welcome: '创建您的账号',
          subtitle: '填写以下信息完成注册',
          form: {
            username: '用户名',
            username_placeholder: '请输入用户名（6-20位数字字母）',
            legal_name: '法定姓名',
            legal_name_placeholder: '请输入您的法定姓名',
            nick_name: '英文名',
            nick_name_placeholder: '请输入您的英文名',
            password: '密码',
            password_placeholder: '请输入密码（6-20位）',
            confirm_password: '确认密码',
            confirm_password_placeholder: '请再次输入密码',
            email: '邮箱',
            email_placeholder: '请输入邮箱地址',
            phone: '手机号',
            phone_placeholder: '请输入手机号',
            gender: '性别',
            school: '学校',
            verification_code: '验证码',
            invitation_code: '邀请码',
          },
          gender_options: {
            male: '男',
            female: '女',
            other: '其他',
          },
          register_button: '注册',
          have_account: '已有账号？',
          login_link: '立即登录',
          register_success: '注册成功',
          register_failed: '注册失败',
        },
        logout: '退出登录',
        logout_confirm: '确认退出登录？',
      },
      
      // 活动相关
      activities: {
        title: '活动',
        list: {
          title: '活动列表',
          empty: '暂无活动',
          load_more: '加载更多',
          refresh: '刷新',
        },
        status: {
          upcoming: '即将开始',
          ongoing: '进行中',
          ended: '已结束',
          registered: '已报名',
          signed_in: '已签到',
          available_spots: '剩余名额：{{count}}个',
          full: '名额已满',
        },
        actions: {
          register: '立即报名',
          sign_in: '签到',
          view_details: '查看详情',
          cancel_registration: '取消报名',
        },
        details: {
          title: '活动详情',
          description: '活动描述',
          time: '活动时间',
          location: '活动地点',
          organizer: '主办方',
          participants: '参与人数',
          requirements: '参与要求',
        },
        messages: {
          register_success: '报名成功',
          register_failed: '报名失败',
          sign_in_success: '签到成功',
          sign_in_failed: '签到失败',
        },
      },
      
      // 志愿者相关
      volunteer: {
        title: '志愿服务',
        check_in: '签到',
        check_out: '签退',
        hours: '工时',
        total_hours: '总工时',
        current_status: '当前状态',
        status: {
          checked_out: '已签退',
          checked_in: '工作中',
          not_started: '未开始',
        },
        history: '工时记录',
        statistics: '工时统计',
        messages: {
          check_in_success: '签到成功',
          check_out_success: '签退成功',
          check_in_failed: '签到失败',
          check_out_failed: '签退失败',
        },
      },
      
      // 个人资料
      profile: {
        title: '个人资料',
        info: {
          username: '用户名',
          legal_name: '法定姓名',
          nick_name: '英文名',
          email: '邮箱',
          phone: '手机号',
          school: '学校',
          role: '角色',
          join_date: '加入日期',
        },
        settings: {
          title: '设置',
          language: '语言设置',
          theme: '主题设置',
          notifications: '通知设置',
          privacy: '隐私设置',
          about: '关于我们',
        },
        edit: {
          title: '编辑资料',
          save_success: '保存成功',
          save_failed: '保存失败',
        },
      },
      
      // 错误和验证
      validation: {
        required: '此字段为必填项',
        invalid_email: '请输入有效的邮箱地址',
        invalid_phone: '请输入有效的手机号',
        password_mismatch: '两次输入的密码不一致',
        min_length: '最少需要{{min}}个字符',
        max_length: '最多允许{{max}}个字符',
        invalid_format: '格式不正确',
      },
      
      errors: {
        network_error: '网络连接失败',
        server_error: '服务器错误',
        not_found: '页面未找到',
        unauthorized: '未授权访问',
        forbidden: '禁止访问',
        timeout: '请求超时',
        unknown_error: '未知错误',
      },
    },
  },
  'en-US': {
    translation: {
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        retry: 'Retry',
        submit: 'Submit',
        refresh: 'Refresh',
        search: 'Search',
        filter: 'Filter',
        clear: 'Clear',
        select: 'Select',
        upload: 'Upload',
        download: 'Download',
        edit: 'Edit',
        delete: 'Delete',
        view: 'View',
        close: 'Close',
      },
      
      // Authentication
      auth: {
        login: {
          title: 'Login',
          welcome: 'Welcome Back',
          subtitle: 'Please enter your account information',
          username: 'Username',
          password: 'Password',
          remember: 'Remember me',
          forgot_password: 'Forgot password?',
          login_button: 'Login',
          no_account: "Don't have an account?",
          register_link: 'Sign up now',
          login_success: 'Login successful',
          login_failed: 'Login failed',
        },
        register: {
          title: 'Register',
          welcome: 'Create Your Account',
          subtitle: 'Fill in the following information to complete registration',
          form: {
            username: 'Username',
            username_placeholder: 'Enter username (6-20 characters)',
            legal_name: 'Legal Name',
            legal_name_placeholder: 'Enter your legal name',
            nick_name: 'English Name',
            nick_name_placeholder: 'Enter your English name',
            password: 'Password',
            password_placeholder: 'Enter password (6-20 characters)',
            confirm_password: 'Confirm Password',
            confirm_password_placeholder: 'Enter password again',
            email: 'Email',
            email_placeholder: 'Enter email address',
            phone: 'Phone',
            phone_placeholder: 'Enter phone number',
            gender: 'Gender',
            school: 'School',
            verification_code: 'Verification Code',
            invitation_code: 'Invitation Code',
          },
          gender_options: {
            male: 'Male',
            female: 'Female',
            other: 'Other',
          },
          register_button: 'Register',
          have_account: 'Already have an account?',
          login_link: 'Login now',
          register_success: 'Registration successful',
          register_failed: 'Registration failed',
        },
        logout: 'Logout',
        logout_confirm: 'Confirm logout?',
      },
      
      // Activities
      activities: {
        title: 'Activities',
        list: {
          title: 'Activity List',
          empty: 'No activities',
          load_more: 'Load More',
          refresh: 'Refresh',
        },
        status: {
          upcoming: 'Upcoming',
          ongoing: 'Ongoing',
          ended: 'Ended',
          registered: 'Registered',
          signed_in: 'Signed In',
          available_spots: 'Available spots: {{count}}',
          full: 'Full',
        },
        actions: {
          register: 'Register Now',
          sign_in: 'Sign In',
          view_details: 'View Details',
          cancel_registration: 'Cancel Registration',
        },
        details: {
          title: 'Activity Details',
          description: 'Description',
          time: 'Time',
          location: 'Location',
          organizer: 'Organizer',
          participants: 'Participants',
          requirements: 'Requirements',
        },
        messages: {
          register_success: 'Registration successful',
          register_failed: 'Registration failed',
          sign_in_success: 'Sign in successful',
          sign_in_failed: 'Sign in failed',
        },
      },
      
      // Volunteer
      volunteer: {
        title: 'Volunteer Service',
        check_in: 'Check In',
        check_out: 'Check Out',
        hours: 'Hours',
        total_hours: 'Total Hours',
        current_status: 'Current Status',
        status: {
          checked_out: 'Checked Out',
          checked_in: 'Working',
          not_started: 'Not Started',
        },
        history: 'Work History',
        statistics: 'Hour Statistics',
        messages: {
          check_in_success: 'Check in successful',
          check_out_success: 'Check out successful',
          check_in_failed: 'Check in failed',
          check_out_failed: 'Check out failed',
        },
      },
      
      // Profile
      profile: {
        title: 'Profile',
        info: {
          username: 'Username',
          legal_name: 'Legal Name',
          nick_name: 'English Name',
          email: 'Email',
          phone: 'Phone',
          school: 'School',
          role: 'Role',
          join_date: 'Join Date',
        },
        settings: {
          title: 'Settings',
          language: 'Language',
          theme: 'Theme',
          notifications: 'Notifications',
          privacy: 'Privacy',
          about: 'About Us',
        },
        edit: {
          title: 'Edit Profile',
          save_success: 'Save successful',
          save_failed: 'Save failed',
        },
      },
      
      // Validation and errors
      validation: {
        required: 'This field is required',
        invalid_email: 'Please enter a valid email address',
        invalid_phone: 'Please enter a valid phone number',
        password_mismatch: 'Passwords do not match',
        min_length: 'Minimum {{min}} characters required',
        max_length: 'Maximum {{max}} characters allowed',
        invalid_format: 'Invalid format',
      },
      
      errors: {
        network_error: 'Network connection failed',
        server_error: 'Server error',
        not_found: 'Page not found',
        unauthorized: 'Unauthorized access',
        forbidden: 'Access forbidden',
        timeout: 'Request timeout',
        unknown_error: 'Unknown error',
      },
    },
  },
};

i18n
  .use(HttpApi) // 从服务器加载翻译
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    resources,
    
    // 语言配置
    fallbackLng: 'zh-CN',
    debug: process.env.NODE_ENV === 'development',
    
    // 插值配置
    interpolation: {
      escapeValue: false, // React 已经进行了 XSS 防护
    },
    
    // 检测器配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    // HTTP 后端配置
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;