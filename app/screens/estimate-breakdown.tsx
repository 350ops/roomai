import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import ThemedText from '@/components/ThemedText';
import Icon, { IconName } from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import useThemeColors from '@/app/_contexts/ThemeColors';
import { 
    ItemizedEstimateResult, 
    RoomBreakdown, 
    LineItem, 
    formatCurrency, 
    formatQuantity 
} from '@/app/_lib/itemizedEstimateService';

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

type ViewMode = 'summary' | 'categories' | 'rooms' | 'items';

export default function EstimateBreakdownScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ estimateData?: string }>();
    
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    
    // Parse estimate data from params
    const estimateData: ItemizedEstimateResult | null = params.estimateData 
        ? JSON.parse(params.estimateData) 
        : null;
    
    if (!estimateData) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ThemedText>No estimate data available</ThemedText>
            </View>
        );
    }

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

    // Tab Button
    const TabButton = ({ mode, label, icon }: { mode: ViewMode; label: string; icon: IconName }) => (
        <Pressable
            onPress={() => setViewMode(mode)}
            style={[
                styles.tabButton,
                viewMode === mode && { backgroundColor: PRIMARY_BLUE }
            ]}
        >
            <Icon 
                name={icon} 
                size={16} 
                color={viewMode === mode ? '#fff' : colors.text} 
            />
            <ThemedText 
                style={[
                    styles.tabLabel, 
                    { color: viewMode === mode ? '#fff' : colors.text }
                ]}
            >
                {label}
            </ThemedText>
        </Pressable>
    );

    // Category Card
    const CategoryCard = ({ 
        title, 
        amount, 
        icon, 
        color,
        items 
    }: { 
        title: string; 
        amount: number; 
        icon: IconName; 
        color: string;
        items?: LineItem[];
    }) => {
        const isExpanded = expandedCategory === title;
        
        return (
            <LiquidGlassCard style={{ marginBottom: 12 }}>
                <Pressable 
                    onPress={() => setExpandedCategory(isExpanded ? null : title)}
                    style={styles.categoryCard}
                >
                    <View style={[styles.categoryIcon, { backgroundColor: `${color}25` }]}>
                        <Icon name={icon} size={22} color={color} />
                    </View>
                    <View style={styles.categoryInfo}>
                        <ThemedText style={styles.categoryTitle}>{title}</ThemedText>
                        <ThemedText style={[styles.categoryAmount, { color: colors.text }]}>
                            {formatCurrency(amount, estimateData.currency)}
                        </ThemedText>
                    </View>
                    {items && items.length > 0 && (
                        <Icon 
                            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                            size={20} 
                            color={colors.placeholder} 
                        />
                    )}
                </Pressable>
                
                {isExpanded && items && items.length > 0 && (
                    <View style={styles.expandedItems}>
                        {items.map((item, idx) => (
                            <View key={idx} style={styles.lineItemRow}>
                                <View style={styles.lineItemInfo}>
                                    <ThemedText style={styles.lineItemName} numberOfLines={1}>
                                        {item.name}
                                    </ThemedText>
                                    <ThemedText style={[styles.lineItemQty, { color: colors.placeholder }]}>
                                        {formatQuantity(item.quantity, item.unit)} × {formatCurrency(item.unitCostFinal)}
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.lineItemCost}>
                                    {formatCurrency(item.costBeforeTax)}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                )}
            </LiquidGlassCard>
        );
    };

    // Room Card
    const RoomCard = ({ room }: { room: RoomBreakdown }) => {
        const isExpanded = expandedRoom === room.roomIndex;
        
        return (
            <LiquidGlassCard style={{ marginBottom: 12 }}>
                <Pressable 
                    onPress={() => setExpandedRoom(isExpanded ? null : room.roomIndex)}
                    style={styles.roomCardHeader}
                >
                    <View>
                        <ThemedText style={styles.roomTitle}>{room.roomType}</ThemedText>
                        <ThemedText style={[styles.roomArea, { color: colors.placeholder }]}>
                            {room.areaM2.toFixed(1)} m² floor area
                        </ThemedText>
                    </View>
                    <View style={styles.roomCostContainer}>
                        <ThemedText style={[styles.roomCost, { color: PRIMARY_BLUE }]}>
                            {formatCurrency(room.subtotal, estimateData.currency)}
                        </ThemedText>
                        <Icon 
                            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                            size={20} 
                            color={colors.placeholder} 
                        />
                    </View>
                </Pressable>
                
                {isExpanded && (
                    <View style={styles.expandedRoom}>
                        {/* Materials / Labor Split */}
                        <View style={styles.splitRow}>
                            <View style={[styles.splitCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Icon name="Package" size={16} color="#A9CC9C" />
                                <ThemedText style={styles.splitLabel}>Materials</ThemedText>
                                <ThemedText style={styles.splitValue}>
                                    {formatCurrency(room.materialsCost)}
                                </ThemedText>
                            </View>
                            <View style={[styles.splitCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Icon name="Hammer" size={16} color={PRIMARY_BLUE} />
                                <ThemedText style={styles.splitLabel}>Labor</ThemedText>
                                <ThemedText style={styles.splitValue}>
                                    {formatCurrency(room.laborCost)}
                                </ThemedText>
                            </View>
                        </View>
                        
                        {/* Line Items */}
                        <ThemedText style={styles.lineItemsHeader}>Line Items</ThemedText>
                        {room.lineItems.map((item, idx) => (
                            <View key={idx} style={styles.lineItemRow}>
                                <View style={styles.lineItemInfo}>
                                    <ThemedText style={styles.lineItemName} numberOfLines={1}>
                                        {item.name}
                                    </ThemedText>
                                    <ThemedText style={[styles.lineItemQty, { color: colors.placeholder }]}>
                                        {formatQuantity(item.quantity, item.unit)} × {formatCurrency(item.unitCostFinal)}
                                        {item.wastePct > 0 && ` (+${(item.wastePct * 100).toFixed(0)}% waste)`}
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.lineItemCost}>
                                    {formatCurrency(item.costBeforeTax)}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                )}
            </LiquidGlassCard>
        );
    };

    // Get items by category
    const materialItems = estimateData.allLineItems.filter(li => li.costType === 'material');
    const laborItems = estimateData.allLineItems.filter(li => li.costType === 'labor');

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View 
                className="px-global pt-4 pb-4"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="flex-row items-center mb-4">
                    <Pressable 
                        onPress={() => router.back()}
                        className="p-2 rounded-xl mr-4"
                        style={{ backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    >
                        <Icon name="ArrowLeft" size={20} color={colors.text} />
                    </Pressable>
                    <ThemedText className="text-xl font-semibold flex-1">
                        Estimate Breakdown
                    </ThemedText>
                </View>
                
                {/* Tab Bar */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                >
                    <TabButton mode="summary" label="Summary" icon="BarChart3" />
                    <TabButton mode="categories" label="Categories" icon="Layers" />
                    <TabButton mode="rooms" label="By Room" icon="Home" />
                    <TabButton mode="items" label="All Items" icon="List" />
                </ScrollView>
            </View>

            <ScrollView 
                className="flex-1 px-global"
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary View */}
                {viewMode === 'summary' && (
                    <AnimatedView animation="fadeInUp">
                        {/* Total Card */}
                        <LiquidGlassCard style={{ marginBottom: 20 }}>
                            <View style={styles.totalCard}>
                                <ThemedText style={styles.totalLabel}>Total Estimate</ThemedText>
                                <ThemedText style={[styles.totalAmount, { color: PRIMARY_BLUE }]}>
                                    {formatCurrency(estimateData.summary.total, estimateData.currency)}
                                </ThemedText>
                                <ThemedText style={[styles.totalSubtext, { color: colors.placeholder }]}>
                                    Including {(estimateData.assumptions.taxRate * 100).toFixed(0)}% VAT
                                </ThemedText>
                            </View>
                        </LiquidGlassCard>

                        {/* Quick Stats */}
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Icon name="Package" size={20} color="#A9CC9C" />
                                <ThemedText style={[styles.statLabel, { color: colors.placeholder }]}>Materials</ThemedText>
                                <ThemedText style={styles.statValue}>
                                    {formatCurrency(estimateData.summary.materials)}
                                </ThemedText>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Icon name="Hammer" size={20} color={PRIMARY_BLUE} />
                                <ThemedText style={[styles.statLabel, { color: colors.placeholder }]}>Labor</ThemedText>
                                <ThemedText style={styles.statValue}>
                                    {formatCurrency(estimateData.summary.labor)}
                                </ThemedText>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Icon name="TrendingUp" size={20} color="#FDBB54" />
                                <ThemedText style={[styles.statLabel, { color: colors.placeholder }]}>Overhead</ThemedText>
                                <ThemedText style={styles.statValue}>
                                    {formatCurrency(estimateData.summary.overhead)}
                                </ThemedText>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Icon name="Shield" size={20} color="#F04848" />
                                <ThemedText style={[styles.statLabel, { color: colors.placeholder }]}>Contingency</ThemedText>
                                <ThemedText style={styles.statValue}>
                                    {formatCurrency(estimateData.summary.contingency)}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Project Factors */}
                        {estimateData.inputSummary && (
                            <LiquidGlassCard style={{ marginTop: 20 }}>
                                <View style={styles.assumptionsCard}>
                                    <ThemedText style={styles.assumptionsTitle}>Project Factors</ThemedText>
                                    <View style={styles.assumptionRow}>
                                        <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                            Location
                                        </ThemedText>
                                        <ThemedText>{estimateData.inputSummary.city}, {estimateData.inputSummary.country}</ThemedText>
                                    </View>
                                    <View style={styles.assumptionRow}>
                                        <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                            Property Type
                                        </ThemedText>
                                        <ThemedText>{estimateData.inputSummary.propertyType} (×{estimateData.multipliers.propertyType?.value?.toFixed(2) || '1.00'})</ThemedText>
                                    </View>
                                    <View style={styles.assumptionRow}>
                                        <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                            Condition
                                        </ThemedText>
                                        <ThemedText style={{ textAlign: 'right', maxWidth: 180 }} numberOfLines={1}>
                                            ×{estimateData.multipliers.propertyCondition?.value?.toFixed(2) || '1.00'}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.assumptionRow}>
                                        <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                            Access
                                        </ThemedText>
                                        <ThemedText>×{estimateData.multipliers.accessDifficulty?.value?.toFixed(2) || '1.00'}</ThemedText>
                                    </View>
                                    <View style={styles.assumptionRow}>
                                        <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                            Timeline
                                        </ThemedText>
                                        <ThemedText>×{estimateData.multipliers.urgency?.value?.toFixed(2) || '1.00'}</ThemedText>
                                    </View>
                                </View>
                            </LiquidGlassCard>
                        )}

                        {/* Assumptions */}
                        <LiquidGlassCard style={{ marginTop: 16 }}>
                            <View style={styles.assumptionsCard}>
                                <ThemedText style={styles.assumptionsTitle}>Calculation Assumptions</ThemedText>
                                <View style={styles.assumptionRow}>
                                    <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                        Ceiling height
                                    </ThemedText>
                                    <ThemedText>{estimateData.assumptions.defaultCeilingHeightM}m</ThemedText>
                                </View>
                                <View style={styles.assumptionRow}>
                                    <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                        Wall openings (doors/windows)
                                    </ThemedText>
                                    <ThemedText>{(estimateData.assumptions.wallOpeningsPct * 100).toFixed(0)}%</ThemedText>
                                </View>
                                <View style={styles.assumptionRow}>
                                    <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                        Overhead & profit
                                    </ThemedText>
                                    <ThemedText>{(estimateData.assumptions.overheadPct * 100).toFixed(0)}%</ThemedText>
                                </View>
                                <View style={styles.assumptionRow}>
                                    <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                        Contingency
                                    </ThemedText>
                                    <ThemedText>{(estimateData.assumptions.contingencyPct * 100).toFixed(0)}%</ThemedText>
                                </View>
                                <View style={styles.assumptionRow}>
                                    <ThemedText style={[styles.assumptionLabel, { color: colors.placeholder }]}>
                                        VAT rate
                                    </ThemedText>
                                    <ThemedText>{(estimateData.assumptions.taxRate * 100).toFixed(0)}%</ThemedText>
                                </View>
                            </View>
                        </LiquidGlassCard>
                    </AnimatedView>
                )}

                {/* Categories View */}
                {viewMode === 'categories' && (
                    <AnimatedView animation="fadeInUp">
                        <CategoryCard 
                            title="Materials" 
                            amount={estimateData.summary.materials} 
                            icon="Package" 
                            color="#A9CC9C"
                            items={materialItems}
                        />
                        <CategoryCard 
                            title="Labor" 
                            amount={estimateData.summary.labor} 
                            icon="Hammer" 
                            color={PRIMARY_BLUE}
                            items={laborItems}
                        />
                        <CategoryCard 
                            title="Overhead & Profit" 
                            amount={estimateData.summary.overhead} 
                            icon="TrendingUp" 
                            color="#FDBB54"
                        />
                        <CategoryCard 
                            title="Contingency" 
                            amount={estimateData.summary.contingency} 
                            icon="Shield" 
                            color="#F04848"
                        />
                        <CategoryCard 
                            title="VAT" 
                            amount={estimateData.summary.taxTotal} 
                            icon="Receipt" 
                            color={colors.placeholder}
                        />
                    </AnimatedView>
                )}

                {/* Rooms View */}
                {viewMode === 'rooms' && (
                    <AnimatedView animation="fadeInUp">
                        {estimateData.rooms.map((room) => (
                            <RoomCard key={room.roomIndex} room={room} />
                        ))}
                        
                        {/* Project-level items */}
                        {estimateData.projectLineItems.length > 0 && (
                            <LiquidGlassCard style={{ marginBottom: 12 }}>
                                <View style={styles.roomCardHeader}>
                                    <View>
                                        <ThemedText style={styles.roomTitle}>Project Setup & Cleanup</ThemedText>
                                        <ThemedText style={[styles.roomArea, { color: colors.placeholder }]}>
                                            Site-wide costs
                                        </ThemedText>
                                    </View>
                                    <ThemedText style={[styles.roomCost, { color: PRIMARY_BLUE }]}>
                                        {formatCurrency(
                                            estimateData.projectLineItems.reduce((sum, li) => sum + li.costBeforeTax, 0),
                                            estimateData.currency
                                        )}
                                    </ThemedText>
                                </View>
                                <View style={styles.expandedRoom}>
                                    {estimateData.projectLineItems.map((item, idx) => (
                                        <View key={idx} style={styles.lineItemRow}>
                                            <View style={styles.lineItemInfo}>
                                                <ThemedText style={styles.lineItemName}>
                                                    {item.name}
                                                </ThemedText>
                                                <ThemedText style={[styles.lineItemQty, { color: colors.placeholder }]}>
                                                    {formatQuantity(item.quantity, item.unit)}
                                                </ThemedText>
                                            </View>
                                            <ThemedText style={styles.lineItemCost}>
                                                {formatCurrency(item.costBeforeTax)}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </LiquidGlassCard>
                        )}
                    </AnimatedView>
                )}

                {/* All Items View */}
                {viewMode === 'items' && (
                    <AnimatedView animation="fadeInUp">
                        <LiquidGlassCard>
                            <View style={styles.allItemsCard}>
                                <ThemedText style={styles.allItemsHeader}>
                                    All Line Items ({estimateData.allLineItems.length})
                                </ThemedText>
                                {estimateData.allLineItems.map((item, idx) => (
                                    <View 
                                        key={idx} 
                                        style={[
                                            styles.lineItemRow,
                                            idx < estimateData.allLineItems.length - 1 && styles.lineItemBorder
                                        ]}
                                    >
                                        <View style={styles.lineItemInfo}>
                                            <View style={styles.lineItemNameRow}>
                                                <View 
                                                    style={[
                                                        styles.costTypeBadge,
                                                        { backgroundColor: item.costType === 'material' ? '#A9CC9C25' : `${PRIMARY_BLUE}25` }
                                                    ]}
                                                >
                                                    <ThemedText 
                                                        style={[
                                                            styles.costTypeBadgeText,
                                                            { color: item.costType === 'material' ? '#A9CC9C' : PRIMARY_BLUE }
                                                        ]}
                                                    >
                                                        {item.costType === 'material' ? 'M' : 'L'}
                                                    </ThemedText>
                                                </View>
                                                <ThemedText style={styles.lineItemName} numberOfLines={1}>
                                                    {item.name}
                                                </ThemedText>
                                            </View>
                                            <ThemedText style={[styles.lineItemQty, { color: colors.placeholder }]}>
                                                {formatQuantity(item.quantity, item.unit)} × {formatCurrency(item.unitCostFinal)}
                                            </ThemedText>
                                        </View>
                                        <ThemedText style={styles.lineItemCost}>
                                            {formatCurrency(item.costBeforeTax)}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        </LiquidGlassCard>
                    </AnimatedView>
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <ThemedText style={[styles.disclaimerText, { color: colors.placeholder }]}>
                        This is an itemized estimate based on standard rates. Actual costs may vary 
                        based on specific site conditions, material availability, and contractor quotes.
                        Pricing version: {estimateData.pricingVersion}
                    </ThemedText>
                </View>
            </ScrollView>
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
    tabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    totalCard: {
        padding: 24,
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        opacity: 0.6,
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 42,
        fontWeight: '700',
    },
    totalSubtext: {
        fontSize: 13,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    statLabel: {
        fontSize: 13,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    categoryAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    expandedItems: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    roomCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    roomTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    roomArea: {
        fontSize: 14,
        marginTop: 2,
    },
    roomCostContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roomCost: {
        fontSize: 18,
        fontWeight: '700',
    },
    expandedRoom: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    splitRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        marginTop: 12,
    },
    splitCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 6,
    },
    splitLabel: {
        fontSize: 13,
        opacity: 0.6,
    },
    splitValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    lineItemsHeader: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        opacity: 0.6,
    },
    lineItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    lineItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    lineItemInfo: {
        flex: 1,
        marginRight: 12,
    },
    lineItemNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    lineItemName: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    lineItemQty: {
        fontSize: 12,
        marginTop: 2,
    },
    lineItemCost: {
        fontSize: 14,
        fontWeight: '600',
    },
    costTypeBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    costTypeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    allItemsCard: {
        padding: 16,
    },
    allItemsHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    assumptionsCard: {
        padding: 16,
    },
    assumptionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    assumptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    assumptionLabel: {
        fontSize: 14,
    },
    disclaimer: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    disclaimerText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});

