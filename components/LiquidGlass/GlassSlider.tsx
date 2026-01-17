/**
 * Liquid Glass Slider Component
 *
 * A beautiful glassmorphism slider with smooth animations
 */

import React, { useState } from 'react';
import { View, PanResponder, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from '../ThemedText';
import useThemeColors from '@/app/_contexts/ThemeColors';

interface GlassSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  width?: number;
  height?: number;
  thumbSize?: number;
  activeColor?: string;
}

export default function GlassSlider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  width = 300,
  height = 8,
  thumbSize = 28,
  activeColor,
}: GlassSliderProps) {
  const colors = useThemeColors();
  const [sliderWidth, setSliderWidth] = useState(width);
  const pan = React.useRef(new Animated.Value(0)).current;

  // Calculate initial position based on value
  const getPositionFromValue = (val: number) => {
    const percentage = (val - minimumValue) / (maximumValue - minimumValue);
    return percentage * (sliderWidth - thumbSize);
  };

  const [position, setPosition] = useState(getPositionFromValue(value));

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        pan.setOffset(position);
      },
      onPanResponderMove: (_, gesture) => {
        const newPosition = Math.max(0, Math.min(sliderWidth - thumbSize, gesture.dx));
        pan.setValue(newPosition);
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const newPosition = Math.max(0, Math.min(sliderWidth - thumbSize, position + gesture.dx));
        setPosition(newPosition);

        // Calculate new value
        const percentage = newPosition / (sliderWidth - thumbSize);
        const rawValue = minimumValue + percentage * (maximumValue - minimumValue);
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.max(minimumValue, Math.min(maximumValue, steppedValue));

        onValueChange(clampedValue);
      },
    })
  ).current;

  // Update position when value changes externally
  React.useEffect(() => {
    const newPosition = getPositionFromValue(value);
    setPosition(newPosition);
    pan.setValue(newPosition);
  }, [value, sliderWidth]);

  const fillWidth = pan.interpolate({
    inputRange: [0, sliderWidth - thumbSize],
    outputRange: [thumbSize / 2, sliderWidth],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      {label && (
        <View className="flex-row justify-between items-center mb-3">
          <ThemedText className="text-sm font-semibold opacity-70">
            {label}
          </ThemedText>
          {showValue && (
            <ThemedText className="text-sm font-bold">
              {Math.round(value)}
            </ThemedText>
          )}
        </View>
      )}

      <View
        style={{ width, height: thumbSize }}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        {/* Track */}
        <View
          style={{
            position: 'absolute',
            top: (thumbSize - height) / 2,
            width: '100%',
            height,
            borderRadius: height / 2,
            overflow: 'hidden',
          }}
        >
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </View>

        {/* Active fill */}
        <Animated.View
          style={{
            position: 'absolute',
            top: (thumbSize - height) / 2,
            width: fillWidth,
            height,
            borderRadius: height / 2,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[
              activeColor || colors.highlight,
              activeColor || colors.highlight,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            transform: [{ translateX: pan }],
            overflow: 'hidden',
          }}
        >
          <BlurView
            intensity={80}
            tint="light"
            style={{
              flex: 1,
              borderWidth: 3,
              borderColor: activeColor || colors.highlight,
              borderRadius: thumbSize / 2,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}
