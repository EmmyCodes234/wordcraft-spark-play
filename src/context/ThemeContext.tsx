import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = 'light' | 'dark' | 'auto';
type ColorScheme = 'green' | 'blue' | 'purple' | 'pink' | 'orange' | 'red' | 'teal' | 'indigo' | 'custom';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  ring: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
}

type ThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  colors: ThemeColors;
  isDark: boolean;
  applyTheme: (theme: { 
    themeMode?: ThemeMode; 
    colorScheme?: ColorScheme; 
    customColor?: string; 
    fontSize?: string; 
  }) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Color scheme definitions
const COLOR_SCHEMES: Record<ColorScheme, { light: string; dark: string }> = {
  green: { light: '#22c55e', dark: '#16a34a' },
  blue: { light: '#3b82f6', dark: '#2563eb' },
  purple: { light: '#8b5cf6', dark: '#7c3aed' },
  pink: { light: '#ec4899', dark: '#db2777' },
  orange: { light: '#f97316', dark: '#ea580c' },
  red: { light: '#ef4444', dark: '#dc2626' },
  teal: { light: '#14b8a6', dark: '#0d9488' },
  indigo: { light: '#6366f1', dark: '#4f46e5' },
  custom: { light: '#22c55e', dark: '#16a34a' }, // Will be overridden
};

// Utility functions
const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const generateThemeColors = (
  primaryHex: string, 
  isDark: boolean
): ThemeColors => {
  const [h, s, l] = hexToHsl(primaryHex);
  
  // Generate color variations
  const primaryHover = hslToHex(h, s, Math.min(l + 10, 100));
  const primaryActive = hslToHex(h, s, Math.max(l - 10, 0));
  
  // Determine foreground colors based on primary color lightness
  const primaryForeground = l > 50 ? '#000000' : '#ffffff';
  
  // Generate secondary colors (muted version of primary)
  const secondary = hslToHex(h, Math.max(s - 30, 0), isDark ? 20 : 95);
  const secondaryHover = hslToHex(h, Math.max(s - 30, 0), isDark ? 30 : 85);
  const secondaryForeground = isDark ? '#ffffff' : '#000000';
  
  // Generate accent colors (complementary)
  const accentH = (h + 180) % 360;
  const accent = hslToHex(accentH, s, isDark ? 60 : 40);
  const accentHover = hslToHex(accentH, s, isDark ? 70 : 50);
  const accentForeground = isDark ? '#ffffff' : '#000000';

  // Background and foreground colors
  const background = isDark ? '#0a0a0a' : '#ffffff';
  const foreground = isDark ? '#ffffff' : '#0a0a0a';
  
  // Card colors
  const card = isDark ? '#1a1a1a' : '#ffffff';
  const cardForeground = isDark ? '#ffffff' : '#0a0a0a';
  
  // Border and input colors
  const border = isDark ? '#2a2a2a' : '#e5e5e5';
  const input = isDark ? '#2a2a2a' : '#f5f5f5';
  const ring = primaryHex;
  
  // Muted colors
  const muted = isDark ? '#2a2a2a' : '#f5f5f5';
  const mutedForeground = isDark ? '#a0a0a0' : '#6b7280';
  
  // Semantic colors
  const destructive = isDark ? '#ef4444' : '#dc2626';
  const destructiveForeground = '#ffffff';
  const success = isDark ? '#22c55e' : '#16a34a';
  const successForeground = '#ffffff';
  const warning = isDark ? '#f59e0b' : '#d97706';
  const warningForeground = '#ffffff';
  const info = isDark ? '#3b82f6' : '#2563eb';
  const infoForeground = '#ffffff';

  return {
    primary: primaryHex,
    primaryHover,
    primaryActive,
    primaryForeground,
    secondary,
    secondaryHover,
    secondaryForeground,
    accent,
    accentHover,
    accentForeground,
    background,
    foreground,
    card,
    cardForeground,
    border,
    input,
    ring,
    muted,
    mutedForeground,
    destructive,
    destructiveForeground,
    success,
    successForeground,
    warning,
    warningForeground,
    info,
    infoForeground,
  };
};

const applyThemeToDOM = (colors: ThemeColors) => {
  const root = document.documentElement;
  
  // Apply all color variables
  Object.entries(colors).forEach(([key, value]) => {
    if (value.startsWith('#')) {
      const [h, s, l] = hexToHsl(value);
      root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, `${h} ${s}% ${l}%`);
    }
  });
  
  // Apply specific CSS custom properties for Tailwind
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--popover', colors.card);
  root.style.setProperty('--popover-foreground', colors.cardForeground);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);
  
  // Apply success, warning, info colors
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--success-foreground', colors.successForeground);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--warning-foreground', colors.warningForeground);
  root.style.setProperty('--info', colors.info);
  root.style.setProperty('--info-foreground', colors.infoForeground);
  
  // Apply gradients
  const [h, s, l] = hexToHsl(colors.primary);
  const gradientStart = hslToHex(h, s, Math.max(l - 10, 0));
  const gradientEnd = hslToHex(h, s, Math.min(l + 10, 100));
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`);
  root.style.setProperty('--gradient-success', `linear-gradient(135deg, ${colors.success}, ${hslToHex(142, 76, 56)})`);
  root.style.setProperty('--gradient-warning', `linear-gradient(135deg, ${colors.warning}, ${hslToHex(38, 92, 60)})`);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('green');
  const [customColor, setCustomColorState] = useState('#22c55e');
  const [fontSize, setFontSizeState] = useState('medium');
  const [isDark, setIsDark] = useState(false);

  // Determine if dark mode should be active
  const getIsDark = (mode: ThemeMode): boolean => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const savedThemeMode = localStorage.getItem('themeMode') as ThemeMode;
    const savedColorScheme = localStorage.getItem('colorScheme') as ColorScheme;
    const savedCustomColor = localStorage.getItem('customColor');
    const savedFontSize = localStorage.getItem('fontSize');
    
    if (savedThemeMode) setThemeModeState(savedThemeMode);
    if (savedColorScheme) setColorSchemeState(savedColorScheme);
    if (savedCustomColor) setCustomColorState(savedCustomColor);
    if (savedFontSize) setFontSizeState(savedFontSize);
  }, []);

  // Apply theme mode changes
  useEffect(() => {
    const dark = getIsDark(themeMode);
    setIsDark(dark);
    
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const dark = getIsDark(themeMode);
        setIsDark(dark);
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Apply color scheme changes
  useEffect(() => {
    const primaryColor = colorScheme === 'custom' ? customColor : COLOR_SCHEMES[colorScheme][isDark ? 'dark' : 'light'];
    const colors = generateThemeColors(primaryColor, isDark);
    applyThemeToDOM(colors);
    
    localStorage.setItem('colorScheme', colorScheme);
  }, [colorScheme, customColor, isDark]);

  // Apply font size changes
  useEffect(() => {
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize as keyof typeof fontSizeMap] || '16px');
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  const setCustomColor = (color: string) => {
    setCustomColorState(color);
    localStorage.setItem('customColor', color);
  };

  const setFontSize = (size: string) => {
    setFontSizeState(size);
  };

  const applyTheme = (theme: { 
    themeMode?: ThemeMode; 
    colorScheme?: ColorScheme; 
    customColor?: string; 
    fontSize?: string; 
  }) => {
    if (theme.themeMode !== undefined) setThemeMode(theme.themeMode);
    if (theme.colorScheme !== undefined) setColorScheme(theme.colorScheme);
    if (theme.customColor !== undefined) setCustomColor(theme.customColor);
    if (theme.fontSize !== undefined) setFontSize(theme.fontSize);
  };

  // Generate current colors
  const primaryColor = colorScheme === 'custom' ? customColor : COLOR_SCHEMES[colorScheme][isDark ? 'dark' : 'light'];
  const colors = generateThemeColors(primaryColor, isDark);

  return (
    <ThemeContext.Provider value={{
      themeMode,
      setThemeMode,
      colorScheme,
      setColorScheme,
      customColor,
      setCustomColor,
      fontSize,
      setFontSize,
      colors,
      isDark,
      applyTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
