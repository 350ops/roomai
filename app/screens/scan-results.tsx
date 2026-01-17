import React, { useEffect, useState } from "react";
import { View, Pressable, Alert, ScrollView, StyleSheet, Platform, Dimensions, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { File } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import AnimatedView from "@/components/AnimatedView";
import useThemeColors from "@/app/_contexts/ThemeColors";
import Icon from "@/components/Icon";
import FloorPlan2D from "@/components/FloorPlan2D";

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Format to millimeter precision
const formatPreciseMeters = (meters: number): string => {
  return `${meters.toFixed(3)}m`;
};

// Format to centimeters for display
const formatToCm = (meters: number): string => {
  const cm = Math.round(meters * 100);
  if (cm >= 100) {
    const m = Math.floor(cm / 100);
    const remainingCm = cm % 100;
    return remainingCm > 0 ? `${m}m ${remainingCm}cm` : `${m}m`;
  }
  return `${cm}cm`;
};

// Try to import file viewer
let openFile: ((path: string, options?: any) => Promise<void>) | null = null;
try {
  const FileViewerTurbo = require("react-native-file-viewer-turbo");
  openFile = FileViewerTurbo.open;
} catch (e) {
  console.log("[Scan Results] react-native-file-viewer-turbo not available");
}

// Types
type Vector3Array = [number, number, number];
type TransformMatrix = number[];

interface RoomElement {
  identifier: string;
  dimensions?: Vector3Array;
  transform?: TransformMatrix;
  category?: Record<string, any>;
}

interface RoomSection {
  label?: string;
  story?: number;
  center?: Vector3Array;
}

interface RoomPlanData {
  sections?: RoomSection[];
  walls?: RoomElement[];
  doors?: RoomElement[];
  windows?: RoomElement[];
  openings?: RoomElement[];
  floors?: RoomElement[];
  objects?: RoomElement[];
  [key: string]: any;
}

export default function ScanResultsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scanUrl?: string; jsonUrl?: string }>();
  
  const [roomData, setRoomData] = useState<RoomPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening3DModel, setIsOpening3DModel] = useState(false);

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
    variant = 'primary',
    flex = false,
    loading = false,
    disabled = false
  }: { 
    onPress: () => void; 
    title: string; 
    icon?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    flex?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }) => {
    const blueColor = colors.isDark ? PRIMARY_BLUE_DARK : PRIMARY_BLUE;
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';
    const isDisabled = loading || disabled;

    const buttonContent = (
            <View style={glassStyles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color={isPrimary ? '#FFFFFF' : colors.text} />
        ) : (
          <>
              {icon && (
                <Icon 
                  name={icon as any} 
                  size={isPrimary ? 22 : 18} 
                  color={isPrimary ? '#FFFFFF' : colors.text} 
                />
              )}
              <ThemedText style={[
                glassStyles.buttonText, 
                { color: isPrimary ? '#FFFFFF' : colors.text },
                !isPrimary && { fontSize: 15 }
              ]}>
                {title}
              </ThemedText>
          </>
        )}
            </View>
    );

    if (supportsNativeLiquidGlass) {
      return (
        <Pressable 
          onPress={isDisabled ? undefined : onPress} 
          style={[glassStyles.buttonOuter, flex && { flex: 1 }, isDisabled && { opacity: 0.6 }]}
        >
          <GlassView
            style={[
              glassStyles.buttonGlass,
              isPrimary && { backgroundColor: blueColor },
              isOutline && { borderWidth: 1, borderColor: colors.border }
            ]}
            glassEffectStyle="regular"
            tintColor={isPrimary ? blueColor : undefined}
            isInteractive
          >
            {buttonContent}
          </GlassView>
        </Pressable>
      );
    }

    return (
      <Pressable 
        onPress={isDisabled ? undefined : onPress} 
        style={[glassStyles.buttonOuter, flex && { flex: 1 }, isDisabled && { opacity: 0.6 }]}
      >
        <BlurView
          intensity={60}
          tint={colors.isDark ? "dark" : "light"}
          style={[
            glassStyles.buttonBlur,
            isOutline && { borderWidth: 1, borderColor: colors.border }
          ]}
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
          {buttonContent}
        </BlurView>
      </Pressable>
    );
  };

  useEffect(() => {
    if (params.jsonUrl) {
      loadRoomData(params.jsonUrl);
    } else {
      setIsLoading(false);
    }
  }, [params.jsonUrl]);

  const loadRoomData = async (jsonUrl: string) => {
    try {
      const file = new File(jsonUrl);
      const jsonContent = await file.text();
      const data: RoomPlanData = JSON.parse(jsonContent);
      setRoomData(data);
    } catch (error) {
      console.error("[Scan Results] Failed to parse JSON:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionFromTransform = (transform?: TransformMatrix) => {
    if (!transform || transform.length < 15) return null;
    return { x: transform[12], y: transform[13], z: transform[14] };
  };

  const getRoomSummary = () => {
    if (!roomData) return null;

    const sections = roomData.sections || [];
    const walls: RoomElement[] = roomData.walls || [];
    const doors: RoomElement[] = roomData.doors || [];
    const windows: RoomElement[] = roomData.windows || [];
    const openings: RoomElement[] = roomData.openings || [];
    const floors: RoomElement[] = roomData.floors || [];
    const objects: RoomElement[] = roomData.objects || [];

    const roomLabel = sections.length > 0 ? sections[0].label : null;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let wallHeight = 0;
    let totalWallArea = 0;

    walls.forEach((wall) => {
      if (wall.dimensions && Array.isArray(wall.dimensions)) {
        const [width, height] = wall.dimensions;
        if (height > wallHeight) wallHeight = height;
        totalWallArea += width * height;
      }
      
      const pos = getPositionFromTransform(wall.transform);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minZ = Math.min(minZ, pos.z);
        maxZ = Math.max(maxZ, pos.z);
      }
    });

    let floorArea = 0;
    floors.forEach((floor) => {
      if (floor.dimensions && Array.isArray(floor.dimensions)) {
        const [width, height, depth] = floor.dimensions;
        floorArea += width * (depth || height);
      }
    });

    const roomWidth = maxX !== -Infinity ? Math.abs(maxX - minX) : 0;
    const roomDepth = maxZ !== -Infinity ? Math.abs(maxZ - minZ) : 0;
    
    if (floorArea === 0 && roomWidth > 0 && roomDepth > 0) {
      floorArea = roomWidth * roomDepth;
    }

    const estimatedVolume = floorArea * wallHeight;

    const objectCategories: string[] = [];
    objects.forEach((obj) => {
      if (obj.category) {
        const category = Object.keys(obj.category)[0];
        if (category && !objectCategories.includes(category)) {
          objectCategories.push(category);
        }
      }
    });

    return {
      roomLabel,
      // Precise values (3 decimal places = millimeter precision)
      floorArea: floorArea > 0 ? floorArea.toFixed(3) : null,
      floorAreaDisplay: floorArea > 0 ? floorArea.toFixed(2) : null,
      estimatedVolume: estimatedVolume > 0 ? estimatedVolume.toFixed(3) : null,
      wallHeight: wallHeight > 0 ? wallHeight.toFixed(3) : null,
      wallHeightCm: wallHeight > 0 ? formatToCm(wallHeight) : null,
      roomWidth: roomWidth > 0 ? roomWidth.toFixed(3) : null,
      roomWidthCm: roomWidth > 0 ? formatToCm(roomWidth) : null,
      roomDepth: roomDepth > 0 ? roomDepth.toFixed(3) : null,
      roomDepthCm: roomDepth > 0 ? formatToCm(roomDepth) : null,
      totalWallArea: totalWallArea > 0 ? totalWallArea.toFixed(3) : null,
      totalWallAreaDisplay: totalWallArea > 0 ? totalWallArea.toFixed(2) : null,
      // Raw values for calculations
      rawFloorArea: floorArea,
      rawWidth: roomWidth,
      rawDepth: roomDepth,
      rawHeight: wallHeight,
      wallCount: walls.length,
      doorCount: doors.length,
      windowCount: windows.length,
      openingCount: openings.length,
      objectCount: objects.length,
      objectCategories,
    };
  };

  const view3DModel = async () => {
    if (!params.scanUrl) {
      Alert.alert("No Model", "No 3D model available.");
      return;
    }

    // Prevent multiple taps
    if (isOpening3DModel) return;
    setIsOpening3DModel(true);

    try {
        // Decode the URL in case it was encoded during navigation
        const decodedUrl = decodeURIComponent(params.scanUrl);
      
      // Use expo-sharing as the primary method - it's more reliable
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        console.log("[Scan Results] Opening 3D model via sharing:", decodedUrl);
        
        // Add a small timeout to ensure UI updates before native call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await Sharing.shareAsync(decodedUrl, {
          mimeType: "model/vnd.usdz+zip",
          dialogTitle: "Room 3D Model",
          UTI: "com.pixar.universal-scene-description-mobile",
        });
      } else if (openFile) {
        // Fallback to file viewer if sharing isn't available
        const filePath = decodedUrl.replace("file://", "");
        console.log("[Scan Results] Opening 3D model via file viewer:", filePath);
        
        await openFile(filePath, {
          displayName: "Room 3D Model",
          showOpenWithDialog: false,
          onDismiss: () => {
            console.log("[Scan Results] Quick Look dismissed");
            setIsOpening3DModel(false);
          },
        });
      } else {
        Alert.alert("Not Available", "3D model viewing is not available on this device.");
      }
    } catch (error: any) {
      // Don't show error if user just dismissed the viewer
      if (error?.message?.includes('cancel') || error?.message?.includes('dismiss')) {
        console.log("[Scan Results] User dismissed 3D model viewer");
        return;
      }
      console.error("[Scan Results] Failed to open 3D model:", error);
      Alert.alert("Error", "Failed to open 3D model viewer. Please try again.");
    } finally {
      setIsOpening3DModel(false);
    }
  };

  const summary = getRoomSummary();

  const labelMap: Record<string, string> = {
    livingRoom: "Living Room",
    bedroom: "Bedroom",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    diningRoom: "Dining Room",
    office: "Office",
    hallway: "Hallway",
    laundry: "Laundry",
    garage: "Garage",
    closet: "Closet",
  };

  const categoryLabels: Record<string, string> = {
    sofa: "Sofa",
    chair: "Chair",
    table: "Table",
    bed: "Bed",
    storage: "Storage",
    television: "TV",
    fireplace: "Fireplace",
    bathtub: "Bathtub",
    toilet: "Toilet",
    sink: "Sink",
    refrigerator: "Refrigerator",
    stove: "Stove",
    dishwasher: "Dishwasher",
    washer: "Washer",
    dryer: "Dryer",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Scan Results" showBackButton />
      
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <AnimatedView animation="fadeInUp" delay={0}>
          <LiquidGlassCard style={{ marginBottom: 20 }}>
            <View style={glassStyles.successContent}>
              <View style={[glassStyles.successIcon, { backgroundColor: 'rgba(169, 204, 156, 0.25)' }]}>
                <Icon name="CheckCircle" size={36} color="#A9CC9C" />
              </View>
              <ThemedText style={[glassStyles.successTitle, { color: colors.text }]}>
                Room Scan Complete
              </ThemedText>
              {summary?.roomLabel && (
                <View style={[glassStyles.roomLabelBadge, { backgroundColor: colors.accentLight }]}>
                  <ThemedText style={[glassStyles.roomLabelText, { color: colors.iconAccent }]}>
                    {labelMap[summary.roomLabel] || summary.roomLabel}
                  </ThemedText>
                </View>
              )}
            </View>
          </LiquidGlassCard>
        </AnimatedView>

        {/* Room Measurements */}
        {summary && (
          <AnimatedView animation="fadeInUp" delay={100}>
            <LiquidGlassCard style={{ marginBottom: 16 }}>
              <View style={glassStyles.cardContent}>
                <ThemedText style={[glassStyles.sectionTitle, { color: colors.text }]}>
                  Room Measurements
                </ThemedText>

                {/* Area Cards */}
                {(summary.floorArea || summary.totalWallArea) && (
                  <View style={glassStyles.areaRow}>
                    {summary.floorArea && (
                      <View style={[glassStyles.areaCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <View style={glassStyles.areaHeader}>
                          <Icon name="Square" size={16} color={colors.iconAccent} />
                          <ThemedText style={[glassStyles.areaLabel, { color: colors.placeholder }]}>
                            Floor Area
                          </ThemedText>
                        </View>
                        <ThemedText style={[glassStyles.areaValue, { color: colors.text }]}>
                          {summary.floorArea}
                        </ThemedText>
                        <ThemedText style={[glassStyles.areaUnit, { color: colors.placeholder }]}>
                          square meters
                        </ThemedText>
                      </View>
                    )}
                    {summary.totalWallArea && (
                      <View style={[glassStyles.areaCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <View style={glassStyles.areaHeader}>
                          <Icon name="Layers" size={16} color={colors.iconAccent} />
                          <ThemedText style={[glassStyles.areaLabel, { color: colors.placeholder }]}>
                            Wall Area
                          </ThemedText>
                        </View>
                        <ThemedText style={[glassStyles.areaValue, { color: colors.text }]}>
                          {summary.totalWallArea}
                        </ThemedText>
                        <ThemedText style={[glassStyles.areaUnit, { color: colors.placeholder }]}>
                          square meters
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}

                {/* Dimensions */}
                {(summary.roomWidth || summary.roomDepth || summary.wallHeight) && (
                  <View style={[glassStyles.dimensionsCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <ThemedText style={[glassStyles.dimensionsTitle, { color: colors.text }]}>
                      Dimensions
                    </ThemedText>
                    <View style={glassStyles.dimensionsList}>
                      {summary.roomWidth && summary.roomDepth && (
                        <>
                        <View style={glassStyles.dimensionRow}>
                          <ThemedText style={{ color: colors.placeholder }}>
                              Width
                          </ThemedText>
                            <View style={{ alignItems: 'flex-end' }}>
                          <ThemedText style={[glassStyles.dimensionValue, { color: colors.text }]}>
                                {summary.roomWidthCm}
                              </ThemedText>
                              <ThemedText style={{ color: colors.placeholder, fontSize: 11 }}>
                                ({summary.roomWidth}m exact)
                          </ThemedText>
                        </View>
                          </View>
                          <View style={glassStyles.dimensionRow}>
                            <ThemedText style={{ color: colors.placeholder }}>
                              Depth
                            </ThemedText>
                            <View style={{ alignItems: 'flex-end' }}>
                              <ThemedText style={[glassStyles.dimensionValue, { color: colors.text }]}>
                                {summary.roomDepthCm}
                              </ThemedText>
                              <ThemedText style={{ color: colors.placeholder, fontSize: 11 }}>
                                ({summary.roomDepth}m exact)
                              </ThemedText>
                            </View>
                          </View>
                        </>
                      )}
                      {summary.wallHeight && (
                        <View style={glassStyles.dimensionRow}>
                          <ThemedText style={{ color: colors.placeholder }}>
                            Ceiling Height
                          </ThemedText>
                          <View style={{ alignItems: 'flex-end' }}>
                          <ThemedText style={[glassStyles.dimensionValue, { color: colors.text }]}>
                              {summary.wallHeightCm}
                            </ThemedText>
                            <ThemedText style={{ color: colors.placeholder, fontSize: 11 }}>
                              ({summary.wallHeight}m exact)
                          </ThemedText>
                          </View>
                        </View>
                      )}
                      {summary.estimatedVolume && (
                        <View style={glassStyles.dimensionRow}>
                          <ThemedText style={{ color: colors.placeholder }}>
                            Room Volume
                          </ThemedText>
                          <ThemedText style={[glassStyles.dimensionValue, { color: colors.text }]}>
                            {summary.estimatedVolume} m³
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </LiquidGlassCard>
          </AnimatedView>
        )}

        {/* 2D Floor Plan */}
        {roomData && (
          <AnimatedView animation="fadeInUp" delay={150}>
            <LiquidGlassCard style={{ marginBottom: 16 }}>
              <View style={glassStyles.cardContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View>
                    <ThemedText style={[glassStyles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                      2D Floor Plan
                    </ThemedText>
                    <ThemedText style={{ color: colors.placeholder, fontSize: 12 }}>
                      Precise measurements • Millimeter accuracy
                    </ThemedText>
                  </View>
                  <View style={[glassStyles.precisionBadge, { backgroundColor: colors.accentLight }]}>
                    <Icon name="Target" size={12} color={colors.iconAccent} />
                    <ThemedText style={{ color: colors.iconAccent, fontSize: 11, fontWeight: '600' }}>
                      LiDAR
                    </ThemedText>
                  </View>
                </View>
                <FloorPlan2D
                  roomData={roomData}
                  width={SCREEN_WIDTH - 72}
                  height={280}
                  showMeasurements={true}
                  showFurniture={true}
                />
              </View>
            </LiquidGlassCard>
          </AnimatedView>
        )}

        {/* Detected Elements */}
        {summary && (summary.wallCount > 0 || summary.doorCount > 0 || summary.windowCount > 0) && (
          <AnimatedView animation="fadeInUp" delay={200}>
            <LiquidGlassCard style={{ marginBottom: 16 }}>
              <View style={glassStyles.cardContent}>
                <ThemedText style={[glassStyles.sectionTitle, { color: colors.text }]}>
                  Detected Elements
                </ThemedText>
                <View style={glassStyles.elementsGrid}>
                  {summary.wallCount > 0 && (
                    <View style={[glassStyles.elementBadge, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Icon name="LayoutGrid" size={18} color={colors.iconAccent} />
                      <ThemedText style={[glassStyles.elementText, { color: colors.text }]}>{summary.wallCount} Walls</ThemedText>
                    </View>
                  )}
                  {summary.doorCount > 0 && (
                    <View style={[glassStyles.elementBadge, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Icon name="DoorOpen" size={18} color="#A9CC9C" />
                      <ThemedText style={[glassStyles.elementText, { color: colors.text }]}>{summary.doorCount} Doors</ThemedText>
                    </View>
                  )}
                  {summary.windowCount > 0 && (
                    <View style={[glassStyles.elementBadge, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Icon name="AppWindow" size={18} color={PRIMARY_BLUE} />
                      <ThemedText style={[glassStyles.elementText, { color: colors.text }]}>{summary.windowCount} Windows</ThemedText>
                    </View>
                  )}
                  {summary.openingCount > 0 && (
                    <View style={[glassStyles.elementBadge, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                      <Icon name="ArrowUpRight" size={18} color={colors.iconAccent} />
                      <ThemedText style={[glassStyles.elementText, { color: colors.text }]}>{summary.openingCount} Openings</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </LiquidGlassCard>
          </AnimatedView>
        )}

        {/* Detected Furniture */}
        {summary?.objectCategories && summary.objectCategories.length > 0 && (
          <AnimatedView animation="fadeInUp" delay={300}>
            <LiquidGlassCard style={{ marginBottom: 16 }}>
              <View style={glassStyles.cardContent}>
                <ThemedText style={[glassStyles.sectionTitle, { color: colors.text }]}>
                  Detected Furniture ({summary.objectCount})
                </ThemedText>
                <View style={glassStyles.furnitureGrid}>
                  {summary.objectCategories.map((category, index) => (
                    <View 
                      key={index}
                      style={[glassStyles.furnitureBadge, { backgroundColor: colors.accentLight }]}
                    >
                      <ThemedText style={[glassStyles.furnitureText, { color: colors.iconAccent }]}>
                        {categoryLabels[category] || category}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </LiquidGlassCard>
          </AnimatedView>
        )}
      </ScrollView>

      {/* Bottom Action Buttons - Liquid Glass */}
      <View style={[glassStyles.bottomActions, { paddingBottom: insets.bottom + 16, backgroundColor: colors.bg }]}>
        {/* Get Quotation - Primary */}
        <LiquidGlassButton
          onPress={() => {
            Alert.alert(
              "Get Renovation Estimate",
              "Would you like to get an approximate cost estimate for renovating this room based on your AR scan?",
              [
                { text: "Not Now", style: "cancel" },
                { 
                  text: "Yes, Get Estimate", 
                  onPress: () => {
                    // Navigate to AR quotation with scan data
                    const scanData = summary ? {
                      floorArea: summary.floorArea || '0',
                      roomWidth: summary.roomWidth || '0',
                      roomDepth: summary.roomDepth || '0',
                      roomLabel: summary.roomLabel || '',
                      wallArea: summary.totalWallArea || '0',
                    } : {};
                    router.push({
                      pathname: '/screens/ar-quotation',
                      params: scanData,
                    });
                  }
                }
              ]
            );
          }}
          title="Get Quotation"
          icon="Calculator"
          variant="primary"
        />

        {/* Secondary Buttons Row */}
        <View style={glassStyles.secondaryRow}>
          <LiquidGlassButton
            onPress={view3DModel}
            title={isOpening3DModel ? "Opening..." : "View 3D"}
            icon="Box"
            variant="secondary"
            flex
            loading={isOpening3DModel}
          />
          
          <LiquidGlassButton
            onPress={() => Alert.alert("Add Items", "This feature will allow you to add furniture and items.")}
            title="Add Items"
            icon="Plus"
            variant="outline"
            flex
          />
        </View>
      </View>
    </View>
  );
}

// Liquid Glass specific styles
const glassStyles = StyleSheet.create({
  cardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardGlass: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  successContent: {
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  roomLabelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  roomLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  precisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  areaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  areaCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  areaLabel: {
    fontSize: 12,
  },
  areaValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  areaUnit: {
    fontSize: 13,
  },
  dimensionsCard: {
    padding: 16,
    borderRadius: 14,
  },
  dimensionsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  dimensionsList: {
    gap: 10,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimensionValue: {
    fontWeight: '600',
  },
  elementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  elementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  elementText: {
    fontWeight: '500',
  },
  furnitureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  furnitureBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  furnitureText: {
    fontWeight: '600',
    fontSize: 14,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4DA3E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  buttonGlass: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonBlur: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
