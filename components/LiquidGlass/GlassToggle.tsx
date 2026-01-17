/**
 * Liquid Glass Toggle Component
 *
 * A beautiful glassmorphism-styled toggle switch with smooth animations
 * Automatically adapts to light/dark theme
 */

import React from 'react';
import { Pressable, View, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import ThemedText from '../ThemedText';
import useThemeColors from '@/app/_contexts/ThemeColors';
import { useTheme } from '@/app/_contexts/ThemeContext';

interface GlassToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  activeColor?: string;
  className?: string;
}

export default function GlassToggle({
  value,
  onValueChange,
  label,
  disabled = false,
  size = 'medium',
  activeColor,
  className = '',
}: GlassToggleProps) {
  const colors = useThemeColors();
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sizes
  const sizes = {
    small: { width: 44, height: 24, thumbSize: 18 },
    medium: { width: 56, height: 32, thumbSize: 26 },
    large: { width: 68, height: 40, thumbSize: 34 },
  };

  const { width, height, thumbSize } = sizes[size];
  const thumbOffset = width - thumbSize - 4;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, thumbOffset],
  });

  // Theme-aware colors
  const inactiveBackground = theme === 'dark'
    ? 'rgba(200, 200, 200, 0.2)'
    : 'rgba(120, 120, 120, 0.2)';

  const inactiveBorder = theme === 'dark'
    ? 'rgba(200, 200, 200, 0.3)'
    : 'rgba(120, 120, 120, 0.25)';

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBackground, activeColor || colors.highlight],
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBorder, activeColor || colors.highlight],
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <View className={`flex-row items-center justify-between py-3 ${className}`}>
      {label && (
        <ThemedText
          className={`flex-1 mr-3 ${disabled ? 'opacity-50' : ''}`}
          style={{
            fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
            fontWeight: '600',
          }}
        >
          {label}
        </ThemedText>
      )}

      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={{
          width,
          height,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Animated.View
          style={{
            width,
            height,
            borderRadius: height / 2,
            backgroundColor,
            justifyContent: 'center',
            paddingHorizontal: 2,
            borderWidth: 2,
            borderColor,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
              },
              android: {
                elevation: 2,
              },
            }),
          }}
        >
          <Animated.View
            style={{
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: '#FFFFFF',
              transform: [{ translateX }],
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.5,
                },
                android: {
                  elevation: 2,
                },
              }),
            }}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}
