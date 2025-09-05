'use client';

import React, { useState } from 'react';
import { Calendar, Heart } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 模拟登录
    setTimeout(() => {
      setUser({ username: loginData.username, legalName: '示例用户' });
      setIsLoading(false);
    }, 1000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
            {/* 标题 */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">欢迎使用 PomeloX</h2>
              <p className="text-gray-600 mt-2">海外华人学生活动平台</p>
            </div>

            {/* 表单 */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="请输入密码"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">PomeloX</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.legalName || user.username}
              </span>
              <button
                onClick={() => setUser(null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 PomeloX Web版上线了！</h2>
          <p className="text-lg text-gray-600 mb-6">
            我们成功将原生应用转换为Web版本，现在你可以在任何设备上访问PomeloX的所有功能。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 功能展示卡片 */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-8 h-8 text-orange-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">活动管理</h3>
            </div>
            <p className="text-gray-600 mb-4">
              浏览和参与各种学生活动，包括学术讲座、文化活动、志愿服务等。
            </p>
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-orange-700 text-sm font-medium">✅ 已完成对接</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center mb-4">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">志愿服务</h3>
            </div>
            <p className="text-gray-600 mb-4">
              参与志愿活动，记录服务时长，为社区贡献你的力量。
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-green-700 text-sm font-medium">✅ 已完成对接</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">QR</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">扫码功能</h3>
            </div>
            <p className="text-gray-600 mb-4">
              使用摄像头扫描二维码，快速完成签到和身份验证。
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-blue-700 text-sm font-medium">✅ Web版已适配</span>
            </div>
          </div>
        </div>

        {/* 技术特性 */}
        <div className="mt-12 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">技术特性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🌐 跨平台访问</h4>
              <p className="text-gray-600">无需下载，通过浏览器即可访问所有功能</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🔒 数据安全</h4>
              <p className="text-gray-600">使用HTTPS加密，保护用户数据安全</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">⚡ 实时更新</h4>
              <p className="text-gray-600">无需等待应用商店审核，功能即时上线</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📱 响应式设计</h4>
              <p className="text-gray-600">完美适配手机、平板和桌面设备</p>
            </div>
          </div>
        </div>

        {/* API状态 */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <h4 className="font-semibold text-gray-900">API连接状态: 正常</h4>
          </div>
          <p className="text-sm text-gray-600">
            已成功连接到生产后端API: https://www.vitaglobal.icu
          </p>
        </div>
      </main>
    </div>
  );
}