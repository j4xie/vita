import React from 'react';
import { Dimensions, Platform } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface RichTextRendererProps {
  html: string;
  contentWidth?: number;
  darkBackground?: boolean; // 是否在深色背景上显示
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  html,
  contentWidth,
  darkBackground = false
}) => {
  // Safety check for empty or invalid HTML
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return null;
  }

  const defaultContentWidth = contentWidth || screenWidth - theme.spacing[4] * 2;

  // 🎨 辅助函数：检测颜色是否为黑色或深色
  const isDarkColor = (color: string): boolean => {
    if (!color) return false;

    const normalized = color.toLowerCase().trim();

    // 直接匹配黑色
    if (normalized === '#000' || normalized === '#000000' ||
        normalized === 'black' || normalized === 'rgb(0,0,0)' ||
        normalized === 'rgb(0, 0, 0)' || normalized === 'rgba(0,0,0,1)' ||
        normalized === 'rgba(0, 0, 0, 1)') {
      return true;
    }

    // 检测深灰色 (RGB值都小于50)
    const rgbMatch = normalized.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      if (r < 50 && g < 50 && b < 50) return true;
    }

    // 检测十六进制深色 (#000 到 #333)
    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        if (r < 50 && g < 50 && b < 50) return true;
      } else {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (r < 50 && g < 50 && b < 50) return true;
      }
    }

    return false;
  };

  // 🎨 辅助函数：转换样式中的颜色
  const convertColors = (style: any): any => {
    if (!darkBackground || !style) return style;

    const converted = { ...style };

    // 转换文字颜色
    if (style.color && isDarkColor(style.color)) {
      converted.color = '#FFFFFF';
    }

    return converted;
  };

  // Define custom font families for different font types
  const fontFamilies = {
    standard: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif'
    }),
    monospace: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace'
    })
  };

  // 🎨 根据背景选择文字颜色
  const textColor = darkBackground ? '#FFFFFF' : theme.colors.text.secondary;
  const primaryTextColor = darkBackground ? '#FFFFFF' : theme.colors.text.primary;

  // Comprehensive tag styles supporting all editor features
  const tagsStyles: any = {
    // Basic text container
    body: {
      fontSize: theme.typography.fontSize.base,
      color: textColor,
      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
      fontFamily: fontFamilies.standard,
    },

    // Paragraph
    p: {
      fontSize: theme.typography.fontSize.base,
      color: textColor,
      marginBottom: theme.spacing[3],
      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
    },

    // Text formatting
    strong: {
      fontWeight: theme.typography.fontWeight.bold,
      color: primaryTextColor,
    },
    b: {
      fontWeight: theme.typography.fontWeight.bold,
      color: primaryTextColor,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    i: {
      fontStyle: 'italic' as const,
    },
    u: {
      textDecorationLine: 'underline' as const,
    },
    s: {
      textDecorationLine: 'line-through' as const,
    },
    del: {
      textDecorationLine: 'line-through' as const,
      opacity: 0.6,
    },
    strike: {
      textDecorationLine: 'line-through' as const,
    },
    ins: {
      textDecorationLine: 'underline' as const,
      color: theme.colors.success,
    },
    mark: {
      backgroundColor: 'rgba(255, 235, 59, 0.3)',
      paddingHorizontal: 2,
    },

    // Headings H1-H6
    h1: {
      fontSize: theme.typography.fontSize['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: primaryTextColor,
      marginBottom: theme.spacing[4],
      marginTop: theme.spacing[5],
    },
    h2: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: primaryTextColor,
      marginBottom: theme.spacing[3],
      marginTop: theme.spacing[4],
    },
    h3: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.semibold,
      color: primaryTextColor,
      marginBottom: theme.spacing[3],
      marginTop: theme.spacing[3],
    },
    h4: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: primaryTextColor,
      marginBottom: theme.spacing[2],
      marginTop: theme.spacing[3],
    },
    h5: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: primaryTextColor,
      marginBottom: theme.spacing[2],
      marginTop: theme.spacing[2],
    },
    h6: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: primaryTextColor,
      marginBottom: theme.spacing[2],
      marginTop: theme.spacing[2],
    },

    // Lists
    ul: {
      marginLeft: theme.spacing[4],
      marginBottom: theme.spacing[3],
    },
    ol: {
      marginLeft: theme.spacing[4],
      marginBottom: theme.spacing[3],
    },
    li: {
      fontSize: theme.typography.fontSize.base,
      color: textColor,
      marginBottom: theme.spacing[1],
      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
    },

    // Blockquote
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      paddingLeft: theme.spacing[3],
      marginLeft: 0,
      marginBottom: theme.spacing[3],
      fontStyle: 'italic' as const,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      paddingVertical: theme.spacing[2],
      paddingRight: theme.spacing[3],
    },

    // Links
    a: {
      color: theme.colors.primary,
      textDecorationLine: 'underline' as const,
    },

    // Code
    code: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      fontFamily: fontFamilies.monospace,
      fontSize: theme.typography.fontSize.sm,
      paddingHorizontal: theme.spacing[1],
      paddingVertical: 2,
      borderRadius: 4,
      color: '#e91e63',
    },
    pre: {
      backgroundColor: '#f5f5f5',
      padding: theme.spacing[3],
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing[3],
      overflow: 'scroll',
    },

    // Tables
    table: {
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing[3],
    },
    thead: {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    tbody: {},
    th: {
      padding: theme.spacing[2],
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
      fontWeight: theme.typography.fontWeight.semibold,
      color: primaryTextColor,
    },
    td: {
      padding: theme.spacing[2],
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)',
      color: textColor,
    },

    // Horizontal rule
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      marginVertical: theme.spacing[4],
    },

    // Superscript and subscript
    sup: {
      fontSize: theme.typography.fontSize.xs,
      // Note: verticalAlign is not supported in React Native
    },
    sub: {
      fontSize: theme.typography.fontSize.xs,
      // Note: verticalAlign is not supported in React Native
    },

    // Line breaks
    br: {
      height: theme.spacing[2],
    },

    // Definition lists
    dl: {
      marginBottom: theme.spacing[3],
    },
    dt: {
      fontWeight: theme.typography.fontWeight.semibold,
      color: primaryTextColor,
      marginTop: theme.spacing[2],
    },
    dd: {
      marginLeft: theme.spacing[4],
      marginBottom: theme.spacing[2],
      color: textColor,
    },

    // Other semantic elements
    abbr: {
      textDecorationLine: 'underline' as const,
      textDecorationStyle: 'dotted' as const,
    },
    cite: {
      fontStyle: 'italic' as const,
    },
    small: {
      fontSize: theme.typography.fontSize.xs,
    },
    kbd: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: 4,
      paddingHorizontal: theme.spacing[1],
      paddingVertical: 2,
      fontFamily: fontFamilies.monospace,
      fontSize: theme.typography.fontSize.sm,
    },
  };

  // Classes styles for text alignment and other class-based styling
  const classesStyles: any = {
    'text-left': {
      textAlign: 'left' as const,
    },
    'text-center': {
      textAlign: 'center' as const,
    },
    'text-right': {
      textAlign: 'right' as const,
    },
    'text-justify': {
      textAlign: 'justify' as const,
    },
    'font-standard': {
      fontFamily: fontFamilies.standard,
    },
    'font-serif': {
      fontFamily: fontFamilies.serif,
    },
    'font-mono': {
      fontFamily: fontFamilies.monospace,
    },
    // Font size classes
    'text-xs': {
      fontSize: theme.typography.fontSize.xs,
    },
    'text-sm': {
      fontSize: theme.typography.fontSize.sm,
    },
    'text-base': {
      fontSize: theme.typography.fontSize.base,
    },
    'text-lg': {
      fontSize: theme.typography.fontSize.lg,
    },
    'text-xl': {
      fontSize: theme.typography.fontSize.xl,
    },
    'text-2xl': {
      fontSize: theme.typography.fontSize['2xl'],
    },
    'text-3xl': {
      fontSize: theme.typography.fontSize['3xl'],
    },

    // Quill editor specific classes
    'ql-size-small': {
      fontSize: 10,
    },
    'ql-size-large': {
      fontSize: 18,
    },
    'ql-size-huge': {
      fontSize: 28,
    },
    'ql-align-center': {
      textAlign: 'center' as const,
    },
    'ql-align-right': {
      textAlign: 'right' as const,
    },
    'ql-align-justify': {
      textAlign: 'justify' as const,
    },
    'ql-indent-1': {
      marginLeft: theme.spacing[4],
    },
    'ql-indent-2': {
      marginLeft: theme.spacing[8],
    },
    'ql-indent-3': {
      marginLeft: theme.spacing[4] * 3,
    },
    'ql-indent-4': {
      marginLeft: theme.spacing[4] * 4,
    },
    'ql-indent-5': {
      marginLeft: theme.spacing[4] * 5,
    },
    'ql-indent-6': {
      marginLeft: theme.spacing[4] * 6,
    },
    'ql-indent-7': {
      marginLeft: theme.spacing[4] * 7,
    },
    'ql-indent-8': {
      marginLeft: theme.spacing[4] * 8,
    },
  };

  // Custom renderers for complex elements
  const renderers = {
    // Enhanced image renderer
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

  // System fonts configuration
  const systemFonts = [
    fontFamilies.standard,
    fontFamilies.serif,
    fontFamilies.monospace,
    'System',
    'San Francisco',
    'Roboto',
    'Helvetica Neue',
    'Helvetica',
    'Arial',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Menlo',
    'Monaco',
  ];

  // 🎨 自定义渲染器：自动转换内联样式中的黑色文字
  const domVisitors = darkBackground ? {
    onElement: (element: any) => {
      // 处理元素的内联样式
      if (element.attribs?.style) {
        const styleStr = element.attribs.style;

        // 检测并替换黑色文字
        if (styleStr.includes('color')) {
          const colorMatch = styleStr.match(/color:\s*([^;]+)/);
          if (colorMatch && isDarkColor(colorMatch[1])) {
            element.attribs.style = styleStr.replace(
              /color:\s*[^;]+/,
              'color: #FFFFFF'
            );
          }
        }
      }
    }
  } : undefined;

  return (
    <RenderHtml
      contentWidth={defaultContentWidth}
      source={{ html }}
      tagsStyles={tagsStyles}
      classesStyles={classesStyles}
      renderersProps={renderers}
      systemFonts={systemFonts}
      enableExperimentalBRCollapsing={true}
      enableExperimentalGhostLinesPrevention={true}
      enableExperimentalMarginCollapsing={true}
      domVisitors={domVisitors}
    />
  );
};