import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LoaderOne } from './LoaderOne';
import { theme } from '../../theme';

interface LoadingProps {
  /**
   * Size of the loader
   * Compatible with ActivityIndicator API
   */
  size?: 'small' | 'large';
  /**
   * Color of the loader
   * Compatible with ActivityIndicator API
   */
  color?: string;
  /**
   * Optional loading text below the loader
   */
  text?: string;
  /**
   * Style for the loading text
   */
  textStyle?: TextStyle;
  /**
   * Container style
   */
  style?: ViewStyle;
  /**
   * Whether to show as fullscreen centered loader
   */
  fullscreen?: boolean;
}

/**
 * Loading - Unified loading component wrapper
 *
 * Provides backward compatibility with ActivityIndicator API
 * while using the elegant LoaderOne animation
 *
 * Usage:
 * ```tsx
 * // Simple replacement for ActivityIndicator
 * <Loading size="large" color={theme.colors.primary} />
 *
 * // With loading text
 * <Loading size="large" text="Loading..." />
 *
 * // Fullscreen loading
 * <Loading fullscreen text="Please wait..." />
 * ```
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = theme.colors.primary,
  text,
  textStyle,
  style,
  fullscreen = false,
}) => {
  if (fullscreen) {
    return (
      <View style={[styles.fullscreenContainer, style]}>
        <LoaderOne size={size} color={color} />
        {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
      </View>
    );
  }

  if (text) {
    return (
      <View style={[styles.containerWithText, style]}>
        <LoaderOne size={size} color={color} />
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </View>
    );
  }

  return <LoaderOne size={size} color={color} style={style} />;
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  containerWithText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});

export default Loading;
