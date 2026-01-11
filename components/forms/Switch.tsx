import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, Animated, Switch as RNSwitch, TouchableOpacity, StyleProp, ViewStyle, Platform } from 'react-native';
import ThemedText from '../ThemedText';
import Icon, { IconName } from '../Icon';
import useThemeColors from '@/app/contexts/ThemeColors';

// Safely check if liquid glass is available (iOS 26+)
let useGlass = false;
let GlassView: any = View;
try {
  const glassEffect = require('expo-glass-effect');
  if (Platform.OS === 'ios' && glassEffect.isLiquidGlassAvailable?.()) {
    useGlass = true;
    GlassView = glassEffect.GlassView;
  }
} catch (e) {
  // expo-glass-effect not available (running in Expo Go or unsupported platform)
}

interface SwitchProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const Switch: React.FC<SwitchProps> = ({
  value,
  onChange,
  label,
  description,
  icon,
  disabled = false,
  className = '',
  style,
}) => {
  const colors = useThemeColors();
  const [isOn, setIsOn] = useState(value ?? false);
  const slideAnim = useRef(new Animated.Value(value ?? false ? 1 : 0)).current;

  // Handle controlled vs uncontrolled state
  const isControlled = value !== undefined;
  const switchValue = isControlled ? value : isOn;

  // Sync animation with controlled value changes
  useEffect(() => {
    if (isControlled) {
      Animated.spring(slideAnim, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12
      }).start();
    }
  }, [value, isControlled, slideAnim]);

  const toggleSwitch = () => {
    if (disabled) return;
    
    const newValue = !switchValue;
    
    // Update internal state if uncontrolled
    if (!isControlled) {
      setIsOn(newValue);
    }
    
    // Call callback if provided
    onChange?.(newValue);
    
    // Animate the switch
    Animated.spring(slideAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12
    }).start();
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={toggleSwitch} 
      disabled={disabled}
      className={`flex-row items-center border-b border-border py-4 pl-2 pr-4 ${disabled ? 'opacity-100' : ''} ${className}`}
      style={style}
    >
      {icon && (
        useGlass ? (
          <GlassView 
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              marginRight: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            glassEffectStyle="regular"
            tintColor={colors.accentLight}
          >
            <Icon name={icon} size={20} color={colors.iconAccent} />
          </GlassView>
        ) : (
          <View 
            className="w-12 h-12 rounded-full mr-4 items-center justify-center"
            style={{ backgroundColor: colors.accentLight }}
          >
            <Icon name={icon} size={20} color={colors.iconAccent} />
        </View>
        )
      )}
      
      <View className="flex-1">
        {label && (
          <ThemedText className="font-semibold text-base">{label}</ThemedText>
        )}
        {description && (
          <ThemedText className="text-xs opacity-50 pr-4">
            {description}
          </ThemedText>
        )}
      </View>
      

        <View style={{ width: 56, height: 32, borderRadius: 16 }}>
          {useGlass ? (
            // Native iOS 26+ Liquid Glass toggle track
            <GlassView
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 16,
                position: 'absolute',
              }}
              glassEffectStyle="regular"
              tintColor={switchValue ? colors.highlight : undefined}
            />
          ) : (
            // Fallback for older iOS versions
          <View
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 16,
                position: 'absolute',
                backgroundColor: switchValue ? colors.highlight : colors.border,
                borderWidth: 1,
                borderColor: colors.border,
              }}
          />
          )}
          {/* Toggle knob */}
          <Animated.View
            style={{
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [-0.2, 1.2],
                  outputRange: [2, 26]
                })
              }],
              width: 24,
              height: 24,
              borderRadius: 12,
              marginVertical: 4,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            {useGlass && (
              <GlassView
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 12,
                }}
                glassEffectStyle="clear"
                tintColor="#FFFFFF"
              />
            )}
          </Animated.View>
        </View>
    </TouchableOpacity>
  );
};

// Support both named and default imports
export { Switch };
export default Switch; 