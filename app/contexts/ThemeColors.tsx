import { useTheme } from './ThemeContext';

// New color palette:
// #484848 - Dark Gray (text, icons)
// #4DA3E1 - Blue (primary, links)
// #F04848 - Red (error, destructive)
// #FDBB54 - Yellow/Orange (warning, highlights)
// #A9CC9C - Sage Green (success, positive)

export const useThemeColors = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    // Core colors
    icon: isDark ? '#ffffff' : '#007334',
  
    bg: isDark ? '#1A1A1A' : '#FFFFFF',
    invert: isDark ? '#000000' : '#007334',
  
    secondary: isDark ? '#2A2A2A' : '#ffffff',
  
    state: isDark
      ? 'rgba(77, 163, 225, 0.35)'
      : 'rgb(34, 92, 209)',
  
    faded: isDark
      ? 'rgba(0,0,0,0.9)'
      : 'rgba(74, 143, 222, 0.96)',
  
    sheet: isDark ? '#2A2A2A' : '#FFFFFF',
  
    highlight: isDark ? '#4DA3E1' : '#007334',
  
    border: isDark
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(72, 72, 72, 0.15)',
  
    text: isDark ? '#ffffff' : '#484848',
  
    placeholder: isDark
      ? 'rgba(255,255,255,0.4)'
      : 'rgba(72, 72, 72, 0.5)',
  
    switch: isDark ? '#4DA3E1' : '#4DA3E1',
  
    chatBg: isDark ? '#1A1A1A' : '#FFFFFF',
  
    // Accent system - Native iOS feel
    accent: '#000000',
    accentLight: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    iconAccent: '#007334',
    iconBg: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',  // Subtle gray for native feel
  
    // Status colors
    success: '#A9CC9C',  // Sage Green
    warning: '#FFE5A0',  // Pastel Yellow (was #FDBB54)
    error: '#F04848',    // Red
    info: '#4DA3E1',     // Blue
  
    // Legacy support
    green: '#007334',
    primary: '#007334',
  
    isDark
  };
};

export default useThemeColors;