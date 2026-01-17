import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoomPlanView, useRoomPlanView, ExportType } from "expo-roomplan";
import type { ScanStatus } from "expo-roomplan";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import ThemeScroller from "@/components/ThemeScroller";
import AnimatedView from "@/components/AnimatedView";
import useThemeColors from "@/app/_contexts/ThemeColors";
import Icon from "@/components/Icon";

// Safely check if liquid glass is available (iOS 26+)
let supportsNativeLiquidGlass = false;
let GlassView: any = View;
try {
    const glassEffect = require('expo-glass-effect');
    if (Platform.OS === 'ios' && glassEffect.isLiquidGlassAvailable?.()) {
        supportsNativeLiquidGlass = true;
        GlassView = glassEffect.GlassView;
    }
} catch (e) {
    // expo-glass-effect not available
}

// Primary blue from palette
const PRIMARY_BLUE = '#4DA3E1';
const PRIMARY_BLUE_DARK = '#5DB5F0';
// Status colors from palette
const SUCCESS_GREEN = '#A9CC9C';
const WARNING_YELLOW = '#FFE5A0';  // Pastel yellow
const ERROR_RED = '#F04848';

export default function ARRoomScanScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [showScanner, setShowScanner] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [exportedData, setExportedData] = useState<{
    scanUrl?: string;
    jsonUrl?: string;
  } | null>(null);
  const transitionAnim = useRef(new Animated.Value(0)).current;

  // Check if the device supports RoomPlan (iOS only, requires LiDAR)
  const isSupported = Platform.OS === "ios";

  const handleStatus = (e: {
    nativeEvent: { status: ScanStatus; errorMessage?: string };
  }) => {
    const { status, errorMessage } = e.nativeEvent;
    console.log("[AR Room Scan] status:", status, errorMessage ? `- ${errorMessage}` : "");
    
    if (status === "OK") {
      setScanComplete(true);
    } else if (status === "Error") {
      Alert.alert("Scan Error", errorMessage || "An error occurred during scanning");
    } else if (status === "Canceled") {
      setShowScanner(false);
    }
  };

  const handleExported = (e: {
    nativeEvent: { scanUrl?: string; jsonUrl?: string };
  }) => {
    console.log("[AR Room Scan] exported:", e.nativeEvent);
    setExportedData(e.nativeEvent);
    
    // Show transition animation instead of immediately closing
    setShowTransition(true);
    transitionAnim.setValue(0);
    
    // Animate the 3D model scaling up
    Animated.spring(transitionAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleContinueFromTransition = () => {
    setShowTransition(false);
    setShowScanner(false);
    
    // Navigate to scan results screen with the exported data
    if (exportedData) {
      router.push({
        pathname: '/screens/scan-results',
        params: {
          scanUrl: exportedData.scanUrl || '',
          jsonUrl: exportedData.jsonUrl || '',
        },
      });
    }
  };

  const handlePreview = () => {
    console.log("[AR Room Scan] preview presented");
  };

  const { viewProps, controls, state } = useRoomPlanView({
    scanName: "RenovationRoom",
    exportType: ExportType.Parametric,
    exportOnFinish: true,
    sendFileLoc: true,
    autoCloseOnTerminalStatus: false,
    onStatus: handleStatus,
    onPreview: handlePreview,
    onExported: handleExported,
  });

  useEffect(() => {
    if (showScanner && !state.isRunning) {
      setShowScanner(false);
    }
  }, [state.isRunning, showScanner]);

  const startScan = () => {
    if (!isSupported) {
      Alert.alert(
        "Not Supported",
        "AR Room Scanning requires an iOS device with LiDAR sensor (iPhone 12 Pro or newer, iPad Pro).",
        [{ text: "OK" }]
      );
      return;
    }
    setShowScanner(true);
    controls.start();
  };

  const onCancel = () => {
    controls.cancel();
    setShowScanner(false);
  };

  const onFinish = () => {
    controls.finishScan();
  };

  const onAddRoom = () => {
    controls.addRoom();
  };

  // Liquid Glass Card Component
  const LiquidGlassCard = ({ children, style }: { children: React.ReactNode; style?: object }) => {
    if (supportsNativeLiquidGlass) {
      return (
        <View style={[glassStyles.cardOuter, style]}>
          <GlassView
            style={glassStyles.cardGlass}
            glassEffectStyle="regular"
          >
            {children}
          </GlassView>
        </View>
      );
    }

    return (
      <View style={[glassStyles.cardOuter, style]}>
        <BlurView
          intensity={40}
          tint={colors.isDark ? "dark" : "light"}
          style={glassStyles.cardBlur}
        >
          <LinearGradient
            colors={colors.isDark 
              ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as [string, string]
              : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'] as [string, string]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {children}
        </BlurView>
      </View>
    );
  };

  // Liquid Glass Button Component
  const LiquidGlassButton = ({ 
    onPress, 
    title, 
    icon,
    disabled = false,
    variant = 'primary'
  }: { 
    onPress: () => void; 
    title: string; 
    icon?: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
  }) => {
    const blueColor = colors.isDark ? PRIMARY_BLUE_DARK : PRIMARY_BLUE;
    const isPrimary = variant === 'primary';

    if (supportsNativeLiquidGlass) {
      return (
        <Pressable 
          onPress={onPress} 
          disabled={disabled}
          style={[glassStyles.buttonOuter, disabled && { opacity: 0.5 }]}
        >
          <GlassView
            style={[
              glassStyles.buttonGlass,
              isPrimary && { backgroundColor: blueColor }
            ]}
            glassEffectStyle="regular"
            tintColor={isPrimary ? blueColor : undefined}
            isInteractive
          >
            <View style={glassStyles.buttonContent}>
              {icon && (
                <Icon 
                  name={icon as any} 
                  size={22} 
                  color={isPrimary ? '#FFFFFF' : colors.text} 
                />
              )}
              <ThemedText style={[
                glassStyles.buttonText, 
                { color: isPrimary ? '#FFFFFF' : colors.text }
              ]}>
                {title}
              </ThemedText>
            </View>
          </GlassView>
        </Pressable>
      );
    }

    return (
      <Pressable 
        onPress={onPress} 
        disabled={disabled}
        style={[glassStyles.buttonOuter, disabled && { opacity: 0.5 }]}
      >
        <BlurView
          intensity={60}
          tint={colors.isDark ? "dark" : "light"}
          style={glassStyles.buttonBlur}
        >
          <LinearGradient
            colors={isPrimary 
              ? (colors.isDark 
                  ? ['rgba(10, 132, 255, 0.95)', 'rgba(0, 122, 255, 0.9)'] as [string, string]
                  : ['rgba(0, 122, 255, 0.98)', 'rgba(0, 100, 220, 0.95)'] as [string, string])
              : (colors.isDark
                  ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] as [string, string]
                  : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'] as [string, string])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={glassStyles.buttonContent}>
            {icon && (
              <Icon 
                name={icon as any} 
                size={22} 
                color={isPrimary ? '#FFFFFF' : colors.text} 
              />
            )}
            <ThemedText style={[
              glassStyles.buttonText, 
              { color: isPrimary ? '#FFFFFF' : colors.text }
            ]}>
              {title}
            </ThemedText>
          </View>
        </BlurView>
      </Pressable>
    );
  };

  // Intro screen when scanner is not active
  if (!showScanner) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="AR Room Scan" showBackButton />
        
        <ThemeScroller contentContainerStyle={{ padding: 16 }}>
          <AnimatedView animation="fadeInUp" delay={0}>
            {/* Hero Section - Liquid Glass */}
            <LiquidGlassCard style={{ marginBottom: 20 }}>
              <View style={glassStyles.heroContent}>
                <View style={[glassStyles.heroIconContainer, { backgroundColor: colors.accentLight }]}>
                  <Icon name="Box" size={40} color={colors.iconAccent} />
                </View>
                <ThemedText style={[glassStyles.heroTitle, { color: colors.text }]}>
                  Scan Your Room in 3D
                </ThemedText>
                <ThemedText style={[glassStyles.heroDescription, { color: colors.placeholder }]}>
                  Your iPhone's LiDAR sensor creates an accurate 3D representation of your space. The easiest way to measure your rooms.
                </ThemedText>
              </View>
            </LiquidGlassCard>
          </AnimatedView>

          {/* Start Scan Button - Primary CTA */}
          <AnimatedView animation="fadeInUp" delay={50}>
            <LiquidGlassButton
              onPress={startScan}
              title="Start scanning"
              icon="ScanLine"
              disabled={!isSupported}
              variant="primary"
            />
            
            {!isSupported && (
              <ThemedText style={[glassStyles.supportText, { color: colors.placeholder }]}>
                AR Room Scanning is only available on iOS devices with LiDAR
              </ThemedText>
            )}
          </AnimatedView>

          <AnimatedView animation="fadeInUp" delay={200}>
            {/* How it works - Liquid Glass */}
            <LiquidGlassCard style={{ marginTop: 20, marginBottom: 40 }}>
              <View style={glassStyles.cardContent}>
                <ThemedText style={[glassStyles.sectionTitle, { color: colors.text }]}>
                How It Works
              </ThemedText>
              
                <View style={glassStyles.stepsList}>
                  <View style={glassStyles.stepRow}>
                    <View style={[glassStyles.stepNumber, { backgroundColor: colors.isDark ? PRIMARY_BLUE_DARK : PRIMARY_BLUE }]}>
                      <ThemedText style={glassStyles.stepNumberText}>1</ThemedText>
                  </View>
                    <View style={glassStyles.stepContent}>
                      <ThemedText style={[glassStyles.stepTitle, { color: colors.text }]}>Corners first</ThemedText>
                      <ThemedText style={[glassStyles.stepDescription, { color: colors.placeholder }]}>
                      Start by pointing your device at the room corners (both floor and ceiling) and slowly move around to capture the room.
                    </ThemedText>
                  </View>
                </View>
                
                  <View style={glassStyles.stepRow}>
                    <View style={[glassStyles.stepNumber, { backgroundColor: colors.isDark ? PRIMARY_BLUE_DARK : PRIMARY_BLUE }]}>
                      <ThemedText style={glassStyles.stepNumberText}>2</ThemedText>
                  </View>
                    <View style={glassStyles.stepContent}>
                      <ThemedText style={[glassStyles.stepTitle, { color: colors.text }]}>Continue scanning</ThemedText>
                      <ThemedText style={[glassStyles.stepDescription, { color: colors.placeholder }]}>
                      The app automatically detects sofas, doors, windows, and other furniture. Continue scanning by pointing your device at the furniture and slowly move around to capture the room.
                    </ThemedText>
                  </View>
                </View>
                
                  <View style={glassStyles.stepRow}>
                    <View style={[glassStyles.stepNumber, { backgroundColor: colors.isDark ? PRIMARY_BLUE_DARK : PRIMARY_BLUE }]}>
                      <ThemedText style={glassStyles.stepNumberText}>3</ThemedText>
                  </View>
                    <View style={glassStyles.stepContent}>
                      <ThemedText style={[glassStyles.stepTitle, { color: colors.text }]}>Finish</ThemedText>
                      <ThemedText style={[glassStyles.stepDescription, { color: colors.placeholder }]}>
                       When you're happy, tap on "Finish" and get ready for an accurate 3D representation of your room.
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
            </LiquidGlassCard>
          </AnimatedView>
        </ThemeScroller>
      </View>
    );
  }

  // Full-screen scanner overlay
  return (
    <View style={[styles.scannerContainer, { backgroundColor: "#000" }]}>
      {/* RoomPlan View */}
      <RoomPlanView style={StyleSheet.absoluteFill} {...viewProps} />

      {/* Top Controls - Liquid Glass */}
      {!showTransition && (
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          {supportsNativeLiquidGlass ? (
            <>
              <Pressable onPress={onCancel}>
                <GlassView style={styles.glassControlButton} glassEffectStyle="regular">
                  <Icon name="X" size={18} color="#fff" />
                  <ThemedText style={styles.controlButtonText}>Cancel</ThemedText>
                </GlassView>
              </Pressable>

              <Pressable onPress={onFinish}>
                <GlassView style={styles.glassControlButton} glassEffectStyle="regular">
                  <Icon name="Check" size={18} color="#fff" />
                  <ThemedText style={styles.controlButtonText}>Finish</ThemedText>
                </GlassView>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={onCancel}>
                <BlurView intensity={60} tint="dark" style={styles.controlButton}>
                  <Icon name="X" size={18} color="#fff" />
          <ThemedText style={styles.controlButtonText}>Cancel</ThemedText>
                </BlurView>
        </Pressable>

              <Pressable onPress={onFinish}>
                <BlurView intensity={60} tint="dark" style={styles.controlButton}>
                  <Icon name="Check" size={18} color="#fff" />
          <ThemedText style={styles.controlButtonText}>Finish</ThemedText>
                </BlurView>
        </Pressable>
            </>
          )}
      </View>
      )}

      {/* Bottom Controls - Liquid Glass */}
      {!showTransition && (
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {supportsNativeLiquidGlass ? (
            <Pressable onPress={onAddRoom}>
              <GlassView style={styles.glassAddRoomButton} glassEffectStyle="regular">
                <Icon name="PlusSquare" size={20} color="#fff" />
                <ThemedText style={styles.addRoomButtonText}>Add Another Room</ThemedText>
              </GlassView>
            </Pressable>
          ) : (
            <Pressable onPress={onAddRoom}>
              <BlurView intensity={60} tint="dark" style={styles.addRoomButton}>
                <Icon name="PlusSquare" size={20} color="#fff" />
          <ThemedText style={styles.addRoomButtonText}>Add Another Room</ThemedText>
              </BlurView>
        </Pressable>
          )}

        {/* Scanning hint */}
          {supportsNativeLiquidGlass ? (
            <GlassView style={styles.glassHintContainer} glassEffectStyle="regular">
              <ThemedText style={styles.hintText}>
                Move slowly around the room to capture all surfaces
              </ThemedText>
            </GlassView>
          ) : (
            <BlurView intensity={40} tint="dark" style={styles.hintContainer}>
          <ThemedText style={styles.hintText}>
            Move slowly around the room to capture all surfaces
          </ThemedText>
            </BlurView>
          )}
        </View>
      )}

      {/* Transition Overlay - After scan complete */}
      {showTransition && (
        <View style={[StyleSheet.absoluteFill, styles.transitionOverlay]}>
          <View style={styles.transitionContent}>
            {/* Animated 3D Icon */}
            <Animated.View
              style={{
                transform: [
                  {
                    scale: transitionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
                opacity: transitionAnim,
              }}
            >
              <View style={[styles.transitionIconContainer, { backgroundColor: colors.accentLight }]}>
                <Icon name="Box" size={80} color={colors.iconAccent} />
              </View>
            </Animated.View>

            {/* Success Text */}
            <Animated.View
              style={{
                opacity: transitionAnim,
                transform: [
                  {
                    translateY: transitionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <ThemedText style={styles.transitionTitle}>
                Scan Complete!
              </ThemedText>
              <ThemedText style={styles.transitionSubtitle}>
                Your 3D room model is ready
              </ThemedText>
            </Animated.View>

            {/* Continue Button - Liquid Glass Blue */}
            <Animated.View
              style={{
                opacity: transitionAnim,
                width: '100%',
                paddingHorizontal: 32,
                marginTop: 40,
              }}
            >
              {supportsNativeLiquidGlass ? (
                <Pressable onPress={handleContinueFromTransition}>
                  <GlassView 
                    style={[styles.glassContinueButton, { backgroundColor: PRIMARY_BLUE }]} 
                    glassEffectStyle="regular"
                    tintColor={PRIMARY_BLUE}
                    isInteractive
                  >
                    <ThemedText style={styles.continueButtonText}>
                      Continue
                    </ThemedText>
                    <Icon name="ArrowRight" size={20} color="#fff" />
                  </GlassView>
                </Pressable>
              ) : (
                <Pressable onPress={handleContinueFromTransition}>
                  <BlurView intensity={80} tint="light" style={styles.continueButton}>
                    <LinearGradient
                      colors={['rgba(0, 122, 255, 0.98)', 'rgba(0, 100, 220, 0.95)'] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <ThemedText style={styles.continueButtonText}>
                      Continue
                    </ThemedText>
                    <Icon name="ArrowRight" size={20} color="#fff" />
                  </BlurView>
                </Pressable>
              )}
            </Animated.View>
        </View>
      </View>
      )}
    </View>
  );
}

// Liquid Glass specific styles
const glassStyles = StyleSheet.create({
  cardOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  cardGlass: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  heroContent: {
    padding: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 15,
    textAlign: 'left',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  requirementsList: {
    gap: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsList: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4DA3E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  buttonGlass: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  supportText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 12,
  },
});

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  glassControlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  controlButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  addRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  glassAddRoomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  addRoomButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  hintContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    overflow: 'hidden',
  },
  glassHintContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  hintText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    opacity: 0.9,
  },
  transitionOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  transitionContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  transitionIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  transitionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  transitionSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    textAlign: "center",
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: 'hidden',
  },
  glassContinueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
