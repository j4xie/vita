/**
 * Web端位置不匹配提醒组件
 * 当检测到的位置与用户设置不匹配时显示提醒
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import UserRegionPreferences, { UserRegionCode } from '../../services/UserRegionPreferences';

interface LocationMismatchAlertProps {
  visible: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
  currentRegion: UserRegionCode;
  settingsRegion: UserRegionCode;
}

export const LocationMismatchAlert: React.FC<LocationMismatchAlertProps> = ({
  visible,
  onClose,
  onGoToSettings,
  currentRegion,
  settingsRegion,
}) => {
  const { t } = useTranslation();

  // 处理ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        handleIgnore();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  const handleIgnore = async () => {
    try {
      // 更新提醒时间，避免短时间内重复提醒
      await UserRegionPreferences.updateMismatchAlertTime();
      onClose();
    } catch (error) {
      console.error('更新提醒时间失败:', error);
      onClose(); // 即使失败也关闭弹窗
    }
  };

  const handleGoToSettings = () => {
    onGoToSettings();
    onClose();
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleIgnore();
    }
  };

  if (!visible) return null;

  return createPortal(
    <div className="alert-backdrop" onClick={handleBackdropClick}>
      <div className="alert-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="alert-header">
          <div className="icon-container">
            <span className="warning-icon">⚠️</span>
          </div>
          <h2 className="title">
            {t('location.mismatch.title', '位置变化提醒')}
          </h2>
          <p className="subtitle">
            {t('location.mismatch.subtitle', '检测到您的位置发生了变化')}
          </p>
        </div>

        {/* Content */}
        <div className="alert-content">
          <div className="region-comparison">
            
            {/* Current Location */}
            <div className="region-item">
              <div className="region-header">
                <span className="location-icon">📍</span>
                <span className="region-label">
                  {t('location.mismatch.current_location', '检测到的位置')}
                </span>
              </div>
              <div className="region-value">
                <span className="region-flag">
                  {UserRegionPreferences.getRegionIcon(currentRegion)}
                </span>
                <span className="region-name">
                  {UserRegionPreferences.getRegionDisplayName(currentRegion, 'zh')}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="arrow">
              <span className="arrow-icon">⬇️</span>
            </div>

            {/* Settings Region */}
            <div className="region-item">
              <div className="region-header">
                <span className="settings-icon">⚙️</span>
                <span className="region-label">
                  {t('location.mismatch.settings_region', '当前设置')}
                </span>
              </div>
              <div className="region-value">
                <span className="region-flag">
                  {UserRegionPreferences.getRegionIcon(settingsRegion)}
                </span>
                <span className="region-name">
                  {UserRegionPreferences.getRegionDisplayName(settingsRegion, 'zh')}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="recommendation">
            <span className="info-icon">💡</span>
            <span className="recommendation-text">
              {t('location.mismatch.recommendation', '建议更新地区设置以获得最佳体验和相应的隐私保护')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="alert-actions">
          <button
            className="button ignore-button"
            onClick={handleIgnore}
          >
            {t('location.mismatch.ignore', '先忽略')}
          </button>

          <button
            className="button settings-button"
            onClick={handleGoToSettings}
          >
            <span className="button-icon">⚙️</span>
            {t('location.mismatch.go_to_settings', '去设置')}
          </button>
        </div>
      </div>

      <style jsx>{`
        .alert-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1100;
          animation: fadeIn 0.2s ease-out;
        }

        .alert-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
          max-width: 420px;
          width: 100%;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }

        .alert-header {
          text-align: center;
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .icon-container {
          width: 80px;
          height: 80px;
          background: #fbbf2415;
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .warning-icon {
          font-size: 40px;
        }

        .title {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
        }

        .subtitle {
          margin: 0;
          font-size: 16px;
          color: #64748b;
          line-height: 1.5;
        }

        .alert-content {
          padding: 24px;
        }

        .region-comparison {
          margin-bottom: 24px;
        }

        .region-item {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          margin-bottom: 8px;
        }

        .region-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .location-icon, .settings-icon {
          font-size: 20px;
          margin-right: 8px;
        }

        .region-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .region-value {
          display: flex;
          align-items: center;
        }

        .region-flag {
          font-size: 24px;
          margin-right: 8px;
        }

        .region-name {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .arrow {
          text-align: center;
          padding: 8px 0;
        }

        .arrow-icon {
          font-size: 20px;
          color: #94a3b8;
        }

        .recommendation {
          display: flex;
          align-items: flex-start;
          background: #ff6b3508;
          padding: 16px;
          border-radius: 8px;
          border-left: 3px solid #ff6b35;
        }

        .info-icon {
          font-size: 16px;
          margin-right: 8px;
          margin-top: 2px;
        }

        .recommendation-text {
          flex: 1;
          font-size: 14px;
          color: #1e293b;
          line-height: 1.5;
        }

        .alert-actions {
          display: flex;
          padding: 24px;
          padding-top: 0;
          gap: 12px;
        }

        .button {
          flex: 1;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ignore-button {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .ignore-button:hover {
          background: #e2e8f0;
          color: #475569;
        }

        .settings-button {
          background: #ff6b35;
          color: white;
        }

        .settings-button:hover {
          background: #e85d22;
        }

        .button-icon {
          margin-right: 6px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .alert-container {
            background: #1e293b;
            color: #f1f5f9;
          }

          .alert-header {
            border-bottom-color: #334155;
          }

          .title {
            color: #f1f5f9;
          }

          .subtitle {
            color: #94a3b8;
          }

          .region-item {
            background: #0f172a;
            border-color: #334155;
          }

          .region-label {
            color: #94a3b8;
          }

          .region-name {
            color: #f1f5f9;
          }

          .recommendation {
            background: #ff6b3508;
          }

          .recommendation-text {
            color: #f1f5f9;
          }

          .ignore-button {
            background: #334155;
            color: #94a3b8;
            border-color: #475569;
          }

          .ignore-button:hover {
            background: #475569;
            color: #f1f5f9;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default LocationMismatchAlert;