// 网络请求助手 - 专门处理PomeloX API调用

// 🚨 紧急修复：生产环境强制使用生产API
const BASE_URL = 'https://www.vitaglobal.icu';

/**
 * 简化的网络请求方法，专门针对React Native优化
 */
export const simpleApiCall = async (endpoint: string, options: {
  method?: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
} = {}): Promise<any> => {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = 10000
  } = options;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('请求超时'));
    }, timeout);

    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      ...headers,
    };

    if (body && method === 'POST') {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method === 'POST') {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`🌐 请求: ${method} ${BASE_URL}${endpoint}`);
    console.log('📤 请求头:', requestHeaders);
    
    fetch(`${BASE_URL}${endpoint}`, requestOptions)
      .then(response => {
        clearTimeout(timeoutId);
        console.log(`📥 响应状态: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log('📊 响应数据:', data);
        resolve(data);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('❌ 网络错误:', error);
        reject(error);
      });
  });
};

/**
 * 获取活动列表的简化版本
 */
export const getActivityListSimple = async (params?: {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  categoryId?: number;
}): Promise<any> => {
  let endpoint = '/app/activity/list';
  
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.name) queryParams.append('name', params.name);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
    
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += '?' + queryString;
    }
  }
  
  return simpleApiCall(endpoint, { method: 'GET' });
};