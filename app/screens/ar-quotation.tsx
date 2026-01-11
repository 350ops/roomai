import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

// Primary colors
const PRIMARY_BLUE = '#4DA3E1';

export default function ARQuotationScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    
    // Get AR scan data from params
    const params = useLocalSearchParams<{
        floorArea?: string;
        roomWidth?: string;
        roomDepth?: string;
        roomLabel?: string;
        wallArea?: string;
    }>();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        propertyLocation: '',
        propertyCity: '',
        propertyAge: '',
        propertyType: '',
        propertyCondition: '',
        accessDifficulty: '',
        urgency: '',
        roomType: params.roomLabel || '',
        floorFinish: '',
        wallFinish: '',
        builtInFurniture: '',
    });

    // Cities list based on selected country
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    // Pre-calculated dimensions from AR scan
    const arFloorArea = parseFloat(params.floorArea || '0');
    const arWidth = parseFloat(params.roomWidth || '0');
    const arDepth = parseFloat(params.roomDepth || '0');
    const arWallArea = parseFloat(params.wallArea || '0');

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
    const [showFloorPicker, setShowFloorPicker] = useState(false);
    const [showWallPicker, setShowWallPicker] = useState(false);
    const [showFurniturePicker, setShowFurniturePicker] = useState(false);

    const totalSteps = 3; // 3 steps: Property Info, Project Details, Finishes

    // Update cities when country changes
    useEffect(() => {
        if (formData.propertyLocation) {
            const cities = getCitiesForCountry(formData.propertyLocation);
            setAvailableCities(cities);
            if (!cities.includes(formData.propertyCity)) {
                setFormData(prev => ({ ...prev, propertyCity: '' }));
            }
        }
    }, [formData.propertyLocation]);

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Map AR room labels to our room types
    const mapARLabelToRoomType = (label: string): string => {
        const mapping: Record<string, string> = {
            'livingRoom': 'Living Room',
            'diningRoom': 'Dining Room',
            'kitchen': 'Kitchen',
            'bathroom': 'Bathroom',
            'bedroom': 'Bedroom',
            'laundryRoom': 'Laundry Room',
            'garage': 'Garage',
            'unknown': '',
        };
        return mapping[label] || label;
    };

    // Set initial room type from AR scan
    useEffect(() => {
        if (params.roomLabel) {
            const mappedType = mapARLabelToRoomType(params.roomLabel);
            if (ROOM_TYPES.includes(mappedType)) {
                setFormData(prev => ({ ...prev, roomType: mappedType }));
            }
        }
    }, [params.roomLabel]);

    // Convert form data to ProjectInput format using AR dimensions
    const buildProjectData = (): ProjectInput => {
        const room: RoomInput = {
            roomType: formData.roomType || 'Living Room',
            width: arWidth > 0 ? arWidth : Math.sqrt(arFloorArea),
            length: arDepth > 0 ? arDepth : Math.sqrt(arFloorArea),
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

    // Save estimate and close
    const handleSaveEstimate = async () => {
        if (!estimateResult) return;

        setIsCalculating(true);

        try {
            // For now, save to AsyncStorage (Supabase integration can be added later)
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
                       formData.propertyType !== '' &&
                       formData.roomType !== '';
            case 1:
                return formData.propertyCondition !== '' && 
                       formData.accessDifficulty !== '' &&
                       formData.urgency !== '';
            case 2:
                return formData.floorFinish !== '' && formData.wallFinish !== '';
            default:
                return true;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 0: return 'Property & Room';
            case 1: return 'Project Details';
            case 2: return 'Finishes';
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
            {[0, 1, 2].map((i) => (
                <View key={i} className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <View 
                        className={`h-full rounded-full`}
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
        onPress 
    }: { 
        label: string; 
        value: string; 
        placeholder: string; 
        onPress: () => void;
    }) => (
        <View className="mb-4">
            <ThemedText className="text-sm font-medium mb-2 ml-1">{label}</ThemedText>
            <Pressable
                onPress={onPress}
                className="border border-border rounded-2xl p-4 flex-row items-center justify-between"
                style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
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
                                className={`p-4 rounded-xl mb-2 ${
                                    selectedValue === option ? 'bg-highlight' : ''
                                }`}
                                style={selectedValue !== option ? { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } : {}}
                            >
                                <ThemedText className={selectedValue === option ? 'text-white font-semibold' : ''}>
                                    {option}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
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
                                        Based on AR scan • {estimateResult.pricingVersion}
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
                                            <ThemedText className="text-light-subtext dark:text-dark-subtext">Materials</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.materials)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText className="text-light-subtext dark:text-dark-subtext">Labor</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.labor)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText className="text-light-subtext dark:text-dark-subtext">Overhead & Profit</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.overhead)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText className="text-light-subtext dark:text-dark-subtext">Contingency</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.contingency)}</ThemedText>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <ThemedText className="text-light-subtext dark:text-dark-subtext">VAT ({(estimateResult.assumptions.taxRate * 100).toFixed(0)}%)</ThemedText>
                                            <ThemedText className="font-medium">{formatCurrency(estimateResult.summary.taxTotal)}</ThemedText>
                                        </View>
                                    </View>
                                </View>

                                {/* AR Scan Data */}
                                <View className="mb-6">
                                    <ThemedText className="font-semibold mb-3">Scanned Room Data</ThemedText>
                                    <View 
                                        className="rounded-xl p-4"
                                        style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                                    >
                                        <View className="flex-row justify-between mb-2">
                                            <ThemedText className="text-light-subtext dark:text-dark-subtext">Floor Area</ThemedText>
                                            <ThemedText className="font-medium">{arFloorArea.toFixed(2)} m²</ThemedText>
                                        </View>
                                        {arWidth > 0 && arDepth > 0 && (
                                            <View className="flex-row justify-between mb-2">
                                                <ThemedText className="text-light-subtext dark:text-dark-subtext">Dimensions</ThemedText>
                                                <ThemedText className="font-medium">{arWidth.toFixed(2)}m × {arDepth.toFixed(2)}m</ThemedText>
                                            </View>
                                        )}
                                        {arWallArea > 0 && (
                                            <View className="flex-row justify-between">
                                                <ThemedText className="text-light-subtext dark:text-dark-subtext">Wall Area</ThemedText>
                                                <ThemedText className="font-medium">{arWallArea.toFixed(2)} m²</ThemedText>
                                            </View>
                                        )}
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
                                                <ThemedText className="text-light-subtext dark:text-dark-subtext">Materials</ThemedText>
                                                <ThemedText>{formatCurrency(room.materialsCost)}</ThemedText>
                                            </View>
                                            <View className="flex-row justify-between mb-2">
                                                <ThemedText className="text-light-subtext dark:text-dark-subtext">Labor</ThemedText>
                                                <ThemedText>{formatCurrency(room.laborCost)}</ThemedText>
                                            </View>
                                            <View className="flex-row justify-between mb-2">
                                                <ThemedText className="text-light-subtext dark:text-dark-subtext">Line Items</ThemedText>
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
                                        View Detailed Breakdown ({estimateResult.allLineItems.length} items)
                                    </ThemedText>
                                </Pressable>

                                {/* Disclaimer */}
                                <View className="mb-6 p-4 rounded-xl border border-border">
                                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext text-center leading-relaxed">
                                        This estimate is based on your AR room scan measurements. 
                                        Actual costs may vary based on specific requirements and local rates.
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
                <View className="flex-row items-center mb-6">
                    <Pressable 
                        onPress={handleBack}
                        className="p-2 rounded-xl mr-4"
                        style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    >
                        <Icon name="ArrowLeft" size={20} color={colors.text} />
                    </Pressable>
                    <ThemedText className="text-xl font-semibold flex-1 text-center pr-12">
                        {getStepTitle()}
                    </ThemedText>
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
                {/* AR Scan Summary Card */}
                <AnimatedView animation="fadeInUp" delay={0}>
                    <LiquidGlassCard style={{ marginBottom: 20 }}>
                        <View style={styles.scanSummary}>
                            <View style={[styles.scanIcon, { backgroundColor: `${PRIMARY_BLUE}25` }]}>
                                <Icon name="Scan" size={28} color={PRIMARY_BLUE} />
                            </View>
                            <View style={styles.scanInfo}>
                                <ThemedText style={styles.scanTitle}>AR Scan Data</ThemedText>
                                <ThemedText style={[styles.scanValue, { color: colors.text }]}>
                                    {arFloorArea.toFixed(2)} m² floor area
                                </ThemedText>
                                {arWidth > 0 && arDepth > 0 && (
                                    <ThemedText style={[styles.scanDimensions, { color: colors.placeholder }]}>
                                        {arWidth.toFixed(2)}m × {arDepth.toFixed(2)}m
                                    </ThemedText>
                                )}
                            </View>
                            <Icon name="CheckCircle" size={24} color="#A9CC9C" />
                        </View>
                    </LiquidGlassCard>
                </AnimatedView>

                {/* Step 1: Property & Room */}
                {step === 0 && (
                    <AnimatedView animation="fadeInUp" delay={100}>
                        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6 leading-relaxed">
                            We've captured your room dimensions. Now tell us about the property.
                        </ThemedText>

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
                            onPress={() => formData.propertyLocation && setShowCityPicker(true)}
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

                        <SelectDropdown
                            label="Room Type"
                            value={formData.roomType}
                            placeholder="Select room type"
                            onPress={() => setShowRoomPicker(true)}
                        />
                    </AnimatedView>
                )}

                {/* Step 2: Project Details */}
                {step === 1 && (
                    <AnimatedView animation="fadeInUp" delay={100}>
                        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6 leading-relaxed">
                            Help us understand the project scope and timeline.
                        </ThemedText>

                        <SelectDropdown
                            label="Current Condition"
                            value={formData.propertyCondition}
                            placeholder="What's the current state?"
                            onPress={() => setShowConditionPicker(true)}
                        />

                        <SelectDropdown
                            label="Site Access"
                            value={formData.accessDifficulty}
                            placeholder="How easy is access for workers?"
                            onPress={() => setShowAccessPicker(true)}
                        />

                        <SelectDropdown
                            label="Timeline"
                            value={formData.urgency}
                            placeholder="How soon do you need this done?"
                            onPress={() => setShowUrgencyPicker(true)}
                        />
                    </AnimatedView>
                )}

                {/* Step 3: Finishes */}
                {step === 2 && (
                    <AnimatedView animation="fadeInUp" delay={100}>
                        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6 leading-relaxed">
                            Select the finishes you'd like for this room.
                        </ThemedText>

                        <SelectDropdown
                            label="Floor Finish"
                            value={formData.floorFinish}
                            placeholder="Select floor finish"
                            onPress={() => setShowFloorPicker(true)}
                        />

                        <SelectDropdown
                            label="Wall Finish"
                            value={formData.wallFinish}
                            placeholder="Select wall finish"
                            onPress={() => setShowWallPicker(true)}
                        />

                        <SelectDropdown
                            label="Built-in Furniture (Optional)"
                            value={formData.builtInFurniture}
                            placeholder="Select built-in furniture"
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
    scanSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    scanIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanInfo: {
        flex: 1,
    },
    scanTitle: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.6,
        marginBottom: 2,
    },
    scanValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    scanDimensions: {
        fontSize: 14,
        marginTop: 2,
    },
});

