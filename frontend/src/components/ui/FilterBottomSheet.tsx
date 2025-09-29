import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  Vibration,
  Platform,
  TextInput,
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 重构后的BottomSheet配置 - 单一Large/Full状态
const BOTTOM_SHEET_CONFIG = {
  HANDLE_WIDTH: 36,
  HANDLE_HEIGHT: 4,
  SNAP_POINTS: {
    LARGE: 0.93, // 减少整体高度，从0.95降到0.93，减少约15px
    FULL: 0.96,  // 相应调整，从0.98降到0.96
  },
  ANIMATION_DURATION: 200, // 标准时长
  REDUCED_MOTION_DURATION: 120, // 减少动态效果时的时长
  BACKDROP_OPACITY: 0.35, // 30-40%范围内
  SPRING_CONFIG: { stiffness: 280, damping: 22, mass: 1 },
  VELOCITY_THRESHOLD: 1200,
};

interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  color?: string;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  // 过滤选项
  categoryFilters: FilterOption[];
  statusFilters: FilterOption[];
  locationFilters?: FilterOption[];
  dateFilters?: FilterOption[];
  // 搜索功能 - 现在是必需的
  searchText: string;
  onSearchChange: (text: string) => void;
  // 计算过滤后数量的函数
  getFilteredCount?: (filters: string[], searchText: string) => number;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  activeFilters,
  onFiltersChange,
  categoryFilters,
  statusFilters,
  locationFilters = [],
  dateFilters = [],
  searchText,
  onSearchChange,
  getFilteredCount,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [currentSnapPoint, setCurrentSnapPoint] = useState<'large' | 'full'>('large');
  const searchInputRef = useRef<TextInput>(null);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardAnimatedValue = useRef(new Animated.Value(0)).current;
  const [showResultCount, setShowResultCount] = useState(false); // 控制是否显示结果数量
  const [filteredCount, setFilteredCount] = useState<number>(0); // 存储过滤后的数量
  
  // 临时存储的过滤器和搜索状态，用于取消时恢复
  const [tempFilters, setTempFilters] = useState<string[]>([]);
  const [tempSearchText, setTempSearchText] = useState('');

  // 检测减少动态效果设置
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);
  
  // A. iOS设计节律 - 键盘处理（180-220ms动画）
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true);
        
        // iOS设计节律动画时长
        const animationDuration = isReduceMotionEnabled ? 120 : 200; // 在180-220ms范围内
        
        Animated.timing(keyboardAnimatedValue, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: false, // E. 仅在必要的transform动画关闭，避免全局软件合成
        }).start();
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        
        const animationDuration = isReduceMotionEnabled ? 120 : 200;
        
        Animated.timing(keyboardAnimatedValue, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: false, // E. 仅在transform时关闭
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [keyboardAnimatedValue, isReduceMotionEnabled]);
  
  // 动画值
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // 重构后的高度计算 - Large/Full状态
  const largeHeight = screenHeight * BOTTOM_SHEET_CONFIG.SNAP_POINTS.LARGE;
  const fullHeight = screenHeight * BOTTOM_SHEET_CONFIG.SNAP_POINTS.FULL;
  const currentHeight = currentSnapPoint === 'full' ? fullHeight : largeHeight;

  // 显示/隐藏动画和焦点管理
  useEffect(() => {
    if (visible) {
      // 打开时初始化临时状态为当前状态
      setTempFilters(activeFilters);
      setTempSearchText(searchText);
      
      showBottomSheet();
      // 焦点管理: 延迟设置焦点到搜索框
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      // 重置结果显示状态
      setShowResultCount(false);
    } else {
      hideBottomSheet();
    }
  }, [visible]);

  // E. iOS设计节律动画（180-220ms）
  const showBottomSheet = () => {
    const duration = isReduceMotionEnabled 
      ? 120 // E. 减少动态效果时仅淡入淡出
      : 200; // E. 180-220ms范围内
      
    Animated.parallel([
      isReduceMotionEnabled ? 
        // E. 减少动态效果：仅淡入淡出
        Animated.timing(translateY, {
          toValue: screenHeight - largeHeight,
          duration,
          useNativeDriver: true,
        }) :
        // E. 正常动画：Spring效果
        Animated.spring(translateY, {
          toValue: screenHeight - largeHeight,
          ...BOTTOM_SHEET_CONFIG.SPRING_CONFIG,
          useNativeDriver: true,
        }),
      Animated.timing(backdropOpacity, {
        toValue: BOTTOM_SHEET_CONFIG.BACKDROP_OPACITY,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideBottomSheet = () => {
    const duration = isReduceMotionEnabled 
      ? 120 // E. 减少动态效果
      : 200; // E. 180-220ms范围内
      
    Animated.parallel([
      isReduceMotionEnabled ? 
        // E. 减少动态效果：仅淡入淡出
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration,
          useNativeDriver: true,
        }) :
        // E. 正常动画：Spring效果
        Animated.spring(translateY, {
          toValue: screenHeight,
          ...BOTTOM_SHEET_CONFIG.SPRING_CONFIG,
          useNativeDriver: true,
        }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 可选: 切换到Full状态 (只在需要时使用)
  const toggleToFull = () => {
    if (currentSnapPoint === 'full') return;
    
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    } else {
      Vibration.vibrate(50);
    }
    
    setCurrentSnapPoint('full');
    
    Animated.spring(translateY, {
      toValue: screenHeight - fullHeight,
      ...BOTTOM_SHEET_CONFIG.SPRING_CONFIG,
      useNativeDriver: true,
    }).start();
  };

  // 拖拽手势处理
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        const newY = screenHeight - currentHeight + gestureState.dy;
        const clampedY = Math.max(screenHeight - fullHeight, Math.min(screenHeight, newY));
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const velocity = gestureState.vy;
        const currentY = screenHeight - currentHeight + gestureState.dy;
        
        const normalizedVelocity = BOTTOM_SHEET_CONFIG.VELOCITY_THRESHOLD / 1000;
        
        if (velocity > normalizedVelocity || currentY > screenHeight - largeHeight / 2) {
          // 向下滑动或超过中点 - 关闭
          onClose();
        } else if (velocity < -normalizedVelocity && currentSnapPoint === 'large') {
          // 向上快速滑动 - 切换到Full状态
          toggleToFull();
        } else {
          // 回弹到当前状态
          Animated.spring(translateY, {
            toValue: screenHeight - currentHeight,
            ...BOTTOM_SHEET_CONFIG.SPRING_CONFIG,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // 过滤器切换处理 - 修改为操作临时状态
  const handleFilterToggle = useCallback((filterId: string) => {
    const newFilters = tempFilters.includes(filterId)
      ? tempFilters.filter(id => id !== filterId)
      : [...tempFilters, filterId];
    setTempFilters(newFilters);
  }, [tempFilters]);

  // 清除所有过滤器 - 修改为清除临时状态
  const handleClearAll = () => {
    setTempFilters([]);
    setTempSearchText('');
  };

  // 清除搜索 - 修改为清除临时搜索
  const handleClearSearch = () => {
    setTempSearchText('');
  };


  // 渲染过滤器选项
  const renderFilterOption = (option: FilterOption, isActive: boolean) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.filterOption,
        isActive && styles.filterOptionActive,
        { borderColor: option.color || theme.colors.primary }
      ]}
      onPress={() => handleFilterToggle(option.id)}
    >
      {option.icon && (
        <Ionicons 
          name={option.icon as any} 
          size={16} 
          color={isActive ? theme.colors.text.inverse : theme.colors.text.secondary} 
          style={styles.filterIcon}
        />
      )}
      <Text style={[
        styles.filterLabel,
        isActive && styles.filterLabelActive
      ]}
      numberOfLines={1}
      ellipsizeMode="tail">
        {option.label}
      </Text>
      {option.count !== undefined && (
        <View style={styles.filterCount}>
          <Text style={[
            styles.filterCountText,
            isActive && styles.filterCountTextActive
          ]}>
            {option.count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // 渲染过滤器分组
  const renderFilterSection = (title: string, options: FilterOption[]) => (
    <View style={styles.filterSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.filterGrid}>
        {(options || []).map(option => 
          renderFilterOption(option, tempFilters.includes(option.id))
        )}
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* BottomSheet 内容 */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            height: currentHeight,
            transform: [{ translateY }],
            paddingBottom: insets.bottom,
            backgroundColor: LIQUID_GLASS_LAYERS.L3.background.light,
            borderColor: LIQUID_GLASS_LAYERS.L3.border.color.light,
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* 简化手柄 - 灰色横杠向下移动5px（原10px-5px） */}
        <View style={[styles.handleContainer, { paddingTop: 5, marginBottom: -5 }]}>
          <View style={styles.handle} />
        </View>

        {/* 标题栏 */}
        <View style={styles.header}>
          {/* 左侧取消按钮 - 恢复原始状态 */}
          <TouchableOpacity onPress={() => {
            // 取消时恢复原始状态
            onFiltersChange(activeFilters);
            onSearchChange(searchText);
            onClose();
          }} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
          </TouchableOpacity>
          
          {/* 中间标题 */}
          <Text style={styles.title}>{t('filters.title', 'Filters')}</Text>
          
          {/* 右侧操作按钮 */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>{t('filters.clearAll', 'Clear All')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 搜索框 - 移入面板内 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputShadowContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={t('activities.searchPlaceholder', 'Search activities...')}
                value={tempSearchText || ''}
                onChangeText={setTempSearchText}
                placeholderTextColor={theme.colors.text.disabled}
                returnKeyType="search"
                blurOnSubmit={false}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {tempSearchText && tempSearchText.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.disabled} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 过滤器内容 */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            {
              // A. 规范公式：scrollContentPaddingBottom = footerBodyHeight(56) + footerPadBottom(safeBottom+10) + 12 + 50(上移量)
              paddingBottom: 56 + (insets.bottom + 10) + 12 + 50 // 调整为50px补偿
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {renderFilterSection(t('filters.categoriesTitle', 'Categories'), categoryFilters)}
          {renderFilterSection(t('filters.statusTitle', 'Status'), statusFilters)}
          {locationFilters.length > 0 && renderFilterSection(t('filters.locationTitle', 'Location'), locationFilters)}
          {dateFilters.length > 0 && renderFilterSection(t('filters.dateTitle', 'Date'), dateFilters)}
        </ScrollView>

        {/* A. 底部唯一Footer - 包含左侧结果文案 + 右侧Apply按钮 */}
        <Animated.View style={[
          styles.footer,
          { 
            // A. 规范公式：footerPadBottom = safeAreaInsets.bottom + 10
            paddingBottom: insets.bottom + 10,
            // A. 键盘响应动画
            transform: [{
              translateY: keyboardAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -keyboardHeight + insets.bottom],
                extrapolate: 'clamp',
              })
            }],
            // 键盘显示时背景优化
            backgroundColor: keyboardAnimatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.liquidGlass.floating.background, 'rgba(255, 255, 255, 0.98)'],
              extrapolate: 'clamp',
            }),
            // 深色模式适配（已禁用，保持light模式）
            ...(false ? {
              backgroundColor: keyboardAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.98)'],
                extrapolate: 'clamp',
              }),
            } : {}),
          }
        ]}>
          {showResultCount && (
            <Text style={styles.resultCount}>
              {filteredCount > 0 
                ? t('filters.resultsCountNumber', { count: filteredCount })
                : t('filters.noResults', '没有找到活动')
              }
            </Text>
          )}
          {!showResultCount && (
            <View style={{ flex: 1 }} />
          )}
          <View style={styles.applyButtonShadowContainer}>
            <TouchableOpacity style={styles.applyButton} onPress={() => {
              // 应用临时状态到实际状态
              onFiltersChange(tempFilters);
              onSearchChange(tempSearchText);
              
              // 计算过滤后的数量
              if (getFilteredCount) {
                const count = getFilteredCount(tempFilters, tempSearchText);
                setFilteredCount(count);
              }
              setShowResultCount(true); // 点击应用后显示结果数量
              setTimeout(() => {
                onClose();
              }, 800); // 延迟关闭，让用户看到结果
            }}>
              <View style={styles.applyButtonGlass}>
                <Text style={styles.applyButtonText}>{t('filters.apply', 'Apply')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: LIQUID_GLASS_LAYERS.L3.backdrop.light as any,
    zIndex: 999998, // 提高层级确保覆盖所有UI元素包括导航栏
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: LIQUID_GLASS_LAYERS.L3.borderRadius.modal,
    borderTopRightRadius: LIQUID_GLASS_LAYERS.L3.borderRadius.modal,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    ...(theme.shadows as any)[LIQUID_GLASS_LAYERS.L3.shadow.light],
    zIndex: 999999, // 确保在遮罩之上并覆盖所有UI元素
    elevation: 999, // Android兼容性
  },

  // v1.2 规范: 手柄样式
  // D. 顶部工具行高度44-48pt - 整体内容向下15px
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8, // 保持原有的上下间距，在组件内额外增加15px
    paddingBottom: 8,
  },
  handle: {
    width: BOTTOM_SHEET_CONFIG.HANDLE_WIDTH, // 36pt
    height: BOTTOM_SHEET_CONFIG.HANDLE_HEIGHT, // 4pt
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: BOTTOM_SHEET_CONFIG.HANDLE_HEIGHT / 2,
    opacity: 0.6,
  },

  // D. 标题栏与搜索框间距 - 缩短35px
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // 统一16pt左右间距
    paddingTop: 0, // 移除负值
    paddingBottom: 0, // 移除负值
    marginTop: -10, // 使用margin代替
    marginBottom: -13, // 使用margin代替
    minHeight: 44, // D. 最小高度44pt
    borderBottomWidth: 0, // 移除分割线减弱视觉占地
    position: 'relative', // 为绝对定位标题做准备
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    position: 'absolute', // 绝对定位
    left: 0,
    right: 0,
    textAlign: 'center', // 居中对齐
    zIndex: 0, // 在按钮下层
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1, // 确保在标题上层
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    zIndex: 1, // 确保在标题上层
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.base, // 从sm放大到base
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold, // 加粗一点
  },
  expandButton: {
    padding: theme.spacing.xs,
  },

  // B. 搜索框上下间距：各 12pt
  searchContainer: {
    paddingHorizontal: 16, // 统一使用16pt左右间距
    paddingVertical: 12, // B. 搜索框上下间距各12pt
    borderBottomWidth: 0, // B. 减弱视觉占地，移除分割线
  },
  // Search Input Shadow容器 - 解决阴影冲突
  searchInputShadowContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 更不透明的背景用于阴影优化
    ...theme.shadows.xs,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.3)',
    // 移除阴影，由searchInputShadowContainer处理
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    // 深色模式输入框优化（已禁用）
    ...(false ? {
      color: '#ffffff', // 主文字颜色保持最高对比度
    } : {}),
  },

  // 内容区域
  content: {
    flex: 1,
    paddingHorizontal: 0, // 移除padding，由filterSection提供
  },
  contentContainer: {
    // A. 按规范公式计算scrollContentPaddingBottom = 56 + (safeBottom+10) + 12
    // 不使用硬编码，在组件内动态计算
    // paddingBottom 在组件内通过 insets 动态设置
  },
  // B. Section间距规范：外边距12，内边距12/16 - 调整：每个空白缩短15px
  filterSection: {
    marginTop: 0, // 调整为0，避免负margin问题
    marginBottom: 0, // 调整为0
    paddingHorizontal: 16, // B. Section内边距：左右16pt
    paddingVertical: 12, // B. Section内边距：上下12pt
    // B. 减弱卡片阴影/双层外边距，使用轻材质
    backgroundColor: 'transparent', // 无背景避免视觉占地
  },
  // B. Section标题与芯片区间距：8pt
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 8, // B. 标题↔芯片间距8pt
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // 使用gap属性替代负边距，row gap = column gap = 8pt
    paddingHorizontal: 0, // 移除负边距，使用统一的16pt内边距（由父容器提供）
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // 12-14pt范围内的水平内边距
    paddingVertical: 8, // 8pt垂直内边距
    borderWidth: 1,
    borderRadius: 18, // 18-20pt圆角
    minHeight: 36, // 36-40pt最小高度
    flexShrink: 1, // 启用收缩，避免被图标/计数挤爆
    overflow: 'hidden', // 外层裁剪，溢出在边界内被裁
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
  },
  filterOptionActive: {
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
  },
  filterIcon: {
    width: 20, // 固定宽高，不占据多余空间
    height: 20,
    marginRight: 6, // 与文本间距
  },
  filterLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.2, // lineHeight ≈ fontSize × 1.2
    flexShrink: 1, // 允许收缩，避免溢出
    // 深色模式对比度优化 - 确保≥ 4.5:1 对比度
    ...(false ? {
      color: 'rgba(255, 255, 255, 0.85)', // 更高对比度的深色模式文字
    } : {}),
  },
  filterLabelActive: {
    color: theme.colors.text.inverse,
  },
  filterCount: {
    marginLeft: 6, // 与文本留6pt间距
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.badge,
    minWidth: 18, // 自身最小宽度
    alignItems: 'center',
    flexShrink: 0, // 计数徽标不收缩，固定在最右
  },
  filterCountText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.tertiary,
  },
  filterCountTextActive: {
    color: theme.colors.text.inverse,
  },

  // 底部操作栏 - 钉住(pinned)机制
  // A. Footer规范尺寸：footerBodyHeight = 56pt（不含安全区）- 向上移动50px
  footer: {
    position: 'absolute',
    bottom: 50, // 向上提高15px，从35px改为50px
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12, // 计算使 footerBodyHeight = 56 (12*2 + 按钮高度约32)
    minHeight: 56, // A. 规范明确的footerBodyHeight
    borderTopWidth: 1,
    borderTopColor: theme.liquidGlass.card.border,
    backgroundColor: theme.liquidGlass.floating.background,
    // 深色模式适配
    ...(false ? {
      backgroundColor: 'rgba(28, 28, 30, 0.95)',
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    } : {}),
  },
  resultCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
    // 深色模式对比度优化
    ...(false ? {
      color: 'rgba(255, 255, 255, 0.75)', // 次级文字但仍保持可读性
    } : {}),
  },
  // Apply Button Shadow容器 - 解决阴影冲突
  applyButtonShadowContainer: {
    borderRadius: theme.borderRadius.button,
    backgroundColor: 'transparent',
    ...theme.shadows.button,
  },
  
  applyButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.button,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#1F2937', // 深灰色字体，在奶橘背景上清晰可读
  },
  
  // V2.0 极简白色玻璃按钮 - iOS风格
  applyButtonGlass: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 极简白色玻璃
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // 淡灰边框
    borderTopColor: 'rgba(255, 255, 255, 0.8)', // 顶部白色高光
    ...theme.shadows.xs, // 轻微阴影增强立体感
  },
});