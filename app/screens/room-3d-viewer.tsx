import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { File } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import useThemeColors from "@/app/_contexts/ThemeColors";
import Icon from "@/components/Icon";
import Room3DViewer, { type RoomPlanData, type TexturePreset } from "@/components/Room3DViewer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Texture preset options
const TEXTURE_PRESETS: { id: TexturePreset; label: string; icon: string }[] = [
  { id: 'modern', label: 'Modern', icon: 'Sparkles' },
  { id: 'classic', label: 'Classic', icon: 'Crown' },
  { id: 'minimal', label: 'Minimal', icon: 'Minus' },
  { id: 'industrial', label: 'Industrial', icon: 'Factory' },
];

export default function Room3DViewerScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ jsonUrl?: string; scanUrl?: string }>();
  
  const [roomData, setRoomData] = useState<RoomPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [texturePreset, setTexturePreset] = useState<TexturePreset>('modern');
  const [showFurniture, setShowFurniture] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  // Load room data from JSON file
  useEffect(() => {
    if (params.jsonUrl) {
      loadRoomData(params.jsonUrl);
    } else {
      setError("No room data provided");
      setIsLoading(false);
    }
  }, [params.jsonUrl]);
  
  const loadRoomData = async (jsonUrl: string) => {
    try {
      const file = new File(jsonUrl);
      const jsonContent = await file.text();
      const data: RoomPlanData = JSON.parse(jsonContent);
      setRoomData(data);
    } catch (err) {
      console.error("[Room 3D Viewer] Failed to load room data:", err);
      setError("Failed to load room data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open original USDZ in Quick Look
  const openOriginalModel = useCallback(async () => {
    if (!params.scanUrl) {
      Alert.alert("No Model", "Original USDZ model not available.");
      return;
    }
    
    try {
      const decodedUrl = decodeURIComponent(params.scanUrl);
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(decodedUrl, {
          mimeType: "model/vnd.usdz+zip",
          dialogTitle: "Original Room Scan",
          UTI: "com.pixar.universal-scene-description-mobile",
        });
      } else {
        Alert.alert("Not Available", "USDZ viewer is not available on this device.");
      }
    } catch (err) {
      console.error("[Room 3D Viewer] Failed to open USDZ:", err);
    }
  }, [params.scanUrl]);
  
  // Handle 3D viewer load
  const handleViewerLoad = useCallback(() => {
    console.log("[Room 3D Viewer] 3D scene loaded");
  }, []);
  
  // Handle 3D viewer error
  const handleViewerError = useCallback((err: Error) => {
    console.error("[Room 3D Viewer] 3D scene error:", err);
    setError(err.message);
  }, []);
  
  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#1a1a1c' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4DA3E1" />
          <ThemedText style={styles.loadingText}>Loading 3D Room...</ThemedText>
        </View>
      </View>
    );
  }
  
  // Render error state
  if (error || !roomData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="ArrowLeft" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>3D Room</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="AlertCircle" size={48} color={colors.placeholder} />
          <ThemedText style={[styles.errorText, { color: colors.placeholder }]}>
            {error || "No room data available"}
          </ThemedText>
          <Pressable 
            onPress={() => router.back()}
            style={[styles.errorButton, { backgroundColor: colors.accentLight }]}
          >
            <ThemedText style={{ color: colors.iconAccent, fontWeight: '600' }}>
              Go Back
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: '#1a1a1c' }]}>
      {/* 3D Viewer */}
      <Room3DViewer
        roomData={roomData}
        texturePreset={texturePreset}
        showFurniture={showFurniture}
        onLoad={handleViewerLoad}
        onError={handleViewerError}
      />
      
      {/* Tap to toggle controls overlay */}
      <Pressable 
        style={styles.tapOverlay} 
        onPress={toggleControls}
      />
      
      {/* Top Controls */}
      {showControls && (
        <View style={[styles.topControls, { paddingTop: insets.top + 8 }]}>
          {/* Back Button */}
          <Pressable onPress={() => router.back()}>
            <BlurView intensity={60} tint="dark" style={styles.controlButton}>
              <Icon name="ArrowLeft" size={20} color="#fff" />
            </BlurView>
          </Pressable>
          
          {/* Title */}
          <BlurView intensity={40} tint="dark" style={styles.titleContainer}>
            <ThemedText style={styles.title}>3D Room View</ThemedText>
          </BlurView>
          
          {/* Open Original USDZ */}
          {params.scanUrl && (
            <Pressable onPress={openOriginalModel}>
              <BlurView intensity={60} tint="dark" style={styles.controlButton}>
                <Icon name="ExternalLink" size={20} color="#fff" />
              </BlurView>
            </Pressable>
          )}
        </View>
      )}
      
      {/* Bottom Controls */}
      {showControls && (
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
          {/* Texture Preset Selector */}
          <BlurView intensity={60} tint="dark" style={styles.presetContainer}>
            <ThemedText style={styles.presetLabel}>Style</ThemedText>
            <View style={styles.presetRow}>
              {TEXTURE_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => setTexturePreset(preset.id)}
                  style={[
                    styles.presetButton,
                    texturePreset === preset.id && styles.presetButtonActive,
                  ]}
                >
                  <Icon 
                    name={preset.icon as any} 
                    size={16} 
                    color={texturePreset === preset.id ? '#fff' : 'rgba(255,255,255,0.6)'} 
                  />
                  <ThemedText 
                    style={[
                      styles.presetText,
                      texturePreset === preset.id && styles.presetTextActive,
                    ]}
                  >
                    {preset.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </BlurView>
          
          {/* Toggle Furniture */}
          <Pressable onPress={() => setShowFurniture(!showFurniture)}>
            <BlurView intensity={60} tint="dark" style={styles.toggleContainer}>
              <Icon 
                name={showFurniture ? "Sofa" : "EyeOff"} 
                size={18} 
                color={showFurniture ? '#4DA3E1' : 'rgba(255,255,255,0.6)'} 
              />
              <ThemedText style={styles.toggleText}>
                {showFurniture ? 'Furniture On' : 'Furniture Off'}
              </ThemedText>
            </BlurView>
          </Pressable>
          
          {/* Instructions */}
          <BlurView intensity={40} tint="dark" style={styles.instructionsContainer}>
            <ThemedText style={styles.instructionsText}>
              Drag to rotate • Pinch to zoom • Two fingers to pan
            </ThemedText>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
  },
  presetContainer: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  presetLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  presetButtonActive: {
    backgroundColor: '#4DA3E1',
  },
  presetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
});
