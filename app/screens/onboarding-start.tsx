import { View, Text, Pressable, ImageBackground } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { router } from 'expo-router';
import React from 'react';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View className='flex-1 bg-background'>
            <ImageBackground
                source={require('@/assets/img/bedr.png')}
                className='w-full h-full absolute top-0 left-0'

            >
                <View style={{ bottom: insets.bottom }} className="flex-1 px-10 relative items-start justify-end">
                    <ThemedText className='text-white text-3xl font-outfit-bold'>Welcome to your new home</ThemedText>
                    <ThemedText className='text-white text-lg'>Let's set up your account.</ThemedText>
                    <View className='flex flex-row items-center justify-center gap-2 mt-8'>
                        <Pressable
                            onPress={() => router.push('/screens/renovation-survey')}
                            className='flex-1 bg-black rounded-full flex flex-row items-center justify-center py-4'
                        >
                            <Text className='text-white text-lg font-semibold mr-4'>Let's get started</Text>
                            <Icon name="ArrowRight" size={20} color="white" />
                        </Pressable>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}
