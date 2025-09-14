/**
 * 🛡️ 通用错误处理工具
 * 统一应用中的错误处理逻辑，减少代码重复
 */

export interface ErrorContext {
  action: string;
  component?: string;
  userId?: number;
  additionalInfo?: Record<string, any>;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * 统一的错误日志记录
 */
export const logError = (error: Error | string, context: ErrorContext) => {
  const timestamp = new Date().toISOString();
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  console.error(`🚨 [${context.component || 'APP'}] ${context.action}失败:`, {
    error: errorMessage,
    timestamp,
    userId: context.userId,
    ...context.additionalInfo,
  });
};

/**
 * 将技术错误转换为用户友好的错误信息
 */
export const getUserFriendlyError = (error: Error | string, action: string): UserFriendlyError => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // 网络错误
  if (errorMessage.includes('Network request failed') || errorMessage.includes('timeout')) {
    return {
      title: '网络连接异常',
      message: '请检查网络连接后重试',
      actionText: '重试',
    };
  }
  
  // 权限错误
  if (errorMessage.includes('权限') || errorMessage.includes('permission') || errorMessage.includes('401')) {
    return {
      title: '权限不足',
      message: '您没有执行此操作的权限，请联系管理员',
      actionText: '确定',
    };
  }
  
  // 服务器错误
  if (errorMessage.includes('500') || errorMessage.includes('服务器')) {
    return {
      title: '服务器异常',
      message: '服务器暂时无法响应，请稍后重试',
      actionText: '重试',
    };
  }
  
  // 数据错误
  if (errorMessage.includes('record') || errorMessage.includes('记录')) {
    return {
      title: '数据异常',
      message: '数据状态异常，请刷新页面后重试',
      actionText: '刷新',
    };
  }
  
  // 默认错误
  return {
    title: `${action}失败`,
    message: '操作失败，请稍后重试',
    actionText: '重试',
  };
};

/**
 * 统一的API错误处理
 */
export const handleAPIError = (
  error: Error | string, 
  context: ErrorContext,
  showAlert: (title: string, message: string, buttons?: any[]) => void
) => {
  // 记录详细错误
  logError(error, context);
  
  // 显示用户友好错误
  const friendlyError = getUserFriendlyError(error, context.action);
  
  const buttons = friendlyError.onAction ? [
    { text: '取消', style: 'cancel' },
    { text: friendlyError.actionText, onPress: friendlyError.onAction }
  ] : [{ text: friendlyError.actionText || '确定' }];
  
  showAlert(friendlyError.title, friendlyError.message, buttons);
};

/**
 * 网络重试逻辑
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
      console.log(`🔄 [RETRY] 第${attempt}次重试...`);
    }
  }
  
  throw lastError!;
};