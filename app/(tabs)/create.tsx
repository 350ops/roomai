import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Image, TextInput, ScrollView, Alert, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, Modal, Animated, PanResponder, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system/next';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';


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

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/app/_contexts/ThemeColors';
import Icon from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import AnimatedBottomSheet from '@/components/AnimatedBottomSheet';
import { AppleListRow, AppleListGroup } from '@/components/AppleListRow';
import { saveDesign } from '@/app/_utils/designStorage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_WIDTH = SCREEN_WIDTH - 80;     

// Supabase Edge Function URL for secure OpenAI proxy
const getEdgeFunctionUrl = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/functions/v1/openai-image`;
};

// Supabase anon key for Edge Function authorization
const getSupabaseAnonKey = () => {
    return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
           process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
};

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

// Brand green color
const BRAND_GREEN = '#007334';

const createLiquidGlassStyles = (colors: ReturnType<typeof useThemeColors>) =>
    StyleSheet.create({
        cardOuter: {
            borderRadius: 32,
            overflow: 'hidden',
            shadowColor: colors.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.08)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 24,
        },
        cardBlur: {
            borderRadius: 32,
            borderWidth: 0,
            borderColor: 'transparent',
            overflow: 'hidden',
            backgroundColor: colors.isDark ? colors.secondary : '#FFFFFF',
        },
        topHighlight: {
            position: 'absolute',
            top: 0,
            left: 20,
            right: 20,
            height: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 1,
        },
        cardContent: {
            paddingHorizontal: 28,
            paddingTop: 40,
            paddingBottom: 32,
            alignItems: 'center',
        },
        iconContainer: {
            marginBottom: 28,
            borderRadius: 24,
            overflow: 'hidden',
        },
        iconBlur: {
            width: 80,
            height: 80,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0,
            backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 115, 52, 0.08)',
            overflow: 'hidden',
        },
        title: {
            fontSize: 26,
            fontWeight: '800',
            color: colors.isDark ? '#FFFFFF' : '#1a1a1a',
            textAlign: 'center',
            marginBottom: 12,
            letterSpacing: -0.5,
        },
        description: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            marginBottom: 32,
            paddingHorizontal: 12,
        },
        actionButton: {
            borderRadius: 50,
            overflow: 'hidden',
            width: '100%',
        },
        buttonBlur: {
            borderRadius: 50,
            borderWidth: 0,
            backgroundColor: colors.isDark ? '#FFFFFF' : '#1a1a1a',
            overflow: 'hidden',
        },
        buttonContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 18,
            paddingHorizontal: 32,
            gap: 10,
        },
        buttonText: {
            fontSize: 17,
            fontWeight: '600',
            color: colors.isDark ? '#1a1a1a' : '#FFFFFF',
            letterSpacing: 0.3,
        },
        skipText: {
            fontSize: 14,
            color: colors.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
            fontWeight: '500',
        },
    });

// Step Badge Component - Based on Figma design (node 3528:41)
// Dark gray circle with white number inside
const StepBadge = ({ number }: { number: number }) => (
    <View 
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: '#9B744D' }}
    >
        <ThemedText className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{number}</ThemedText>
    </View>
);

// Liquid Glass Card Component - Uses native GlassView on iOS 26+, falls back to BlurView
interface LiquidGlassCardProps {
    children: React.ReactNode;
    style?: object;
    cardStyle?: 'regular' | 'clear';
    colors: ReturnType<typeof useThemeColors>;
    liquidGlassStyles: ReturnType<typeof createLiquidGlassStyles>;
    glassGradients: {
        card: [string, string];
        icon: [string, string];
        button: [string, string];
        paginationActive: string;
        paginationInactive: string;
    };
}

const LiquidGlassCard = ({ 
    children, 
    style, 
    cardStyle = 'regular',
    colors,
    liquidGlassStyles,
    glassGradients 
}: LiquidGlassCardProps) => {
    if (supportsNativeLiquidGlass) {
        // Use native iOS 26+ GlassView with clean white/dark background
        return (
            <View style={[liquidGlassStyles.cardOuter, style]}>
                <GlassView
                    style={liquidGlassStyles.cardBlur}
                    glassEffectStyle={cardStyle}
                    tintColor={colors.isDark ? undefined : '#FFFFFF'}
                    isInteractive
                >
                    {children}
                </GlassView>
            </View>
        );
    }

    // Fallback - solid white/dark background
    return (
        <View style={[liquidGlassStyles.cardOuter, style]}>
            <View style={liquidGlassStyles.cardBlur}>
                {children}
            </View>
        </View>
    );
};

// Liquid Glass Icon Component
interface LiquidGlassIconProps {
    icon: string;
    size?: number;
    colors: ReturnType<typeof useThemeColors>;
    liquidGlassStyles: ReturnType<typeof createLiquidGlassStyles>;
    glassGradients: {
        card: [string, string];
        icon: [string, string];
        button: [string, string];
        paginationActive: string;
        paginationInactive: string;
    };
}

const LiquidGlassIcon = ({ 
    icon, 
    size = 40,
    colors,
    liquidGlassStyles,
}: LiquidGlassIconProps) => {
    // Icon color is green on light background, white on dark
    const iconColor = colors.isDark ? '#FFFFFF' : BRAND_GREEN;
    
    if (supportsNativeLiquidGlass) {
        return (
            <View style={liquidGlassStyles.iconContainer}>
                <GlassView
                    style={liquidGlassStyles.iconBlur}
                    glassEffectStyle="regular"
                >
                    <Icon
                        name={icon as any}
                        size={size}
                        color={iconColor}
                    />
                </GlassView>
            </View>
        );
    }

    return (
        <View style={liquidGlassStyles.iconContainer}>
            <View style={liquidGlassStyles.iconBlur}>
                <Icon
                    name={icon as any}
                    size={size}
                    color={iconColor}
                />
            </View>
        </View>
    );
};

// Liquid Glass Button Component
interface LiquidGlassButtonProps {
    onPress: () => void;
    title: string;
    colors: ReturnType<typeof useThemeColors>;
    liquidGlassStyles: ReturnType<typeof createLiquidGlassStyles>;
    glassGradients: {
        card: [string, string];
        icon: [string, string];
        button: [string, string];
        paginationActive: string;
        paginationInactive: string;
    };
}

const LiquidGlassButton = ({ 
    onPress, 
    title,
    colors,
    liquidGlassStyles,
}: LiquidGlassButtonProps) => {
    // Button text/icon color: white on black (light), dark on white (dark)
    const buttonTextColor = colors.isDark ? '#1a1a1a' : '#FFFFFF';
    
    if (supportsNativeLiquidGlass) {
        return (
            <Pressable onPress={onPress} style={liquidGlassStyles.actionButton}>
                <GlassView
                    style={liquidGlassStyles.buttonBlur}
                    glassEffectStyle="regular"
                    tintColor={colors.isDark ? '#FFFFFF' : '#1a1a1a'}
                    isInteractive
                >
                    <View style={liquidGlassStyles.buttonContent}>
                        <ThemedText style={[liquidGlassStyles.buttonText, { color: buttonTextColor }]}>
                            {title}
                        </ThemedText>
                        <Icon
                            name="ArrowRight"
                            size={18}
                            color={buttonTextColor}
                        />
                    </View>
                </GlassView>
            </Pressable>
        );
    }

    // Fallback - solid black/white button
    return (
        <Pressable onPress={onPress} style={liquidGlassStyles.actionButton}>
            <View style={liquidGlassStyles.buttonBlur}>
                <View style={liquidGlassStyles.buttonContent}>
                    <ThemedText style={[liquidGlassStyles.buttonText, { color: buttonTextColor }]}>
                        {title}
                    </ThemedText>
                    <Icon
                        name="ArrowRight"
                        size={18}
                        color={buttonTextColor}
                    />
                </View>
            </View>
        </Pressable>
    );
};

export default function CreateScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    
    const liquidGlassStyles = useMemo(() => createLiquidGlassStyles(colors), [colors]);
    const glassGradients = useMemo(() => {
        // Native iOS feel with subtle grays
        const lightGray = 'rgba(0, 0, 0, 0.04)';
        const lighterGray = 'rgba(0, 0, 0, 0.02)';

        const accentSoft = toRgba(colors.accent, colors.isDark ? 0.25 : 0.2);
        const backgroundSoft = toRgba(colors.bg, colors.isDark ? 0.92 : 0.85);
        const textSoft = toRgba(colors.text, colors.isDark ? 0.12 : 0.18);

        return {
            card: (colors.isDark
                ? [backgroundSoft, 'rgba(42, 42, 42, 0.75)']
                : [lighterGray, lightGray]) as [string, string],
            icon: (colors.isDark
                ? [textSoft, toRgba(colors.text, 0.04)]
                : ['rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.05)']) as [string, string],
            button: (colors.isDark
                ? ['rgba(42, 42, 42, 0.9)', 'rgba(26, 26, 26, 0.9)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(245, 245, 245, 0.9)']) as [string, string],
            paginationActive: colors.isDark ? '#4DA3E1' : '#484848',
            paginationInactive: colors.isDark
                ? toRgba(colors.text, 0.25)
                : 'rgba(72, 72, 72, 0.25)',
        };
    }, [colors]);

    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const [selectedFurniture, setSelectedFurniture] = useState<number[]>([]);
    
    // Design customization options
    const [selectedWall, setSelectedWall] = useState('');
    const [selectedFlooring, setSelectedFlooring] = useState('');
    const [selectedFlooringSampleId, setSelectedFlooringSampleId] = useState<string | null>(null);
    const [selectedFurnitureStyle, setSelectedFurnitureStyle] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('');
    
    // Picker modal states
    const [showStylePicker, setShowStylePicker] = useState(false);
    const [showWallPicker, setShowWallPicker] = useState(false);
    const [showFlooringPicker, setShowFlooringPicker] = useState(false);
    const [showFurnitureStylePicker, setShowFurnitureStylePicker] = useState(false);
    const [showRoomTypePicker, setShowRoomTypePicker] = useState(false);
    
    const [showRecap, setShowRecap] = useState(false);
    const [sliderCompleted, setSliderCompleted] = useState(false);
    const [shouldGenerate, setShouldGenerate] = useState(false);
    const sliderPosition = useRef(new Animated.Value(0)).current;
    const [carouselIndex, setCarouselIndex] = useState(0);
    const carouselRef = useRef<FlatList>(null);
    
    // Pre-fetch optimization: start API call before user confirms
    const [apiStarted, setApiStarted] = useState(false);
    const apiPromiseRef = useRef<Promise<{ success: boolean; imageUrl?: string; error?: string }> | null>(null);
    
    // Strict realism mode and room type
    const [strictMode, setStrictMode] = useState(false);
    const [roomType, setRoomType] = useState<string>('');
    
    // Room type options
    const ROOM_TYPE_OPTIONS = [
        'Living Room',
        'Bedroom',
        'Kitchen',
        'Bathroom',
        'Dining Room',
        'Home Office',
        'Entryway',
        'Hallway',
        'Nursery',
        'Guest Room',
    ];
    
    // Furniture reference images state
    const [selectedFurnitureItems, setSelectedFurnitureItems] = useState<string[]>([]);
    const [placementInstructions, setPlacementInstructions] = useState('');
    
    // User uploaded images state
    // User uploaded images state (furniture, floors, etc.)
    const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; uri: string; name: string }>>([]);
    
    // Flooring reference images
    const flooringReferenceItems = [
        { id: 'denver', name: 'Denver', image: require('@/assets/img/denver.jpeg') },
        { id: 'tholos', name: 'Tholos', image: require('@/assets/img/Tholos.jpeg') },
        { id: 'nivala', name: 'Nivala', image: require('@/assets/img/nivala.jpeg') },
        { id: 'merida', name: 'Merida', image: require('@/assets/img/merida.jpeg') },
    ];

    const selectedFlooringSample = flooringReferenceItems.find(
        (item) => item.id === selectedFlooringSampleId
    );

    // Available furniture reference images
    const furnitureReferenceItems = [
        { id: 'mobile', name: 'Media Console', image: require('@/assets/img/mobile.jpg') },
        { id: 'silla', name: 'Accent Chair', image: require('@/assets/img/silla.jpg') },
        { id: 'mueble1', name: 'Sideboard', image: require('@/assets/img/Mueble1 Background Removed.png') },
        { id: 'mueble2', name: 'Cabinet', image: require('@/assets/img/Mueble2 Background Removed.png') },
        { id: 'mueble4', name: 'Bookshelf', image: require('@/assets/img/Mueble4 Background Removed.png') },
        { id: 'mueble5', name: 'Console Table', image: require('@/assets/img/Mueble5 Background Removed.png') },
    ];
    
    // Slider configuration
    const SLIDER_WIDTH = SCREEN_WIDTH - 80; // Container width minus padding
    const SLIDER_BUTTON_SIZE = 64;
    const SLIDER_MAX = SLIDER_WIDTH - SLIDER_BUTTON_SIZE - 8; // Max slide distance

    // Pan responder for the swipe slider
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const newValue = Math.max(0, Math.min(gestureState.dx, SLIDER_MAX));
                sliderPosition.setValue(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx >= SLIDER_MAX * 0.9) {
                    // Slider completed - snap to end and trigger
                    Animated.spring(sliderPosition, {
                        toValue: SLIDER_MAX,
                        useNativeDriver: false,
                    }).start(() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setSliderCompleted(true);
                        // Trigger generation via state
                        setTimeout(() => {
                            setShowRecap(false);
                            setShouldGenerate(true);
                        }, 300);
                    });
                } else {
                    // Reset slider
                    Animated.spring(sliderPosition, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Design options
    const WALL_OPTIONS = [
        'Plain White',
        'Soft Gray',
        'Warm Beige',
        'Light Blue',
        'Sage Green',
        'Floral Wallpaper',
        'Geometric Wallpaper',
        'Marble Effect',
        'Exposed Brick',
        'Wood Paneling',
        'Textured Plaster',
        'Accent Wall (Dark)',
    ];

    const FLOORING_OPTIONS = [
        'Hardwood Oak',
        'Hardwood Walnut',
        'Light Maple Wood',
        'Dark Mahogany',
        'White Marble',
        'Gray Marble',
        'Ceramic Tiles',
        'Porcelain Tiles',
        'Herringbone Parquet',
        'Concrete Polished',
        'Natural Stone',
        'Luxury Vinyl Plank',
    ];

    const FURNITURE_STYLE_OPTIONS = [
        'Modern Minimalist',
        'Mid-Century Modern',
        'Contemporary',
        'Traditional Classic',
        'Rustic Farmhouse',
        'Industrial',
        'Bohemian',
        'Art Deco',
        'Japandi',
        'Coastal',
    ];

    const STYLE_OPTIONS = [
        'Bright & Airy',
        'Warm & Cozy',
        'Elegant & Luxurious',
        'Clean & Minimal',
        'Bold & Dramatic',
        'Natural & Organic',
        'Sleek & Modern',
        'Vintage & Eclectic',
        'Serene & Calm',
        'Chic & Sophisticated',
    ];

    // Build production-grade prompt with hard constraints
    const buildPromptFromSelections = () => {
        const promptSections: string[] = [];
        
        // ============================================
        // SECTION 1: CRITICAL CONSTRAINTS (Non-negotiable)
        // ============================================
        const constraints = `CRITICAL CONSTRAINTS:
- Preserve the original room geometry exactly.
- Do NOT change wall positions, ceiling height, doors, windows, or openings.
- Do NOT modify camera angle, lens perspective, or framing.
- Do NOT add or remove architectural elements.
- Keep original natural lighting direction and intensity.
- Only modify surfaces, finishes, and furniture explicitly requested.`;
        
        promptSections.push(constraints);
        
        // ============================================
        // SECTION 2: STRUCTURE (Immutable)
        // ============================================
        let structureSection = `STRUCTURE (DO NOT CHANGE):
- Original room layout and proportions
- All doors, windows, trim, and architectural details
- Original lighting sources and direction
- Camera perspective and viewpoint`;
        
        if (roomType) {
            structureSection += `\n- Room function: ${roomType}`;
        }
        
        promptSections.push(structureSection);
        
        // ============================================
        // SECTION 3: STYLE TRANSFORMATION
        // ============================================
        const styleChanges: string[] = [];
        
        if (selectedStyle) {
            styleChanges.push(`Overall aesthetic: ${selectedStyle} interior design`);
        }
        
        if (selectedWall) {
            styleChanges.push(`Walls: Replace existing wall finish with ${selectedWall.toLowerCase()}. Remove the previous wall material entirely. Keep wall texture realistic and consistent.`);
        }
        
        if (selectedFlooring) {
            styleChanges.push(`Flooring: Replace the existing floor surface with ${selectedFlooring.toLowerCase()}. Remove the previous floor material entirely. Ensure seamless integration with room edges.`);
        }
        
        if (selectedFlooringSampleId) {
            styleChanges.push(`Floor reference: Match the floor finish exactly to the selected flooring reference image.`);
        }
        
        if (selectedFurnitureStyle) {
            styleChanges.push(`Furniture style: ${selectedFurnitureStyle.toLowerCase()}`);
        }
        
        if (styleChanges.length > 0) {
            promptSections.push(`STYLE TRANSFORMATION:\n${styleChanges.join('\n')}`);
        }
        
        // ============================================
        // SECTION 4: FURNITURE PLACEMENT (If applicable)
        // ============================================
        const furnitureNames = selectedFurnitureItems.map(id => {
            const item = furnitureReferenceItems.find(i => i.id === id);
            return item ? item.name : '';
        }).filter(Boolean);
        
        const uploadedNames = uploadedImages.map(img => img.name);
        const allProductNames = [...furnitureNames, ...uploadedNames];
        
        if (allProductNames.length > 0) {
            let furnitureSection = `FURNITURE & PRODUCT PLACEMENT:
Products to add: ${allProductNames.join(', ')}

Furniture placement rules:
- Each product must sit fully on the floor plane with correct ground contact.
- Maintain realistic clearance from doors and primary walkways.
- Do NOT block doors, windows, radiators, or electrical outlets.
- Respect realistic scale relative to door height (standard door ~2.1m).
- Match product lighting and shadows to room's ambient light.
- Preserve product proportions from reference images.`;
            
            if (placementInstructions.trim()) {
                furnitureSection += `\n\nUser placement instructions: ${placementInstructions.trim()}`;
            }
            
            promptSections.push(furnitureSection);
        }
        
        // ============================================
        // SECTION 5: ROOM FUNCTION CONTEXT
        // ============================================
        if (roomType) {
            promptSections.push(`ROOM FUNCTION CONTEXT:
This space is a ${roomType}.
All design decisions must respect typical functional use of this room type.
Furniture placement should optimize usability for this room's purpose.`);
        }
        
        // ============================================
        // SECTION 6: STRICT MODE (If enabled)
        // ============================================
        if (strictMode) {
            promptSections.push(`STRICT REALISM MODE ENABLED:
No creative interpretation beyond explicit instructions.
Preserve maximum fidelity to original photograph.
Zero artistic embellishment or stylization.`);
        }
        
        // ============================================
        // SECTION 7: RENDERING QUALITY TARGET
        // ============================================
        const qualityTarget = `RENDERING QUALITY TARGET:
Photorealistic interior visualization.
Real-world materials with correct textures.
Accurate shadows and global illumination matching original photo.
No stylization, no illustration, no artistic exaggeration.
Output must appear as a real photograph, not a 3D render.`;
        
        promptSections.push(qualityTarget);
        
        return promptSections.join('\n\n');
    };

    // Update prompt when selections change
    useEffect(() => {
        const autoPrompt = buildPromptFromSelections();
        if (autoPrompt) {
            setPrompt(autoPrompt);
        }
    }, [selectedWall, selectedFlooring, selectedFlooringSampleId, selectedFurnitureStyle, selectedStyle]);

    // Trigger generation when slider completes
    useEffect(() => {
        if (shouldGenerate) {
            setShouldGenerate(false);
            actuallyGenerate();
        }
    }, [shouldGenerate]);

    // Furniture images for the carousel
    const furnitureItems = [
        { id: 1, image: require('@/assets/img/Mueble1 Background Removed.png'), name: 'Sideboard 1' },
        { id: 2, image: require('@/assets/img/Mueble2 Background Removed.png'), name: 'Sideboard 2' },
        { id: 4, image: require('@/assets/img/Mueble4 Background Removed.png'), name: 'TV Stand' },
        { id: 5, image: require('@/assets/img/Mueble5 Background Removed.png'), name: 'Cabinet' },
        { id: 7, image: require('@/assets/img/Mueble7 Background Removed.png'), name: 'Wall Shelf' },
        { id: 9, image: require('@/assets/img/Mueble9 Background Removed.png'), name: 'Drawer Unit' },
        { id: 10, image: require('@/assets/img/Mueble10 Background Removed.png'), name: 'Low Cabinet' },
        { id: 12, image: require('@/assets/img/Mueble12 Background Removed.png'), name: 'Credenza' },
        { id: 13, image: require('@/assets/img/Mueble13 Background Removed.png'), name: 'Tall Cabinet' },
        { id: 15, image: require('@/assets/img/Mueble15 Background Removed.png'), name: 'Entertainment Unit' },
        { id: 17, image: require('@/assets/img/Mueble17 Background Removed.png'), name: 'Slatted Sideboard' },
        { id: 18, image: require('@/assets/img/Mueble18 Background Removed.png'), name: 'Oak Sideboard' },
        { id: 19, image: require('@/assets/img/Mueble19 Background Removed.png'), name: 'Slatted Cabinet' },
        { id: 20, image: require('@/assets/img/Mueble20 Background Removed.png'), name: 'Modular Shelf' },
        { id: 21, image: require('@/assets/img/Mueble21 Background Removed.png'), name: 'TV Console' },
        { id: 22, image: require('@/assets/img/Mueble22 Background Removed.png'), name: 'Geometric Shelf' },
        { id: 23, image: require('@/assets/img/Mueble23 Background Removed.png'), name: 'Fluted Cabinet' },
        { id: 24, image: require('@/assets/img/Mueble24 Background Removed.png'), name: 'Wood Sideboard' },
        { id: 25, image: require('@/assets/img/Mueble25 Background Removed.png'), name: 'Dark Shelf' },
        { id: 26, image: require('@/assets/img/Mueble26 Background Removed.png'), name: 'Walnut Console' },
        { id: 27, image: require('@/assets/img/Mueble27 Background Removed.png'), name: 'Console Table' },
        { id: 28, image: require('@/assets/img/Mueble28 Background Removed.png'), name: 'Display Cabinet' },
        { id: 29, image: require('@/assets/img/Mueble29 Background Removed.png'), name: 'Low TV Unit' },
        { id: 30, image: require('@/assets/img/Mueble30 Background Removed.png'), name: 'Floating Console' },
    ];

    const toggleFurnitureSelection = (id: number) => {
        setSelectedFurniture(prev => 
            prev.includes(id) 
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    // Progress bar animation for processing (60 seconds)
    useEffect(() => {
        if (loading) {
            setProgress(0);
            progressAnim.setValue(0);
            
            // Animate progress over 60 seconds with easing (faster at start, slower near end)
            const duration = 60000; // 60 seconds
            const startTime = Date.now();
            
            progressInterval.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const linearProgress = Math.min(elapsed / duration, 0.95); // Cap at 95%
                // Ease out - starts fast, slows down near end
                const easedProgress = 1 - Math.pow(1 - linearProgress, 2);
                setProgress(Math.round(easedProgress * 100));
                progressAnim.setValue(easedProgress);
            }, 100);
        } else {
            // Complete the progress when done
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
            }
            if (resultImage) {
                setProgress(100);
                progressAnim.setValue(1);
            }
        }
        
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [loading, resultImage]);

    // Convert image to JPEG format (OpenAI only accepts PNG, JPEG, WEBP)
    const convertImageToJpeg = async (uri: string): Promise<string> => {
        try {
            console.log('🔄 Converting image to JPEG:', uri);
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                uri,
                [], // No transformations, just convert format
                { 
                    compress: 0.9, 
                    format: ImageManipulator.SaveFormat.JPEG 
                }
            );
            console.log('✅ Converted to:', manipulatedImage.uri);
            return manipulatedImage.uri;
        } catch (error) {
            console.error('❌ Error converting image:', error);
            return uri; // Return original if conversion fails
        }
    };

    const takePhoto = async () => {
        // Request camera permissions (required for camera)
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            // Convert to JPEG for API compatibility
            const convertedUri = await convertImageToJpeg(result.assets[0].uri);
            setImage(convertedUri);
            setResultImage(null);
            setCurrentStep(2);
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
    
        if (!result.canceled) {
            // Convert to JPEG for API compatibility
            const convertedUri = await convertImageToJpeg(result.assets[0].uri);
            setImage(convertedUri);
            setResultImage(null);
            setCurrentStep(2);
        }
    };

    // Upload additional images (furniture, floors, etc.)
    const uploadAdditionalImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
            allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
            const originalUri = result.assets[0].uri;
            const originalName = result.assets[0].fileName || `product_${Date.now()}`;
            
            // Convert image to JPEG to ensure API compatibility (handles AVIF, HEIC, etc.)
            const convertedUri = await convertImageToJpeg(originalUri);
            
            // Ensure filename ends with .jpg
            const baseName = originalName.replace(/\.(avif|heic|heif|webp|png|gif)$/i, '');
            const jpegName = baseName.endsWith('.jpg') || baseName.endsWith('.jpeg') ? baseName : `${baseName}.jpg`;
            
            const newImage = {
                id: `upload_${Date.now()}_${Math.random()}`,
                uri: convertedUri,
                name: jpegName,
            };
            setUploadedImages([...uploadedImages, newImage]);
        }
    };

    // Remove uploaded image
    const removeUploadedImage = (imageId: string) => {
        setUploadedImages(uploadedImages.filter(img => img.id !== imageId));
    };

    // Tutorial carousel slides
    const tutorialSlides = [
        {
            id: '1',
            title: 'Take a Photo',
            description: 'Use your camera to capture the room you want to redesign. Make sure the lighting is good for best results.',
            icon: 'Camera' as const,
            iconColor: '#000',
            gradientColors: ['#fff', '#fff'] as [string, string],
            textColor: '#000',
            action: takePhoto,
        },
        {
            id: '2',
            title: 'Renovation Cost Simulation',
            description: 'Get a detailed cost breakdown for your renovation project. Perfect for budget planning.',
            icon: 'Calculator' as const,
            iconColor: '#000',
            gradientColors: ['#fff', '#fff'] as [string, string],
            textColor: '#000',
            action: () => router.push('/screens/project-estimate'),
        },
        {
            id: '3',
            title: 'Choose from Gallery',
            description: 'Select an existing photo from your gallery. Pick a clear image that shows the full room.',
            icon: 'Image' as const,
            iconColor: '#000',
            gradientColors: ['#fff', '#fff'] as [string, string],
            textColor: '#000',
            action: pickImage,
        },
        ...(Platform.OS === 'ios' ? [
            {
                id: '4',
                title: 'Scan with AR',
                description: 'Use LiDAR to create an accurate 3D model of your room. Perfect for precise renovations.',
                icon: 'Scan' as const,
                iconColor: '#000',
                gradientColors: ['#fff', '#fff'] as [string, string],
                textColor: '#000',
                action: () => router.push('/screens/ar-room-scan'),
            },
        ] : []),
    ];

    const getErrorMessage = (error: any, statusCode?: number): string => {
        if (statusCode === 401) {
            return 'Invalid API key. Please check your OpenAI API key is correct.';
        }
        if (statusCode === 429) {
            return 'Rate limit exceeded. Please wait a moment and try again.';
        }
        if (statusCode === 400) {
            return `Bad request: ${error?.message || 'Check your image format and prompt.'}`;
        }
        if (statusCode === 413) {
            return 'Image too large. Please use a smaller image (max 4MB).';
        }
        if (statusCode === 500 || statusCode === 503) {
            return 'OpenAI service is temporarily unavailable. Please try again later.';
        }
        return error?.message || 'An unexpected error occurred.';
    };

    // Show recap screen before generating AND start API call in background
    const handleGenerate = () => {
        setErrorDetails(null);

        if (!getSupabaseAnonKey()) {
            Alert.alert('Configuration Error', 'Service is not configured. Please contact support.');
            return;
        }
        if (!image) {
            Alert.alert('Image Missing', 'Please select an image to edit.');
            return;
        }
        if (!prompt) {
            Alert.alert('Prompt Missing', 'Please describe what you want to edit or generate.');
            return;
        }

        // Reset slider and show recap
        sliderPosition.setValue(0);
        setSliderCompleted(false);
        setShowRecap(true);
        
        // 🚀 Start API call immediately in background (before user confirms with slider)
        // This reduces perceived wait time by several seconds
        console.log('🚀 Pre-starting API call while showing recap...');
        setApiStarted(true);
        apiPromiseRef.current = startApiCall();
    };

    // Start API call in background (returns promise with result)
    const startApiCall = async (): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
        console.log('🚀 Starting image generation in background...');
        console.log('📦 Selected furniture items:', selectedFurnitureItems);

        try {
            const formData = new FormData();
            
            // Build array of images: room image first, then furniture reference images
            const imagesArray: any[] = [];
            
            // Main room image (first for highest fidelity preservation)
            imagesArray.push({
                uri: image,
                name: 'room.png',
                type: 'image/png',
            });

            if (selectedFlooringSample) {
                const asset = Image.resolveAssetSource(selectedFlooringSample.image);
                imagesArray.push({
                    uri: asset.uri,
                    name: `${selectedFlooringSample.id}.jpeg`,
                    type: 'image/jpeg',
                });
            }
            
            // Add furniture reference images if selected
            if (selectedFurnitureItems.length > 0) {
                selectedFurnitureItems.forEach((itemId) => {
                    const furnitureItem = furnitureReferenceItems.find(item => item.id === itemId);
                    if (furnitureItem) {
                        const asset = Image.resolveAssetSource(furnitureItem.image);
                        imagesArray.push({
                            uri: asset.uri,
                            name: `${itemId}.png`,
                            type: 'image/png',
                        });
                    }
                });
            }

            // Add user uploaded images
            if (uploadedImages.length > 0) {
                uploadedImages.forEach((uploadedImg) => {
                    imagesArray.push({
                        uri: uploadedImg.uri,
                        name: uploadedImg.name,
                        type: 'image/jpeg',
                    });
                });
            }
            
            // Append images using array notation
            imagesArray.forEach((img) => {
                formData.append('image[]', img as any);
            });

            const flooringSampleCount = selectedFlooringSample ? 1 : 0;
            console.log(
                `📸 Sending ${imagesArray.length} images to API (room + ${flooringSampleCount} flooring sample + ${selectedFurnitureItems.length} furniture items + ${uploadedImages.length} uploaded products)`
            );
            
            const enhancedPrompt = buildPromptFromSelections();
            formData.append('prompt', enhancedPrompt);
            formData.append('input_fidelity', 'high');
            formData.append('n', '1');
            formData.append('size', '1024x1024');
            formData.append('model', 'gpt-image-1');

            const response = await fetch(getEdgeFunctionUrl(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getSupabaseAnonKey()}`,
                },
                body: formData,
            });

            const responseText = await response.text();
            let data;
            
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                return { success: false, error: 'Failed to parse API response.' };
            }

            if (!response.ok || data.error) {
                const errorMessage = getErrorMessage(data.error, response.status);
                return { success: false, error: errorMessage };
            } else if (data.data && data.data.length > 0) {
                const imageData = data.data[0];
                const imageUrl = imageData.url || (imageData.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null);
                if (imageUrl) {
                    return { success: true, imageUrl };
                }
            }
            
            return { success: false, error: 'No image returned from API.' };
        } catch (error: any) {
            console.error('❌ API Error:', error);
            return { success: false, error: error.message || 'Network error' };
        }
    };

    // Wait for API result and show it (called when slider completes)
    const actuallyGenerate = async () => {
        setLoading(true);
        setResultImage(null);
        setCurrentStep(4);

        try {
            // Wait for the pre-started API call to complete
            if (apiPromiseRef.current) {
                console.log('⏳ Waiting for pre-started API call...');
                const result = await apiPromiseRef.current;
                
                if (result.success && result.imageUrl) {
                    setResultImage(result.imageUrl);
                    setErrorDetails(null);
                } else {
                    setErrorDetails(result.error || 'Unknown error');
                    Alert.alert('Error', result.error || 'Failed to generate image.');
                    setCurrentStep(3);
                }
            } else {
                // Fallback: API wasn't pre-started, start it now
                console.log('⚠️ API not pre-started, starting now...');
                const result = await startApiCall();
                
                if (result.success && result.imageUrl) {
                    setResultImage(result.imageUrl);
                    setErrorDetails(null);
                } else {
                    setErrorDetails(result.error || 'Unknown error');
                    Alert.alert('Error', result.error || 'Failed to generate image.');
                    setCurrentStep(3);
                }
            }
        } catch (error: any) {
            const errorMsg = `Network Error: ${error.message || 'Unknown error'}`;
            setErrorDetails(errorMsg);
            Alert.alert('Network Error', 'Failed to connect to OpenAI API.');
            setCurrentStep(3);
        } finally {
            setLoading(false);
            setApiStarted(false);
            apiPromiseRef.current = null;
        }
    };

    const resetAll = () => {
        setImage(null);
        setPrompt('');
        setResultImage(null);
        setCurrentStep(1);
        setErrorDetails(null);
        setSelectedFurniture([]);
        setSelectedWall('');
        setSelectedFlooring('');
        setSelectedFlooringSampleId(null);
        setSelectedFurnitureStyle('');
        setSelectedStyle('');
        setShowRecap(false);
        setSliderCompleted(false);
        setShouldGenerate(false);
        sliderPosition.setValue(0);
        // Reset pre-fetch state
        setApiStarted(false);
        apiPromiseRef.current = null;
        setSelectedFurnitureItems([]);
        setPlacementInstructions('');
        setUploadedImages([]);
    };

    const handleDone = () => {
        Alert.alert(
            'Finished Session',
            'You can choose to save your renovation data or discard it.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Exit',
                    style: 'destructive',
                    onPress: () => {
                        resetAll();
                    },
                },
                {
                    text: 'Save & Exit',
                    onPress: async () => {
                        if (!image || !resultImage) {
                            Alert.alert('Error', 'No images to save.');
                            return;
                        }
                        try {
                            await saveDesign(image, resultImage, prompt);
                            Alert.alert('Saved!', 'Your design has been saved to My Designs.', [
                                { text: 'OK', onPress: () => { resetAll(); router.push('/(tabs)/my-designs'); } },
                            ]);
                        } catch (error) {
                            console.error('Failed to save design:', error);
                            Alert.alert('Error', 'Failed to save design. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Progress bar
    const ProgressBar = () => (
        <View className="flex-row gap-2 mb-6">
            {[1, 2, 3, 4].map((step) => (
                <View
                    key={step}
                    className="flex-1 h-1 rounded-full"
                    style={{
                        backgroundColor: step <= currentStep 
                            ? colors.text 
                            : colors.border
                    }}
                />
            ))}
        </View>
    );


    return (
        <View 
            className="flex-1" 
            style={{ backgroundColor: colors.bg }}
        >
            {/* Header */}
            <View 
                className="flex-row items-center justify-between px-global py-4" 
                style={{ paddingTop: insets.top + 10, zIndex: 100 }}
            >
                {currentStep > 1 && !loading ? (
                    <Pressable 
                        onPress={goBack}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={{ padding: 8 }}
                    >
                        <Icon name="ChevronLeft" size={24} color={colors.text} />
                    </Pressable>
                ) : (
                    <View className="w-10" />
                )}
                <ThemedText 
                    className="text-lg font-semibold"
                    style={{ color: colors.text }}
                >
                    Step {currentStep} / 4
                </ThemedText>
                <Pressable 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        resetAll();
                    }}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={{ padding: 8 }}
                >
                    <Icon name="X" size={24} color={colors.text} />
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView 
                    contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} 
                    className="flex-1 px-global"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <ProgressBar />

                    {/* Step 1: Add Photo - Carousel Design */}
                    {currentStep === 1 && (
                        <View className="flex-1 -mx-global" style={{ marginTop: 90 }}>
                            {/* Carousel */}
                            <FlatList
                                ref={carouselRef}
                                data={tutorialSlides}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={SCREEN_WIDTH}
                                decelerationRate="fast"
                                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                    setCarouselIndex(index);
                                }}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item, index }) => (
                                    <View 
                                        style={{ width: SCREEN_WIDTH }}
                                        className="items-center justify-center px-6 py-6"
                                    >
                                        {/* Liquid Glass Card - Uses native GlassView on iOS 26+ */}
                                        <LiquidGlassCard
                                            style={{ width: CARD_WIDTH }}
                                            colors={colors}
                                            liquidGlassStyles={liquidGlassStyles}
                                            glassGradients={glassGradients}
                                        >
                                            {/* Content */}
                                            <View style={liquidGlassStyles.cardContent}>
                                                {/* Icon in glass circle */}
                                                <LiquidGlassIcon
                                                    icon={item.icon}
                                                    size={56}
                                                    colors={colors}
                                                    liquidGlassStyles={liquidGlassStyles}
                                                    glassGradients={glassGradients}
                                                />

                                                {/* Title */}
                                                <ThemedText style={liquidGlassStyles.title}>
                                                    {item.title}
                            </ThemedText>
                                                
                                                {/* Description */}
                                                <ThemedText style={liquidGlassStyles.description}>
                                                    {item.description}
                            </ThemedText>

                                                {/* Glass Action Button */}
                                                <LiquidGlassButton
                                                    onPress={item.action}
                                                    title="Select"
                                                    colors={colors}
                                                    liquidGlassStyles={liquidGlassStyles}
                                                    glassGradients={glassGradients}
                                                />

                                                {/* Skip/Next hint */}
                                                {index < tutorialSlides.length - 1 && (
                            <Pressable 
                                                        onPress={() => {
                                                            carouselRef.current?.scrollToIndex({ index: index + 1, animated: true });
                                                        }}
                                                        className="py-3 items-center"
                                                    >
                                                        <ThemedText style={liquidGlassStyles.skipText}>
                                                            Swipe for more →
                                </ThemedText>
                            </Pressable>
                                                )}
                                        </View>
                                        </LiquidGlassCard>
                                        </View>
                                )}
                            />

                            {/* Pagination Dots */}
                            <View className="flex-row justify-center gap-2 pb-8">
                                {tutorialSlides.map((_, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            width: carouselIndex === index ? 24 : 8,
                                            height: 4,
                                            borderRadius: 4,
                                            backgroundColor: carouselIndex === index
                                                ? glassGradients.paginationActive
                                                : glassGradients.paginationInactive,
                                        }}
                                    />
                                ))}
                                    </View>
                                </View>
                    )}

                    {/* Step 2: Review Photo */}
                    {currentStep === 2 && image && (
                        <AnimatedView animation="fadeInUp">
                            <ThemedText className="text-2xl font-bold mb-2">Your Photo</ThemedText>
                            <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
                                This is the room you want to redesign
                            </ThemedText>

                            <View className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-border mb-6">
                                <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                                <Pressable
                                    onPress={() => {
                                        setImage(null);
                                        setCurrentStep(1);
                                    }}
                                    className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                                >
                                    <Icon name="X" size={20} color="white" />
                                </Pressable>
                            </View>

                            <LiquidGlassButton
                                onPress={() => setCurrentStep(3)}
                                title="Continue"
                                colors={colors}
                                liquidGlassStyles={liquidGlassStyles}
                                glassGradients={glassGradients}
                            />
                        </AnimatedView>
                    )}

                    {/* Step 3: Describe Changes */}
                    {currentStep === 3 && (
                        <AnimatedView animation="fadeInUp">
                            <ThemedText className="text-2xl font-bold mb-1">What should change?</ThemedText>
                            <ThemedText className="text-sm mb-4" style={{ color: colors.text }}>
                                Everything else stays exactly the same.
                            </ThemedText>
                        
                            {/* What will NOT change - Confirmation Box */}
                            
                            

                            {image && (
                                <View className="w-full h-96 rounded-2xl overflow-hidden border border-border mb-4">
                                    <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                                </View>
                            )}
  <View className="mb-4 p-4 rounded-xl" style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
                                <ThemedText className="font-bold mb-2" style={{ color: colors.isDark ? colors.text : colors.text }}>
                                    ✓ We will keep these exactly the same
                                </ThemedText>
                                <View className="gap-1">
                                    <ThemedText className="text-sm" style={{ color: colors.text }}>       • Room shape & size</ThemedText>
                                    <ThemedText className="text-sm" style={{ color: colors.text }}>       • Doors & windows</ThemedText>
                                    <ThemedText className="text-sm" style={{ color: colors.text }}>       • Camera angle</ThemedText>
                                    <ThemedText className="text-sm" style={{ color: colors.text }}>       • Natural light direction</ThemedText>
                                </View>
                            </View>  
                            <TextInput
                                value={prompt}
                                onChangeText={setPrompt}
                                placeholder="Modern minimalist style with warm wooden tones, clean lines, and natural lighting..."
                                placeholderTextColor={colors.placeholder}
                                className="bg-secondary p-4 rounded-xl text-text border border-border text-base min-h-[120px] mb-6"
                                multiline
                                textAlignVertical="top"
                            />

                            {/* Design Options - Apple Style List */}
                            <AppleListGroup header="Design Options">
                                <AppleListRow
                                    title="Style"
                                    value={selectedStyle}
                                    placeholder="Select style..."
                                    icon="Sparkles"
                                    onPress={() => setShowStylePicker(true)}
                                />
                                <AppleListRow
                                    title="Walls"
                                    value={selectedWall}
                                    placeholder="Select wall finish..."
                                    icon="Square"
                                    onPress={() => setShowWallPicker(true)}
                                />
                                <AppleListRow
                                    title="Flooring"
                                    value={selectedFlooring}
                                    placeholder="Select flooring..."
                                    icon="Grid3x3"
                                    onPress={() => setShowFlooringPicker(true)}
                                />
                                <AppleListRow
                                    title="Furniture"
                                    value={selectedFurnitureStyle}
                                    placeholder="Select furniture style..."
                                    icon="Armchair"
                                    onPress={() => setShowFurnitureStylePicker(true)}
                                />
                            </AppleListGroup>

                            <AppleListGroup header="Room Settings">
                                <AppleListRow
                                    title="Room Type"
                                    value={roomType}
                                    placeholder="Select room type..."
                                    icon="Home"
                                    onPress={() => setShowRoomTypePicker(true)}
                                />
                            </AppleListGroup>
                            
                            {/* Advanced Settings with Toggle */}
                            <AppleListGroup header="Advanced" footer="Strict mode prevents creative interpretation beyond your explicit instructions.">
                                <AppleListRow
                                    title="Strict Realism"
                                    subtitle="No creative liberties"
                                    icon="Shield"
                                    isToggle
                                    toggleValue={strictMode}
                                    onToggle={setStrictMode}
                                    showChevron={false}
                                />
                            </AppleListGroup>

                            {/* Furniture Reference Selection */}
                            <View className="mb-6">
                                <ThemedText className="font-semibold mb-3">Add Furniture to Your Room</ThemedText>
                                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-4">
                                    Select furniture pieces to place in your room. The AI will integrate them naturally into the design.
                                </ThemedText>
                                
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingRight: 24, gap: 12 }}
                                >
                                    {furnitureReferenceItems.map((item) => {
                                        const isSelected = selectedFurnitureItems.includes(item.id);
                                        return (
                                    <Pressable 
                                                key={item.id}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setSelectedFurnitureItems(selectedFurnitureItems.filter(id => id !== item.id));
                                                    } else {
                                                        setSelectedFurnitureItems([...selectedFurnitureItems, item.id]);
                                                    }
                                                }}
                                                className="items-center"
                                                style={{ width: 120 }}
                                            >
                                                <View 
                                                    className={`rounded-2xl overflow-hidden border-2 mb-2 ${
                                                        isSelected ? 'border-highlight' : 'border-border'
                                                    }`}
                                                    style={{
                                                        width: 120,
                                                        height: 120,
                                                        backgroundColor: colors.secondary,
                                                    }}
                                                >
                                                    <Image 
                                                        source={item.image} 
                                                        style={{ width: '100%', height: '100%' }}
                                                        resizeMode="contain"
                                                    />
                                                    {isSelected && (
                                                        <View className="absolute top-2 right-2 w-6 h-6 bg-highlight rounded-full items-center justify-center">
                                                            <Icon name="Check" size={14} color="#FFFFFF" />
                                                        </View>
                                                    )}
                                                </View>
                                                <ThemedText className="text-xs text-center" numberOfLines={2}>
                                                    {item.name}
                                                </ThemedText>
                                    </Pressable>
                                        );
                                    })}
                                </ScrollView>

                                {/* Placement Instructions (shown only if furniture is selected) */}
                                {selectedFurnitureItems.length > 0 && (
                                    <View className="mt-4">
                                        <ThemedText className="text-sm font-medium mb-2">
                                            Placement Instructions (Optional)
                                        </ThemedText>
                                        <TextInput
                                            value={placementInstructions}
                                            onChangeText={setPlacementInstructions}
                                            placeholder="e.g., Place furniture against the wall, Arrange in the center of the room..."
                                            placeholderTextColor={colors.placeholder}
                                            className="bg-secondary p-3 rounded-xl text-text border border-border text-sm min-h-[80px]"
                                            multiline
                                            textAlignVertical="top"
                                        />
                                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                                            Leave empty to let AI place furniture naturally
                                        </ThemedText>
                                    </View>
                                )}
                            </View>

                            {/* User Uploaded Products Section */}
                            <View className="mb-6">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View>
                                        <ThemedText className="font-semibold">Upload Your Products</ThemedText>
                                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                                            Upload furniture, flooring, or decor images to place in your room
                                        </ThemedText>
                                    </View>
                                    <Pressable
                                        onPress={uploadAdditionalImage}
                                        className="bg-highlight px-4 py-2 rounded-full flex-row items-center gap-2"
                                    >
                                        <Icon name="Plus" size={18} color="#FFFFFF" />
                                        <ThemedText className="text-white font-medium text-sm">Upload</ThemedText>
                                    </Pressable>
                                </View>

                                {uploadedImages.length > 0 && (
                                    <ScrollView 
                                        horizontal 
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingRight: 24, gap: 12 }}
                                    >
                                        {uploadedImages.map((uploadedImg) => (
                                            <View key={uploadedImg.id} className="items-center" style={{ width: 120 }}>
                                                <View className="relative">
                                                    <View 
                                                        className="rounded-2xl overflow-hidden border-2 border-highlight"
                                                        style={{
                                                            width: 120,
                                                            height: 120,
                                                            backgroundColor: colors.secondary,
                                                        }}
                                                    >
                                                        <Image 
                                                            source={{ uri: uploadedImg.uri }} 
                                                            style={{ width: '100%', height: '100%' }}
                                                            resizeMode="cover"
                                                        />
                                                    </View>
                                                    <Pressable
                                                        onPress={() => removeUploadedImage(uploadedImg.id)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                                                    >
                                                        <Icon name="X" size={12} color="#FFFFFF" />
                                                    </Pressable>
                                                </View>
                                                <ThemedText className="text-xs text-center mt-2" numberOfLines={2}>
                                                    {uploadedImg.name}
                                                </ThemedText>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}

                                {uploadedImages.length === 0 && (
                                    <View className="border-2 border-dashed border-border rounded-2xl p-8 items-center justify-center">
                                        <Icon name="Image" size={32} color={colors.placeholder} />
                                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2 text-center">
                                            No products uploaded yet. Tap "Upload" to add furniture or decor items.
                                        </ThemedText>
                                    </View>
                                )}
                            </View>

                            {errorDetails && (
                                <View className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4">
                                    <ThemedText className="text-sm text-red-500">{errorDetails}</ThemedText>
                                </View>
                            )}

                            <LiquidGlassButton
                                onPress={handleGenerate}
                                title="Generate Design"
                                colors={colors}
                                liquidGlassStyles={liquidGlassStyles}
                                glassGradients={glassGradients}
                            />
                        </AnimatedView>
                    )}

                    {/* Step 4: Processing / Result */}
                    {currentStep === 4 && (
                        <AnimatedView animation="fadeInUp">
                            {loading ? (
                                <View className="items-center py-16">
                                    <View className="w-36 h-36 rounded-3xl overflow-hidden mb-8 border border-border">
                                        {image && <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />}
                                    </View>
                                    
                                    {/* Progress Bar */}
                                    <View className="w-full mb-4">
                                        <View className="h-2 bg-border rounded-full overflow-hidden">
                                            <Animated.View 
                                                className="h-full rounded-full"
                                                style={{ 
                                                    backgroundColor: colors.highlight,
                                                    width: progressAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ['0%', '100%'],
                                                    }),
                                                }}
                                            />
                                        </View>
                                        <View className="flex-row justify-between mt-2">
                                            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                                                {progress}%
                                            </ThemedText>
                                            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                                                ~{Math.max(0, Math.ceil((100 - progress) * 0.6))}s remaining
                                            </ThemedText>
                                        </View>
                                    </View>
                                    
                                    <ActivityIndicator size="small" color={colors.highlight} className="mb-3" />
                                    <ThemedText className="text-2xl font-semibold mb-2">Processing...</ThemedText>
                                    <ThemedText className="text-light-subtext dark:text-dark-subtext text-center px-4">
                                        Transforming your room... Please don't close this! It will just take a moment.
                                    </ThemedText>
                                </View>
                            ) : resultImage ? (
                                <>
                                    <ThemedText className="text-2xl font-bold mb-4">Your Redesigned Room</ThemedText>
                                    
                                    {/* Before */}
                                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">Before</ThemedText>
                                    <View className="h-40 rounded-2xl overflow-hidden border border-border mb-4">
                                        <Image source={{ uri: image! }} className="w-full h-full" resizeMode="cover" />
                                    </View>

                                    {/* After */}
                                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">After</ThemedText>
                                    <View className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-secondary mb-6">
                                        <Image source={{ uri: resultImage }} className="w-full h-full" resizeMode="cover" />
                                        {/* Fullscreen button */}
                                        <Pressable
                                            onPress={() => setShowFullscreen(true)}
                                            className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-lg"
                                        >
                                            <Icon name="Maximize2" size={18} color="white" />
                                        </Pressable>
                                    </View>

                                    <View className="flex-row gap-3">
                                        <Button
                                            title="Try Again"
                                            variant="ghost"
                                            className="flex-1"
                                            onPress={() => setCurrentStep(3)}
                                        />
                                        <Button
                                            title="Done"
                                            variant="primary"
                                            className="flex-1"
                                            onPress={handleDone}
                                        />
                                    </View>
                                </>
                            ) : (
                                <View className="items-center py-20">
                                    <Icon name="AlertCircle" size={48} color={colors.placeholder} />
                                    <ThemedText className="text-xl font-semibold mt-4 mb-2">Something went wrong</ThemedText>
                                    <ThemedText className="text-light-subtext dark:text-dark-subtext text-center mb-6">
                                        {errorDetails || 'Please try again'}
                                    </ThemedText>
                                    <Button
                                        title="Try Again"
                                        variant="primary"
                                        onPress={() => setCurrentStep(3)}
                                    />
                                </View>
                            )}
                        </AnimatedView>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fullscreen Image Modal */}
            <Modal
                visible={showFullscreen}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFullscreen(false)}
            >
                <View className="flex-1 bg-black">
                    {/* Top bar with close button */}
                    <View 
                        className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4"
                        style={{ paddingTop: insets.top + 10 }}
                    >
                        <Pressable
                            onPress={() => setShowFullscreen(false)}
                            className="bg-white/20 p-3 rounded-full"
                        >
                            <Icon name="X" size={24} color="white" />
                        </Pressable>
                        
                        <ThemedText className="text-white text-sm opacity-60">
                            Pinch to zoom
                        </ThemedText>
                        
                        <View style={{ width: 48 }} />
                    </View>
                    
                    {/* Zoomable image */}
                    {resultImage && (
                        <ScrollView
                            contentContainerStyle={{ 
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            maximumZoomScale={5}
                            minimumZoomScale={1}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            centerContent
                            bouncesZoom
                        >
                            <Image
                                source={{ uri: resultImage }}
                                style={{
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_WIDTH,
                                }}
                                resizeMode="contain"
                            />
                        </ScrollView>
                    )}
                    
                    {/* Bottom action bar */}
                    <View 
                        className="absolute bottom-0 left-0 right-0 flex-row justify-center gap-6 px-6"
                        style={{ paddingBottom: insets.bottom + 20 }}
                    >
                        {/* Save to Photos */}
                        <Pressable
                            onPress={async () => {
                                if (!resultImage) return;
                                try {
                                    const filename = `reForma_${Date.now()}.png`;
                                    const cachePath = `${Paths.cache.uri}/${filename}`;
                                    
                                    // Download/save image to cache first
                                    if (resultImage.startsWith('http')) {
                                        const response = await fetch(resultImage);
                                        const blob = await response.blob();
                                        const reader = new FileReader();
                                        reader.readAsDataURL(blob);
                                        await new Promise<void>((resolve) => {
                                            reader.onloadend = async () => {
                                                const base64 = (reader.result as string).split(',')[1];
                                                const file = new File(cachePath);
                                                await file.write(base64, { encoding: 'base64' });
                                                resolve();
                                            };
                                        });
                                    } else if (resultImage.startsWith('data:')) {
                                        const base64Data = resultImage.split(',')[1];
                                        const file = new File(cachePath);
                                        await file.write(base64Data, { encoding: 'base64' });
                                    } else {
                                        // Already a local file, copy it
                                        const sourceFile = new File(resultImage);
                                        const destFile = new File(cachePath);
                                        await sourceFile.copy(destFile);
                                    }
                                    
                                    // Save to media library
                                    await MediaLibrary.saveToLibraryAsync(cachePath);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    Alert.alert('Saved!', 'Image saved to your photo library.');
                                } catch (error) {
                                    console.error('Failed to save image:', error);
                                    Alert.alert('Error', 'Failed to save image to photos.');
                                }
                            }}
                            className="items-center"
                        >
                            {supportsNativeLiquidGlass ? (
                                <GlassView
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    glassEffectStyle="regular"
                                    tintColor="rgba(255,255,255,0.2)"
                                >
                                    <Icon name="Download" size={24} color="white" />
                                </GlassView>
                            ) : (
                                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                                    <Icon name="Download" size={24} color="white" />
                                </View>
                            )}
                            <ThemedText className="text-white text-xs mt-2 opacity-80">Save</ThemedText>
                        </Pressable>
                        
                        {/* Share */}
                        <Pressable
                            onPress={async () => {
                                if (!resultImage) return;
                                try {
                                    // Check if sharing is available
                                    const isAvailable = await Sharing.isAvailableAsync();
                                    if (!isAvailable) {
                                        Alert.alert('Error', 'Sharing is not available on this device.');
                                        return;
                                    }
                                    
                                    const filename = `reForma_${Date.now()}.png`;
                                    const cachePath = `${Paths.cache.uri}/${filename}`;
                                    
                                    // Download/save image to cache first
                                    if (resultImage.startsWith('http')) {
                                        const response = await fetch(resultImage);
                                        const blob = await response.blob();
                                        const reader = new FileReader();
                                        reader.readAsDataURL(blob);
                                        await new Promise<void>((resolve) => {
                                            reader.onloadend = async () => {
                                                const base64 = (reader.result as string).split(',')[1];
                                                const file = new File(cachePath);
                                                await file.write(base64, { encoding: 'base64' });
                                                resolve();
                                            };
                                        });
                                    } else if (resultImage.startsWith('data:')) {
                                        const base64Data = resultImage.split(',')[1];
                                        const file = new File(cachePath);
                                        await file.write(base64Data, { encoding: 'base64' });
                                    } else {
                                        // Already a local file, copy it
                                        const sourceFile = new File(resultImage);
                                        const destFile = new File(cachePath);
                                        await sourceFile.copy(destFile);
                                    }
                                    
                                    await Sharing.shareAsync(cachePath, {
                                        mimeType: 'image/png',
                                        dialogTitle: 'Share your reForma design',
                                    });
                                } catch (error) {
                                    console.error('Failed to share image:', error);
                                    Alert.alert('Error', 'Failed to share image.');
                                }
                            }}
                            className="items-center"
                        >
                            {supportsNativeLiquidGlass ? (
                                <GlassView
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 28,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    glassEffectStyle="regular"
                                    tintColor="rgba(255,255,255,0.2)"
                                >
                                    <Icon name="Share" size={24} color="white" />
                                </GlassView>
                            ) : (
                                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                                    <Icon name="Share" size={24} color="white" />
                                </View>
                            )}
                            <ThemedText className="text-white text-xs mt-2 opacity-80">Share</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Recap Screen Modal */}
            <Modal
                visible={showRecap}
                animationType="fade"
                onRequestClose={() => {
                    setShowRecap(false);
                    // Cancel the pre-started API call (result will be ignored)
                    setApiStarted(false);
                    apiPromiseRef.current = null;
                }}
            >
                <View className="flex-1" style={{ backgroundColor: colors.bg, paddingTop: insets.top + 20 }}>
                    {/* Close button */}
                    <Pressable
                        onPress={() => {
                            setShowRecap(false);
                            // Cancel the pre-started API call (result will be ignored)
                            setApiStarted(false);
                            apiPromiseRef.current = null;
                        }}
                        className="absolute top-10 left-4 z-10 p-3"
                        style={{ top: insets.top + 10 }}
                    >
                        <Icon name="X" size={24} color={colors.text} />
                    </Pressable>

                    {/* Content */}
                    <View className="flex-1 px-6 pt-16">
                        <ThemedText className="text-4xl font-bold mb-8" style={{ color: colors.text }}>
                            Let's recap...
                        </ThemedText>

                        {/* Selected options list */}
                        <View className="gap-4">
                            {selectedStyle && (
                                <View className="flex-row items-center gap-3">
                                    <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#9B744D' }} />
                                    <ThemedText className="text-lg" style={{ color: colors.text }}>
                                        {selectedStyle} Style
                                    </ThemedText>
                                </View>
                            )}
                            {selectedWall && (
                                <View className="flex-row items-center gap-30">
                                    <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#B8A182' }} />
                                    <ThemedText className="text-lg" style={{ color: colors.text }}>
                                        {selectedWall} Wall Paint
                                    </ThemedText>
                                </View>
                            )}
                            {selectedFlooring && (
                                <View className="flex-row items-center gap-3">
                                    <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#75523C' }} />
                                    <ThemedText className="text-lg" style={{ color: colors.text }}>
                                        {selectedFlooring} floor
                                    </ThemedText>
                                </View>
                            )}
                            {selectedFurnitureStyle && (
                                <View className="flex-row items-center gap-3">
                                    <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#D2C6B6' }} />
                                    <ThemedText className="text-lg" style={{ color: colors.text }}>
                                        {selectedFurnitureStyle} Furniture
                                    </ThemedText>
                                </View>
                            )}
                            {roomType && (
                                <View className="flex-row items-center gap-3">
                                    <View className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.highlight }} />
                                    <ThemedText className="text-lg" style={{ color: colors.text }}>
                                        Room: {roomType}
                                    </ThemedText>
                                </View>
                            )}
                            {strictMode && (
                                <View className="flex-row items-center gap-3">
                                    <Icon name="Shield" size={16} color={colors.highlight} />
                                    <ThemedText className="text-lg font-semibold" style={{ color: colors.highlight }}>
                                        Strict Realism Mode
                                    </ThemedText>
                                </View>
                            )}
                            {(selectedFurnitureItems.length > 0 || uploadedImages.length > 0) && (
                                <View className="gap-2">
                                    <ThemedText className="text-sm font-medium" style={{ color: colors.text, opacity: 0.8 }}>
                                        Selected Products ({selectedFurnitureItems.length + uploadedImages.length}):
                                    </ThemedText>
                                    <View className="flex-row flex-wrap gap-2">
                                        {selectedFurnitureItems.map((itemId) => {
                                            const item = furnitureReferenceItems.find(i => i.id === itemId);
                                            return item ? (
                                                <View key={itemId} className="flex-row items-center gap-2 bg-secondary/50 px-3 py-2 rounded-full">
                                                    <View className="w-6 h-6 rounded overflow-hidden">
                                                        <Image source={item.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                    </View>
                                                    <ThemedText className="text-sm" style={{ color: colors.text }}>
                                                        {item.name}
                                                    </ThemedText>
                                                </View>
                                            ) : null;
                                        })}
                                        {uploadedImages.map((uploadedImg) => (
                                            <View key={uploadedImg.id} className="flex-row items-center gap-2 bg-secondary/50 px-3 py-2 rounded-full">
                                                <View className="w-6 h-6 rounded overflow-hidden">
                                                    <Image source={{ uri: uploadedImg.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                                </View>
                                                <ThemedText className="text-sm" style={{ color: colors.text }}>
                                                    {uploadedImg.name}
                                                </ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                    {placementInstructions.trim() && (
                                        <View className="mt-2 bg-secondary/30 p-3 rounded-xl">
                                            <ThemedText className="text-xs font-medium mb-1" style={{ color: colors.text, opacity: 0.7 }}>
                                                Placement Instructions:
                                            </ThemedText>
                                            <ThemedText className="text-sm" style={{ color: colors.text }}>
                                                {placementInstructions}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Swipe to confirm slider - Liquid Glass iOS 26 Style */}
                    <View 
                        className="px-6 pb-8"
                        style={{ paddingBottom: insets.bottom + 20 }}
                    >
                        <View 
                            style={{ 
                                height: 72,
                                width: SLIDER_WIDTH,
                                alignSelf: 'center',
                                borderRadius: 36,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Liquid Glass Track */}
                            {supportsNativeLiquidGlass ? (
                                <GlassView
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 36,
                                    }}
                                    glassEffectStyle="regular"
                                    tintColor={colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                                />
                            ) : (
                                <BlurView
                                    intensity={40}
                                    tint={colors.isDark ? 'dark' : 'light'}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 36,
                                    }}
                                >
                                    <LinearGradient
                                        colors={colors.isDark 
                                            ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] as [string, string]
                                            : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'] as [string, string]
                                        }
                                        style={{ flex: 1 }}
                                    />
                                </BlurView>
                            )}
                            
                            {/* Subtle border */}
                            <View 
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 36,
                                    borderWidth: 1,
                                    borderColor: colors.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                }}
                            />
                            
                            {/* Track text with chevrons */}
                            <View className="absolute inset-0 items-center justify-center flex-row gap-2">
                                <Icon name="ChevronsRight" size={20} color={colors.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                                <ThemedText 
                                    style={{ 
                                        color: colors.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                                        fontSize: 16,
                                        fontWeight: '500',
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Slide to generate
                                </ThemedText>
                                <Icon name="ChevronsRight" size={20} color={colors.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                            </View>
                            
                            {/* Slider thumb - Liquid Glass Button */}
                            <Animated.View
                                {...panResponder.panHandlers}
                                style={{
                                    position: 'absolute',
                                    left: 4,
                                    top: 4,
                                    width: SLIDER_BUTTON_SIZE,
                                    height: SLIDER_BUTTON_SIZE,
                                    borderRadius: SLIDER_BUTTON_SIZE / 2,
                                    transform: [{ translateX: sliderPosition }],
                                    overflow: 'hidden',
                                }}
                            >
                                {supportsNativeLiquidGlass ? (
                                    <GlassView
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: SLIDER_BUTTON_SIZE / 2,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        glassEffectStyle="regular"
                                        tintColor="#4DA3E1"
                                        isInteractive
                                    >
                                        <Icon name="ArrowRight" size={26} color="#FFFFFF" />
                                    </GlassView>
                                ) : (
                                    <BlurView
                                        intensity={80}
                                        tint="default"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: SLIDER_BUTTON_SIZE / 2,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <LinearGradient
                                            colors={['#4DA3E1', '#3B8BC9'] as [string, string]}
                                            style={{
                                                position: 'absolute',
                                                width: '100%',
                                                height: '100%',
                                            }}
                                        />
                                        <Icon name="ArrowRight" size={26} color="#FFFFFF" />
                                    </BlurView>
                                )}
                                {/* Highlight shine on thumb */}
                                <View 
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: SLIDER_BUTTON_SIZE / 2,
                                        borderTopLeftRadius: SLIDER_BUTTON_SIZE / 2,
                                        borderTopRightRadius: SLIDER_BUTTON_SIZE / 2,
                                        backgroundColor: 'rgba(255,255,255,0.25)',
                                    }}
                                />
                            </Animated.View>
                        </View>
                        
                        {/* Helper text */}
                        <ThemedText 
                            style={{ 
                                textAlign: 'center', 
                                marginTop: 12,
                                fontSize: 13,
                                color: colors.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                            }}
                        >
                            Swipe right to start AI generation
                        </ThemedText>
                    </View>
                </View>
            </Modal>

            {/* Style Picker - Animated Bottom Sheet */}
            <AnimatedBottomSheet
                visible={showStylePicker}
                onClose={() => setShowStylePicker(false)}
                title="Select Style"
                height={0.6}
            >
                {STYLE_OPTIONS.map((option) => (
                    <Pressable
                        key={option}
                        onPress={() => {
                            setSelectedStyle(option);
                            setShowStylePicker(false);
                        }}
                        className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
                            selectedStyle === option ? 'bg-highlight/20' : 'bg-secondary'
                        }`}
                        style={selectedStyle === option ? { borderWidth: 2, borderColor: colors.highlight } : { borderWidth: 1, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center gap-3">
                            <Icon name="Sparkles" size={20} color={selectedStyle === option ? colors.highlight : colors.placeholder} />
                            <ThemedText className={selectedStyle === option ? 'font-semibold' : ''}>
                                {option}
                            </ThemedText>
                        </View>
                        {selectedStyle === option && (
                            <Icon name="Check" size={20} color={colors.highlight} />
                        )}
                    </Pressable>
                ))}
            </AnimatedBottomSheet>

            {/* Wall Picker - Animated Bottom Sheet */}
            <AnimatedBottomSheet
                visible={showWallPicker}
                onClose={() => setShowWallPicker(false)}
                title="Select Wall Treatment"
                height={0.65}
            >
                {WALL_OPTIONS.map((option) => (
                    <Pressable
                        key={option}
                        onPress={() => {
                            setSelectedWall(option);
                            setShowWallPicker(false);
                        }}
                        className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
                            selectedWall === option ? 'bg-highlight/20' : 'bg-secondary'
                        }`}
                        style={selectedWall === option ? { borderWidth: 2, borderColor: colors.highlight } : { borderWidth: 1, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center gap-3">
                            <Icon name="Square" size={20} color={selectedWall === option ? colors.highlight : colors.placeholder} />
                            <ThemedText className={selectedWall === option ? 'font-semibold' : ''}>
                                {option}
                            </ThemedText>
                        </View>
                        {selectedWall === option && (
                            <Icon name="Check" size={20} color={colors.highlight} />
                        )}
                    </Pressable>
                ))}
            </AnimatedBottomSheet>

            {/* Flooring Picker - Animated Bottom Sheet with Image Thumbnails */}
            <AnimatedBottomSheet
                visible={showFlooringPicker}
                onClose={() => setShowFlooringPicker(false)}
                title="Select Flooring"
                height={0.75}
            >
                <Pressable
                    onPress={() => {
                        setSelectedFlooring('');
                        setSelectedFlooringSampleId(null);
                        setShowFlooringPicker(false);
                    }}
                    className="p-3 rounded-xl border border-dashed border-border mb-4 items-center"
                >
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                        No preference
                    </ThemedText>
                </Pressable>

                <ThemedText className="text-sm font-semibold mb-3">Flooring samples</ThemedText>
                <View className="flex-row flex-wrap justify-between">
                    {flooringReferenceItems.map((item) => {
                        const isSelected = selectedFlooringSampleId === item.id;
                        return (
                            <Pressable
                                key={item.id}
                                onPress={() => {
                                    setSelectedFlooring(item.name);
                                    setSelectedFlooringSampleId(item.id);
                                    setShowFlooringPicker(false);
                                }}
                                style={{ width: '48%', marginBottom: 12 }}
                            >
                                <View
                                    className={`rounded-2xl overflow-hidden ${
                                        isSelected ? 'border-2 border-highlight' : 'border border-border'
                                    }`}
                                    style={{ backgroundColor: colors.secondary }}
                                >
                                    <Image
                                        source={item.image}
                                        style={{ width: '100%', height: 100 }}
                                        resizeMode="cover"
                                    />
                                    {isSelected && (
                                        <View className="absolute top-2 right-2 w-6 h-6 bg-highlight rounded-full items-center justify-center">
                                            <Icon name="Check" size={14} color="#FFFFFF" />
                                        </View>
                                    )}
                                </View>
                                <ThemedText className="text-sm font-medium mt-2 text-center">
                                    {item.name}
                                </ThemedText>
                            </Pressable>
                        );
                    })}
                </View>
            </AnimatedBottomSheet>

            {/* Furniture Style Picker - Animated Bottom Sheet */}
            <AnimatedBottomSheet
                visible={showFurnitureStylePicker}
                onClose={() => setShowFurnitureStylePicker(false)}
                title="Select Furniture Style"
                height={0.6}
            >
                {FURNITURE_STYLE_OPTIONS.map((option) => (
                    <Pressable
                        key={option}
                        onPress={() => {
                            setSelectedFurnitureStyle(option);
                            setShowFurnitureStylePicker(false);
                        }}
                        className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
                            selectedFurnitureStyle === option ? 'bg-highlight/20' : 'bg-secondary'
                        }`}
                        style={selectedFurnitureStyle === option ? { borderWidth: 2, borderColor: colors.highlight } : { borderWidth: 1, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center gap-3">
                            <Icon name="Armchair" size={20} color={selectedFurnitureStyle === option ? colors.highlight : colors.placeholder} />
                            <ThemedText className={selectedFurnitureStyle === option ? 'font-semibold' : ''}>
                                {option}
                            </ThemedText>
                        </View>
                        {selectedFurnitureStyle === option && (
                            <Icon name="Check" size={20} color={colors.highlight} />
                        )}
                    </Pressable>
                ))}
            </AnimatedBottomSheet>

            {/* Room Type Picker - Animated Bottom Sheet */}
            <AnimatedBottomSheet
                visible={showRoomTypePicker}
                onClose={() => setShowRoomTypePicker(false)}
                title="Select Room Type"
                height={0.6}
            >
                {ROOM_TYPE_OPTIONS.map((option) => (
                    <Pressable
                        key={option}
                        onPress={() => {
                            setRoomType(option);
                            setShowRoomTypePicker(false);
                        }}
                        className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
                            roomType === option ? 'bg-highlight/20' : 'bg-secondary'
                        }`}
                        style={roomType === option ? { borderWidth: 2, borderColor: colors.highlight } : { borderWidth: 1, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center gap-3">
                            <Icon name="Home" size={20} color={roomType === option ? colors.highlight : colors.placeholder} />
                            <ThemedText className={roomType === option ? 'font-semibold' : ''}>
                                {option}
                            </ThemedText>
                        </View>
                        {roomType === option && (
                            <Icon name="Check" size={20} color={colors.highlight} />
                        )}
                    </Pressable>
                ))}
            </AnimatedBottomSheet>

        </View>
    );
}
