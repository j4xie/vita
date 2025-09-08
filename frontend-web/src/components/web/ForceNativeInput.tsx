// 强制使用原生HTML input的React组件 - 解决React Native Web输入问题
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Platform, TextInputProps, StyleSheet } from 'react-native';

interface ForceNativeInputProps extends Omit<TextInputProps, 'style'> {
  style?: any;
  onChangeText?: (text: string) => void;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
}

export const ForceNativeInput = forwardRef<HTMLInputElement, ForceNativeInputProps>((props, ref) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(props.value || '');
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = ref || internalRef;

  // 同步外部value变化
  useEffect(() => {
    if (props.value !== undefined && props.value !== value) {
      setValue(props.value);
    }
  }, [props.value]);

  if (Platform.OS !== 'web') {
    // 非Web环境，这里应该不会被调用，但为了类型安全
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    props.onChangeText?.(newValue);
    
    console.log('🔥 [ForceNativeInput] 原生输入事件:', {
      value: newValue,
      placeholder: props.placeholder,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    props.onFocus?.(e as any);
    
    console.log('🎯 [ForceNativeInput] 原生聚焦事件:', {
      placeholder: props.placeholder,
      value: e.target.value
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    props.onBlur?.(e as any);
    
    console.log('👋 [ForceNativeInput] 原生失焦事件:', {
      placeholder: props.placeholder,
      value: e.target.value
    });
  };

  // 将React Native样式转换为CSS样式
  const convertStyle = (rnStyle: any) => {
    if (!rnStyle) return {};
    
    // 展平样式数组
    const flatStyle = Array.isArray(rnStyle) 
      ? Object.assign({}, ...rnStyle.filter(Boolean))
      : rnStyle;

    // 基础样式设置
    const baseStyle: React.CSSProperties = {
      // 输入框基本样式
      display: 'block',
      width: '100%',
      padding: '12px 16px',
      fontSize: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#FFFFFF',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      color: '#374151',
      // Web必需样式
      outline: 'none',
      cursor: 'text',
      userSelect: 'text',
      WebkitUserSelect: 'text',
      pointerEvents: 'auto',
      touchAction: 'manipulation',
      WebkitAppearance: 'none',
      MozAppearance: 'textfield',
      boxSizing: 'border-box',
      WebkitTapHighlightColor: 'transparent',
      // 聚焦效果
      transition: 'all 0.2s ease-in-out',
    };

    // 转换React Native特定样式
    const cssStyle: React.CSSProperties = { ...baseStyle };
    
    Object.keys(flatStyle).forEach(key => {
      const value = flatStyle[key];
      
      switch (key) {
        case 'paddingHorizontal':
          cssStyle.paddingLeft = value;
          cssStyle.paddingRight = value;
          break;
        case 'paddingVertical':
          cssStyle.paddingTop = value;
          cssStyle.paddingBottom = value;
          break;
        case 'borderRadius':
          cssStyle.borderRadius = value;
          break;
        case 'fontSize':
          cssStyle.fontSize = value;
          break;
        case 'color':
          cssStyle.color = value;
          break;
        case 'backgroundColor':
          cssStyle.backgroundColor = value;
          break;
        case 'borderWidth':
          cssStyle.borderWidth = value;
          cssStyle.borderStyle = 'solid';
          break;
        case 'borderColor':
          cssStyle.borderColor = value;
          break;
        case 'padding':
        case 'margin':
        case 'width':
        case 'height':
        case 'opacity':
        case 'zIndex':
          cssStyle[key as keyof React.CSSProperties] = value;
          break;
        // 忽略可能导致样式冲突的属性
        case 'elevation':
        case 'shadowColor':
        case 'shadowOffset':
        case 'shadowOpacity':
        case 'shadowRadius':
          // 转换为CSS阴影
          if (key === 'elevation' && value > 0) {
            cssStyle.boxShadow = `0 ${Math.min(value, 4)}px ${value * 2}px rgba(0, 0, 0, 0.1)`;
          }
          break;
        default:
          // 谨慎处理其他样式
          if (typeof value === 'string' || typeof value === 'number') {
            (cssStyle as any)[key] = value;
          }
      }
    });

    // 聚焦时的增强样式
    if (focused) {
      cssStyle.borderColor = '#007AFF';
      cssStyle.boxShadow = '0 0 0 2px rgba(0, 122, 255, 0.2)';
    }

    return cssStyle;
  };

  const inputType = props.keyboardType === 'email-address' ? 'email' :
                   props.keyboardType === 'phone-pad' ? 'tel' :
                   props.keyboardType === 'numeric' ? 'number' :
                   props.secureTextEntry ? 'password' :
                   'text';

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={inputType}
      value={value}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={props.placeholder}
      disabled={props.editable === false || props.disabled}
      readOnly={props.readOnly}
      autoCapitalize={props.autoCapitalize}
      autoCorrect={props.autoCorrect ? 'on' : 'off'}
      spellCheck={props.spellCheck}
      style={convertStyle(props.style)}
      onKeyDown={(e) => {
        console.log('⌨️ [ForceNativeInput] 按键事件:', e.key);
        props.onKeyPress?.(e as any);
      }}
      onClick={() => {
        console.log('🖱️ [ForceNativeInput] 点击事件');
      }}
      // 标识符，防止被WebInputFix处理
      data-force-native="true"
      data-component="ForceNativeInput"
    />
  );
});

ForceNativeInput.displayName = 'ForceNativeInput';