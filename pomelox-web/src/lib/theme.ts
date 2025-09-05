// Theme configuration for PomeloX Web
export const theme = {
  colors: {
    // PomeloX brand colors
    primary: {
      50: '#fff5f2',
      100: '#ffe8e1',
      200: '#ffd6c7',
      300: '#ffb8a0',
      400: '#ff8a65', // Light Orange - accent
      500: '#ff6b35', // Vibrant Orange - primary
      600: '#e55a2b',
      700: '#c94a22',
      800: '#a53d1c',
      900: '#8b3419',
    },
    
    secondary: {
      50: '#fef2f4',
      100: '#fce7ea',
      200: '#f9d4da',
      300: '#f4b5bf',
      400: '#ed8a9a',
      500: '#ff4757', // Coral Red - secondary
      600: '#e53e4e',
      700: '#d1364a',
      800: '#b02e40',
      900: '#94293a',
    },
    
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#2ed573', // Fresh Green - success
      600: '#22c55e',
      700: '#16a34a',
      800: '#15803d',
      900: '#14532d',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#ffa726', // Warm Amber - warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Semantic colors
    background: '#ffffff',
    surface: '#f9fafb',
    'on-background': '#111827',
    'on-surface': '#374151',
    
    // Glass effect colors
    'glass-bg': 'rgba(255, 255, 255, 0.8)',
    'glass-border': 'rgba(255, 255, 255, 0.2)',
    'glass-shadow': 'rgba(0, 0, 0, 0.1)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Colored shadows for liquid glass effect
    'primary-glow': '0 10px 30px rgba(255, 107, 53, 0.3)',
    'secondary-glow': '0 10px 30px rgba(255, 71, 87, 0.3)',
    'success-glow': '0 10px 30px rgba(46, 213, 115, 0.3)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    
    easing: {
      linear: 'linear',
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Layout constants
  layout: {
    headerHeight: 64,
    sidebarWidth: 280,
    maxContentWidth: 1200,
    cardPadding: 24,
    cardRadius: 16,
  },
  
  // Glass morphism styles
  glass: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
} as const;

// CSS custom properties for theming
export const cssVariables = {
  '--primary-color': theme.colors.primary[500],
  '--primary-light': theme.colors.primary[400],
  '--primary-dark': theme.colors.primary[600],
  '--secondary-color': theme.colors.secondary[500],
  '--success-color': theme.colors.success[500],
  '--warning-color': theme.colors.warning[500],
  '--background-color': theme.colors.background,
  '--surface-color': theme.colors.surface,
  '--text-primary': theme.colors['on-background'],
  '--text-secondary': theme.colors['on-surface'],
  '--glass-bg': theme.colors['glass-bg'],
  '--glass-border': theme.colors['glass-border'],
  '--glass-shadow': theme.colors['glass-shadow'],
} as const;