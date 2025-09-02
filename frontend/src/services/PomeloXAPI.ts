// PomeloX Backend API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentToken } from './authAPI';
import { Platform, DeviceEventEmitter } from 'react-native';
import { notifyRegistrationSuccess, scheduleActivityReminder } from './smartAlertSystem';

const BASE_URL = 'http://106.14.165.234:8085';

// 检测是否为iOS模拟器
const isIOSSimulator = Platform.OS === 'ios' && __DEV__;

// 🚀 性能优化：智能网络重试工具
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 尝试请求 (第${i + 1}/${maxRetries}次): ${url}`);
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      console.warn(`⚠️ 第${i + 1}次请求失败:`, error.message);
      
      // 🚀 智能重试判断：某些错误不值得重试
      const shouldRetry = !error.message.includes('AbortError') && 
                         !error.message.includes('AUTH') &&
                         i < maxRetries - 1;
      
      if (!shouldRetry) {
        throw error;
      }
      
      // 🚀 优化重试延迟：使用指数退避但上限更低 (500ms, 1s)
      const delay = Math.min(500 * Math.pow(2, i), 1000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('所有重试都失败了');
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
}

interface LoginData {
  userName: string;
  password: string;
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
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 API请求携带token:', { endpoint, hasToken: true });
    } else {
      console.warn('⚠️ API请求无token:', endpoint);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
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
  async sendSMSVerification(phone: string): Promise<SMSResponse> {
    const response = await fetch(`${BASE_URL}/sms/vercodeSms?phoneNum=${phone}`, {
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
    const response = await fetch(`${BASE_URL}/app/dept/list`, {
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
      deptIdType: typeof data.deptId
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
    
    if (data.verCode) formData.append('verCode', data.verCode);
    if (data.invCode) formData.append('invCode', data.invCode);
    if (data.bizId) formData.append('bizId', data.bizId);
    if (data.orgId) formData.append('orgId', data.orgId);
    
    console.log('🌐 发送到后端的最终参数:', [...formData.entries()].reduce((acc, [key, value]) => {
      acc[key] = key === 'password' ? '[HIDDEN]' : value;
      return acc;
    }, {} as any));
    
    const response = await fetch(`${BASE_URL}/app/user/add`, {
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
    console.log('🔐 PomeloXAPI.login 调用参数:', { userName: data.userName, password: '[HIDDEN]' });
    
    // 使用form-urlencoded格式，不是JSON
    const formData = new URLSearchParams();
    formData.append('username', data.userName);
    formData.append('password', data.password);
    
    console.log('📝 发送到后端的参数:', { username: data.userName, password: '[HIDDEN]' });
    
    const response = await fetch(`${BASE_URL}/app/login`, {
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
      children: any[];
    };
    roles: Array<{
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
    }>;
    roleIds: number[] | null;
    postIds: number[] | null;
    roleId: number | null;
    verCode: string | null;
    invCode: string | null;
    bizId: string | null;
    orgId: string | null;
    admin: boolean;
  }>> {
    // 如果提供了userId，添加查询参数
    const endpoint = userId ? `/app/user/info?userId=${userId}` : '/app/user/info';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * 获取活动列表（公开接口，无需认证）
   */
  async getActivityList(params?: {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    status?: number;
    categoryId?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    total: number;
    rows: Array<{
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
    }>;
  }>> {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.name) queryParams.append('name', params.name);
      if (params.status) queryParams.append('status', params.status.toString());
      if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
      if (params.startTime) queryParams.append('startTime', params.startTime);
      if (params.endTime) queryParams.append('endTime', params.endTime);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/app/activity/list?${queryString}` : '/app/activity/list';
    
    // 尝试获取用户token以获取个性化数据（如报名状态）
    const token = await getCurrentToken();
    console.log(`🔐 活动列表API调用:`, { 
      endpoint: `${BASE_URL}${endpoint}`,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 🚀 优化：8秒超时
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PomeloX/1.0.0 (iOS)', // 添加User-Agent
    };
    
    // 如果用户已登录，添加认证头获取个性化数据
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`🌐 发起网络请求:`, { 
      url: `${BASE_URL}${endpoint}`,
      method: 'GET',
      headers: Object.keys(headers),
    });
    
    let response;
    try {
      // 🚨 iOS模拟器网络兼容性修复
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers,
        signal: controller.signal,
        credentials: 'omit',
        // 添加iOS模拟器特定配置
        cache: 'no-cache',
        mode: 'cors',
        redirect: 'follow',
      };
      
      // iOS模拟器特殊处理
      if (isIOSSimulator) {
        console.log('🍎 检测到iOS模拟器，使用兼容性网络配置');
        // 移除可能导致问题的配置
        delete (fetchOptions as any).mode;
        delete (fetchOptions as any).credentials;
        
        // 增加超时时间
        clearTimeout(timeoutId);
        const newTimeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      }
      
      console.log('📡 最终请求配置:', {
        url: `${BASE_URL}${endpoint}`,
        options: {
          ...fetchOptions,
          signal: '[AbortController]'
        }
      });
      
      response = await fetchWithRetry(`${BASE_URL}${endpoint}`, fetchOptions, 3);
      
      clearTimeout(timeoutId);
      console.log(`✅ API响应成功: ${response.status}`);
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error(`❌ 网络请求失败:`, {
        name: fetchError.name,
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack?.split('\n')[0] // 只显示第一行堆栈
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
    console.log('📥 活动列表API响应:', {
      code: result.code,
      msg: result.msg,
      total: result.total || 0,
      rowsCount: result.rows?.length || 0,
      firstActivitySignStatus: result.rows?.[0]?.signStatus,
      hasPersonalizedData: result.rows?.some((activity: any) => activity.signStatus !== undefined)
    });
    
    // 详细记录每个活动的signStatus（仅前3个）
    if (result.rows && result.rows.length > 0) {
      const sampleActivities = result.rows.slice(0, 3);
      console.log('📋 活动signStatus样本:', sampleActivities.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        signStatus: activity.signStatus,
        type: activity.type
      })));
    }
    
    return result;
  }

  /**
   * 活动报名
   */
  async enrollActivity(activityId: number, userId: number): Promise<ApiResponse<number>> {
    try {
      const response = await this.request(`/app/activity/enroll?activityId=${activityId}&userId=${userId}`, {
        method: 'GET',
      });

      // 报名成功后发送本地通知
      if (response.code === 200) {
        // 获取活动信息用于通知
        try {
          const activityResponse = await this.getActivityList(1, 10, userId);
          const activity = activityResponse.data?.rows?.find((a: any) => a.id === activityId);
          
          if (activity) {
            // 发送即时成功通知
            await notifyRegistrationSuccess(activity.name);
            
            // 安排活动提醒
            await scheduleActivityReminder(activity);
          }
        } catch (notificationError) {
          console.error('发送报名通知失败:', notificationError);
          // 不影响报名流程
        }

        // 发送事件给其他组件刷新数据
        DeviceEventEmitter.emit('activityRegistered', { activityId, userId });
      }

      return response;
    } catch (error) {
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
    rows: Array<{
      id: number;
      name: string;
      createTime: string;
    }>;
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
    rows: Array<{
      id: number;
      userId: number;
      startTime: string;
      endTime: string;
      type: number;
      operateUserId: number | null;
      operateLegalName: string | null;
      legalName: string;
    }>;
  }>> {
    return this.request('/app/hour/recordList', { method: 'GET' });
  }

  /**
   * 志愿者工时统计
   */
  async getVolunteerHours(): Promise<ApiResponse<{
    total: number;
    rows: Array<{
      userId: number;
      totalMinutes: number;
      legalName: string;
    }>;
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
    rows: Array<{
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
    }>;
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
      endpoint: `${BASE_URL}${endpoint}`
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
      'vita_access_token',
      'vita_user_id',
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
  async getPostList(): Promise<ApiResponse<Array<{
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
  }>>> {
    console.log('🔍 获取职位列表 API调用');
    return this.request('/app/post/list', { method: 'GET' });
  }
}

export const pomeloXAPI = new PomeloXAPI();
export default pomeloXAPI;