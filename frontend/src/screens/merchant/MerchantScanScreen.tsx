import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { couponAPI } from '../../services/couponAPI';
import { VerifySuccessModal } from '../../components/merchant/VerifySuccessModal';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.7;

/**
 * MerchantScanScreen - 商家扫码核销页面
 *
 * 功能：
 * - 扫描用户的优惠券二维码
 * - 调用核销API
 * - 显示核销结果
 */
export const MerchantScanScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verifiedCoupon, setVerifiedCoupon] = useState<{
    name?: string;
    price?: number;
  }>({});

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // 处理二维码扫描
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || verifying) return;

    setScanned(true);
    setVerifying(true);

    try {
      // 解析二维码数据
      let couponNo: string;
      try {
        const parsedData = JSON.parse(data);
        couponNo = parsedData.couponNo;
      } catch (e) {
        // 如果不是JSON格式，直接使用原始数据作为couponNo
        couponNo = data;
      }

      console.log('📱 [MerchantScan] 扫描到券码:', couponNo);

      // 调用核销API
      const response = await couponAPI.writeOffCoupon(couponNo);

      if (response.code === 200) {
        // 核销成功
        console.log('✅ [MerchantScan] 核销成功');

        // TODO: 从response中获取优惠券信息（需要后端返回）
        setVerifiedCoupon({
          name: t('coupon.verified', '优惠券'),
          price: 0,
        });

        setShowSuccessModal(true);

        // 等待弹窗关闭后重置扫描状态
        setTimeout(() => {
          setScanned(false);
        }, 3500);
      } else {
        // 核销失败
        console.error('❌ [MerchantScan] 核销失败:', response.msg);
        Alert.alert(
          t('merchant.verify.failed', '核销失败'),
          response.msg || t('merchant.verify.invalid_code', '无效的券码'),
          [
            {
              text: t('common.ok', '确定'),
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ [MerchantScan] 核销出错:', error);
      Alert.alert(
        t('merchant.verify.error', '核销出错'),
        t('merchant.verify.error_message', '请稍后重试'),
        [
          {
            text: t('common.ok', '确定'),
            onPress: () => setScanned(false),
          },
        ]
      );
    } finally {
      setVerifying(false);
    }
  };

  // 关闭成功弹窗
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // 如果没有权限
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>{t('camera.requesting_permission', '请求相机权限中...')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#CCCCCC" />
          <Text style={styles.permissionTitle}>
            {t('camera.no_permission', '需要相机权限')}
          </Text>
          <Text style={styles.permissionText}>
            {t('camera.no_permission_desc', '请允许访问相机以扫描二维码')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              {t('camera.grant_permission', '授予权限')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('merchant.scan_verify', '扫码核销')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 相机视图 */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* 扫描框遮罩 */}
        <View style={styles.overlay}>
          {/* 上部遮罩 */}
          <View style={styles.maskTop} />

          {/* 中间区域（扫描框） */}
          <View style={styles.maskMiddle}>
            <View style={styles.maskLeft} />
            <View style={styles.scanBox}>
              {/* 四个角的装饰 */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* 扫描提示 */}
              {verifying && (
                <View style={styles.verifyingOverlay}>
                  <Text style={styles.verifyingText}>
                    {t('merchant.verifying', '核销中...')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.maskRight} />
          </View>

          {/* 下部遮罩 */}
          <View style={styles.maskBottom}>
            <Text style={styles.scanHint}>
              {t('merchant.scan_hint', '将二维码放入框内扫描')}
            </Text>
          </View>
        </View>
      </CameraView>

      {/* 核销成功弹窗 */}
      <VerifySuccessModal
        visible={showSuccessModal}
        couponName={verifiedCoupon.name}
        couponPrice={verifiedCoupon.price}
        onClose={handleCloseSuccessModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // 顶部导航栏
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerRight: {
    width: 36,
  },

  // 权限请求
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
  },

  permissionTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  permissionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },

  permissionButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
  },

  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 相机
  camera: {
    flex: 1,
  },

  // 遮罩层
  overlay: {
    flex: 1,
  },

  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  maskMiddle: {
    flexDirection: 'row',
    height: SCAN_BOX_SIZE,
  },

  maskLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  maskRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    paddingTop: 40,
  },

  // 扫描框
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FF6B6B',
  },

  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  verifyingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  verifyingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 提示文字
  scanHint: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
