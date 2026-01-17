import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, ImageSourcePropType } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import useThemeColors from '@/app/_contexts/ThemeColors';

interface BeforeAfterSliderProps {
    beforeImage: string | ImageSourcePropType;
    afterImage: string | ImageSourcePropType;
    width?: number;
    height?: number;
    initialPosition?: number; // 0-1, default 0.5
    sliderColor?: string;
    borderRadius?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BeforeAfterSlider({
    beforeImage,
    afterImage,
    width = SCREEN_WIDTH - 32,
    height = 300,
    initialPosition = 0.5,
    sliderColor,
    borderRadius = 16,
}: BeforeAfterSliderProps) {
    const colors = useThemeColors();
    const activeSliderColor = sliderColor || colors.highlight || '#4DA3E1';
    
    const sliderPosition = useSharedValue(initialPosition * width);
    const [position, setPosition] = useState(initialPosition * width);

    const updatePosition = (x: number) => {
        setPosition(x);
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            const newX = Math.max(0, Math.min(width, event.x));
            sliderPosition.value = newX;
            runOnJS(updatePosition)(newX);
        });

    const animatedClipStyle = useAnimatedStyle(() => ({
        width: sliderPosition.value,
    }));

    const animatedSliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: sliderPosition.value }],
    }));

    const beforeSource = typeof beforeImage === 'string' ? { uri: beforeImage } : beforeImage;
    const afterSource = typeof afterImage === 'string' ? { uri: afterImage } : afterImage;

    return (
        <GestureHandlerRootView style={{ flex: 0 }}>
            <GestureDetector gesture={panGesture}>
                <View style={[styles.container, { width, height, borderRadius }]}>
                    {/* After Image (Background) */}
                    <Image
                        source={afterSource}
                        style={[styles.image, { width, height, borderRadius }]}
                        resizeMode="cover"
                    />

                    {/* Before Image (Clipped overlay) */}
                    <Animated.View style={[styles.beforeContainer, animatedClipStyle, { height, borderRadius }]}>
                        <Image
                            source={beforeSource}
                            style={[styles.image, { width, height, borderRadius }]}
                            resizeMode="cover"
                        />
                    </Animated.View>

                    {/* Slider Line */}
                    <Animated.View style={[styles.sliderLine, animatedSliderStyle, { height }]}>
                        <View style={[styles.line, { backgroundColor: activeSliderColor }]} />
                        
                        {/* Slider Handle */}
                        <View style={[styles.handle, { backgroundColor: activeSliderColor }]}>
                            <View style={styles.handleInner}>
                                <View style={[styles.arrow, styles.arrowLeft, { borderRightColor: activeSliderColor }]} />
                                <View style={[styles.arrow, styles.arrowRight, { borderLeftColor: activeSliderColor }]} />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Labels */}
                    <View style={[styles.labelContainer, styles.labelLeft]}>
                        <View style={styles.labelBg}>
                            <Animated.Text style={styles.labelText}>Before</Animated.Text>
                        </View>
                    </View>
                    <View style={[styles.labelContainer, styles.labelRight]}>
                        <View style={styles.labelBg}>
                            <Animated.Text style={styles.labelText}>After</Animated.Text>
                        </View>
                    </View>
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    beforeContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    sliderLine: {
        position: 'absolute',
        top: 0,
        left: -2,
        width: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    line: {
        position: 'absolute',
        width: 3,
        height: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    handle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    handleInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
    },
    arrowLeft: {
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderRightWidth: 8,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    arrowRight: {
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderLeftWidth: 8,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    labelContainer: {
        position: 'absolute',
        bottom: 12,
    },
    labelLeft: {
        left: 12,
    },
    labelRight: {
        right: 12,
    },
    labelBg: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    labelText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});

