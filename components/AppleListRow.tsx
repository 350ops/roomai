import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import ThemedText from '@/components/ThemedText';
import Icon, { IconName } from '@/components/Icon';
import useThemeColors from '@/app/_contexts/ThemeColors';

// Safely check if liquid glass is available (iOS 26+)
let supportsLiquidGlass = false;
let GlassView: any = View;
try {
    const glassEffect = require('expo-glass-effect');
    if (Platform.OS === 'ios' && glassEffect.isLiquidGlassAvailable?.()) {
        supportsLiquidGlass = true;
        GlassView = glassEffect.GlassView;
    }
} catch (e) {
    // expo-glass-effect not available
}

interface AppleListRowProps {
    title: string;
    subtitle?: string;
    value?: string;
    placeholder?: string;
    icon?: IconName;
    onPress?: () => void;
    showChevron?: boolean;
    showSeparator?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    // Toggle support
    isToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
}

export function AppleListRow({
    title,
    subtitle,
    value,
    placeholder = 'Not set',
    icon,
    onPress,
    showChevron = true,
    showSeparator = true,
    isFirst = false,
    isLast = false,
    isToggle = false,
    toggleValue = false,
    onToggle,
}: AppleListRowProps) {
    const colors = useThemeColors();

    const handlePress = () => {
        if (isToggle && onToggle) {
            onToggle(!toggleValue);
        } else if (onPress) {
            onPress();
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                styles.row,
                subtitle ? styles.rowWithSubtitle : null,
                {
                    backgroundColor: pressed && !isToggle
                        ? colors.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.04)'
                        : 'transparent',
                },
                isFirst && styles.firstRow,
                isLast && styles.lastRow,
            ]}
        >
            <View style={styles.content}>
                {/* Separator */}
                {showSeparator && !isFirst && (
                    <View
                        style={[
                            styles.separator,
                            {
                                backgroundColor: colors.isDark
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.08)',
                            },
                        ]}
                    />
                )}

                {/* Main Row Content */}
                <View style={styles.rowInner}>
                    {/* Left side: Icon + Title */}
                    <View style={styles.leftContent}>
                        {icon && (
                            <View
                                style={[
                                    styles.iconContainer,
                                    {
                                        backgroundColor: colors.isDark
                                            ? 'rgba(255,255,255,0.1)'
                                            : 'rgba(0,0,0,0.05)',
                                    },
                                ]}
                            >
                                <Icon name={icon} size={18} color={colors.highlight} />
                            </View>
                        )}
                        <View style={styles.titleContainer}>
                            <ThemedText style={[styles.title, { color: colors.text }]}>
                                {title}
                            </ThemedText>
                            {subtitle && (
                                <ThemedText 
                                    style={[
                                        styles.subtitle, 
                                        { 
                                            color: colors.isDark 
                                                ? 'rgba(255,255,255,0.5)' 
                                                : 'rgba(60,60,67,0.6)' 
                                        }
                                    ]}
                                >
                                    {subtitle}
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    {/* Right side: Value/Toggle/Chevron */}
                    <View style={styles.rightContent}>
                        {isToggle ? (
                            // iOS-style Toggle Switch
                            <Pressable
                                onPress={() => onToggle?.(!toggleValue)}
                                style={[
                                    styles.toggleTrack,
                                    {
                                        backgroundColor: toggleValue 
                                            ? '#34C759' // iOS green
                                            : colors.isDark 
                                                ? 'rgba(255,255,255,0.2)' 
                                                : 'rgba(120,120,128,0.16)',
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.toggleKnob,
                                        {
                                            transform: [{ translateX: toggleValue ? 20 : 2 }],
                                        },
                                    ]}
                                />
                            </Pressable>
                        ) : (
                            <>
                                <ThemedText
                                    style={[
                                        styles.value,
                                        {
                                            color: value
                                                ? colors.isDark
                                                    ? 'rgba(255,255,255,0.6)'
                                                    : 'rgba(60,60,67,0.6)'
                                                : colors.isDark
                                                    ? 'rgba(255,255,255,0.3)'
                                                    : 'rgba(60,60,67,0.3)',
                                        },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {value || placeholder}
                                </ThemedText>
                                {showChevron && (
                                    <ThemedText
                                        style={[
                                            styles.chevron,
                                            {
                                                color: colors.isDark
                                                    ? 'rgba(255,255,255,0.3)'
                                                    : 'rgba(60,60,67,0.3)',
                                            },
                                        ]}
                                    >
                                        ›
                                    </ThemedText>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

interface AppleListGroupProps {
    children: React.ReactNode;
    header?: string;
    footer?: string;
    useGlass?: boolean;
}

export function AppleListGroup({ children, header, footer, useGlass = true }: AppleListGroupProps) {
    const colors = useThemeColors();

    // Clone children to add isFirst/isLast props
    const childArray = React.Children.toArray(children);
    const enhancedChildren = childArray.map((child, index) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<AppleListRowProps>, {
                isFirst: index === 0,
                isLast: index === childArray.length - 1,
                showSeparator: index !== 0,
            });
        }
        return child;
    });

    // Use native GlassView on iOS 26+ when useGlass is true
    const shouldUseGlass = useGlass && supportsLiquidGlass;

    const containerContent = (
        <>
            {enhancedChildren}
        </>
    );

    return (
        <View style={styles.groupContainer}>
            {header && (
                <ThemedText
                    style={[
                        styles.groupHeader,
                        {
                            color: colors.isDark
                                ? 'rgba(255,255,255,0.5)'
                                : 'rgba(60,60,67,0.6)',
                        },
                    ]}
                >
                    {header.toUpperCase()}
                </ThemedText>
            )}
            {shouldUseGlass ? (
                <GlassView
                    style={[
                        styles.groupContent,
                        styles.glassContainer,
                    ]}
                    glassEffectStyle="regular"
                >
                    {containerContent}
                </GlassView>
            ) : (
                <View
                    style={[
                        styles.groupContent,
                        {
                            backgroundColor: colors.isDark
                                ? 'rgba(255,255,255,0.08)'
                                : '#FFFFFF',
                            borderRadius: 12,
                            overflow: 'hidden',
                        },
                    ]}
                >
                    {containerContent}
                </View>
            )}
            {footer && (
                <ThemedText
                    style={[
                        styles.groupFooter,
                        {
                            color: colors.isDark
                                ? 'rgba(255,255,255,0.5)'
                                : 'rgba(60,60,67,0.6)',
                        },
                    ]}
                >
                    {footer}
                </ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        minHeight: 44,
        justifyContent: 'center',
    },
    rowWithSubtitle: {
        minHeight: 58,
    },
    firstRow: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    lastRow: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 0,
    },
    rowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 16,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '400',
        letterSpacing: -0.43,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: -0.08,
        marginTop: 2,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    value: {
        fontSize: 17,
        letterSpacing: -0.43,
        maxWidth: 180,
    },
    chevron: {
        fontSize: 22,
        fontWeight: '600',
        marginLeft: 2,
    },
    // Toggle styles
    toggleTrack: {
        width: 51,
        height: 31,
        borderRadius: 15.5,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 27,
        height: 27,
        borderRadius: 13.5,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    groupContainer: {
        marginBottom: 20,
    },
    groupHeader: {
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: -0.08,
        marginBottom: 8,
        marginLeft: 16,
    },
    groupContent: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    glassContainer: {
        // Additional glass-specific styles
    },
    groupFooter: {
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: -0.08,
        marginTop: 8,
        marginLeft: 16,
    },
});

export default AppleListRow;
