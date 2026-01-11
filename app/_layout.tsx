import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import useThemeColors from './contexts/ThemeColors';

export default function RootLayout() {
  const colors = useThemeColors();
  return (
    <ErrorBoundary>
      <GestureHandlerRootView className={`bg-background ${Platform.OS === 'ios' ? 'pb-0' : ''}`} style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <Stack 
          screenOptions={{ 
            headerShown: false, 
            contentStyle: { backgroundColor: colors.bg } 
          }} 
          initialRouteName="screens/welcome"
        >
          {/* Auth screens */}
          <Stack.Screen name="screens/welcome" />
          <Stack.Screen name="screens/login" />
          <Stack.Screen name="screens/signup" />
          <Stack.Screen name="screens/forgot-password" />
          
          {/* Onboarding */}
          <Stack.Screen name="screens/onboarding-start" />
          <Stack.Screen name="screens/renovation-survey" />
          
          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Other screens */}
          <Stack.Screen name="screens/settings" />
          <Stack.Screen name="screens/edit-profile" />
          <Stack.Screen name="screens/notification-settings" />
          <Stack.Screen name="screens/security" />
          <Stack.Screen name="screens/help" />
          <Stack.Screen name="screens/languages" />
          <Stack.Screen name="screens/subscription" />
          <Stack.Screen name="screens/lighting-tips" />
          <Stack.Screen name="screens/wide-angle-tips" />
          <Stack.Screen name="screens/clear-space-tips" />
          
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
