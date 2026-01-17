/**
 * Liquid Glass Card Component
 *
 * Uses native iOS 26+ Liquid Glass when available, falls back to BlurView
 * Automatically adapts to light/dark theme
 */

import React from 'react';
import { View, ViewStyle, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/_contexts/ThemeContext';

// Try to import expo-glass-effect, fallback gracefully
let GlassView: any = null;
let isLiquidGlassAvailable: any = null;
let isGlassEffectAPIAvailable: any = null;

try {
  const glassEffect = require('expo-glass-effect');
  GlassView = glassEffect.GlassView;
  isLiquidGlassAvailable = glassEffect.isLiquidGlassAvailable;
  isGlassEffectAPIAvailable = glassEffect.isGlassEffectAPIAvailable;
} catch (e) {
  // expo-glass-effect not available
}

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'auto';
  bordered?: boolean;
  gradient?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
  borderRadius?: number;
  glassEffectStyle?: 'clear' | 'regular';
}

export default function GlassCard({
  children,
  intensity = 40,
  tint = 'auto',
  bordered = true,
  gradient = false,
  pressable = false,
  onPress,
  style,
  className = '',
  borderRadius = 24,
  glassEffectStyle = 'regular',
}: GlassCardProps) {
  const { theme } = useTheme();

  // Check if native Liquid Glass is available
  const useNativeGlass =
    Platform.OS === 'ios' &&
    GlassView &&
    isLiquidGlassAvailable?.() &&
    isGlassEffectAPIAvailable?.();

  // Auto-detect tint based on theme
  const effectiveTint = tint === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : tint;

  // Theme-aware border and gradient colors
  const borderColor = theme === 'dark'
    ? 'rgba(255, 255, 255, 0.15)'
    : 'rgba(0, 0, 0, 0.1)';

  const gradientColors = theme === 'dark'
    ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
    : ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)'];

  const containerStyle = [
    {
      borderRadius,
      overflow: 'hidden',
      borderWidth: bordered ? 1.5 : 0,
      borderColor,
    },
    style,
  ];

  let cardContent;

  if (useNativeGlass) {
    // Use native iOS 26+ Liquid Glass
    cardContent = (
      <GlassView
        style={containerStyle}
        glassEffectStyle={glassEffectStyle}
        className={className}
      >
        {gradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            {children}
          </LinearGradient>
        ) : (
          children
        )}
      </GlassView>
    );
  } else {
    // Fallback to BlurView for older iOS versions
    cardContent = (
      <BlurView
        intensity={intensity}
        tint={effectiveTint}
        style={containerStyle}
        className={className}
      >
        {gradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            {children}
          </LinearGradient>
        ) : (
          children
        )}
      </BlurView>
    );
  }

  if (pressable && onPress) {
    return (
      <Pressable onPress={onPress} style={{ opacity: 1 }}>
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.8 : 1 }}>
            {cardContent}
          </View>
        )}
      </Pressable>
    );
  }

  return cardContent;
}
