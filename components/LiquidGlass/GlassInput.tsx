/**
 * Liquid Glass Input Component
 *
 * A glassmorphism text input with smooth animations
 */

import React, { useState } from 'react';
import { TextInput, View, Animated, TextInputProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import ThemedText from '../ThemedText';
import useThemeColors from '@/app/_contexts/ThemeColors';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export default function GlassInput({
  label,
  error,
  icon,
  rightIcon,
  containerClassName = '',
  ...textInputProps
}: GlassInputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(focusAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(focusAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.15)', colors.highlight],
  });

  return (
    <View className={containerClassName}>
      {label && (
        <ThemedText className="mb-2 text-sm font-semibold opacity-70">
          {label}
        </ThemedText>
      )}

      <Animated.View
        style={{
          borderWidth: 2,
          borderColor: error ? '#ef4444' : borderColor,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <BlurView
          intensity={60}
          tint="dark"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === 'ios' ? 16 : 0,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          {icon && <View className="mr-3">{icon}</View>}

          <TextInput
            {...textInputProps}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              flex: 1,
              color: '#FFFFFF',
              fontSize: 16,
              paddingVertical: Platform.OS === 'android' ? 12 : 0,
            }}
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />

          {rightIcon && <View className="ml-3">{rightIcon}</View>}
        </BlurView>
      </Animated.View>

      {error && (
        <ThemedText className="mt-2 text-xs text-red-400">
          {error}
        </ThemedText>
      )}
    </View>
  );
}
