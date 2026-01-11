import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, TextInput, Modal, Alert, StyleSheet, Platform, Animated, LayoutAnimation, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';

// Import pricing configuration
import {
    PROPERTY_LOCATIONS,
    PROPERTY_AGES,
    PROPERTY_TYPES,
    PROPERTY_CONDITIONS,
    ACCESS_DIFFICULTIES,
    URGENCY_OPTIONS,
    ROOM_TYPES,
    FLOOR_FINISHES,
    WALL_FINISHES,
    FURNITURE_OPTIONS,
    CEILING_HEIGHTS,
    getCitiesForCountry,
} from '@/app/lib/pricing';

// Import itemized estimate service
import {
    ProjectInput,
    RoomInput,
    ItemizedEstimateResult,
    calculateItemizedEstimate,
    formatCurrency,
} from '@/app/lib/itemizedEstimateService';

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
const PRIMARY_BLUE = '#4DA3E1';

// Form data type
type FormData = {
    // Property Info (Step 1)
    propertyLocation: string;
    propertyCity: string;
    propertyAge: string;
    propertyType: string;
    // Property Condition (Step 2)
    propertyCondition: string;
    accessDifficulty: string;
    urgency: string;
    // Room Details (Step 3)
    roomType: string;
    width: string;
    length: string;
    totalArea: string;  // For "Entire Property" selection
    ceilingHeight: string;
    // Finishes (Step 4)
    floorFinish: string;
    wallFinish: string;
    builtInFurniture: string;
};

export default function ProjectEstimateScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        propertyLocation: '',
        propertyCity: '',
        propertyAge: '',
        propertyType: '',
        propertyCondition: '',
        accessDifficulty: '',
        urgency: '',
        roomType: '',
        width: '',
        length: '',
        totalArea: '',
        ceilingHeight: '',
        floorFinish: '',
        wallFinish: '',
        builtInFurniture: '',
    });

    // Cities list based on selected country
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    // Track whether "Entire Property" is selected
    const isEntireProperty = formData.roomType === 'Entire Property';

    // Animation for room type switch - using state to control visibility with animation
    const [showTotalArea, setShowTotalArea] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animate when room type changes
    useEffect(() => {
        if (isEntireProperty) {
            // First fade out, then switch, then fade in
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                setShowTotalArea(true);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        } else if (formData.roomType !== '') {
            // Only animate if a room type is selected (not initial empty state)
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                setShowTotalArea(false);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            // Initial state - show dimensions without animation
            setShowTotalArea(false);
            fadeAnim.setValue(1);
        }
    }, [formData.roomType]);

    // Estimate state
    const [isCalculating, setIsCalculating] = useState(false);
    const [estimateResult, setEstimateResult] = useState<ItemizedEstimateResult | null>(null);
    const [showEstimateModal, setShowEstimateModal] = useState(false);

    // Dropdown states
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [showAgePicker, setShowAgePicker] = useState(false);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [showConditionPicker, setShowConditionPicker] = useState(false);
    const [showAccessPicker, setShowAccessPicker] = useState(false);
    const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);
    const [showRoomPicker, setShowRoomPicker] = useState(false);
    const [showCeilingPicker, setShowCeilingPicker] = useState(false);
    const [showFloorPicker, setShowFloorPicker] = useState(false);
    const [showWallPicker, setShowWallPicker] = useState(false);
    const [showFurniturePicker, setShowFurniturePicker] = useState(false);

    const totalSteps = 4;

    // Update cities when country changes
    useEffect(() => {
        if (formData.propertyLocation) {
            const cities = getCitiesForCountry(formData.propertyLocation);
            setAvailableCities(cities);
            // Reset city if country changed
            if (!cities.includes(formData.propertyCity)) {
                setFormData(prev => ({ ...prev, propertyCity: '' }));
            }
        }
    }, [formData.propertyLocation]);

    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Convert form data to ProjectInput format
    const buildProjectData = (): ProjectInput => {
        // For "Entire Property", calculate width/length from total area (assume square)
        let width = parseFloat(formData.width) || 0;
        let length = parseFloat(formData.length) || 0;
        
        if (formData.roomType === 'Entire Property' && formData.totalArea) {
            const totalArea = parseFloat(formData.totalArea) || 0;
            // Assume roughly square layout for entire property
            const side = Math.sqrt(totalArea);
            width = side;
            length = side;
        }

        const room: RoomInput = {
            roomType: formData.roomType,
            width,
            length,
            ceilingHeight: formData.ceilingHeight || undefined,
            floorFinish: formData.floorFinish,
            wallFinish: formData.wallFinish,
            builtInFurniture: formData.builtInFurniture || 'None',
        };

        return {
            propertyLocation: formData.propertyLocation,
            propertyCity: formData.propertyCity,
            propertyAge: formData.propertyAge,
            propertyType: formData.propertyType,
            propertyCondition: formData.propertyCondition,
            accessDifficulty: formData.accessDifficulty,
            urgency: formData.urgency,
            rooms: [room],
        };
    };

    // Calculate and show estimate
    const handleCalculateEstimate = async () => {
        setIsCalculating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const projectData = buildProjectData();
            const result = calculateItemizedEstimate(projectData);
            
            setEstimateResult(result);
            setShowEstimateModal(true);
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to calculate estimate:', error);
            Alert.alert('Error', 'Failed to calculate estimate. Please try again.');
        } finally {
            setIsCalculating(false);
        }
    };

    // View detailed breakdown
    const handleViewBreakdown = () => {
        if (!estimateResult) return;
        
        setShowEstimateModal(false);
        router.push({
            pathname: '/screens/estimate-breakdown',
            params: { estimateData: JSON.stringify(estimateResult) },
        });
    };

    // Save estimate
    const handleSaveEstimate = async () => {
        if (!estimateResult) return;

        setIsCalculating(true);

        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const savedEstimates = await AsyncStorage.getItem('savedEstimates');
            const estimates = savedEstimates ? JSON.parse(savedEstimates) : [];
            estimates.push({
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                ...estimateResult,
            });
            await AsyncStorage.setItem('savedEstimates', JSON.stringify(estimates));
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Estimate Saved!',
                'Your project estimate has been saved successfully.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Failed to save estimate:', error);
            Alert.alert('Error', 'Failed to save estimate. Please try again.');
        } finally {
            setIsCalculating(false);
            setShowEstimateModal(false);
        }
    };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
        } else {
            handleCalculateEstimate();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 0:
                return formData.propertyLocation !== '' && 
                       formData.propertyCity !== '' && 
                       formData.propertyAge !== '' &&
                       formData.propertyType !== '';
            case 1:
                return formData.propertyCondition !== '' && 
                       formData.accessDifficulty !== '' &&
                       formData.urgency !== '';
            case 2:
                // For "Entire Property", only total area is required
                if (formData.roomType === 'Entire Property') {
                    return formData.totalArea !== '';
                }
                // For other room types, width and length are required
                return formData.roomType !== '' && 
                       formData.width !== '' && 
                       formData.length !== '';
            case 3:
                return formData.floorFinish !== '' && formData.wallFinish !== '';
            default:
                return true;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 0: return 'Property Info';
            case 1: return 'Project Details';
            case 2: return 'Room Dimensions';
            case 3: return 'Finishes';
            default: return '';
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 0: return 'Tell us about the property location and characteristics.';
            case 1: return 'Help us understand the current state and project timeline.';
            case 2: return 'Add room details including type and dimensions.';
            case 3: return 'Select the finishes and furniture options for this room.';
            default: return '';
        }
    };

    // Liquid Glass Card Component
    const LiquidGlassCard = ({ children, style }: { children: React.ReactNode; style?: object }) => {
        if (supportsNativeLiquidGlass) {
            return (
                <View style={[styles.cardOuter, style]}>
                    <GlassView style={styles.cardGlass} glassEffectStyle="regular">
                        {children}
                    </GlassView>
                </View>
            );
        }

        return (
            <View style={[styles.cardOuter, style]}>
                <BlurView
                    intensity={40}
                    tint={colors.isDark ? "dark" : "light"}
                    style={styles.cardBlur}
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

    // Progress Bar
    const ProgressBar = () => (
        <View className="flex-row gap-2 mb-6">
            {[0, 1, 2, 3].map((i) => (
                <View key={i} className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <View 
                        className={`h-full rounded-full ${i <= step ? 'bg-highlight' : 'bg-transparent'}`}
                        style={{ width: i <= step ? '100%' : '0%', backgroundColor: i <= step ? PRIMARY_BLUE : 'transparent' }}
                    />
                </View>
            ))}
        </View>
    );

    // Select Dropdown Component
    const SelectDropdown = ({ 
        label, 
        value, 
        placeholder, 
        onPress,
        disabled = false,
    }: { 
        label: string; 
        value: string; 
        placeholder: string; 
        onPress: () => void;
        disabled?: boolean;
    }) => (
        <View className="mb-4">
            <ThemedText className="text-sm font-medium mb-2 ml-1">{label}</ThemedText>
            <Pressable
                onPress={disabled ? undefined : onPress}
                className="border border-border rounded-2xl p-4 flex-row items-center justify-between"
                style={{ 
                    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    opacity: disabled ? 0.5 : 1,
                }}
            >
                <ThemedText className={value ? '' : 'text-light-subtext dark:text-dark-subtext'}>
                    {value || placeholder}
                </ThemedText>
                <Icon name="ChevronDown" size={20} color={colors.placeholder} />
            </Pressable>
        </View>
    );

    // Picker Modal Component
    const PickerModal = ({ 
        visible, 
        onClose, 
        title, 
        options, 
        selectedValue, 
        onSelect 
    }: { 
        visible: boolean; 
        onClose: () => void; 
        title: string; 
        options: string[]; 
        selectedValue: string; 
        onSelect: (value: string) => void;
    }) => (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable 
                className="flex-1 bg-black/50 justify-end"
                onPress={onClose}
            >
                <View 
                    className="bg-background rounded-t-3xl max-h-[60%]"
                    style={{ paddingBottom: insets.bottom + 20 }}
                >
                    <View className="items-center pt-3 pb-2">
                        <View className="w-10 h-1 bg-border rounded-full" />
                    </View>
                    <View className="flex-row items-center justify-between px-6 pb-4 border-b border-border">
                        <ThemedText className="text-lg font-bold">{title}</ThemedText>
                        <Pressable onPress={onClose}>
                            <Icon name="X" size={24} color={colors.text} />
                        </Pressable>
                    </View>
                    <ScrollView className="p-4">
                        {options.map((option) => (
                            <Pressable
                                key={option}
                                onPress={() => {
                                    onSelect(option);
                                    onClose();
                                    Haptics.selectionAsync();
                                }}
                                className={`p-4 rounded-xl mb-2`}
                                style={{ 
                                    backgroundColor: selectedValue === option 
                                        ? PRIMARY_BLUE 
                                        : colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' 
                                }}
                            >
                                <ThemedText style={{ color: selectedValue === option ? '#fff' : colors.text, fontWeight: selectedValue === option ? '600' : '400' }}>
                                    {option}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );

    // Input Field Component
    const InputField = ({ 
        label, 
        value, 
        placeholder, 
        onChangeText,
        keyboardType = 'default',
        suffix
    }: { 
        label: string; 
        value: string; 
        placeholder: string; 
        onChangeText: (text: string) => void;
        keyboardType?: 'default' | 'numeric' | 'decimal-pad';
        suffix?: string;
    }) => (
        <View className="mb-4">
            <ThemedText className="text-sm font-medium mb-2 ml-1">{label}</ThemedText>
            <View className="flex-row items-center">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.placeholder}
                    keyboardType={keyboardType}
                    className="flex-1 border border-border rounded-2xl p-4 text-text"
                    style={{ 
                        backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        color: colors.text,
                    }}
                />
                {suffix && (
                    <ThemedText className="ml-3 text-light-subtext dark:text-dark-subtext font-medium">
                        {suffix}
                    </ThemedText>
                )}
            </View>
        </View>
    );

    // Estimate Result Modal
    const EstimateModal = () => (
        <Modal
            visible={showEstimateModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowEstimateModal(false)}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View 
                    className="bg-background rounded-t-3xl"
                    style={{ paddingBottom: insets.bottom + 20, maxHeight: '85%' }}
                >
                    <View className="items-center pt-3 pb-2">
                        <View className="w-10 h-1 bg-border rounded-full" />
                    </View>

                    <View className="flex-row items-center justify-between px-6 pb-4 border-b border-border">
                        <ThemedText className="text-xl font-bold">Your Estimate</ThemedText>
                        <Pressable onPress={() => setShowEstimateModal(false)}>
                            <Icon name="X" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <ScrollView className="px-6 py-4">
                        {estimateResult && (
                            <>
                                {/* Total Cost */}
                                <View 
                                    className="rounded-2xl p-6 mb-6 items-center"
                                    style={{ backgroundColor: PRIMARY_BLUE }}
                                >
                                    <ThemedText className="text-white/80 text-sm mb-1">
                                        Estimated Total
                                    </ThemedText>
                                    <ThemedText className="text-white text-4xl font-bold">
                                        {formatCurrency(estimateResult.summary.total, estimateResult.currency)}
                                    </ThemedText>
                                    <ThemedText className="text-white/60 text-xs mt-2">
                                        {estimateResult.inputSummary.totalArea.toFixed(1)} m² • {estimateResult.pricingVersion}
                                    </ThemedText>
                                </View>

                                {/* Category Summary */}
                                <View className="mb-6">
                                    <ThemedText className="font-semibold mb-3">Cost Breakdown</ThemedText>
                                    <View 
                                        className="rounded-xl p-4"
                                        style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                    >
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Materials</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.materials)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Labor</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.labor)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Overhead & Profit</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.overhead)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Contingency</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.contingency)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <ThemedText style={{ color: colors.placeholder }}>VAT ({(estimateResult.assumptions.taxRate * 100).toFixed(0)}%)</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.taxTotal)}</ThemedText>
                                        </View>
                                    </View>
                                </View>

                                {/* Project Factors */}
                                <View className="mb-6">
                                    <ThemedText className="font-semibold mb-3">Project Factors Applied</ThemedText>
                                    <View 
                                        className="rounded-xl p-4"
                                        style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                    >
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Location</ThemedText>
                                            <ThemedText className="font-medium">
                                                {estimateResult.inputSummary.city}, {estimateResult.inputSummary.country}
                                            </ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Property Type</ThemedText>
                                            <ThemedText className="font-medium">
                                                {estimateResult.multipliers.propertyType.label}
                                                <ThemedText className="text-xs" style={{ color: colors.placeholder }}>
                                                    {' '}(×{estimateResult.multipliers.propertyType.value.toFixed(2)})
                                                </ThemedText>
                                            </ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Condition</ThemedText>
                                            <ThemedText className="font-medium text-right" style={{ maxWidth: '60%' }} numberOfLines={2}>
                                                {estimateResult.multipliers.propertyCondition.label.split('(')[0].trim()}
                                            </ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText style={{ color: colors.placeholder }}>Access</ThemedText>
                                            <ThemedText className="font-medium text-right" style={{ maxWidth: '60%' }} numberOfLines={2}>
                                                {estimateResult.multipliers.accessDifficulty.label.split('(')[0].trim()}
                                            </ThemedText>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <ThemedText style={{ color: colors.placeholder }}>Timeline</ThemedText>
                                            <ThemedText className="font-medium text-right" style={{ maxWidth: '60%' }} numberOfLines={2}>
                                                {estimateResult.multipliers.urgency.label.split('(')[0].trim()}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>

                                {/* Room Summary */}
                                {estimateResult.rooms.map((room, index) => (
                                    <View key={index} className="mb-6">
                                        <ThemedText className="font-semibold mb-3">
                                            {room.roomType} ({room.areaM2.toFixed(1)} m²)
                                        </ThemedText>
                                        <View 
                                            className="rounded-xl p-4"
                                            style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                        >
                                            <View className="flex-row justify-between mb-2">
                                                <ThemedText style={{ color: colors.placeholder }}>Materials</ThemedText>
                                                <ThemedText>{formatCurrency(room.materialsCost)}</ThemedText>
                                            </View>
                                            <View className="flex-row justify-between mb-2">
                                                <ThemedText style={{ color: colors.placeholder }}>Labor</ThemedText>
                                                <ThemedText>{formatCurrency(room.laborCost)}</ThemedText>
                                            </View>
                                            <View className="flex-row justify-between mb-2">
                                                <ThemedText style={{ color: colors.placeholder }}>Line Items</ThemedText>
                                                <ThemedText>{room.lineItems.length} items</ThemedText>
                                            </View>
                                            <View className="border-t border-border pt-3 flex-row justify-between">
                                                <ThemedText className="font-semibold">Room Total</ThemedText>
                                                <ThemedText className="font-bold" style={{ color: PRIMARY_BLUE }}>
                                                    {formatCurrency(room.subtotal)}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* View Breakdown Button */}
                                <Pressable
                                    onPress={handleViewBreakdown}
                                    className="mb-6 p-4 rounded-xl flex-row items-center justify-center gap-2"
                                    style={{ backgroundColor: `${PRIMARY_BLUE}15`, borderWidth: 1, borderColor: PRIMARY_BLUE }}
                                >
                                    <Icon name="List" size={18} color={PRIMARY_BLUE} />
                                    <ThemedText className="font-semibold" style={{ color: PRIMARY_BLUE }}>
                                        View Full Bill of Quantities ({estimateResult.allLineItems.length} items)
                                    </ThemedText>
                                </Pressable>

                                {/* Disclaimer */}
                                <View className="mb-6 p-4 rounded-xl border border-border">
                                    <ThemedText className="text-xs text-center leading-relaxed" style={{ color: colors.placeholder }}>
                                        This is an itemized estimate based on standard renovation rates. 
                                        Actual costs may vary based on specific requirements and contractor quotes.
                                    </ThemedText>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View className="px-6 pt-4 border-t border-border flex-row gap-3">
                        <View className="flex-1">
                            <Button
                                title="Close"
                                variant="secondary"
                                size="large"
                                onPress={() => setShowEstimateModal(false)}
                            />
                        </View>
                        <View className="flex-1">
                            <Button
                                title={isCalculating ? 'Saving...' : 'Save Estimate'}
                                variant="primary"
                                size="large"
                                disabled={isCalculating}
                                onPress={handleSaveEstimate}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View 
                className="px-global pt-4 pb-4"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="flex-row items-center mb-4">
                    <Pressable 
                        onPress={handleBack}
                        className="p-2 rounded-xl mr-4"
                        style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    >
                        <Icon name="ArrowLeft" size={20} color={colors.text} />
                    </Pressable>
                    <View className="flex-1">
                        <ThemedText className="text-xl font-semibold">{getStepTitle()}</ThemedText>
                        <ThemedText className="text-xs" style={{ color: colors.placeholder }}>Step {step + 1} of {totalSteps}</ThemedText>
                    </View>
                </View>
                <ProgressBar />
            </View>

            {/* Content */}
            <ScrollView 
                className="flex-1 px-global"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Step Description */}
                <ThemedText className="mb-6 leading-relaxed" style={{ color: colors.placeholder }}>
                    {getStepDescription()}
                </ThemedText>

                {/* Step 1: Property Info */}
                {step === 0 && (
                    <AnimatedView animation="fadeInUp">
                        <SelectDropdown
                            label="Country"
                            value={formData.propertyLocation}
                            placeholder="Select country"
                            onPress={() => setShowLocationPicker(true)}
                        />

                        <SelectDropdown
                            label="City"
                            value={formData.propertyCity}
                            placeholder={formData.propertyLocation ? "Select city" : "Select country first"}
                            onPress={() => setShowCityPicker(true)}
                            disabled={!formData.propertyLocation}
                        />

                        <SelectDropdown
                            label="Property Age"
                            value={formData.propertyAge}
                            placeholder="How old is the property?"
                            onPress={() => setShowAgePicker(true)}
                        />

                        <SelectDropdown
                            label="Property Type"
                            value={formData.propertyType}
                            placeholder="What type of property?"
                            onPress={() => setShowTypePicker(true)}
                        />
                    </AnimatedView>
                )}

                {/* Step 2: Project Details */}
                {step === 1 && (
                    <AnimatedView animation="fadeInUp">
                        <SelectDropdown
                            label="Current Condition"
                            value={formData.propertyCondition}
                            placeholder="What's the current state?"
                            onPress={() => setShowConditionPicker(true)}
                        />

                        <SelectDropdown
                            label="Site Access"
                            value={formData.accessDifficulty}
                            placeholder="How easy is access for workers/materials?"
                            onPress={() => setShowAccessPicker(true)}
                        />

                        <SelectDropdown
                            label="Timeline"
                            value={formData.urgency}
                            placeholder="How soon do you need this done?"
                            onPress={() => setShowUrgencyPicker(true)}
                        />

                        {/* Info Card */}
                        <LiquidGlassCard style={{ marginTop: 12 }}>
                            <View style={styles.infoCard}>
                                <Icon name="Info" size={20} color={PRIMARY_BLUE} />
                                <ThemedText style={[styles.infoText, { color: colors.placeholder }]}>
                                    These factors affect pricing: poor condition requires more prep work, 
                                    difficult access increases material delivery costs, and urgent timelines 
                                    may require overtime labor.
                                </ThemedText>
                            </View>
                        </LiquidGlassCard>
                    </AnimatedView>
                )}

                {/* Step 3: Room Details */}
                {step === 2 && (
                    <AnimatedView animation="fadeInUp">
                        <SelectDropdown
                            label="Room Type"
                            value={formData.roomType}
                            placeholder="Select room type"
                            onPress={() => setShowRoomPicker(true)}
                        />

                        {/* Animated container for dimension inputs */}
                        <Animated.View style={[styles.dimensionsContainer, { opacity: fadeAnim }]}>
                            {/* Width & Length inputs (visible when NOT showing total area) */}
                            {!showTotalArea && (
                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <InputField
                                            label="Width"
                                            value={formData.width}
                                            placeholder="4.5"
                                            onChangeText={(text) => updateField('width', text)}
                                            keyboardType="decimal-pad"
                                            suffix="m"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <InputField
                                            label="Length"
                                            value={formData.length}
                                            placeholder="6.0"
                                            onChangeText={(text) => updateField('length', text)}
                                            keyboardType="decimal-pad"
                                            suffix="m"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Total Area input (visible when Entire Property is selected) */}
                            {showTotalArea && (
                                <View>
                                    <InputField
                                        label="Total Property Area"
                                        value={formData.totalArea}
                                        placeholder="e.g., 120"
                                        onChangeText={(text) => updateField('totalArea', text)}
                                        keyboardType="decimal-pad"
                                        suffix="m²"
                                    />
                                    
                                    {/* Info hint for entire property */}
                                    <LiquidGlassCard style={{ marginTop: 4, marginBottom: 8 }}>
                                        <View style={styles.infoCard}>
                                            <Icon name="Home" size={18} color={PRIMARY_BLUE} />
                                            <ThemedText style={[styles.infoText, { color: colors.placeholder }]}>
                                                Enter the total floor area of your property. This will be used to estimate 
                                                renovation costs across all rooms.
                                            </ThemedText>
                                        </View>
                                    </LiquidGlassCard>
                                </View>
                            )}
                        </Animated.View>

                        <SelectDropdown
                            label="Ceiling Height (Optional)"
                            value={formData.ceilingHeight}
                            placeholder="Standard (2.4 - 2.7m)"
                            onPress={() => setShowCeilingPicker(true)}
                        />

                        {/* Show calculated area for regular rooms */}
                        {!showTotalArea && formData.width && formData.length && (
                            <LiquidGlassCard style={{ marginTop: 8 }}>
                                <View style={styles.areaCard}>
                                    <ThemedText style={[styles.areaLabel, { color: colors.placeholder }]}>
                                        Room Area
                                    </ThemedText>
                                    <ThemedText style={[styles.areaValue, { color: PRIMARY_BLUE }]}>
                                        {(parseFloat(formData.width) * parseFloat(formData.length)).toFixed(2)} m²
                                    </ThemedText>
                                </View>
                            </LiquidGlassCard>
                        )}

                        {/* Show entered area for entire property */}
                        {showTotalArea && formData.totalArea && (
                            <LiquidGlassCard style={{ marginTop: 8 }}>
                                <View style={styles.areaCard}>
                                    <ThemedText style={[styles.areaLabel, { color: colors.placeholder }]}>
                                        Total Property Area
                                    </ThemedText>
                                    <ThemedText style={[styles.areaValue, { color: PRIMARY_BLUE }]}>
                                        {parseFloat(formData.totalArea).toFixed(2)} m²
                                    </ThemedText>
                                </View>
                            </LiquidGlassCard>
                        )}
                    </AnimatedView>
                )}

                {/* Step 4: Finishes */}
                {step === 3 && (
                    <AnimatedView animation="fadeInUp">
                        <SelectDropdown
                            label="Floor Finish"
                            value={formData.floorFinish}
                            placeholder="Select floor material"
                            onPress={() => setShowFloorPicker(true)}
                        />

                        <SelectDropdown
                            label="Wall Finish"
                            value={formData.wallFinish}
                            placeholder="Select wall treatment"
                            onPress={() => setShowWallPicker(true)}
                        />

                        <SelectDropdown
                            label="Built-in Furniture (Optional)"
                            value={formData.builtInFurniture}
                            placeholder="Any built-in furniture?"
                            onPress={() => setShowFurniturePicker(true)}
                        />
                    </AnimatedView>
                )}
            </ScrollView>

            {/* Bottom Button */}
            <View 
                className="absolute bottom-0 left-0 right-0 px-global pb-4 pt-6"
                style={{ paddingBottom: insets.bottom + 16, backgroundColor: colors.bg }}
            >
                <Button
                    title={isCalculating ? 'Calculating...' : (step === totalSteps - 1 ? 'Get Estimate' : 'Continue')}
                    variant="primary"
                    size="large"
                    rounded="xl"
                    disabled={!isStepValid() || isCalculating}
                    onPress={handleNext}
                />
            </View>

            {/* Picker Modals */}
            <PickerModal
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                title="Select Country"
                options={PROPERTY_LOCATIONS}
                selectedValue={formData.propertyLocation}
                onSelect={(value) => updateField('propertyLocation', value)}
            />

            <PickerModal
                visible={showCityPicker}
                onClose={() => setShowCityPicker(false)}
                title="Select City"
                options={availableCities}
                selectedValue={formData.propertyCity}
                onSelect={(value) => updateField('propertyCity', value)}
            />

            <PickerModal
                visible={showAgePicker}
                onClose={() => setShowAgePicker(false)}
                title="Select Property Age"
                options={PROPERTY_AGES}
                selectedValue={formData.propertyAge}
                onSelect={(value) => updateField('propertyAge', value)}
            />

            <PickerModal
                visible={showTypePicker}
                onClose={() => setShowTypePicker(false)}
                title="Select Property Type"
                options={PROPERTY_TYPES}
                selectedValue={formData.propertyType}
                onSelect={(value) => updateField('propertyType', value)}
            />

            <PickerModal
                visible={showConditionPicker}
                onClose={() => setShowConditionPicker(false)}
                title="Current Condition"
                options={PROPERTY_CONDITIONS}
                selectedValue={formData.propertyCondition}
                onSelect={(value) => updateField('propertyCondition', value)}
            />

            <PickerModal
                visible={showAccessPicker}
                onClose={() => setShowAccessPicker(false)}
                title="Site Access"
                options={ACCESS_DIFFICULTIES}
                selectedValue={formData.accessDifficulty}
                onSelect={(value) => updateField('accessDifficulty', value)}
            />

            <PickerModal
                visible={showUrgencyPicker}
                onClose={() => setShowUrgencyPicker(false)}
                title="Project Timeline"
                options={URGENCY_OPTIONS}
                selectedValue={formData.urgency}
                onSelect={(value) => updateField('urgency', value)}
            />

            <PickerModal
                visible={showRoomPicker}
                onClose={() => setShowRoomPicker(false)}
                title="Select Room Type"
                options={ROOM_TYPES}
                selectedValue={formData.roomType}
                onSelect={(value) => updateField('roomType', value)}
            />

            <PickerModal
                visible={showCeilingPicker}
                onClose={() => setShowCeilingPicker(false)}
                title="Ceiling Height"
                options={CEILING_HEIGHTS}
                selectedValue={formData.ceilingHeight}
                onSelect={(value) => updateField('ceilingHeight', value)}
            />

            <PickerModal
                visible={showFloorPicker}
                onClose={() => setShowFloorPicker(false)}
                title="Select Floor Finish"
                options={FLOOR_FINISHES}
                selectedValue={formData.floorFinish}
                onSelect={(value) => updateField('floorFinish', value)}
            />

            <PickerModal
                visible={showWallPicker}
                onClose={() => setShowWallPicker(false)}
                title="Select Wall Finish"
                options={WALL_FINISHES}
                selectedValue={formData.wallFinish}
                onSelect={(value) => updateField('wallFinish', value)}
            />

            <PickerModal
                visible={showFurniturePicker}
                onClose={() => setShowFurniturePicker(false)}
                title="Select Built-in Furniture"
                options={FURNITURE_OPTIONS}
                selectedValue={formData.builtInFurniture}
                onSelect={(value) => updateField('builtInFurniture', value)}
            />

            {/* Estimate Result Modal */}
            <EstimateModal />
        </View>
    );
}

const styles = StyleSheet.create({
    cardOuter: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardGlass: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    areaCard: {
        padding: 20,
        alignItems: 'center',
    },
    areaLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    areaValue: {
        fontSize: 32,
        fontWeight: '700',
    },
    dimensionsContainer: {
        minHeight: 80,  // Prevent layout jump during animation
    },
});
