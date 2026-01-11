import React, { useRef, useEffect } from 'react';
import { View, Animated, PanResponder, Pressable, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import useThemeColors from '@/app/contexts/ThemeColors';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface AnimatedBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    height?: number; // Percentage of screen height (0-1)
}

export default function AnimatedBottomSheet({
    visible,
    onClose,
    title,
    children,
    height = 0.65,
}: AnimatedBottomSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    
    const MODAL_HEIGHT = SCREEN_HEIGHT * height;
    const modalY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        if (visible) {
            // Open animation with spring
            Animated.parallel([
                Animated.spring(modalY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 150,
                    mass: 0.8,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            // Close animation
            Animated.parallel([
                Animated.spring(modalY, {
                    toValue: MODAL_HEIGHT,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to downward gestures
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    modalY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    // Close if dragged down enough or with velocity
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                } else {
                    // Snap back
                    Animated.spring(modalY, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 150,
                    }).start();
                }
            },
        })
    ).current;
    
    if (!visible) return null;
    
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            <Animated.View 
                style={[
                    StyleSheet.absoluteFill,
                    { opacity: backdropOpacity }
                ]}
            >
                <Pressable 
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                >
                    <BlurView 
                        intensity={20} 
                        tint={colors.isDark ? 'dark' : 'light'}
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                    />
                </Pressable>
            </Animated.View>
            
            {/* Modal Content */}
            <Animated.View
                style={[
                    styles.modalContainer,
                    {
                        height: MODAL_HEIGHT + insets.bottom,
                        backgroundColor: colors.bg,
                        transform: [{ translateY: modalY }],
                    }
                ]}
            >
                {/* Drag Handle */}
                <View {...panResponder.panHandlers} style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
                </View>
                
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <ThemedText className="text-xl font-bold">{title}</ThemedText>
                    <Pressable 
                        onPress={onClose}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={[styles.closeButtonBg, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Icon name="X" size={18} color={colors.text} />
                        </View>
                    </Pressable>
                </View>
                
                {/* Content */}
                <ScrollView 
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {children}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 4,
    },
    closeButtonBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
});

