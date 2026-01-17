/**
 * Error Fallback UI
 *
 * Displayed when an error boundary catches an error.
 * Provides a user-friendly error message and recovery option.
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/Button';
import ThemedText from '../../components/ThemedText';
import Icon from '../../components/Icon';
import useThemeColors from '../_contexts/ThemeColors';

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

export default function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const colors = useThemeColors();

  const handleGoHome = () => {
    if (onReset) {
      onReset();
    }
    router.replace('/');
  };

  const handleReload = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Icon */}
        <View className="mb-6 bg-red-500/10 p-6 rounded-full">
          <Icon name="AlertTriangle" size={64} color="#ef4444" />
        </View>

        {/* Error Title */}
        <ThemedText className="text-2xl font-bold text-center mb-3">
          Oops! Something went wrong
        </ThemedText>

        {/* Error Message */}
        <ThemedText className="text-base text-center text-light-subtext dark:text-dark-subtext mb-6 px-4">
          We encountered an unexpected error. Don't worry, this has been logged and we'll look into it.
        </ThemedText>

        {/* Error Details (Development Only) */}
        {__DEV__ && error && (
          <View className="w-full bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6">
            <ThemedText className="font-bold text-red-500 mb-2">
              Error Details (Dev Only):
            </ThemedText>
            <ThemedText className="text-xs font-mono text-red-400">
              {error.message}
            </ThemedText>
            {error.stack && (
              <ScrollView className="mt-2 max-h-40">
                <ThemedText className="text-xs font-mono text-red-400">
                  {error.stack}
                </ThemedText>
              </ScrollView>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="w-full gap-3">
          <Button
            title="Try Again"
            variant="primary"
            size="large"
            onPress={handleReload}
            className="w-full"
          />
          <Button
            title="Go to Home"
            variant="secondary"
            size="large"
            onPress={handleGoHome}
            className="w-full"
          />
        </View>

        {/* Help Text */}
        <ThemedText className="text-xs text-center text-light-subtext dark:text-dark-subtext mt-6">
          If this problem persists, please contact support
        </ThemedText>
      </ScrollView>
    </View>
  );
}
