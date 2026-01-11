/**
 * Liquid Glass Components Showcase
 *
 * Demo screen showcasing all glassmorphism components
 * You can use this as a reference or delete it after implementing
 */

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from '../ThemedText';
import GlassToggle from './GlassToggle';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';
import GlassInput from './GlassInput';
import GlassSlider from './GlassSlider';
import Icon from '../Icon';

export default function GlassShowcase() {
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ThemedText className="text-3xl font-bold mb-2">
            Liquid Glass UI
          </ThemedText>
          <ThemedText className="text-base opacity-70 mb-8">
            Modern glassmorphism components
          </ThemedText>

          {/* Toggles Section */}
          <GlassCard className="p-6 mb-6" gradient>
            <ThemedText className="text-xl font-bold mb-4">
              Glass Toggles
            </ThemedText>

            <GlassToggle
              value={toggle1}
              onValueChange={setToggle1}
              label="Small Toggle"
              size="small"
              className="mb-4"
            />

            <GlassToggle
              value={toggle2}
              onValueChange={setToggle2}
              label="Medium Toggle (Default)"
              size="medium"
              className="mb-4"
            />

            <GlassToggle
              value={toggle3}
              onValueChange={setToggle3}
              label="Large Toggle with Custom Color"
              size="large"
              activeColor="#00d4ff"
              className="mb-4"
            />

            <GlassToggle
              value={false}
              onValueChange={() => {}}
              label="Disabled Toggle"
              disabled
            />
          </GlassCard>

          {/* Buttons Section */}
          <GlassCard className="p-6 mb-6" gradient>
            <ThemedText className="text-xl font-bold mb-4">
              Glass Buttons
            </ThemedText>

            <GlassButton
              title="Primary Button"
              variant="primary"
              onPress={() => console.log('Primary pressed')}
              fullWidth
              className="mb-3"
            />

            <GlassButton
              title="Secondary Button"
              variant="secondary"
              onPress={() => console.log('Secondary pressed')}
              fullWidth
              className="mb-3"
            />

            <GlassButton
              title="Ghost Button"
              variant="ghost"
              onPress={() => console.log('Ghost pressed')}
              fullWidth
              className="mb-3"
            />

            <View className="flex-row gap-3">
              <GlassButton
                title="Small"
                size="small"
                onPress={() => {}}
                variant="primary"
              />
              <GlassButton
                title="Medium"
                size="medium"
                onPress={() => {}}
                variant="secondary"
              />
              <GlassButton
                title="Large"
                size="large"
                onPress={() => {}}
                variant="ghost"
              />
            </View>
          </GlassCard>

          {/* Inputs Section */}
          <GlassCard className="p-6 mb-6" gradient>
            <ThemedText className="text-xl font-bold mb-4">
              Glass Inputs
            </ThemedText>

            <GlassInput
              label="Email Address"
              placeholder="Enter your email"
              value={emailValue}
              onChangeText={setEmailValue}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Icon name="Mail" size={20} color="rgba(255,255,255,0.6)" />}
              containerClassName="mb-4"
            />

            <GlassInput
              label="Password"
              placeholder="Enter your password"
              value={passwordValue}
              onChangeText={setPasswordValue}
              secureTextEntry
              icon={<Icon name="Lock" size={20} color="rgba(255,255,255,0.6)" />}
              containerClassName="mb-4"
            />

            <GlassInput
              label="With Error"
              placeholder="This field has an error"
              value=""
              onChangeText={() => {}}
              error="This field is required"
            />
          </GlassCard>

          {/* Slider Section */}
          <GlassCard className="p-6 mb-6" gradient>
            <ThemedText className="text-xl font-bold mb-4">
              Glass Slider
            </ThemedText>

            <GlassSlider
              label="Volume"
              value={sliderValue}
              onValueChange={setSliderValue}
              minimumValue={0}
              maximumValue={100}
              step={1}
              showValue
              width={300}
            />
          </GlassCard>

          {/* Cards Section */}
          <GlassCard className="p-6 mb-6" gradient>
            <ThemedText className="text-xl font-bold mb-4">
              Glass Cards
            </ThemedText>

            <GlassCard className="p-4 mb-3" bordered>
              <ThemedText className="font-semibold">Basic Glass Card</ThemedText>
              <ThemedText className="text-sm opacity-70 mt-1">
                With border and blur effect
              </ThemedText>
            </GlassCard>

            <GlassCard className="p-4 mb-3" bordered={false} gradient>
              <ThemedText className="font-semibold">Gradient Glass Card</ThemedText>
              <ThemedText className="text-sm opacity-70 mt-1">
                With gradient overlay
              </ThemedText>
            </GlassCard>

            <GlassCard
              className="p-4"
              pressable
              onPress={() => console.log('Card pressed')}
            >
              <ThemedText className="font-semibold">Pressable Glass Card</ThemedText>
              <ThemedText className="text-sm opacity-70 mt-1">
                Tap me!
              </ThemedText>
            </GlassCard>
          </GlassCard>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
