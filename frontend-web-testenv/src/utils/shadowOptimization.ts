import { Platform, StyleSheet } from 'react-native';

export interface ShadowConfig {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export interface OptimizedShadowConfig extends ShadowConfig {
  backgroundColor?: string; // For shadow calculation efficiency
}

export const SHADOW_LEVELS = {
  none: { level: 0 },
  xs: { level: 1 },
  sm: { level: 2 },
  md: { level: 3 },
  lg: { level: 4 },
  xl: { level: 5 },
} as const;

export type ShadowLevel = keyof typeof SHADOW_LEVELS;

interface ShadowOptimizationConfig {
  // Performance mode reduces shadow complexity
  performanceMode: boolean;
  // Brand colors for themed shadows
  brandColors: {
    primary: string;
    orange: string;
    coral: string;
  };
  // Device capabilities
  isLowEndDevice: boolean;
}

const DEFAULT_CONFIG: ShadowOptimizationConfig = {
  performanceMode: false,
  brandColors: {
    primary: '#FF6B35',
    orange: '#F9A889', 
    coral: '#FF4757',
  },
  isLowEndDevice: false,
};

class ShadowOptimizer {
  private config: ShadowOptimizationConfig;

  constructor(config: Partial<ShadowOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get optimized shadow configuration for a given level
   */
  getShadowConfig(level: ShadowLevel, options: {
    color?: string;
    tinted?: boolean; // Use brand color tinting
    transparent?: boolean; // Requires background color for performance
  } = {}): OptimizedShadowConfig {
    const { color = '#000000', tinted = false, transparent = true } = options;
    const shadowLevel = SHADOW_LEVELS[level].level;
    
    if (shadowLevel === 0) {
      return {};
    }

    // Performance mode reduces all shadow values
    const performanceMultiplier = this.config.performanceMode || this.config.isLowEndDevice ? 0.6 : 1.0;
    
    // Base configurations for each level
    const baseConfigs: Record<number, ShadowConfig> = {
      1: { // xs
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      2: { // sm  
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      3: { // md
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
      },
      4: { // lg
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      },
      5: { // xl
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 6,
      },
    };

    const baseConfig = baseConfigs[shadowLevel];
    const shadowColor = tinted ? this.config.brandColors.orange : color;

    const optimizedConfig: OptimizedShadowConfig = {
      shadowColor,
      shadowOffset: baseConfig.shadowOffset,
      shadowOpacity: (baseConfig.shadowOpacity || 0) * performanceMultiplier,
      shadowRadius: Math.round((baseConfig.shadowRadius || 0) * performanceMultiplier),
      elevation: Math.max(1, Math.round((baseConfig.elevation || 0) * performanceMultiplier)),
    };

    // Add minimal background color for transparent elements to improve shadow calculation
    if (transparent) {
      optimizedConfig.backgroundColor = 'rgba(255, 255, 255, 0.02)';
    }

    // Platform-specific optimizations
    if (Platform.OS === 'android') {
      // Android uses elevation, remove iOS shadow properties
      delete optimizedConfig.shadowColor;
      delete optimizedConfig.shadowOffset;
      delete optimizedConfig.shadowOpacity;
      delete optimizedConfig.shadowRadius;
    }

    return optimizedConfig;
  }

  /**
   * Get glass-themed shadow for Liquid Glass components
   */
  getGlassShadowConfig(level: ShadowLevel, isDarkMode: boolean = false): OptimizedShadowConfig {
    const glassShadowColor = isDarkMode ? '#FFFFFF' : '#000000';
    const config = this.getShadowConfig(level, { 
      color: glassShadowColor, 
      transparent: true 
    });

    // Glass components need slightly different opacity
    if (config.shadowOpacity) {
      config.shadowOpacity *= isDarkMode ? 0.3 : 0.7;
    }

    return config;
  }

  /**
   * Get brand-tinted shadow for UI elements  
   */
  getBrandShadowConfig(level: ShadowLevel, brandColor: 'primary' | 'orange' | 'coral' = 'orange'): OptimizedShadowConfig {
    return this.getShadowConfig(level, {
      color: this.config.brandColors[brandColor],
      tinted: true,
      transparent: true,
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ShadowOptimizationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Enable performance mode (reduces all shadow values)
   */
  enablePerformanceMode(enabled: boolean = true) {
    this.config.performanceMode = enabled;
  }

  /**
   * Set device performance level
   */
  setDevicePerformance(isLowEnd: boolean) {
    this.config.isLowEndDevice = isLowEnd;
  }
}

// Create global instance
export const shadowOptimizer = new ShadowOptimizer();

/**
 * Convenience function to get optimized shadow styles
 */
export const getOptimizedShadow = (level: ShadowLevel, options?: {
  color?: string;
  tinted?: boolean;
  transparent?: boolean;
}): OptimizedShadowConfig => {
  return shadowOptimizer.getShadowConfig(level, options);
};

/**
 * Convenience function for glass shadows
 */
export const getGlassShadow = (level: ShadowLevel, isDarkMode?: boolean): OptimizedShadowConfig => {
  return shadowOptimizer.getGlassShadowConfig(level, isDarkMode);
};

/**
 * Convenience function for brand shadows
 */
export const getBrandShadow = (level: ShadowLevel, brandColor?: 'primary' | 'orange' | 'coral'): OptimizedShadowConfig => {
  return shadowOptimizer.getBrandShadowConfig(level, brandColor);
};

export default shadowOptimizer;