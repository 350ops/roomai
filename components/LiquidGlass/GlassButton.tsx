/**
 * Liquid Glass Button Component
 *
 * A glassmorphism button with haptic feedback and animations
 */

import React from 'react';
import { Pressable, View, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ThemedText from '../ThemedText';
import Icon from '../Icon';
import { LucideIcon } from 'lucide-react-native';

interface GlassButtonProps {
  title?: string;
  icon?: LucideIcon;
  iconSize?: number;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  className?: string;
}

export default function GlassButton({
  title,
  icon: IconComponent,
  iconSize = 20,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  haptic = true,
  className = '',
}: GlassButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;

    if (haptic && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      height: 36,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      height: 48,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      height: 56,
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          gradientColors: [
            'rgba(255, 52, 86, 0.8)',
            'rgba(255, 32, 56, 0.9)',
            'rgba(200, 20, 40, 0.8)',
          ],
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          gradientColors: [
            'rgba(255, 255, 255, 0.15)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.05)',
          ],
          textColor: '#FFFFFF',
        };
      case 'ghost':
        return {
          gradientColors: [
            'rgba(255, 255, 255, 0.05)',
            'rgba(255, 255, 255, 0.02)',
            'rgba(255, 255, 255, 0)',
          ],
          textColor: '#FFFFFF',
        };
      default:
        return {
          gradientColors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
          textColor: '#FFFFFF',
        };
    }
  };

  const { gradientColors, textColor } = getVariantColors();

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
      }}
      className={className}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <BlurView
          intensity={variant === 'ghost' ? 40 : 80}
          tint="dark"
          style={{
            borderRadius: config.height / 2,
            overflow: 'hidden',
            borderWidth: variant === 'ghost' ? 1 : 0,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: config.paddingVertical,
              paddingHorizontal: config.paddingHorizontal,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: config.height,
            }}
          >
            {loading ? (
              <View className="mr-2">
                {/* Add ActivityIndicator if needed */}
                <ThemedText style={{ color: textColor, fontSize: config.fontSize }}>
                  ...
                </ThemedText>
              </View>
            ) : (
              IconComponent && (
                <View className="mr-2">
                  <IconComponent size={iconSize} color={textColor} />
                </View>
              )
            )}

            {title && (
              <ThemedText
                style={{
                  color: textColor,
                  fontSize: config.fontSize,
                  fontWeight: '600',
                }}
              >
                {title}
              </ThemedText>
            )}
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}
