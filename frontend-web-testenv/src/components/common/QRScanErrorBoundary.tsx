/* Web端特定版本 - 与App端隔离 */
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface Props {
  children: ReactNode;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  errorInfo?: string;
}

export class QRScanErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorInfo: error.message || '未知错误'
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 [QR-ERROR-BOUNDARY] 捕获到错误:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorInfo: undefined });
    this.props.onRetry?.();
  };

  handleClose = () => {
    this.setState({ hasError: false, errorInfo: undefined });
    this.props.onClose?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons 
              name="warning-outline" 
              size={48} 
              color={theme.colors.error} 
              style={styles.errorIcon}
            />
            <Text style={styles.errorTitle}>
              {this.props.title || '扫码功能出错'}
            </Text>
            <Text style={styles.errorMessage}>
              {this.props.message || '扫码功能遇到问题，请重试'}
            </Text>
            
            <View style={styles.errorActions}>
              {this.props.onRetry && (
                <TouchableOpacity
                  style={[styles.errorButton, styles.retryButton]}
                  onPress={this.handleRetry}
                  accessibilityRole="button"
                  accessibilityLabel="重试"
                  accessibilityHint="重新尝试扫码功能"
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>重试</Text>
                </TouchableOpacity>
              )}
              
              {this.props.onClose && (
                <TouchableOpacity
                  style={[styles.errorButton, styles.closeButton]}
                  onPress={this.handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="关闭"
                  accessibilityHint="关闭错误提示"
                >
                  <Text style={styles.closeButtonText}>关闭</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  errorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
  },
  closeButton: {
    backgroundColor: theme.colors.text.tertiary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default QRScanErrorBoundary;