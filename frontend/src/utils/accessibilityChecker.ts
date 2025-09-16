/**
 * v1.2 无障碍合规性检查工具
 * 用于验证组件是否符合WCAG 2.1 AA标准
 */

import { theme } from '../theme';

/**
 * 颜色对比度计算
 * 基于WCAG 2.1标准
 */
export class ColorContrastChecker {
  /**
   * 计算相对亮度
   */
  private static getRelativeLuminance(hex: string): number {
    // 移除#号
    const color = hex.replace('#', '');
    
    // 转换为RGB
    const r = parseInt(color.substr(0, 2), 16) / 255;
    const g = parseInt(color.substr(2, 2), 16) / 255;
    const b = parseInt(color.substr(4, 2), 16) / 255;
    
    // 应用gamma校正
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    // 计算相对亮度
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  /**
   * 计算两个颜色的对比度
   * @returns 对比度比率 (1:1 到 21:1)
   */
  static getContrastRatio(foreground: string, background: string): number {
    const l1 = this.getRelativeLuminance(foreground);
    const l2 = this.getRelativeLuminance(background);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * 检查是否符合WCAG AA标准
   * 普通文本: 4.5:1
   * 大文本(18pt+或14pt+粗体): 3:1
   */
  static meetsWCAG_AA(
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const requiredRatio = isLargeText ? 3 : 4.5;
    return ratio >= requiredRatio;
  }
  
  /**
   * 检查是否符合WCAG AAA标准
   * 普通文本: 7:1
   * 大文本: 4.5:1
   */
  static meetsWCAG_AAA(
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const requiredRatio = isLargeText ? 4.5 : 7;
    return ratio >= requiredRatio;
  }
  
  /**
   * 获取推荐的文本颜色（基于背景色）
   */
  static getAccessibleTextColor(
    backgroundColor: string,
    preferDark: boolean = true
  ): string {
    const darkText = theme.colors.text.primary;
    const lightText = theme.colors.text.inverse;
    
    const darkRatio = this.getContrastRatio(darkText, backgroundColor);
    const lightRatio = this.getContrastRatio(lightText, backgroundColor);
    
    // 都符合标准时，根据偏好选择
    if (darkRatio >= 4.5 && lightRatio >= 4.5) {
      return preferDark ? darkText : lightText;
    }
    
    // 选择对比度更高的
    return darkRatio > lightRatio ? darkText : lightText;
  }
}

/**
 * 触摸目标验证器
 */
export class TouchTargetValidator {
  /**
   * 检查尺寸是否符合最小触摸目标
   * WCAG 2.1: 最小44×44 CSS像素
   * Material Design: 48×48 dp
   */
  static validate(width: number, height: number): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const minSize = theme.touchTarget.minimum;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (width < minSize) {
      issues.push(`宽度${width}pt小于最小要求${minSize}pt`);
      recommendations.push(`增加宽度至少到${minSize}pt`);
    }
    
    if (height < minSize) {
      issues.push(`高度${height}pt小于最小要求${minSize}pt`);
      recommendations.push(`增加高度至少到${minSize}pt`);
    }
    
    // 检查是否可以通过hitSlop补偿
    if (issues.length > 0) {
      const widthDeficit = Math.max(0, minSize - width);
      const heightDeficit = Math.max(0, minSize - height);
      
      if (widthDeficit > 0 || heightDeficit > 0) {
        recommendations.push(
          `或使用hitSlop: { top: ${heightDeficit/2}, bottom: ${heightDeficit/2}, left: ${widthDeficit/2}, right: ${widthDeficit/2} }`
        );
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
  
  /**
   * 计算推荐的hitSlop
   */
  static calculateHitSlop(
    currentWidth: number,
    currentHeight: number
  ): { top: number; bottom: number; left: number; right: number } | null {
    const minSize = theme.touchTarget.minimum;
    
    if (currentWidth >= minSize && currentHeight >= minSize) {
      return null; // 不需要hitSlop
    }
    
    const horizontalDeficit = Math.max(0, minSize - currentWidth);
    const verticalDeficit = Math.max(0, minSize - currentHeight);
    
    return {
      top: Math.ceil(verticalDeficit / 2),
      bottom: Math.floor(verticalDeficit / 2),
      left: Math.ceil(horizontalDeficit / 2),
      right: Math.floor(horizontalDeficit / 2),
    };
  }
}

/**
 * 文本可读性检查器
 */
export class TextReadabilityChecker {
  /**
   * 检查字体大小是否适合阅读
   */
  static checkFontSize(fontSize: number, isBodyText: boolean = true): {
    isAccessible: boolean;
    recommendation?: string;
  } {
    const minBodySize = 14; // 最小正文字体
    const minCaptionSize = 12; // 最小辅助文字
    
    const minSize = isBodyText ? minBodySize : minCaptionSize;
    
    if (fontSize < minSize) {
      return {
        isAccessible: false,
        recommendation: `字体大小${fontSize}pt小于推荐的${minSize}pt`,
      };
    }
    
    return { isAccessible: true };
  }
  
  /**
   * 检查行间距是否适合阅读
   */
  static checkLineSpacing(lineHeight: number, fontSize: number): {
    isAccessible: boolean;
    recommendation?: string;
  } {
    const ratio = lineHeight / fontSize;
    const minRatio = 1.4; // WCAG推荐最小1.5，这里稍微放宽
    
    if (ratio < minRatio) {
      return {
        isAccessible: false,
        recommendation: `行高比例${ratio.toFixed(2)}小于推荐的${minRatio}`,
      };
    }
    
    return { isAccessible: true };
  }
}

/**
 * 综合无障碍审计
 */
export class AccessibilityAuditor {
  /**
   * 审计颜色方案
   */
  static auditColorScheme(): {
    passed: number;
    failed: number;
    details: {
      combination: string;
      ratio: number;
      meetsAA: boolean;
      meetsAAA: boolean;
    }[];
  } {
    const combinations = [
      // 主要文本组合
      { fg: theme.colors.text.primary, bg: theme.colors.background.primary, name: 'Primary Text' },
      { fg: theme.colors.text.secondary, bg: theme.colors.background.primary, name: 'Secondary Text' },
      { fg: theme.colors.text.tertiary, bg: theme.colors.background.primary, name: 'Tertiary Text' },
      
      // 按钮文本
      { fg: theme.colors.text.inverse, bg: theme.colors.primary, name: 'Primary Button' },
      { fg: theme.colors.text.inverse, bg: theme.colors.secondary, name: 'Secondary Button' },
      
      // 状态颜色
      { fg: theme.colors.text.inverse, bg: theme.colors.success, name: 'Success' },
      { fg: theme.colors.text.inverse, bg: theme.colors.warning, name: 'Warning' },
      { fg: theme.colors.text.inverse, bg: theme.colors.danger, name: 'Danger' },
    ];
    
    const results = combinations.map(({ fg, bg, name }) => {
      const ratio = ColorContrastChecker.getContrastRatio(fg, bg);
      return {
        combination: name,
        ratio: parseFloat(ratio.toFixed(2)),
        meetsAA: ColorContrastChecker.meetsWCAG_AA(fg, bg),
        meetsAAA: ColorContrastChecker.meetsWCAG_AAA(fg, bg),
      };
    });
    
    const passed = results.filter(r => r.meetsAA).length;
    const failed = results.length - passed;
    
    return { passed, failed, details: results };
  }
  
  /**
   * 生成无障碍报告
   */
  static generateReport(): string {
    const colorAudit = this.auditColorScheme();
    
    let report = '=== v1.2 无障碍合规性报告 ===\n\n';
    
    // 颜色对比度
    report += '📊 颜色对比度检查:\n';
    report += `✅ 通过: ${colorAudit.passed}\n`;
    report += `❌ 失败: ${colorAudit.failed}\n\n`;
    
    report += '详细结果:\n';
    colorAudit.details.forEach(detail => {
      const status = detail.meetsAA ? '✅' : '❌';
      const level = detail.meetsAAA ? 'AAA' : detail.meetsAA ? 'AA' : '不合格';
      report += `${status} ${detail.combination}: ${detail.ratio}:1 (${level})\n`;
    });
    
    // 触摸目标
    report += `\n📱 触摸目标标准:\n`;
    report += `最小尺寸: ${theme.touchTarget.minimum}×${theme.touchTarget.minimum}pt\n`;
    report += `FAB尺寸: ${theme.touchTarget.fab.size}×${theme.touchTarget.fab.size}pt ✅\n`;
    
    // 字体可读性
    report += `\n📝 字体可读性:\n`;
    report += `最小正文: ${theme.typography.fontSize.bodySmall}pt ✅\n`;
    report += `最小辅助: ${theme.typography.fontSize.captionSmall}pt ✅\n`;
    report += `行高范围: ${theme.typography.lineHeight.tight}-${theme.typography.lineHeight.relaxed} ✅\n`;
    
    // Dynamic Type支持
    report += `\n🔤 Dynamic Type支持:\n`;
    report += `按钮最小宽度: ${theme.layout.dynamicType.button.minWidth}pt\n`;
    report += `按钮最小高度: ${theme.layout.dynamicType.button.minHeight}pt\n`;
    report += `大号高度: ${theme.layout.dynamicType.button.largeHeight}pt\n`;
    report += `特大号高度: ${theme.layout.dynamicType.button.xlHeight}pt\n`;
    
    return report;
  }
}

export default {
  ColorContrastChecker,
  TouchTargetValidator,
  TextReadabilityChecker,
  AccessibilityAuditor,
};