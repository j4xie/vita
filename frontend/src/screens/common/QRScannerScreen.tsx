import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const scanAreaSize = screenWidth * 0.7;

export const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const purpose = route.params?.purpose || 'scan'; // 'register' | 'verify' | 'scan'
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    // 根据不同用途处理扫描结果
    switch (purpose) {
      case 'register':
        handleRegisterCode(data);
        break;
      case 'verify':
        handleVerifyCode(data);
        break;
      default:
        handleGeneralScan(data);
    }
  };

  const handleRegisterCode = (code: string) => {
    // 验证推荐码格式
    if (code.startsWith('VG_REF_')) {
      const referralCode = code.replace('VG_REF_', '');
      Alert.alert(
        '推荐码扫描成功',
        `推荐码：${referralCode}`,
        [
          {
            text: '继续注册',
            onPress: () => {
              navigation.navigate('RegisterForm', { 
                referralCode,
                hasReferralCode: true 
              });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '无效的推荐码',
        '请扫描正确的推荐码二维码',
        [
          {
            text: '重新扫描',
            onPress: () => setScanned(false),
          },
          {
            text: '返回',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleVerifyCode = (code: string) => {
    // 处理活动核销二维码
    if (code.startsWith('VG_EVENT_')) {
      Alert.alert(
        '核销成功',
        '活动签到成功！',
        [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert(
        '无效的二维码',
        '请扫描正确的活动二维码',
        [
          {
            text: '重新扫描',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleGeneralScan = (data: string) => {
    Alert.alert(
      '扫描结果',
      data,
      [
        {
          text: '确定',
          onPress: () => setScanned(false),
        },
      ]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const handleManualInput = () => {
    if (purpose === 'register') {
      Alert.prompt(
        '手动输入推荐码',
        '请输入您的推荐码',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '确认',
            onPress: (text) => {
              if (text) {
                navigation.navigate('RegisterForm', { 
                  referralCode: text,
                  hasReferralCode: true 
                });
              }
            },
          },
        ],
        'plain-text'
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>请求相机权限中...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color={theme.colors.text.disabled} />
        <Text style={styles.message}>没有相机权限</Text>
        <Text style={styles.submessage}>请在设置中允许访问相机</Text>
        <TouchableOpacity style={[styles.button, { marginBottom: theme.spacing[2] }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>请求权限</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {purpose === 'register' ? '扫描推荐码' : '扫描二维码'}
          </Text>
          <TouchableOpacity onPress={toggleTorch} style={styles.headerButton}>
            <Ionicons 
              name={torchOn ? "flash" : "flash-off"} 
              size={24} 
              color={theme.colors.text.inverse} 
            />
          </TouchableOpacity>
        </View>

        {/* Scan Area */}
        <View style={styles.scanContainer}>
          <View style={styles.scanArea}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scan Line Animation */}
            <View style={styles.scanLine} />
          </View>
          
          <Text style={styles.tip}>
            {purpose === 'register' 
              ? '将推荐码二维码放入框内，即可自动扫描'
              : '将二维码放入框内，即可自动扫描'}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {purpose === 'register' && (
            <TouchableOpacity style={styles.manualButton} onPress={handleManualInput}>
              <Ionicons name="keypad-outline" size={24} color={theme.colors.text.inverse} />
              <Text style={styles.manualButtonText}>手动输入</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing[2],
  },
  submessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.disabled,
    marginBottom: theme.spacing[6],
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  tip: {
    marginTop: theme.spacing[8],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  bottomActions: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: theme.spacing[6],
    alignItems: 'center',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  manualButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
  },
});