import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  title?: string;
  message?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/**
 * 🛡️ 增强的错误边界组件
 * 防止组件错误导致整个应用崩溃，提供优雅的错误处理和重试功能
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: undefined,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 🚨 增强的错误日志记录
    console.error('🚨 [ERROR-BOUNDARY] 捕获到组件错误:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    });

    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    // 🔄 重试功能：重置错误状态，增加重试计数
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1,
    }));
    console.log(`🔄 [ERROR-BOUNDARY] 用户重试，第${this.state.retryCount + 1}次`);
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback组件，使用它
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      // 🎨 增强的默认错误UI
      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning-outline" size={48} color={theme.colors.danger} />
          </View>
          
          <Text style={styles.title}>
            {this.props.title || '出现了一些问题'}
          </Text>
          <Text style={styles.message}>
            {this.props.message || '组件遇到错误，但不会影响应用的其他功能'}
          </Text>
          
          {/* 重试按钮 */}
          {(this.props.showRetry !== false) && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={this.retry}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={styles.retryIcon} />
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          )}

          {/* 开发环境显示详细错误信息 */}
          {__DEV__ && this.state.error && (
            <View style={styles.devErrorContainer}>
              <Text style={styles.devErrorTitle}>开发信息:</Text>
              <Text style={styles.devErrorText} numberOfLines={5}>
                {this.state.error.message}
              </Text>
              {this.state.retryCount > 0 && (
                <Text style={styles.retryCountText}>
                  重试次数: {this.state.retryCount}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  devErrorContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    maxHeight: 200,
    width: '100%',
  },
  devErrorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  devErrorText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: 'monospace',
  },
  retryCountText: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
});