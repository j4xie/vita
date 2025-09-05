'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users, Clock, Heart } from 'lucide-react';
import { Activity } from '@/services/PomeloXAPI';

interface ActivityCardProps {
  activity: Activity;
  onRegister?: (activityId: number) => void;
  onSignIn?: (activityId: number) => void;
  onViewDetails?: (activity: Activity) => void;
  className?: string;
  variant?: 'grid' | 'list';
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onRegister,
  onSignIn,
  onViewDetails,
  className = '',
  variant = 'grid',
}) => {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取活动状态
  const getActivityStatus = () => {
    if (activity.type === -1) return { text: t('activities.status.upcoming'), color: 'text-blue-600 bg-blue-50' };
    if (activity.type === 1) return { text: t('activities.status.ongoing'), color: 'text-green-600 bg-green-50' };
    if (activity.type === 2) return { text: t('activities.status.ended'), color: 'text-gray-600 bg-gray-50' };
    return { text: '', color: '' };
  };

  // 获取注册状态
  const getRegistrationStatus = () => {
    if (activity.signStatus === 1) return { text: t('activities.status.signed_in'), color: 'text-green-600 bg-green-50' };
    if (activity.signStatus === -1) return { text: t('activities.status.registered'), color: 'text-blue-600 bg-blue-50' };
    return null;
  };

  // 计算剩余名额
  const availableSpots = activity.maxParticipants - activity.currentParticipants;
  const isFull = availableSpots <= 0;

  // 处理注册
  const handleRegister = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || isFull) return;

    setIsLoading(true);
    try {
      await onRegister?.(activity.id);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理签到
  const handleSignIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onSignIn?.(activity.id);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理收藏
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  // 处理查看详情
  const handleViewDetails = () => {
    onViewDetails?.(activity);
  };

  const status = getActivityStatus();
  const registrationStatus = getRegistrationStatus();

  if (variant === 'list') {
    return (
      <div
        className={`bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer ${className}`}
        onClick={handleViewDetails}
      >
        <div className="flex items-start space-x-4">
          {/* 活动图片 */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 活动信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {activity.activityName}
                </h3>
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                )}
              </div>

              <button
                onClick={handleLike}
                className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isLiked ? 'text-red-500 fill-current' : 'text-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* 活动详情 */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {formatDate(activity.activityTime)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                {activity.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                {activity.currentParticipants}/{activity.maxParticipants}
              </div>
            </div>

            {/* 状态和按钮 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {status.text && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                )}
                {registrationStatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${registrationStatus.color}`}>
                    {registrationStatus.text}
                  </span>
                )}
                {!isFull && (
                  <span className="text-xs text-green-600">
                    {t('activities.status.available_spots', { count: availableSpots })}
                  </span>
                )}
                {isFull && (
                  <span className="text-xs text-red-600">{t('activities.status.full')}</span>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-2">
                {activity.signStatus === -1 && activity.type === 1 && (
                  <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? t('common.loading') : t('activities.actions.sign_in')}
                  </button>
                )}
                {activity.signStatus === 0 && !isFull && activity.type !== 2 && (
                  <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? t('common.loading') : t('activities.actions.register')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid 模式
  return (
    <div
      className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group ${className}`}
      onClick={handleViewDetails}
    >
      {/* 活动图片 */}
      <div className="relative h-48 bg-gradient-to-br from-primary-400 to-secondary-400">
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-16 h-16 text-white/80" />
        </div>
        
        {/* 收藏按钮 */}
        <button
          onClick={handleLike}
          className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isLiked ? 'text-white fill-current' : 'text-white/80'
            }`}
          />
        </button>

        {/* 状态标签 */}
        {status.text && (
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        )}

        {registrationStatus && (
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${registrationStatus.color}`}>
              {registrationStatus.text}
            </span>
          </div>
        )}
      </div>

      {/* 活动信息 */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {activity.activityName}
        </h3>
        
        {activity.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {activity.description}
          </p>
        )}

        {/* 活动详情 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {formatDate(activity.activityTime)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">{activity.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            {activity.currentParticipants}/{activity.maxParticipants}
          </div>
        </div>

        {/* 剩余名额 */}
        <div className="mb-4">
          {!isFull ? (
            <span className="text-sm text-green-600 font-medium">
              {t('activities.status.available_spots', { count: availableSpots })}
            </span>
          ) : (
            <span className="text-sm text-red-600 font-medium">{t('activities.status.full')}</span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2">
          {activity.signStatus === -1 && activity.type === 1 && (
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? t('common.loading') : t('activities.actions.sign_in')}
            </button>
          )}
          {activity.signStatus === 0 && !isFull && activity.type !== 2 && (
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? t('common.loading') : t('activities.actions.register')}
            </button>
          )}
          <button
            onClick={handleViewDetails}
            className="px-4 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-lg font-medium transition-colors"
          >
            {t('activities.actions.view_details')}
          </button>
        </div>
      </div>
    </div>
  );
};