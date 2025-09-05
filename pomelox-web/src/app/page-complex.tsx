'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/components/forms/LoginForm';
import { ActivityCard } from '@/components/ui/ActivityCard';
import { QRScanner } from '@/components/common/QRScanner';
import { getActivityList, enrollActivity, signInActivity, getUserInfo } from '@/services/PomeloXAPI';
import { isLoggedIn, getUserInfo as getStoredUserInfo } from '@/services/authAPI';
import { Activity } from '@/services/PomeloXAPI';
import { Calendar, QrCode, Users, Settings, LogOut } from 'lucide-react';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'activities' | 'scanner' | 'profile'>('activities');
  const [showLoginForm, setShowLoginForm] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setIsAuthenticated(loggedIn);
        
        if (loggedIn) {
          const storedUser = await getStoredUserInfo();
          setUser(storedUser);
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 获取活动列表
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await getActivityList(1, 20, user?.id);
        if (response.code === 200) {
          // API返回可能是data或rows，需要兼容处理
          const activities = response.rows || response.data || [];
          // 确保是Activity数组
          const activityList = Array.isArray(activities) 
            ? (Array.isArray(activities[0]) ? activities.flat() : activities)
            : [];
          setActivities(activityList as Activity[]);
        }
      } catch (error) {
        console.error('获取活动列表失败:', error);
      }
    };

    fetchActivities();
  }, [isAuthenticated, user]);

  // 处理登录成功
  const handleLoginSuccess = async (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    setShowLoginForm(false);
    
    // 获取完整用户信息
    try {
      const userInfoResponse = await getUserInfo();
      if (userInfoResponse.code === 200 && userInfoResponse.data) {
        setUser(userInfoResponse.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 处理活动报名
  const handleActivityRegister = async (activityId: number) => {
    if (!user?.id) return;
    
    try {
      const response = await enrollActivity(activityId, user.id);
      if (response.code === 200) {
        // 刷新活动列表
        const updatedActivities = await getActivityList(1, 20, user.id);
        if (updatedActivities.code === 200) {
          const activities = updatedActivities.rows || updatedActivities.data || [];
          const activityList = Array.isArray(activities) 
            ? (Array.isArray(activities[0]) ? activities.flat() : activities)
            : [];
          setActivities(activityList as Activity[]);
        }
      }
    } catch (error) {
      console.error('活动报名失败:', error);
    }
  };

  // 处理活动签到
  const handleActivitySignIn = async (activityId: number) => {
    if (!user?.id) return;
    
    try {
      const response = await signInActivity(activityId, user.id);
      if (response.code === 200) {
        // 刷新活动列表
        const updatedActivities = await getActivityList(1, 20, user.id);
        if (updatedActivities.code === 200) {
          const activities = updatedActivities.rows || updatedActivities.data || [];
          const activityList = Array.isArray(activities) 
            ? (Array.isArray(activities[0]) ? activities.flat() : activities)
            : [];
          setActivities(activityList as Activity[]);
        }
      }
    } catch (error) {
      console.error('活动签到失败:', error);
    }
  };

  // 处理QR扫码结果
  const handleQRResult = (result: string) => {
    console.log('扫码结果:', result);
    // 这里可以处理各种QR码类型
    alert(`扫码结果: ${result}`);
  };

  // 处理登出
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('activities');
  };

  // 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 语言切换 */}
          <div className="mb-4 text-right">
            <button
              onClick={toggleLanguage}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {i18n.language === 'zh-CN' ? 'English' : '中文'}
            </button>
          </div>
          
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">PomeloX</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.legalName || user?.username}
              </span>
              <button
                onClick={toggleLanguage}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {i18n.language === 'zh-CN' ? 'EN' : '中文'}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 z-40">
        <div className="container-custom">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => setCurrentView('activities')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                currentView === 'activities' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-xs mt-1">{t('activities.title')}</span>
            </button>
            
            <button
              onClick={() => setCurrentView('scanner')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                currentView === 'scanner' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="w-6 h-6" />
              <span className="text-xs mt-1">扫码</span>
            </button>
            
            <button
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                currentView === 'profile' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs mt-1">{t('profile.title')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="pb-20 pt-4">
        <div className="container-custom">
          {currentView === 'activities' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('activities.list.title')}</h2>
                <p className="text-gray-600">发现精彩活动，参与社区生活</p>
              </div>
              
              {activities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onRegister={handleActivityRegister}
                      onSignIn={handleActivitySignIn}
                      variant="grid"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('activities.list.empty')}</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'scanner' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">QR扫码</h2>
                <p className="text-gray-600">扫描二维码进行签到或验证</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <QRScanner
                  onResult={handleQRResult}
                  className="w-full h-96"
                />
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.title')}</h2>
                <p className="text-gray-600">查看和管理个人信息</p>
              </div>
              
              <div className="glass p-6 rounded-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user?.legalName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user?.legalName || user?.username}
                    </h3>
                    {user?.email && (
                      <p className="text-gray-600">{user.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('profile.info.username')}</span>
                    <span className="font-medium">{user?.username}</span>
                  </div>
                  {user?.legalName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('profile.info.legal_name')}</span>
                      <span className="font-medium">{user.legalName}</span>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('profile.info.email')}</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}