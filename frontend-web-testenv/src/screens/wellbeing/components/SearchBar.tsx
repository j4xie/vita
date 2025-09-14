import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';
import { LIQUID_GLASS_LAYERS, BRAND_GLASS } from '../../../theme/core';
import { usePerformanceDegradation } from '../../../hooks/usePerformanceDegradation';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onScanQR: () => void;
  loading?: boolean;
  error?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onScanQR,
  loading = false,
  error,
  placeholder,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  const inputRef = useRef<TextInput>(null);
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  // 处理错误状态动画
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(errorOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  // 手机号格式验证
  const validatePhoneNumber = (phone: string) => {
    // 简单的中国手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // 格式化手机号显示（添加空格）
  const formatPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    const formatted = numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    return formatted.length <= 13 ? formatted : formatted.substring(0, 13);
  };

  // 处理输入变化
  const handleChangeText = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted.replace(/\s/g, '')); // 传递纯数字给父组件
  };

  // 处理搜索
  const handleSearch = () => {
    if (!value.trim()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      // 聚焦输入框提示用户输入
      inputRef.current?.focus();
      return;
    }

    if (!validatePhoneNumber(value)) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    Keyboard.dismiss();
    onSearch();
  };

  // 处理扫码按钮
  const handleScanQR = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    // 显示轻量提示而不是阻断弹窗 - 改为非阻断方式
    onScanQR();
  };

  // 处理输入框聚焦
  const handleFocus = () => {
    setIsFocused(true);
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  };

  // 处理输入框失焦
  const handleBlur = () => {
    setIsFocused(false);
  };

  // 处理回车键
  const handleSubmitEditing = () => {
    handleSearch();
  };

  // 获取输入框状态样式
  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer];
    
    if (error && !isFocused) {
      baseStyle.push(styles.inputContainerError);
    } else if (isFocused) {
      baseStyle.push(styles.inputContainerFocused);
    }
    
    return [
      ...baseStyle,
      {
        backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
        borderColor: error && !isFocused 
          ? theme.colors.danger 
          : isFocused 
            ? theme.colors.primary 
            : isDarkMode ? '#48484a' : '#c6c6c8'
      }
    ];
  };

  return (
    <View style={styles.container}>
      {/* 主搜索区域 */}
      <View style={getInputContainerStyle()}>
        {/* 搜索图标 */}
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? theme.colors.primary : (isDarkMode ? '#8e8e93' : '#8e8e93')}
          style={styles.searchIcon}
        />
        
        {/* 输入框 */}
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}
          value={formatPhoneNumber(value)}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          placeholder={placeholder || t('volunteerCheckIn.searchPlaceholder')}
          placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
          keyboardType="phone-pad"
          maxLength={13} // 格式化后的长度
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          editable={!loading}
          accessibilityLabel={t('wellbeing.searchVolunteerPhone')}
          accessibilityHint={t('wellbeing.searchHint')}
        />
        
        {/* 清空按钮 */}
        {value.length > 0 && !loading && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={t('wellbeing.clearInput')}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={isDarkMode ? '#8e8e93' : '#8e8e93'}
            />
          </TouchableOpacity>
        )}
        
        {/* 加载指示器 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Ionicons name="sync" size={16} color={theme.colors.primary} />
          </View>
        )}
        
        {/* 扫码按钮 */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            { backgroundColor: '#E5E7EB' } // 灰色背景
          ]}
          onPress={handleScanQR}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityLabel={t('wellbeing.scanQRCode')}
          accessibilityHint={t('wellbeing.scanComingSoon')}
        >
          <Ionicons
            name="qr-code-outline"
            size={24}
            color={loading ? '#6B728060' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      {/* 内联错误提示 */}
      {error && (
        <Animated.View style={[styles.errorContainer, { opacity: errorOpacity }]}>
          <Ionicons name="alert-circle" size={14} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {error}
          </Text>
        </Animated.View>
      )}

      {/* 搜索建议（当输入3位以上时显示） */}
      {value.length >= 3 && isFocused && !loading && (
        <View style={[
          styles.suggestionsContainer,
          { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff' }
        ]}>
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={handleSearch}
            activeOpacity={0.6}
          >
            <Ionicons name="search" size={16} color={theme.colors.primary} />
            <Text style={[
              styles.suggestionText,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              {t('wellbeing.searchFor', { phone: formatPhoneNumber(value) })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingLeft: 16,
    paddingRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputContainerFocused: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputContainerError: {
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingVertical: 0, // 移除默认padding确保垂直居中
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
  },
  loadingContainer: {
    padding: 8,
    marginRight: 8,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 16,
  },
  errorText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 48,
  },
  suggestionText: {
    fontSize: 16,
    marginLeft: 8,
  },
});

export default SearchBar;