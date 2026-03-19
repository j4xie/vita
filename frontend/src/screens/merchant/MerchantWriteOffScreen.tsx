import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScanIcon } from '../../components/common/icons/ScanIcon';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  SlideInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { couponAPI } from '../../services/couponAPI';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../../components/common/KeyboardDismissWrapper';

const COLORS = {
  bg: '#FAF3F1',
  primary: '#FF8A72',
  primaryLight: '#FFF0ED',
  textMain: '#111111',
  textSecondary: '#8C8C8C',
  cardBg: '#FFFFFF',
  success: '#34C759',
  successBg: '#E8F9EE',
  error: '#FF3B30',
  errorBg: '#FFE5E3',
  border: '#F0F0F0',
  scanOverlay: 'rgba(0,0,0,0.65)',
};

const SCAN_FRAME_SIZE = 236;

type WriteOffResult = {
  status: 'idle' | 'verifying' | 'success' | 'failed';
  message?: string;
  couponInfo?: {
    name?: string;
    discount?: number;
    holder?: string;
  };
};

// ─── Animated Scan Line ───────────────────────────────────────────────────────

const ScanLine: React.FC = () => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(SCAN_FRAME_SIZE - 4, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );
  }, [translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.scanLine, animStyle]} pointerEvents="none">
      {/* Gradient-like glow using two overlapping layers */}
      <View style={styles.scanLineCore} />
      <View style={styles.scanLineGlowTop} />
      <View style={styles.scanLineGlowBottom} />
    </Animated.View>
  );
};

// ─── Corner Markers ───────────────────────────────────────────────────────────

const ScanCorners: React.FC<{ highlight: boolean }> = ({ highlight }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (highlight) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        4,
        false
      );
    } else {
      opacity.value = 1;
    }
  }, [highlight, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cornerColor = highlight ? COLORS.success : COLORS.primary;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animStyle]} pointerEvents="none">
      <View style={[styles.scanCorner, styles.scanCornerTL, { borderColor: cornerColor }]} />
      <View style={[styles.scanCorner, styles.scanCornerTR, { borderColor: cornerColor }]} />
      <View style={[styles.scanCorner, styles.scanCornerBL, { borderColor: cornerColor }]} />
      <View style={[styles.scanCorner, styles.scanCornerBR, { borderColor: cornerColor }]} />
    </Animated.View>
  );
};

// ─── Result Overlay ───────────────────────────────────────────────────────────

interface ResultOverlayProps {
  result: WriteOffResult;
  onReset: () => void;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({ result, onReset }) => {
  const { t } = useTranslation();

  if (result.status === 'verifying') {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.resultOverlay}>
        <View style={styles.resultCard}>
          <View style={styles.verifyingSpinnerWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.verifyingText}>{t('merchant.writeOff.verifying')}</Text>
        </View>
      </Animated.View>
    );
  }

  const isSuccess = result.status === 'success';
  const iconName = isSuccess ? 'checkmark' : 'close';
  const accentColor = isSuccess ? COLORS.success : COLORS.error;
  const accentBg = isSuccess ? COLORS.successBg : COLORS.errorBg;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.resultOverlay}>
      <Animated.View
        entering={SlideInDown.springify().damping(18).stiffness(200)}
        style={[styles.resultCard, { borderTopColor: accentColor }]}
      >
        {/* Icon */}
        <Animated.View
          entering={ZoomIn.delay(150).springify()}
          style={[styles.resultIconCircle, { backgroundColor: accentColor }]}
        >
          <Ionicons name={iconName} size={34} color="#FFFFFF" />
        </Animated.View>

        <Text style={[styles.resultTitle, { color: accentColor }]}>
          {isSuccess ? t('merchant.writeOff.success') : t('merchant.writeOff.failed')}
        </Text>
        <Text style={styles.resultMessage}>{result.message}</Text>

        {/* Coupon detail card on success */}
        {isSuccess && result.couponInfo && (
          <Animated.View
            entering={FadeIn.delay(300).duration(300)}
            style={styles.couponInfoCard}
          >
            {result.couponInfo.name && (
              <View style={styles.couponInfoRow}>
                <Text style={styles.couponInfoLabel}>{t('merchant.writeOff.couponName')}</Text>
                <Text style={styles.couponInfoValue}>{result.couponInfo.name}</Text>
              </View>
            )}
            {result.couponInfo.discount != null && (
              <View style={[styles.couponInfoRow, styles.couponInfoHighlightRow]}>
                <Text style={styles.couponInfoLabel}>{t('merchant.writeOff.couponDiscount')}</Text>
                <Text style={[styles.couponInfoValue, styles.couponInfoHighlightValue]}>
                  ¥{result.couponInfo.discount}
                </Text>
              </View>
            )}
            {result.couponInfo.holder && (
              <View style={styles.couponInfoRow}>
                <Text style={styles.couponInfoLabel}>{t('merchant.writeOff.couponHolder')}</Text>
                <Text style={styles.couponInfoValue}>{result.couponInfo.holder}</Text>
              </View>
            )}
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={onReset}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('merchant.writeOff.continueScan')}
        >
          <View style={{ marginRight: 7 }}>
            <ScanIcon size={17} color="#FFFFFF" />
          </View>
          <Text style={styles.continueButtonText}>{t('merchant.writeOff.continueScan')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const MerchantWriteOffScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [couponCode, setCouponCode] = useState('');
  const [result, setResult] = useState<WriteOffResult>({ status: 'idle' });
  const [isScanning, setIsScanning] = useState(true);
  const [scanHighlight, setScanHighlight] = useState(false);
  const scanProcessed = useRef(false);

  // Tab indicator sliding animation
  const tabIndicatorX = useSharedValue(0);
  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  const handleWriteOff = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setResult({ status: 'verifying' });

    try {
      // writeOff API 本身包含验证逻辑，会返回具体错误（券码不存在/商家不在适用范围等）
      const writeOffRes = await couponAPI.writeOffCoupon({ couponNo: code.trim() });
      if (writeOffRes.code === 200) {
        const data = writeOffRes.data;
        setResult({
          status: 'success',
          message: t('merchant.writeOff.successMessage'),
          couponInfo: data ? {
            name: data.couponName || t('merchant.writeOff.unknownCoupon'),
            discount: data.couponPrice ?? data.discount ?? 0,
            holder: data.userName || '',
          } : undefined,
        });
      } else {
        setResult({
          status: 'failed',
          message: writeOffRes.msg || t('merchant.writeOff.failedMessage'),
        });
      }
    } catch (error) {
      console.error('❌ [WriteOff] 核销失败:', error);
      setResult({ status: 'failed', message: t('merchant.writeOff.failedMessage') });
    }
  }, [t]);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanProcessed.current) return;
    scanProcessed.current = true;
    setIsScanning(false);
    setScanHighlight(true);
    handleWriteOff(data);
  }, [handleWriteOff]);

  const resetScan = useCallback(() => {
    setResult({ status: 'idle' });
    setCouponCode('');
    scanProcessed.current = false;
    setIsScanning(true);
    setScanHighlight(false);
  }, []);

  // ── Pick QR from photo album ────────────────────────────────────────────
  const handlePickFromAlbum = useCallback(async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

      const uri = pickerResult.assets[0].uri;
      setResult({ status: 'verifying' });

      const scanResults = await scanFromURLAsync(uri, ['qr']);
      if (scanResults && scanResults.length > 0) {
        const code = scanResults[0].data;
        handleWriteOff(code);
      } else {
        setResult({ status: 'idle' });
        Alert.alert('', t('merchant.writeOff.noQRFound'));
      }
    } catch (error) {
      console.error('❌ [WriteOff] Album scan error:', error);
      setResult({ status: 'idle' });
      Alert.alert('', t('merchant.writeOff.noQRFound'));
    }
  }, [handleWriteOff, t]);

  const switchTab = useCallback((tab: 'scan' | 'manual') => {
    setActiveTab(tab);
    resetScan();
    // Slide indicator to the correct half
    tabIndicatorX.value = withSpring(tab === 'scan' ? 0 : 1, { damping: 18, stiffness: 200 });
  }, [resetScan, tabIndicatorX]);

  // ── Camera permission ──────────────────────────────────────────────────────
  const renderPermissionPrompt = () => (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionIconWrap}>
        <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.permissionTitle}>{t('merchant.writeOff.cameraPermission')}</Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={requestPermission}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('merchant.writeOff.requestPermission')}
      >
        <Text style={styles.permissionButtonText}>{t('merchant.writeOff.requestPermission')}</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Scan mode ──────────────────────────────────────────────────────────────
  const renderScanMode = () => {
    if (!permission?.granted) return renderPermissionPrompt();

    return (
      <View style={styles.cameraContainer}>
        {isScanning && (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
          />
        )}

        {/* Dark overlay using absolute fill + a flexbox "window" cutout */}
        <View style={styles.overlayWrapper} pointerEvents="none">
          {/* Top dark strip */}
          <View style={styles.overlayTop} />
          {/* Middle row: side strips + transparent scan window */}
          <View style={styles.overlayRow}>
            <View style={styles.overlaySide} />
            <View style={styles.scanWindowSpace} />
            <View style={styles.overlaySide} />
          </View>
          {/* Bottom dark strip */}
          <View style={styles.overlayBottom} />
        </View>

        {/* Scan frame (corners + animated line) centered over the transparent window */}
        <View style={styles.scanFrameAbsolute} pointerEvents="none">
          <View style={styles.scanFrameInner}>
            <ScanCorners highlight={scanHighlight} />
            {isScanning && !scanHighlight && <ScanLine />}
          </View>
        </View>

        {/* Hint text below scan window */}
        <View style={styles.scanHintRow} pointerEvents="none">
          <Ionicons name="qr-code-outline" size={15} color="rgba(255,255,255,0.7)" />
          <Text style={styles.scanHintText}>{t('merchant.writeOff.scanHint')}</Text>
        </View>

        {/* Pick from album button */}
        <View style={styles.albumButtonRow}>
          <TouchableOpacity
            style={styles.albumButton}
            onPress={handlePickFromAlbum}
            activeOpacity={0.8}
            testID="writeoff-album-button"
            accessibilityRole="button"
            accessibilityLabel={t('merchant.writeOff.pickFromAlbum')}
          >
            <Ionicons name="images-outline" size={18} color="#FFFFFF" />
            <Text style={styles.albumButtonText}>{t('merchant.writeOff.pickFromAlbum')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Manual mode ────────────────────────────────────────────────────────────
  const renderManualMode = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.manualContainer}
    >
      <View style={styles.manualContent}>
        {/* Visual illustration area */}
        <View style={styles.manualIllustration}>
          <View style={styles.manualIllustrationCircle}>
            <Ionicons name="keypad-outline" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.manualIllustrationTitle}>{t('merchant.writeOff.manualInputTitle')}</Text>
          <Text style={styles.manualHint}>{t('merchant.writeOff.manualHint')}</Text>
        </View>

        {/* Input area */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>{t('merchant.writeOff.couponCodeLabel')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              testID="writeoff-code-input"
              style={[
                styles.codeInput,
                couponCode.length > 0 && styles.codeInputActive,
              ]}
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder={t('merchant.writeOff.inputPlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (couponCode.trim()) handleWriteOff(couponCode);
              }}
              inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!couponCode.trim() || result.status === 'verifying') && styles.verifyButtonDisabled,
            ]}
            onPress={() => handleWriteOff(couponCode)}
            disabled={!couponCode.trim() || result.status === 'verifying'}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('merchant.writeOff.verifyButton')}
          >
            {result.status === 'verifying' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.verifyButtonText}>{t('merchant.writeOff.verifyButton')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Guidance note */}
          <View style={styles.guidanceRow}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.guidanceText}>{t('merchant.writeOff.manualGuidance')}</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('merchant.writeOff.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('merchant.writeOff.headerSubtitle')}</Text>
      </View>

      {/* ── Tab Switcher ─────────────────────────────────────────────── */}
      <View style={styles.tabContainer}>
        {/* Sliding background pill */}
        <Animated.View style={[styles.tabSlider, tabIndicatorStyle]} />

        <TouchableOpacity
          style={styles.tab}
          onPress={() => switchTab('scan')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'scan' }}
          accessibilityLabel={t('merchant.writeOff.scanTab')}
        >
          <Ionicons
            name={activeTab === 'scan' ? 'scan' : 'scan-outline'}
            size={17}
            color={activeTab === 'scan' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
            {t('merchant.writeOff.scanTab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => switchTab('manual')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'manual' }}
          accessibilityLabel={t('merchant.writeOff.manualTab')}
        >
          <Ionicons
            name={activeTab === 'manual' ? 'keypad' : 'keypad-outline'}
            size={17}
            color={activeTab === 'manual' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
            {t('merchant.writeOff.manualTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {activeTab === 'scan' ? renderScanMode() : renderManualMode()}
      </View>

      {/* ── Result Overlay ───────────────────────────────────────────── */}
      {result.status !== 'idle' && (
        <ResultOverlay result={result} onReset={resetScan} />
      )}
      <KeyboardDoneAccessory />
    </View>
  );
};

const HALF_TAB_WIDTH = '50%' as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // ── Tab Switcher ──────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 13,
    padding: 4,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  // The sliding background pill - width is half the container minus padding
  tabSlider: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '49%',
    bottom: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },

  // ── Camera / Scan Mode ────────────────────────────────────────────────────
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  // Full-screen overlay wrapper (flex column)
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  // Top dark strip: takes remaining vertical space above scan window (flex: 1)
  overlayTop: {
    flex: 1,
    backgroundColor: COLORS.scanOverlay,
  },
  // Middle row containing side strips + transparent gap
  overlayRow: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: COLORS.scanOverlay,
  },
  // Bottom dark strip: takes remaining space below scan window (flex: 1.5)
  overlayBottom: {
    flex: 1.5,
    backgroundColor: COLORS.scanOverlay,
  },
  // Transparent space in the scan window (no background)
  scanWindowSpace: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
  },
  // Absolute positioned frame for corners + scan line, centered over the scan window.
  // We center it using flex so it aligns exactly with the scanWindowSpace gap.
  scanFrameAbsolute: {
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Inner container sized to match the scan window
  scanFrameInner: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },

  // Scan corners
  scanCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  // Animated scan line
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 3,
    zIndex: 2,
  },
  scanLineCore: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  scanLineGlowTop: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
    borderRadius: 3,
  },
  scanLineGlowBottom: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    borderRadius: 4,
  },

  scanHintRow: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
  },
  scanHintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  albumButtonRow: {
    position: 'absolute',
    bottom: 105,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  albumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  albumButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Permission prompt ─────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 13,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Manual mode ───────────────────────────────────────────────────────────
  manualContainer: {
    flex: 1,
  },
  manualContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  manualIllustration: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  manualIllustrationCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  manualIllustrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  manualHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 2,
  },
  inputRow: {
    width: '100%',
  },
  codeInput: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMain,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    letterSpacing: 1,
  },
  codeInputActive: {
    borderColor: COLORS.primary,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 2,
  },
  verifyButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 4,
  },
  guidanceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ── Result Overlay ────────────────────────────────────────────────────────
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  resultCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  verifyingSpinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  verifyingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  resultIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  resultMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  couponInfoCard: {
    width: '100%',
    backgroundColor: '#F8F8FA',
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 18,
  },
  couponInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  couponInfoHighlightRow: {
    borderBottomWidth: 0,
  },
  couponInfoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  couponInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  couponInfoHighlightValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    paddingHorizontal: 28,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MerchantWriteOffScreen;
