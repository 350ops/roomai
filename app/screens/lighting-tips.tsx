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

export default function LightingTipsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const sunFloat = useRef(new Animated.Value(0)).current;
  const rayPulse = useRef(new Animated.Value(0)).current;
  const beamSweep = useRef(new Animated.Value(0)).current;
  const cameraPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(sunFloat, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(sunFloat, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    const rayAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(rayPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(rayPulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    const beamAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(beamSweep, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(beamSweep, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    const cameraAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(cameraPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(cameraPulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );

    floatAnim.start();
    rayAnim.start();
    beamAnim.start();
    cameraAnim.start();

    return () => {
      floatAnim.stop();
      rayAnim.stop();
      beamAnim.stop();
      cameraAnim.stop();
    };
  }, [beamSweep, cameraPulse, rayPulse, sunFloat]);

  const sunTranslate = sunFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const rayScale = rayPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  const rayOpacity = rayPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });
  const beamShift = beamSweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 14],
  });
  const beamOpacity = beamSweep.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });
  const cameraScale = cameraPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const cameraRingOpacity = cameraPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.6],
  });

  const beamColors = colors.isDark
    ? [toRgba('#FFFFFF', 0.08), 'transparent']
    : [toRgba(colors.secondary, 0.55), 'transparent'];
  const haloColor = colors.isDark ? toRgba('#FFFFFF', 0.18) : toRgba(colors.secondary, 0.6);

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title="Good lighting" />
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

              <View style={[styles.window, { borderColor: colors.border, backgroundColor: colors.bg }]} />
              <View style={[styles.windowBarHorizontal, { backgroundColor: colors.border }]} />
              <View style={[styles.windowBarVertical, { backgroundColor: colors.border }]} />

              <Animated.View style={[styles.sun, { transform: [{ translateY: sunTranslate }] }]}>
                <View style={[styles.sunCore, { backgroundColor: colors.secondary }]} />
                <Animated.View
                  style={[
                    styles.sunHalo,
                    { borderColor: haloColor, opacity: rayOpacity, transform: [{ scale: rayScale }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.sunHaloLarge,
                    { borderColor: haloColor, opacity: rayOpacity, transform: [{ scale: rayScale }] },
                  ]}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.beam,
                  { opacity: beamOpacity, transform: [{ translateX: beamShift }, { rotate: '-10deg' }] },
                ]}
              >
                <LinearGradient colors={beamColors} style={StyleSheet.absoluteFill} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.beamTwo,
                  { opacity: beamOpacity, transform: [{ translateX: beamShift }, { rotate: '-6deg' }] },
                ]}
              >
                <LinearGradient colors={beamColors} style={StyleSheet.absoluteFill} />
              </Animated.View>

              <View style={[styles.floor, { backgroundColor: toRgba(colors.text, 0.05) }]} />

              <View style={[styles.subject, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                <View style={[styles.subjectHead, { backgroundColor: colors.text }]} />
                <View style={[styles.subjectBody, { backgroundColor: colors.text }]} />
              </View>

              <Animated.View
                style={[
                  styles.camera,
                  {
                    transform: [{ scale: cameraScale }],
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.cameraRing,
                    { borderColor: colors.accent, opacity: cameraRingOpacity },
                  ]}
                />
                <Icon name="Camera" size={18} color={colors.text} />
              </Animated.View>
            </View>
          </View>
        </AnimatedView>

        <AnimatedView animation="fadeInUp" delay={120}>
          <ThemedText className="text-2xl font-bold mb-2">What good lighting looks like</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-4">
            Keep the main light source in front of the camera and soften it with curtains for even,
            natural light.
          </ThemedText>
        </AnimatedView>

        <AnimatedView animation="fadeInUp" delay={220}>
          <View className="gap-3">
            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Sparkles" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Face the light</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Place the brightest window or lamp in front of you, not behind.
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Maximize" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Diffuse harsh light</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Use sheer curtains or bounce light off a wall for softer shadows.
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-2xl p-4">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-background border border-border">
                <Icon name="Camera" size={18} color={colors.iconAccent} />
              </View>
              <View className="flex-1">
                <ThemedText className="font-semibold">Keep colors consistent</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Turn off mixed bulbs so the room stays warm and true to color.
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
  window: {
    position: 'absolute',
    left: 16,
    top: 58,
    width: 70,
    height: 96,
    borderRadius: 12,
    borderWidth: 2,
  },
  windowBarHorizontal: {
    position: 'absolute',
    left: 16,
    top: 106,
    width: 70,
    height: 2,
  },
  windowBarVertical: {
    position: 'absolute',
    left: 50,
    top: 58,
    width: 2,
    height: 96,
  },
  sun: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  sunHalo: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  sunHaloLarge: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
  },
  beam: {
    position: 'absolute',
    left: 60,
    top: 90,
    width: 220,
    height: 140,
  },
  beamTwo: {
    position: 'absolute',
    left: 68,
    top: 118,
    width: 220,
    height: 120,
  },
  subject: {
    position: 'absolute',
    left: 130,
    bottom: 32,
    width: 58,
    height: 70,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectHead: {
    position: 'absolute',
    top: -20,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  subjectBody: {
    width: 28,
    height: 30,
    borderRadius: 8,
  },
  camera: {
    position: 'absolute',
    right: 16,
    bottom: 36,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cameraRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
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
