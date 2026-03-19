// PomeloX Backend API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentToken } from './authAPI';
import { Platform, DeviceEventEmitter } from 'react-native';
import { notifyRegistrationSuccess, scheduleActivityReminder } from './smartAlertSystem';
import { getApiUrl } from '../utils/environment';

// 🔧 使用环境管理器统一管理API地址 - 动态获取
const getBaseUrl = () => getApiUrl();

// 检测是否为iOS模拟器
const isIOSSimulator = Platform.OS === 'ios' && __DEV__;

// 🚀 基本网络重试工具
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      console.warn(`⚠️ 第${i + 1}次请求失败:`, error.message);

      // 基本重试逻辑：非中止错误且未达到最大重试次数
      const shouldRetry = !error.message.includes('AbortError') && i < maxRetries - 1;

      if (!shouldRetry) {
        throw error;
      }

      // 简单的重试延迟
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  throw new Error('网络请求失败');
};

interface ApiResponse<T = any> {
  msg: string;
  code: number;
  data?: T;
}

interface RegisterData {
  userName: string;
  legalName: string;
  nickName: string;
  password: string;
  phonenumber: string;
  email: string;
  sex: string;
  deptId?: string; // 可选字段，不传则用户默认角色为common
  verCode?: string;
  invCode?: string;
  bizId?: string;
  orgId?: string;
  area?: string; // 地域选择：zh-中国，en-美国
  areaCode?: string; // 新增：区域代码，用于区分中国和美国手机号码
}

interface LoginData {
  userName: string;
  password: string;
  areaCode?: string; // 新增：区域代码，用于区分中国和美国手机号码
}

interface APISchoolData {
  createBy?: string;
  createTime?: string;
  updateBy?: string | null;
  updateTime?: string | null;
  remark?: string | null;
  deptId: number;
  parentId: number;
  ancestors: string;
  deptName: string;
  orderNum: number;
  leader?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  delFlag?: string;
  parentName?: string | null;
  logo?: string | null;
  engName?: string | null;
  aprName?: string | null;
  mailDomain?: string | null; // 🆕 新增邮箱后缀字段
  children: APISchoolData[];
}

interface SMSResponse {
  bizId: string;
  code: string;
  message: string;
  requestId: string;
}

class PomeloXAPI {
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await getCurrentToken(); // 使用统一的token获取函数

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 API请求携带token:', { endpoint, hasToken: true });
    } else {
      console.warn('⚠️ API请求无token:', endpoint);
    }

    try {
      const response = await fetchWithRetry(`${getBaseUrl()}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API Request Error:', error);
      throw new Error('网络连接失败');
    }
  }

  // 公开接口（无需认证）

  /**
   * 获取验证码图片
   */
  async getCaptcha(): Promise<ApiResponse<{
    img: string;
    uuid: string;
    captchaEnabled: boolean;
  }>> {
    return this.request('/captchaImage', { method: 'GET' });
  }

  /**
   * 发送短信验证码
   */
  async sendSMSVerification(phone: string, areaCode: string = '86'): Promise<SMSResponse> {
    const response = await fetchWithRetry(`${getBaseUrl()}/sms/vercodeSms?phoneNum=${phone}&areaCode=${areaCode}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('发送验证码失败');
    }

    return response.json();
  }

  /**
   * 获取学校列表 (公开接口，无需认证)
   */
  async getSchoolList(): Promise<ApiResponse<APISchoolData[]>> {
    const response = await fetchWithRetry(`${getBaseUrl()}/app/dept/list`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 获取学校列表失败`);
    }

    return response.json();
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<ApiResponse> {
    console.log('📝 PomeloXAPI.register 接收到的数据:', {
      ...data,
      password: '[HIDDEN]',
      deptId: data.deptId,
      deptIdType: typeof data.deptId,
      areaCode: data.areaCode
    });

    // 使用form-urlencoded格式
    const formData = new URLSearchParams();
    formData.append('userName', data.userName);
    formData.append('legalName', data.legalName);
    formData.append('nickName', data.nickName);
    formData.append('password', data.password);
    formData.append('phonenumber', data.phonenumber);
    formData.append('email', data.email);
    formData.append('sex', data.sex);

    // 只有提供deptId时才添加，不传则用户默认角色为common
    if (data.deptId) {
      formData.append('deptId', data.deptId);
      console.log('✅ deptId已添加到请求:', data.deptId);
    } else {
      console.log('⚠️ deptId为空，用户将没有学校关联');
    }

    // 新增：添加areaCode参数支持
    if (data.areaCode) {
      formData.append('areaCode', data.areaCode);
      console.log('✅ areaCode已添加到请求:', data.areaCode);
    }

    if (data.verCode) formData.append('verCode', data.verCode);
    if (data.invCode) formData.append('invCode', data.invCode);
    if (data.bizId) formData.append('bizId', data.bizId);
    if (data.orgId) formData.append('orgId', data.orgId);
    if (data.area) formData.append('area', data.area);

    console.log('🌐 发送到后端的最终参数:', [...formData.entries()].reduce((acc, [key, value]) => {
      acc[key] = key === 'password' ? '[HIDDEN]' : value;
      return acc;
    }, {} as any));

    const response = await fetchWithRetry(`${getBaseUrl()}/app/user/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 注册失败`);
    }

    return response.json();
  }

  /**
   * 用户登录
   */
  async login(data: LoginData): Promise<ApiResponse<{
    userId: number;
    token: string;
  }>> {
    console.log('🔐 PomeloXAPI.login 调用参数:', { userName: data.userName, password: '[HIDDEN]', areaCode: data.areaCode });

    // 使用form-urlencoded格式，不是JSON
    const formData = new URLSearchParams();
    formData.append('username', data.userName);
    formData.append('password', data.password);

    // 新增：添加areaCode参数支持
    if (data.areaCode) {
      formData.append('areaCode', data.areaCode);
    }

    console.log('📝 发送到后端的参数:', { username: data.userName, password: '[HIDDEN]', areaCode: data.areaCode });

    const response = await fetchWithRetry(`${getBaseUrl()}/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 登录失败`);
    }

    const result = await response.json();

    // 保存token - 使用统一的键名
    if (result.code === 200 && result.data?.token) {
      await AsyncStorage.setItem('@pomelox_token', result.data.token);
      await AsyncStorage.setItem('@pomelox_user_id', result.data.userId.toString());
    }

    return result;
  }

  /**
   * 管理员登录
   */
  async adminLogin(data: {
    username: string;
    password: string;
    code: string;
    uuid: string;
  }): Promise<ApiResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 忘记密码 - 发送重置密码验证码
   * @param phone 手机号码
   * @param areaCode 区域代码 (可选，用于区分中国和美国手机号码)
   */
  async sendPasswordResetCode(phone: string, areaCode?: string): Promise<ApiResponse> {
    console.log('📱 [PomeloXAPI] 发送忘记密码验证码开始:', {
      phone: phone,
      areaCode: areaCode,
      phonePrefix: phone.substring(0, 3),
      timestamp: new Date().toISOString()
    });

    const formData = new URLSearchParams();
    formData.append('phone', phone);

    if (areaCode) {
      formData.append('areaCode', areaCode);
    }

    // 根据API文档，使用分开的phoneNum和areaCode参数
    const apiAreaCode = areaCode === 'CN' ? '86' : '1';
    const smsUrl = `${getBaseUrl()}/sms/vercodeSms?phoneNum=${phone}&areaCode=${apiAreaCode}`;

    console.log('🌐 [PomeloXAPI] 发送短信验证码请求详情:', {
      url: smsUrl,
      baseUrl: getBaseUrl(),
      phoneNum: phone,
      areaCode: apiAreaCode,
      originalAreaCode: areaCode,
      phonePrefix: phone.substring(0, 3),
      phoneLength: phone.length
    });

    let response;
    try {
      response = await fetchWithRetry(smsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📥 [PomeloXAPI] 忘记密码HTTP响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

    } catch (networkError: any) {
      console.error('❌ [PomeloXAPI] 网络请求失败:', {
        error: networkError.message,
        phone: phone,
        prefix: phone.substring(0, 3),
        url: smsUrl
      });
      throw new Error(`网络请求失败: ${networkError.message}`);
    }

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        console.warn('无法读取错误响应内容');
      }

      console.error('❌ [PomeloXAPI] HTTP错误详情:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        phone: phone,
        prefix: phone.substring(0, 3)
      });

      throw new Error(`HTTP ${response.status}: 发送验证码失败 - ${errorText || response.statusText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError: any) {
      console.error('❌ [PomeloXAPI] JSON解析失败:', parseError);
      throw new Error('服务器响应格式错误');
    }

    console.log('📋 [PomeloXAPI] 忘记密码响应数据详情:', {
      result: result,
      code: result.code,
      codeType: typeof result.code,
      message: result.message,
      msg: result.msg,
      bizId: result.bizId,
      phone: phone,
      prefix: phone.substring(0, 3)
    });

    // 分析响应结果
    if (result.code !== "OK" && result.code !== 200) {
      console.warn('⚠️ [PomeloXAPI] 业务逻辑失败:', {
        code: result.code,
        message: result.message || result.msg,
        phone: phone,
        prefix: phone.substring(0, 3)
      });
    }

    return result;
  }

  /**
   * 重置密码
   */
  async resetPassword(data: {
    phonenumber: string;
    verCode: string;
    bizId: string;
    password: string;
    areaCode: string;
  }): Promise<ApiResponse> {
    // 转换区号格式：CN/US -> 86/1
    let cleanAreaCode: string;
    if (data.areaCode === 'CN' || data.areaCode === '+86') {
      cleanAreaCode = '86';
    } else if (data.areaCode === 'US' || data.areaCode === '+1') {
      cleanAreaCode = '1';
    } else {
      cleanAreaCode = data.areaCode.replace('+', '');
    }

    // 构建form-data格式的请求体
    const formData = new URLSearchParams();
    formData.append('phonenumber', data.phonenumber);
    formData.append('verCode', data.verCode);
    formData.append('bizId', data.bizId);
    formData.append('password', data.password);
    formData.append('areaCode', cleanAreaCode);

    console.log('🔐 [PomeloXAPI.resetPassword] 请求参数:', {
      phonenumber: data.phonenumber,
      verCode: data.verCode,
      bizId: data.bizId,
      areaCode: `${data.areaCode} -> ${cleanAreaCode}`,
      passwordLength: data.password.length,
      body: formData.toString(),
    });

    const response = await fetchWithRetry(`${getBaseUrl()}/app/resetPwd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error('重置密码失败');
    }

    return response.json();
  }

  /**
   * 通过邮箱重置密码（后端接口就绪后即可工作）
   */
  async resetPasswordByEmail(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append('email', data.email);
    formData.append('password', data.password);

    console.log('🔐 [PomeloXAPI.resetPasswordByEmail] 请求参数:', {
      email: data.email,
      passwordLength: data.password.length,
    });

    const response = await fetchWithRetry(`${getBaseUrl()}/app/resetPwd`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error('重置密码失败');
    }

    return response.json();
  }

  // 需要认证的接口

  /**
   * 获取用户信息 - 根据截图需要userId参数
   */
  async getUserInfo(userId?: number): Promise<ApiResponse<{
    createBy: string;
    createTime: string;
    updateBy: string | null;
    updateTime: string | null;
    remark: string | null;
    userId: number;
    deptId: number;
    legalName: string;
    userName: string;
    nickName: string;
    email: string;
    phonenumber: string;
    sex: string;
    avatar: string;
    password: string;
    status: string;
    delFlag: string;
    loginIp: string;
    loginDate: string;
    pwdUpdateDate: string | null;
    admin: boolean; // 🆕 管理员标识
    orgId: number | null; // 🆕 组织ID
    dept: {
      createBy: string | null;
      createTime: string | null;
      updateBy: string | null;
      updateTime: string | null;
      remark: string | null;
      deptId: number;
      parentId: number;
      ancestors: string;
      deptName: string;
      orderNum: number;
      leader: string | null;
      phone: string | null;
      email: string | null;
      status: string;
      delFlag: string | null;
      parentName: string | null;
      engName?: string | null; // 🆕 英文名
      aprName?: string | null; // 🆕 缩写
      mailDomain?: string | null; // 🆕 邮箱后缀
      childrenDept?: any | null; // 🆕 子部门
      children: any[];
    };
    roles: {
      createBy: string | null;
      createTime: string | null;
      updateBy: string | null;
      updateTime: string | null;
      remark: string | null;
      roleId: number;
      roleName: string;
      roleKey: string;
      roleSort: number;
      dataScope: string;
      menuCheckStrictly: boolean;
      deptCheckStrictly: boolean;
      status: string;
      delFlag: string | null;
      flag: boolean;
      menuIds: string | null;
      deptIds: string | null;
      permissions: string | null;
      admin: boolean;
    }[];
    role?: { // 🆕 单个角色对象
      roleId: number;
      roleName: string;
      roleKey: string;
      admin: boolean;
    };
    post?: { // 🆕 岗位信息
      postId: number;
      postCode: string;
      postName: string;
      postSort: number;
    };
    roleIds: number[] | null;
    postIds: number[] | null;
    roleId: number | null;
    verCode: string | null;
    invCode: string | null;
    bizId: string | null;
  }>> {
    // 如果提供了userId，添加查询参数
    const endpoint = userId ? `/app/user/info?userId=${userId}` : '/app/user/info';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * 获取活动列表 - 支持访客模式和登录模式
   * @param params.userId 可选 - 提供时返回个性化数据，不提供时返回基础列表
   */
  async getActivityList(params: {
    pageNum?: number;
    pageSize?: number;
    userId?: number; // 🔧 改为可选参数，支持访客模式
    name?: string;
    status?: number;
    categoryId?: number;
    startTime?: string;
    endTime?: string;
    deptId?: number;
    accessRoleKey?: string; // 按角色过滤活动访问权限
    actType?: number; // 活动类型: 4-证书申请
  }): Promise<ApiResponse<{
    total: number;
    rows: {
      id: number;
      name: string;
      icon: string;
      startTime: string;
      endTime: string;
      address: string;
      enrollment: number;
      detail: string;
      signStartTime: string;
      signEndTime: string;
      enabled: number;
      createUserId: number;
      createName: string;
      createNickName: string;
      signStatus?: number; // 0-未报名，-1-已报名未签到，1-已签到
      type?: number; // -1-即将开始，1-已开始，2-已结束
      timeZone?: string; // 🆕 时区信息
      registerCount?: number; // 🆕 活动已报名人数
    }[];
  }>> {
    // 构建查询参数
    const queryParams = new URLSearchParams();

    // 🔧 userId现在是可选参数 - 支持访客模式
    if (params.userId) {
      queryParams.append('userId', params.userId.toString());
      console.log('🔐 个性化活动列表模式:', { userId: params.userId });
    } else {
      console.log('👤 访客模式活动列表');
    }

    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.name) queryParams.append('name', params.name);
    if (params.status) queryParams.append('status', params.status.toString());
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    if (params.startTime) queryParams.append('startTime', params.startTime);
    if (params.endTime) queryParams.append('endTime', params.endTime);
    if (params.deptId) queryParams.append('deptId', params.deptId.toString());
    if (params.accessRoleKey) queryParams.append('accessRoleKey', params.accessRoleKey);
    if (params.actType !== undefined) queryParams.append('actType', params.actType.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/app/activity/list?${queryString}` : '/app/activity/list';

    // 🔧 灵活的token处理 - 支持访客模式
    const token = await getCurrentToken();
    const isGuestMode = !params.userId || !token;

    console.log(`🔐 活动列表API调用:`, {
      endpoint: `${getBaseUrl()}${endpoint}`,
      mode: isGuestMode ? '访客模式' : '个性化模式',
      hasToken: !!token,
      hasUserId: !!params.userId,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
    });

    // 🔧 简化网络请求，移除AbortController超时机制
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PomeloX/1.0.0 (iOS)',
    };

    // 只有在个性化模式下才添加认证头
    if (!isGuestMode && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🌐 发起网络请求:`, {
      url: `${getBaseUrl()}${endpoint}`,
      method: 'GET',
      mode: isGuestMode ? '访客模式' : '个性化模式'
    });

    let response;
    try {
      // 🔧 简化的网络请求配置
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers,
        // 移除AbortController，让系统处理超时
      };

      console.log('📡 发起网络请求:', { url: `${getBaseUrl()}${endpoint}` });

      response = await fetchWithRetry(`${getBaseUrl()}${endpoint}`, fetchOptions, 3);

      console.log(`✅ API响应成功: ${response.status}`);

    } catch (fetchError: any) {
      console.error(`❌ 网络请求失败:`, {
        name: fetchError.name,
        message: fetchError.message,
        cause: fetchError.cause
      });

      // 根据错误类型提供更具体的错误信息
      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      } else if (fetchError.message?.includes('Network request failed')) {
        throw new Error('网络连接失败，请检查网络设置或切换网络');
      } else if (fetchError.message?.includes('timeout')) {
        throw new Error('网络超时，请稍后重试');
      } else {
        throw new Error(`网络错误: ${fetchError.message}`);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} 错误:`, errorText);
      throw new Error(`HTTP ${response.status}: 获取活动列表失败`);
    }

    const result = await response.json();

    // 🚨 处理后端SQL查询错误的fallback机制
    if (result.code === 500 && result.msg?.includes('Subquery returns more than 1 row')) {
      console.warn('⚠️ [FALLBACK] 个性化活动列表查询失败，立即 fallback 到基础列表');

      // Fallback: 调用不带userId的基础活动列表
      const fallbackParams = new URLSearchParams();
      if (params.pageNum) fallbackParams.append('pageNum', params.pageNum.toString());
      if (params.pageSize) fallbackParams.append('pageSize', params.pageSize.toString());
      if (params.name) fallbackParams.append('name', params.name);
      if (params.categoryId) fallbackParams.append('categoryId', params.categoryId.toString());
      if (params.startTime) fallbackParams.append('startTime', params.startTime);
      if (params.endTime) fallbackParams.append('endTime', params.endTime);

      const fallbackEndpoint = `/app/activity/list?${fallbackParams.toString()}`;

      // 🔧 Fallback 请求不再使用重试，直接获取
      const fallbackResponse = await fetch(`${getBaseUrl()}${fallbackEndpoint}`, {
        method: 'GET',
        headers: headers,
      });

      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        console.log('✅ [FALLBACK] 基础活动列表获取成功');
        return fallbackResult;
      } else {
        throw new Error('Fallback API also failed');
      }
    }

    console.log('📥 活动列表API响应:', {
      code: result.code,
      msg: result.msg,
      total: result.total || 0,
      rowsCount: result.rows?.length || 0,
      firstActivitySignStatus: result.rows?.[0]?.signStatus,
      firstActivityRegisterCount: result.rows?.[0]?.registerCount,
      hasPersonalizedData: result.rows?.some((activity: any) => activity.signStatus !== undefined),
      hasRegisterCountData: result.rows?.some((activity: any) => activity.registerCount !== undefined)
    });

    // 详细记录每个活动的完整数据（仅前3个）
    if (result.rows && result.rows.length > 0) {
      const sampleActivities = result.rows.slice(0, 3);
      console.log('📋 活动完整数据样本:', sampleActivities.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        enrollment: activity.enrollment,
        registerCount: activity.registerCount,
        timeZone: activity.timeZone,
        signStatus: activity.signStatus,
        type: activity.type
      })));
    }

    return result;
  }

  /**
   * 活动报名
   */
  async enrollActivity(activityId: number, userId: number, isCancel?: boolean, shareUserId?: number): Promise<ApiResponse<number>> {
    try {
      // 🔧 参数验证和类型转换
      const validActivityId = Number(activityId);
      const validUserId = Number(userId);

      if (!validActivityId || !validUserId || validActivityId <= 0 || validUserId <= 0) {
        throw new Error(`参数无效: activityId=${activityId}, userId=${userId}`);
      }

      const action = isCancel ? '取消报名' : '报名';
      console.log(`🌐 [PomeloXAPI] 发起活动${action}请求:`, {
        originalParams: { activityId, userId, isCancel, shareUserId },
        validatedParams: { activityId: validActivityId, userId: validUserId, isCancel },
        url: `/app/activity/enroll?activityId=${validActivityId}&userId=${validUserId}${isCancel ? '&isCancel=1' : ''}`,
        method: 'GET',
        timestamp: new Date().toISOString()
      });

      // 构建请求URL，根据isCancel参数决定是否添加isCancel=1
      let url = `/app/activity/enroll?activityId=${validActivityId}&userId=${validUserId}${isCancel ? '&isCancel=1' : ''}`;
      if (shareUserId && shareUserId > 0) {
        url += `&shareUserId=${shareUserId}`;
      }

      const response = await this.request(url, {
        method: 'GET',
      });

      console.log(`📡 [PomeloXAPI] 活动${action}响应:`, {
        response,
        success: response.code === 200 && response.data > 0,
        code: response.code,
        data: response.data,
        actualSuccess: response.code === 200 && response.data > 0,
        timestamp: new Date().toISOString()
      });

      // 🔧 根据API文档修复：只有当 code=200 且 data>0 时才算真正成功
      const isActuallySuccessful = response.code === 200 && response.data != null && response.data > 0;

      if (!isActuallySuccessful) {
        console.error(`❌ [PomeloXAPI] 活动${action}失败:`, {
          code: response.code,
          data: response.data,
          msg: response.msg,
          reason: response.code !== 200 ? 'HTTP错误' : 'data值无效（应>0）'
        });
        throw new Error(`活动${action}失败: ${response.msg || '未知错误'}`);
      }

      // 操作成功后的处理
      if (isActuallySuccessful) {
        if (!isCancel) {
          // 通知系统
          await notifyRegistrationSuccess(validActivityId);

          // 发送报名事件 - 使用React Native事件
          DeviceEventEmitter.emit('activityRegistered', { activityId, userId });
        } else {
          // 发送取消报名事件 - 使用React Native事件
          DeviceEventEmitter.emit('activityCancelled', { activityId, userId });
        }
      }

      return response;
    } catch (error: any) {
      console.error(`💥 [PomeloXAPI] 活动${isCancel ? '取消报名' : '报名'}异常:`, error);
      throw error;
    }
  }

  /**
   * 获取活动报名列表 - 返回报名用户的userId等信息
   */
  async getActivitySignList(activityId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/app/activity/actSignList?activityId=${activityId}`, { method: 'GET' });
  }

  /**
   * 获取单个活动详情 (通过活动列表API筛选)
   */
  async getActivityById(activityId: number, userId?: number): Promise<any | null> {
    try {
      const params: any = { pageNum: 1, pageSize: 1 };
      if (userId) params.userId = userId;
      const result = await this.getActivityList(params);
      // Search in a larger set if not found
      const allResult = await this.getActivityList({ pageNum: 1, pageSize: 100, userId });
      if (allResult.code === 200 && allResult.data?.rows) {
        const found = allResult.data.rows.find((a: any) => a.id === activityId);
        return found || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 提交活动报名表单 (动态表单)
   * @param activityId 活动ID
   * @param userId 用户ID
   * @param formData 表单数据
   */
  async submitActivityRegistration(activityId: number, userId: number, formData: any, shareUserId?: number): Promise<ApiResponse<number>> {
    try {
      console.log('📝 [PomeloXAPI] 提交活动报名表单:', { activityId, userId, formData, shareUserId });

      // 将formData转为JSON字符串并URL编码，使用GET方式提交
      const formDataStr = encodeURIComponent(JSON.stringify(formData));
      let url = `/app/activity/enroll?activityId=${activityId}&userId=${userId}&formData=${formDataStr}`;
      if (shareUserId && shareUserId > 0) {
        url += `&shareUserId=${shareUserId}`;
      }

      const response = await this.request(url, {
        method: 'GET',
      });

      if (response.code === 200 && response.data != null && Number(response.data) > 0) {
        // 成功，触发相关的通知逻辑
        try {
          await notifyRegistrationSuccess(activityId);
          DeviceEventEmitter.emit('activityRegistered', { activityId, userId });
        } catch (e) {
          console.warn('⚠️ [PomeloXAPI] 通知失败:', e);
        }
      }

      return response;
    } catch (error) {
      console.error('💥 [PomeloXAPI] 提交报名表单失败:', error);
      throw error;
    }
  }
  /**
   * 活动签到
   */
  async signInActivity(activityId: number, userId: number): Promise<ApiResponse<number>> {
    return this.request(`/app/activity/signIn?activityId=${activityId}&userId=${userId}`, {
      method: 'GET',
    });
  }

  /**
   * 检查用户活动报名状态
   */
  async getSignInfo(activityId: number, userId: number): Promise<ApiResponse<number>> {
    return this.request(`/app/activity/getSignInfo?activityId=${activityId}&userId=${userId}`, {
      method: 'GET',
    });
  }

  /**
   * 获取组织列表
   */
  async getOrganizationList(): Promise<ApiResponse<{
    total: number;
    rows: {
      id: number;
      name: string;
      createTime: string;
    }[];
  }>> {
    return this.request('/app/organization/list', { method: 'GET' });
  }

  // 管理员接口

  /**
   * 查询邀请码信息
   */
  async getInvitationInfo(): Promise<ApiResponse<{
    id: number;
    userId: number;
    invCode: string;
  }>> {
    return this.request('/app/invitation/invInfo', { method: 'POST' });
  }

  /**
   * 生成邀请码
   */
  async generateInvitation(): Promise<ApiResponse> {
    return this.request('/app/invitation/addInv', { method: 'POST' });
  }

  /**
   * 重新生成邀请码
   */
  async resetInvitation(): Promise<ApiResponse> {
    return this.request('/app/invitation/resetInv', { method: 'POST' });
  }

  /**
   * 志愿者打卡记录列表
   */
  async getVolunteerRecords(): Promise<ApiResponse<{
    total: number;
    rows: {
      id: number;
      userId: number;
      startTime: string;
      endTime: string;
      type: number;
      operateUserId: number | null;
      operateLegalName: string | null;
      legalName: string;
    }[];
  }>> {
    return this.request('/app/hour/recordList', { method: 'GET' });
  }

  /**
   * 志愿者工时统计
   */
  async getVolunteerHours(): Promise<ApiResponse<{
    total: number;
    rows: {
      userId: number;
      totalMinutes: number;
      legalName: string;
    }[];
  }>> {
    return this.request('/app/hour/hourList', { method: 'GET' });
  }

  /**
   * 志愿者签到签退
   */
  async volunteerSignRecord(data: {
    userId: number;
    type: number;
  }): Promise<ApiResponse> {
    return this.request('/app/hour/signRecord', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 查看志愿者最后签到记录
   */
  async getLastVolunteerRecord(userId: number): Promise<ApiResponse<{
    id: number;
    userId: number;
    startTime: string;
    endTime: string;
    type: number;
    operateUserId: number;
    operateLegalName: string;
    legalName: string;
  }>> {
    return this.request(`/app/hour/lastRecordList?userId=${userId}`, {
      method: 'GET',
    });
  }

  /**
   * 获取和当前用户相关的活动列表
   */
  async getUserActivityList(userId?: number, signStatus?: number): Promise<ApiResponse<{
    total: number;
    rows: {
      id: number;
      name: string;
      icon: string;
      startTime: string;
      endTime: string;
      address: string;
      enrollment: number;
      detail: string;
      signStartTime: string;
      signEndTime: string;
      enabled: number;
      createUserId: number;
      createName: string;
      createNickName: string;
      signStatus: number; // -1-已报名未签到，1-已报名已签到
      type?: number; // -1-即将开始，1-已开始，2-已结束
    }[];
  }>> {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId.toString());
    if (signStatus !== undefined) queryParams.append('signStatus', signStatus.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/app/activity/userActivitylist?${queryString}` : '/app/activity/userActivitylist';

    console.log('🔍 getUserActivityList API调用详情:', {
      userId,
      signStatus,
      queryString,
      endpoint: `${getBaseUrl()}${endpoint}`
    });

    return this.request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      '@pomelox_token',
      '@pomelox_user_id',
    ]);
  }

  /**
   * 检查是否已登录
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await getCurrentToken();
    return !!token;
  }

  /**
   * 获取职位/岗位列表
   */
  async getPostList(): Promise<ApiResponse<{
    postId: number;
    postCode: string;
    postName: string;
    postSort: number;
    status: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
    remark?: string;
  }[]>> {
    console.log('🔍 获取职位列表 API调用');
    return this.request('/app/post/list', { method: 'GET' });
  }


  /**
   * 专门的邀请码验证接口 - 使用后端新增的校验API
   * @param inviteCode 邀请码
   * @returns 验证结果
   */
  async checkInvitationCode(inviteCode: string): Promise<{
    valid: boolean;
    message: string;
  }> {
    console.log('🔍 使用专门API验证邀请码:', inviteCode);

    try {
      const response = await fetchWithRetry(`${getBaseUrl()}/app/invitation/checkInviteCode?inviteCode=${inviteCode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      console.log('🌐 邀请码验证结果:', { code: result.code, msg: result.msg });

      if (result.code === 200) {
        console.log('✅ 邀请码验证通过');
        return {
          valid: true,
          message: result.msg || '邀请码有效'
        };
      } else {
        console.log('❌ 邀请码验证失败:', result.msg);
        return {
          valid: false,
          message: result.msg || '邀请码无效'
        };
      }

    } catch (error: any) {
      console.error('❌ 邀请码验证API调用失败:', error);
      return {
        valid: false,
        message: '验证过程出错，请检查网络连接'
      };
    }
  }

}

export const pomeloXAPI = new PomeloXAPI();
export default pomeloXAPI;