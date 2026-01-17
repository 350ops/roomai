import React from 'react';
import { Platform, DynamicColorIOS } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  // Dynamic colors for liquid glass on iOS - using app primary blue
  const tintColor = Platform.OS === 'ios' 
    ? DynamicColorIOS({ dark: '#14532D', light: '#14532D' })
    : '#4DA3E1';

  const labelColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: 'rgba(255,255,255,0.9)', light: 'rgba(72,72,72,0.9)' })
    : undefined;

  return (
    <NativeTabs
      tintColor={tintColor}
      labelStyle={labelColor ? { color: labelColor } : undefined}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <Icon 
          sf={{ default: 'safari', selected: 'safari.fill' }} 
          drawable="ic_menu_compass"
        />
        <Label>Explore</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <Icon 
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} 
          drawable="ic_menu_add"
        />
        <Label>Create</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my-designs">
        <Icon 
          sf={{ default: 'photo.on.rectangle', selected: 'photo.fill.on.rectangle.fill' }} 
          drawable="ic_menu_gallery"
        />
        <Label>My Designs</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon 
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }} 
          drawable="ic_menu_preferences"
        />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
