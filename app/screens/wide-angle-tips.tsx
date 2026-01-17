import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import AnimatedView from '@/components/AnimatedView';
import Icon from '@/components/Icon';
import useThemeColors from '@/app/_contexts/ThemeColors';

const toRgba = (hexColor: string, alpha: number) => {
  if (!hexColor.startsWith('#')) {
    return hexColor;
  }

  let hex = hexColor.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return hexColor;
  }

  const intValue = parseInt(hex, 16);
  const red = (intValue >> 16) & 255;
  const green = (intValue >> 8) & 255;
  const blue = intValue & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export default function WideAngleTipsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const framePulse = useRef(new Animated.Value(0)).current;
  const guidePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const frameAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(framePulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(framePulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    const guideAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(guidePulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(guidePulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );

    frameAnim.start();
    guideAnim.start();

    return () => {
      frameAnim.stop();
      guideAnim.stop();
    };
  }, [framePulse, guidePulse]);

  const frameScaleX = framePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.12],
  });
  const frameOpacity = framePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.9],
  });
  const guideShift = guidePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const guideOpacity = guidePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title="Wide angle" />
      <View className="flex-1 px-global" style={{ paddingBottom: insets.bottom + 20 }}>
        <AnimatedView animation="fadeInUp">
          <View className="rounded-3xl overflow-hidden border border-border mb-6">
            <View style={[styles.scene, { backgroundColor: colors.secondary }]}>
              <LinearGradient
                colors={[
                  toRgba(colors.bg, colors.isDark ? 0.85 : 0.55),
                  toRgba(colors.secondary, colors.isDark ? 0.2 : 0.6),
                ]}
                style={StyleSheet.absoluteFill}
              />

              <View style={[styles.room, { borderColor: colors.border, backgroundColor: colors.bg }]} />
              <View style={[styles.roomLine, { backgroundColor: colors.border }]} />
              <View style={[styles.roomLineVertical, { backgroundColor: colors.border }]} />

              <Animated.View
                style={[
                  styles.frame,
                  {
                    borderColor: colors.accent,
                    opacity: frameOpacity,
                    transform: [{ scaleX: frameScaleX }],
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.guideLeft,
                  {
                    opacity: guideOpacity,
                    backgroundColor: colors.accent,
                    transform: [{ translateX: Animated.multiply(guideShift, -1) }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.guideRight,
                  {
                    opacity: guideOpacity,
                    backgroundColor: colors.accent,
                    transform: [{ translateX: guideShift }],
                  },
                ]}
              />

              <View style={[styles.camera, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Icon name="Camera" size={18} color={colors.text} />
              </View>

              <View style={[styles.floor, { backgroundColor: toRgba(colors.text, 0.05) }]} />
            </View>
          </View>
        </AnimatedView>

        <AnimatedView animation="fadeInUp" delay={120}>
          <ThemedText className="text-2xl font-bold mb-2">Capture the whole room</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-4">
            Step back, keep the phone level, and use a wide lens so walls and corners stay visible.
          </ThemedText>
        </AnimatedView>

        <AnimatedView animation="fadeInUp" delay={220}>
          <View className="gap-3">
            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Maximize" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Use 0.5x or wide lens</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Wide angle captures the full space without cutting off furniture.
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Camera" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Keep the camera level</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Level shots prevent walls from leaning and keep proportions accurate.
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Square" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Center the room</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Place the main focal point in the middle for balanced framing.
                </ThemedText>
              </View>
            </View>
          </View>
        </AnimatedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 260,
    position: 'relative',
  },
  room: {
    position: 'absolute',
    left: 70,
    top: 48,
    width: 180,
    height: 120,
    borderRadius: 18,
    borderWidth: 2,
  },
  roomLine: {
    position: 'absolute',
    left: 70,
    top: 108,
    width: 180,
    height: 2,
  },
  roomLineVertical: {
    position: 'absolute',
    left: 160,
    top: 48,
    width: 2,
    height: 120,
  },
  frame: {
    position: 'absolute',
    left: 86,
    top: 64,
    width: 148,
    height: 88,
    borderRadius: 14,
    borderWidth: 2,
  },
  guideLeft: {
    position: 'absolute',
    left: 48,
    top: 92,
    width: 12,
    height: 48,
    borderRadius: 6,
  },
  guideRight: {
    position: 'absolute',
    right: 48,
    top: 92,
    width: 12,
    height: 48,
    borderRadius: 6,
  },
  camera: {
    position: 'absolute',
    left: 20,
    bottom: 40,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
});
