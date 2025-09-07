/**
 * Web端区域切换弹窗组件
 * 支持区域切换和隐私条款签署流程
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import UserRegionPreferences, { UserRegionCode } from '../../services/UserRegionPreferences';
import { PrivacyAgreementModal } from './PrivacyAgreementModal';

interface RegionSwitchModalProps {
  visible: boolean;
  onClose: () => void;
  onRegionChanged: (newRegion: UserRegionCode) => void;
}

export const RegionSwitchModal: React.FC<RegionSwitchModalProps> = ({
  visible,
  onClose,
  onRegionChanged,
}) => {
  const { t } = useTranslation();

  // Component states
  const [currentRegion, setCurrentRegion] = useState<UserRegionCode>('china');
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<UserRegionCode | null>(null);
  const [privacySignedRegions, setPrivacySignedRegions] = useState<UserRegionCode[]>([]);

  // Load initial data
  useEffect(() => {
    if (visible) {
      loadRegionData();
    }
  }, [visible]);

  // 处理ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible && !loading) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [visible, loading, onClose]);

  const loadRegionData = async () => {
    try {
      const preferences = await UserRegionPreferences.getPreferences();
      if (preferences) {
        setCurrentRegion(preferences.currentRegion);
        setPrivacySignedRegions(preferences.privacySignedRegions);
      }
    } catch (error) {
      console.error('加载区域数据失败:', error);
    }
  };

  const handleRegionSelect = async (region: UserRegionCode) => {
    if (region === currentRegion) {
      return; // 选择相同区域，无需处理
    }

    try {
      setLoading(true);

      // 检查是否已签署该区域的隐私条款
      const hasSigned = await UserRegionPreferences.hasSignedPrivacyFor(region);
      
      if (!hasSigned) {
        // 需要签署隐私条款
        setPendingRegion(region);
        setShowPrivacyModal(true);
      } else {
        // 直接切换区域
        await switchRegion(region);
      }
    } catch (error) {
      console.error('处理区域选择失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchRegion = async (region: UserRegionCode) => {
    try {
      setLoading(true);
      await UserRegionPreferences.updateCurrentRegion(region);
      setCurrentRegion(region);
      onRegionChanged(region);
      onClose();
    } catch (error) {
      console.error('切换区域失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyAccept = async () => {
    if (!pendingRegion) return;

    try {
      setLoading(true);
      
      // 标记隐私条款已签署
      await UserRegionPreferences.markPrivacySigned(pendingRegion);
      
      // 更新本地状态
      setPrivacySignedRegions(prev => [...prev, pendingRegion]);
      
      // 关闭隐私弹窗
      setShowPrivacyModal(false);
      
      // 执行区域切换
      await switchRegion(pendingRegion);
      
      setPendingRegion(null);
    } catch (error) {
      console.error('处理隐私条款接受失败:', error);
      setShowPrivacyModal(false);
      setPendingRegion(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    setPendingRegion(null);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  const regions: { code: UserRegionCode; name: string; icon: string; description: string }[] = [
    {
      code: 'china',
      name: t('regions.china.name', '中国'),
      icon: '🇨🇳',
      description: t('regions.china.description', '适用中华人民共和国相关法律法规'),
    },
    {
      code: 'usa',
      name: t('regions.usa.name', '美国'),
      icon: '🇺🇸',
      description: t('regions.usa.description', '适用美国联邦和州相关法律法规'),
    },
  ];

  if (!visible) return null;

  return createPortal(
    <>
      {/* Main Modal */}
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="modal-header">
            <div className="header-content">
              <div className="icon-container">
                <span className="icon">📍</span>
              </div>
              <h2 className="title">
                {t('profile.region_switch.title', '选择地区')}
              </h2>
              <p className="subtitle">
                {t('profile.region_switch.subtitle', '切换到不同地区将使用相应的隐私政策')}
              </p>
            </div>
            
            <button
              className="close-button"
              onClick={onClose}
              disabled={loading}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          {/* Region Options */}
          <div className="modal-content">
            {regions.map((region) => (
              <button
                key={region.code}
                className={`
                  region-option
                  ${currentRegion === region.code ? 'region-option-active' : ''}
                  ${loading ? 'region-option-disabled' : ''}
                `}
                onClick={() => handleRegionSelect(region.code)}
                disabled={loading}
              >
                <div className="region-content">
                  <div className="region-left">
                    <span className="region-icon">{region.icon}</span>
                    <div className="region-info">
                      <div className="region-name">{region.name}</div>
                      <div className="region-description">{region.description}</div>
                    </div>
                  </div>
                  
                  <div className="region-right">
                    {currentRegion === region.code && (
                      <span className="check-icon">✓</span>
                    )}
                    
                    {/* 隐私条款签署状态 */}
                    {privacySignedRegions.includes(region.code) && (
                      <div className="privacy-signed-indicator">
                        <span className="shield-icon">🛡️</span>
                        <span className="privacy-signed-text">
                          {t('profile.region_switch.privacy_signed', '已签署')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-info">
              <span className="info-icon">ℹ️</span>
              <span className="footer-text">
                {t('profile.region_switch.privacy_notice', '切换地区时如未签署相应隐私政策，将需要重新签署')}
              </span>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                {t('profile.region_switch.loading', '处理中...')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Agreement Modal */}
      {showPrivacyModal && (
        <PrivacyAgreementModal
          visible={showPrivacyModal}
          onAccept={handlePrivacyAccept}
          onDecline={handlePrivacyDecline}
          userArea={pendingRegion === 'china' ? 'zh' : 'en'}
          allowRegionSwitch={false}
        />
      )}

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-content {
          flex: 1;
          text-align: center;
        }

        .icon-container {
          width: 64px;
          height: 64px;
          background: #ff6b3515;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .icon {
          font-size: 32px;
        }

        .title {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
        }

        .subtitle {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        .close-button {
          padding: 8px;
          background: none;
          border: none;
          font-size: 20px;
          color: #64748b;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-content {
          padding: 24px;
          padding-top: 16px;
        }

        .region-option {
          display: block;
          width: 100%;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .region-option:hover {
          border-color: #ff6b35;
          background: #ff6b3508;
        }

        .region-option-active {
          border-color: #ff6b35 !important;
          background: #ff6b3508 !important;
        }

        .region-option-disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .region-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .region-left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .region-icon {
          font-size: 28px;
          margin-right: 12px;
        }

        .region-info {
          flex: 1;
        }

        .region-name {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .region-description {
          font-size: 14px;
          color: #64748b;
          line-height: 1.4;
        }

        .region-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .check-icon {
          font-size: 24px;
          color: #ff6b35;
          margin-bottom: 4px;
        }

        .privacy-signed-indicator {
          display: flex;
          align-items: center;
          margin-top: 4px;
        }

        .shield-icon {
          font-size: 16px;
          margin-right: 4px;
        }

        .privacy-signed-text {
          font-size: 12px;
          font-weight: 500;
          color: #059669;
        }

        .modal-footer {
          padding: 24px;
          padding-top: 0;
          border-top: 1px solid #f1f5f9;
        }

        .footer-info {
          display: flex;
          align-items: flex-start;
        }

        .info-icon {
          font-size: 16px;
          margin-right: 8px;
          margin-top: 2px;
        }

        .footer-text {
          flex: 1;
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f1f5f9;
          border-top: 3px solid #ff6b35;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
          margin-top: 12px;
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .modal-container {
            background: #1e293b;
            color: #f1f5f9;
          }

          .modal-header {
            border-bottom-color: #334155;
          }

          .title {
            color: #f1f5f9;
          }

          .subtitle {
            color: #94a3b8;
          }

          .close-button {
            color: #94a3b8;
          }

          .close-button:hover {
            background: #334155;
            color: #f1f5f9;
          }

          .region-option {
            border-color: #334155;
            background: #0f172a;
          }

          .region-option:hover {
            border-color: #ff6b35;
            background: #ff6b3508;
          }

          .region-name {
            color: #f1f5f9;
          }

          .region-description {
            color: #94a3b8;
          }

          .modal-footer {
            border-top-color: #334155;
          }

          .footer-text {
            color: #94a3b8;
          }

          .loading-overlay {
            background: rgba(30, 41, 59, 0.9);
          }

          .loading-text {
            color: #f1f5f9;
          }

          .loading-spinner {
            border-color: #334155;
            border-top-color: #ff6b35;
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default RegionSwitchModal;