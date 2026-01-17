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

export default function ClearSpaceTipsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const clearAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cleanupAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(clearAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(clearAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );

    cleanupAnim.start();
    return () => cleanupAnim.stop();
  }, [clearAnim]);

  const clutterFade = (delay: number) =>
    clearAnim.interpolate({
      inputRange: [0, delay, delay + 0.45, 1],
      outputRange: [1, 1, 0, 1],
    });

  const clutterShift = (amount: number) =>
    clearAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, amount],
    });

  const glowOpacity = clearAnim.interpolate({
    inputRange: [0, 0.45, 0.75, 1],
    outputRange: [0, 0, 0.7, 0],
  });

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title="Clear space" />
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

              <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.bg }]} />
              <View style={[styles.tableTop, { backgroundColor: toRgba(colors.text, 0.05) }]} />

              <Animated.View style={[styles.clutterOne, { opacity: clutterFade(0), transform: [{ translateX: clutterShift(-18) }] }]}>
                <View style={[styles.clutterBox, { backgroundColor: colors.text }]} />
              </Animated.View>
              <Animated.View style={[styles.clutterTwo, { opacity: clutterFade(0.12), transform: [{ translateY: clutterShift(14) }] }]}>
                <View style={[styles.clutterCircle, { borderColor: colors.text }]} />
              </Animated.View>
              <Animated.View style={[styles.clutterThree, { opacity: clutterFade(0.24), transform: [{ translateX: clutterShift(16) }] }]}>
                <View style={[styles.clutterRect, { backgroundColor: colors.text }]} />
              </Animated.View>

              <Animated.View style={[styles.cleanGlow, { opacity: glowOpacity, borderColor: colors.accent }]} />

              <View style={[styles.camera, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <Icon name="Camera" size={18} color={colors.text} />
              </View>
            </View>
          </View>
        </AnimatedView>

        <AnimatedView animation="fadeInUp" delay={120}>
          <ThemedText className="text-2xl font-bold mb-2">Clear the scene</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-4">
            Remove small objects and clutter so the AI can read the room layout cleanly.
          </ThemedText>
        </AnimatedView>

        <AnimatedView animation="fadeInUp" delay={220}>
          <View className="gap-3">
            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Trash" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Clear surfaces</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Remove piles, loose cables, and small decor from tables and floors.
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Sparkles" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Highlight key furniture</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Leave only the main pieces so the layout feels intentional and clean.
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Check" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Tidy the floor</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Make sure walkways are visible for the best room understanding.
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
  table: {
    position: 'absolute',
    left: 56,
    top: 70,
    width: 200,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
  },
  tableTop: {
    position: 'absolute',
    left: 56,
    top: 120,
    width: 200,
    height: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  clutterOne: {
    position: 'absolute',
    left: 78,
    top: 92,
  },
  clutterTwo: {
    position: 'absolute',
    left: 148,
    top: 92,
  },
  clutterThree: {
    position: 'absolute',
    left: 204,
    top: 92,
  },
  clutterBox: {
    width: 28,
    height: 18,
    borderRadius: 6,
    opacity: 0.7,
  },
  clutterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    opacity: 0.7,
  },
  clutterRect: {
    width: 26,
    height: 14,
    borderRadius: 6,
    opacity: 0.7,
  },
  cleanGlow: {
    position: 'absolute',
    left: 76,
    top: 84,
    width: 160,
    height: 80,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  camera: {
    position: 'absolute',
    right: 20,
    bottom: 36,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
