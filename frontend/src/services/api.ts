// API Service for Pomelo Frontend
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, AuthTokens, User, LoginRequest, RegisterRequest } from '../types/api';
import { getApiUrl } from '../utils/environment';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use environment-managed API URL - dynamically get each time
    this.baseURL = getApiUrl();

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // 重新初始化API客户端以获取最新的环境URL
  private reinitializeClient() {
    const newBaseURL = getApiUrl();
    if (newBaseURL !== this.baseURL) {
      this.baseURL = newBaseURL;
      this.client = axios.create({
        baseURL: this.baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      this.setupInterceptors();
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // 检查并更新环境URL
        this.reinitializeClient();

        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add language preference
        const language = await AsyncStorage.getItem('language_preference') || 'zh-CN';
        config.headers['Accept-Language'] = language;
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearAuth();
            // Here you would navigate to login screen
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      const response = await this.client.post('/auth/login', credentials);
      
      if (response.data.tokens) {
        await this.setAuthTokens(response.data.tokens);
      }
      
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User; message: string }>> {
    try {
      const response = await this.client.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.client.post('/auth/verify-email', { token });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      await this.setAuthTokens(response.data.tokens);
      return response.data.tokens;
    } catch (error) {
      await this.clearAuth();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
    } finally {
      await this.clearAuth();
    }
  }

  // User methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get('/users/me');
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateProfile(profileData: any): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.put('/users/profile', profileData);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Helper methods
  private async setAuthTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.setItem('access_token', tokens.access_token);
    await AsyncStorage.setItem('refresh_token', tokens.refresh_token);
    await AsyncStorage.setItem('token_expires_at', 
      (Date.now() + tokens.expires_in * 1000).toString()
    );
  }

  private async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token', 
      'token_expires_at'
    ]);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    const expiresAt = await AsyncStorage.getItem('token_expires_at');
    
    if (!token || !expiresAt) {
      return false;
    }
    
    const now = Date.now();
    const expiry = parseInt(expiresAt, 10);
    
    return now < expiry;
  }

  private handleError(error: AxiosError): ApiResponse {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: (error.response.data as any)?.error || {
          code: 'API_ERROR',
          message: '服务器错误',
          message_en: 'Server error',
        },
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络连接错误',
          message_en: 'Network connection error',
        },
      };
    } else {
      // Other error
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: '未知错误',
          message_en: 'Unknown error',
        },
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;