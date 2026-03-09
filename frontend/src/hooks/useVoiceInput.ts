/**
 * useVoiceInput Hook
 * 语音输入功能 - 使用 expo-speech-recognition 实现语音转文字
 * 当原生模块不可用时，会优雅降级并返回不支持状态
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import i18n from 'i18next';

// ==================== 动态导入 ====================

// 尝试加载原生模块，如果失败则设为 null
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
let moduleAvailable = false;

try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
  moduleAvailable = !!ExpoSpeechRecognitionModule;
  console.log('[VoiceInput] expo-speech-recognition 模块加载成功');
} catch (error) {
  console.warn('[VoiceInput] expo-speech-recognition 模块不可用，语音功能已禁用');
  moduleAvailable = false;
}

// ==================== 类型定义 ====================

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  hasPermission: boolean | null;
}

export interface UseVoiceInputReturn extends VoiceInputState {
  startListening: () => Promise<void>;
  stopListening: () => void;
  cancelListening: () => void;
  clearTranscript: () => void;
  requestPermission: () => Promise<boolean>;
}

// ==================== 空事件钩子（fallback）====================

function useNoOpSpeechEvent(_event: string, _callback: (event: any) => void) {
  // 当模块不可用时，不注册任何事件
}

// ==================== Hook 实现 ====================

export function useVoiceInput(): UseVoiceInputReturn {
  // 状态
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 追踪是否已挂载
  const isMounted = useRef(true);

  // 检查是否支持语音识别
  const isSupported = moduleAvailable && (Platform.OS === 'ios' || Platform.OS === 'android');

  // 使用实际的事件钩子或空操作
  const useEventHook = moduleAvailable && useSpeechRecognitionEvent
    ? useSpeechRecognitionEvent
    : useNoOpSpeechEvent;

  // 注册语音识别事件（只在模块可用时生效）
  useEventHook('start', () => {
    console.log('[VoiceInput] 开始录音');
    if (isMounted.current) {
      setIsListening(true);
      setError(null);
    }
  });

  useEventHook('end', () => {
    console.log('[VoiceInput] 录音结束');
    if (isMounted.current) {
      setIsListening(false);
    }
  });

  useEventHook('result', (event: any) => {
    const result = event.results[event.resultIndex];
    if (result && isMounted.current) {
      const text = result.transcript || '';
      console.log('[VoiceInput] 识别结果:', { text, isFinal: result.isFinal });

      if (result.isFinal) {
        setTranscript(text);
        setInterimTranscript('');
      } else {
        setInterimTranscript(text);
      }
    }
  });

  useEventHook('error', (event: any) => {
    console.error('[VoiceInput] 错误:', event.error, event.message);

    if (!isMounted.current) return;

    // 用户友好的错误消息
    let errorMessage = '语音识别失败';
    switch (event.error) {
      case 'no-speech':
        errorMessage = '未检测到语音，请重试';
        break;
      case 'audio-capture':
        errorMessage = '无法访问麦克风';
        break;
      case 'not-allowed':
        errorMessage = '麦克风权限被拒绝';
        break;
      case 'network':
        errorMessage = '网络错误，请检查连接';
        break;
      case 'aborted':
        // 用户主动取消，不显示错误
        errorMessage = '';
        break;
      default:
        errorMessage = event.message || '语音识别失败';
    }

    if (errorMessage) {
      setError(errorMessage);
    }
    setIsListening(false);
  });

  /**
   * 请求麦克风权限
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!moduleAvailable || !ExpoSpeechRecognitionModule) {
      console.warn('[VoiceInput] 模块不可用，无法请求权限');
      setHasPermission(false);
      return false;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      const granted = result.granted;
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          '需要麦克风权限',
          '请在设置中允许应用访问麦克风以使用语音输入功能',
          [{ text: '确定' }]
        );
      }

      return granted;
    } catch (err) {
      console.error('[VoiceInput] 请求权限失败:', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * 开始语音识别
   */
  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('当前设备不支持语音识别');
      return;
    }

    if (!moduleAvailable || !ExpoSpeechRecognitionModule) {
      setError('语音识别模块未安装');
      return;
    }

    // 检查权限
    if (hasPermission === null) {
      const granted = await requestPermission();
      if (!granted) return;
    } else if (!hasPermission) {
      await requestPermission();
      return;
    }

    try {
      // 清除之前的临时结果
      setInterimTranscript('');
      setError(null);

      // 根据当前语言设置选择识别语言
      const currentLang = i18n.language;
      const recognitionLang = currentLang === 'zh-CN' ? 'zh-CN' : 'en-US';

      console.log('[VoiceInput] 开始语音识别, 语言:', recognitionLang);

      await ExpoSpeechRecognitionModule.start({
        lang: recognitionLang,
        interimResults: true,
        continuous: false, // 单次识别
        maxAlternatives: 1,
      });
    } catch (err: any) {
      console.error('[VoiceInput] 启动失败:', err);
      setError(err.message || '启动语音识别失败');
      setIsListening(false);
    }
  }, [isSupported, hasPermission, requestPermission]);

  /**
   * 停止语音识别 (处理最终结果)
   */
  const stopListening = useCallback(() => {
    console.log('[VoiceInput] 停止录音');
    if (!moduleAvailable || !ExpoSpeechRecognitionModule) return;

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.warn('[VoiceInput] 停止失败:', err);
    }
  }, []);

  /**
   * 取消语音识别 (不处理结果)
   */
  const cancelListening = useCallback(() => {
    console.log('[VoiceInput] 取消录音');
    if (!moduleAvailable || !ExpoSpeechRecognitionModule) {
      setIsListening(false);
      return;
    }

    try {
      ExpoSpeechRecognitionModule.abort();
      setInterimTranscript('');
    } catch (err) {
      console.warn('[VoiceInput] 取消失败:', err);
    }
    setIsListening(false);
  }, []);

  /**
   * 清除识别结果
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // 组件挂载/卸载处理
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (isListening && moduleAvailable && ExpoSpeechRecognitionModule) {
        try {
          ExpoSpeechRecognitionModule.abort();
        } catch (err) {
          // 忽略
        }
      }
    };
  }, [isListening]);

  return {
    // 状态
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    hasPermission,

    // 方法
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
    requestPermission,
  };
}

export default useVoiceInput;
