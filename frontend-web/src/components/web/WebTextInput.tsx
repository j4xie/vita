import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Platform, TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native';

interface WebTextInputProps extends RNTextInputProps {
  debugMode?: boolean;
}

export const WebTextInput = forwardRef<RNTextInput, WebTextInputProps>((props, ref) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const internalRef = useRef<RNTextInput>(null);
  const debugMode = props.debugMode !== false; // 默认开启调试模式
  
  // 统一ref处理
  const inputRef = ref || internalRef;

  // Web环境调试信息收集
  useEffect(() => {
    if (Platform.OS === 'web' && debugMode) {
      const updateDebugInfo = () => {
        setDebugInfo({
          timestamp: new Date().toLocaleTimeString(),
          placeholder: props.placeholder,
          value: props.value,
          editable: props.editable !== false,
          disabled: props.disabled || false,
          hasOnChangeText: !!props.onChangeText,
          hasOnFocus: !!props.onFocus,
          autoFocus: props.autoFocus,
          readOnly: props.readOnly,
        });
      };
      
      updateDebugInfo();
      
      // 定期更新调试信息
      const interval = setInterval(updateDebugInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [props.placeholder, props.value, props.editable, props.disabled, props.onChangeText, props.onFocus, debugMode]);

  // 在Web环境下，使用增强的TextInput
  if (Platform.OS === 'web') {
    if (debugMode) {
      console.log('🌐 [WebTextInput] Web环境输入框初始化:', {
        ...debugInfo,
        component: 'WebTextInput'
      });
    }

    return (
      <RNTextInput
        ref={inputRef}
        {...props}
        // 移除debugMode属性，避免传递给DOM
        debugMode={undefined}
        style={[
          {
            // Web环境下的关键修复样式 - 保持原有样式
            cursor: 'text',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            pointerEvents: 'auto',
            // 确保输入框层级和可见性
            zIndex: 10,
            position: 'relative',
            // 移除Web默认样式，避免冲突
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
            // 确保输入框可以接收点击事件
            touchAction: 'manipulation',
            // 确保边框可见性（如果需要）
            boxSizing: 'border-box',
            // 确保透明度正常
            opacity: 1,
            // 禁用outline，使用borderColor来显示聚焦状态
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          },
          props.style, // 将传入的样式放在后面，确保优先级
        ]}
        // 增强的事件处理器
        onFocus={(e) => {
          if (debugMode) {
            console.log('🎯 [WebTextInput] 输入框获得焦点:', {
              placeholder: props.placeholder,
              currentValue: e.nativeEvent?.target?.value || props.value,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          if (debugMode) {
            console.log('👋 [WebTextInput] 输入框失去焦点:', {
              placeholder: props.placeholder,
              finalValue: e.nativeEvent?.target?.value || props.value,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          if (debugMode) {
            console.log('🔄 [WebTextInput] onChange事件:', {
              placeholder: props.placeholder,
              newValue: e.nativeEvent?.text,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onChange?.(e);
        }}
        onChangeText={(text) => {
          if (debugMode) {
            console.log('📝 [WebTextInput] onChangeText事件:', {
              placeholder: props.placeholder,
              inputText: text,
              textLength: text.length,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onChangeText?.(text);
        }}
        onPress={(e) => {
          if (debugMode) {
            console.log('🖱️ [WebTextInput] 点击事件:', {
              placeholder: props.placeholder,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onPress?.(e);
        }}
        onPressIn={(e) => {
          if (debugMode) {
            console.log('👇 [WebTextInput] 按下开始:', {
              placeholder: props.placeholder,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (debugMode) {
            console.log('👆 [WebTextInput] 按下结束:', {
              placeholder: props.placeholder,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onPressOut?.(e);
        }}
        onTouchStart={(e) => {
          if (debugMode) {
            console.log('👆 [WebTextInput] 触摸开始:', {
              placeholder: props.placeholder,
              touches: e.nativeEvent.touches.length,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onTouchStart?.(e);
        }}
        onTouchEnd={(e) => {
          if (debugMode) {
            console.log('✋ [WebTextInput] 触摸结束:', {
              placeholder: props.placeholder,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onTouchEnd?.(e);
        }}
        onKeyPress={(e) => {
          if (debugMode) {
            console.log('⌨️ [WebTextInput] 按键事件:', {
              placeholder: props.placeholder,
              key: e.nativeEvent.key,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          props.onKeyPress?.(e);
        }}
        // Web环境特有属性
        autoCapitalize={props.autoCapitalize || 'none'}
        autoCorrect={props.autoCorrect !== undefined ? props.autoCorrect : false}
        spellCheck={props.spellCheck !== undefined ? props.spellCheck : false}
        // 确保可编辑性
        editable={props.editable !== false}
        // 确保输入框可以获得焦点
        accessibilityRole="textbox"
        accessible={true}
      />
    );
  }

  // 非Web环境使用原生TextInput
  if (debugMode) {
    console.log('📱 [WebTextInput] 使用原生TextInput环境');
  }
  return <RNTextInput ref={inputRef} {...props} debugMode={undefined} />;
});

WebTextInput.displayName = 'WebTextInput';