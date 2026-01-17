import React, { useState, useCallback } from 'react';
import { View, Pressable, Image, FlatList, Alert, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';

import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import useThemeColors from '@/app/_contexts/ThemeColors';
import { loadDesigns, deleteDesign, SavedDesign } from '@/app/_utils/designStorage';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

export default function MyDesignsScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState<SavedDesign | null>(null);

    const fetchDesigns = async () => {
        try {
            const savedDesigns = await loadDesigns();
            setDesigns(savedDesigns);
        } catch (error) {
            console.error('Failed to load designs:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Reload designs when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchDesigns();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDesigns();
    };

    const handleDeleteDesign = (design: SavedDesign) => {
        Alert.alert(
            'Delete Design',
            'Are you sure you want to delete this design? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDesign(design.id);
                            setDesigns(prev => prev.filter(d => d.id !== design.id));
                            setSelectedDesign(null);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete design.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const SLIDER_WIDTH = SCREEN_WIDTH - 32;
    const SLIDER_HEIGHT = (SLIDER_WIDTH * 3) / 4; // 4:3 ratio

    const DesignCard = ({ item, index }: { item: SavedDesign; index: number }) => (
        <AnimatedView 
            animation="fadeInUp" 
            delay={index * 50}
            className="mb-4"
        >
            <Pressable
                onPress={() => setSelectedDesign(item)}
                onLongPress={() => handleDeleteDesign(item)}
                className="rounded-2xl overflow-hidden"
            >
                {/* Before/After Slider */}
                <View className="w-full items-center bg-black/5 dark:bg-white/5">
                    <BeforeAfterSlider
                        beforeImage={{ uri: item.originalImage }}
                        afterImage={{ uri: item.resultImage }}
                        width={SLIDER_WIDTH}
                        height={SLIDER_HEIGHT}
                        borderRadius={20}
                    />
                </View>

                {/* Info */}
                <View className="p-4">
                    <View className="flex-row items-center justify-between mb-2">
                        <ThemedText className="font-semibold text-base" numberOfLines={1}>
                            {item.title || 'Untitled Design'}
                        </ThemedText>
                        <Pressable
                            onPress={() => handleDeleteDesign(item)}
                            className="p-2 -mr-2"
                            hitSlop={8}
                        >
                            <Icon name="Trash2" size={18} color={colors.placeholder} />
                        </Pressable>
                    </View>
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                        {formatDate(item.createdAt)}
                    </ThemedText>
                </View>
            </Pressable>
        </AnimatedView>
    );

    // Full screen design viewer
    if (selectedDesign) {
        return (
            <View className="flex-1 bg-black">
                <View 
                    className="flex-row items-center justify-between px-4 py-3"
                    style={{ paddingTop: insets.top + 10 }}
                >
                    <Pressable onPress={() => setSelectedDesign(null)} className="p-2">
                        <Icon name="X" size={24} color="white" />
                    </Pressable>
                    <ThemedText className="text-white font-semibold">
                        {selectedDesign.title || 'Design'}
                    </ThemedText>
                    <Pressable 
                        onPress={() => handleDeleteDesign(selectedDesign)} 
                        className="p-2"
                    >
                        <Icon name="Trash2" size={22} color="#EF4444" />
                    </Pressable>
                </View>

                <View className="flex-1 justify-center px-4">
                    <BeforeAfterSlider
                        beforeImage={{ uri: selectedDesign.originalImage }}
                        afterImage={{ uri: selectedDesign.resultImage }}
                        width={SCREEN_WIDTH - 32}
                        height={((SCREEN_WIDTH - 32) * 3) / 4}
                        borderRadius={16}
                    />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View 
                className="flex-row items-center justify-between px-global py-4 border-b border-border" 
                style={{ paddingTop: insets.top + 10 }}
            >
                <ThemedText className="text-2xl font-bold">My Designs</ThemedText>
                <Pressable className="p-3 rounded-full" style={{ backgroundColor: colors.iconBg }}>
                    <Icon name="Search" size={22} color={colors.text} />
                </Pressable>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ThemedText className="text-light-subtext dark:text-dark-subtext">Loading...</ThemedText>
                </View>
            ) : designs.length === 0 ? (
                /* Empty State */
            <View className="flex-1 items-center justify-center px-global">
                <AnimatedView animation="fadeInUp" className="items-center">
                        <View 
                            className="w-24 h-24 rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: colors.accentLight }}
                        >
                            <Icon name="Images" size={40} color={colors.iconAccent} />
                    </View>
                    <ThemedText className="text-2xl font-bold mb-2 text-center">No Designs Yet</ThemedText>
                    <ThemedText className="text-light-subtext dark:text-dark-subtext text-center mb-8 px-8">
                        Your AI-generated room designs will appear here. Start creating to see your transformations!
                    </ThemedText>
                    <Link href="/(tabs)/create" asChild>
                            <Pressable 
                                className="px-8 py-4 rounded-full flex-row items-center gap-2"
                                style={{ backgroundColor: colors.accent }}
                            >
                            <Icon name="Plus" size={20} color="white" />
                            <ThemedText className="text-white font-semibold text-lg">Create First Design</ThemedText>
                        </Pressable>
                    </Link>
                </AnimatedView>
            </View>
            ) : (
                /* Designs List */
                <FlatList
                    data={designs}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => <DesignCard item={item} index={index} />}
                    contentContainerStyle={{ 
                        padding: 16,
                        paddingBottom: 120,
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.text}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
