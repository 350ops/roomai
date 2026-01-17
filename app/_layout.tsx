import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from './_contexts/ThemeContext';
import { AuthProvider } from './_contexts/AuthContext';
import { LanguageProvider } from './_contexts/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox, Platform } from 'react-native';
import useThemeColors from './_contexts/ThemeColors';

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
]);

export default function RootLayout() {
  const colors = useThemeColors();
  return (
    <ErrorBoundary>
      <GestureHandlerRootView className={`bg-background ${Platform.OS === 'ios' ? 'pb-0' : ''}`} style={{ flex: 1 }}>
        <ThemeProvider>
          <LanguageProvider>
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
          
          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Other screens */}
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
          </LanguageProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
