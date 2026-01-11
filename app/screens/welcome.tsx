import { View, Text, FlatList, Dimensions, Pressable, ImageBackground } from 'react-native';
import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconName } from '@/components/Icon';

const { width } = Dimensions.get('window');

interface SlideData {
    id: string;
    title: string;
    image: any;
    description: string;
    icon: string;
}

const slides: SlideData[] = [
    {
        id: '1',
        title: 'Unleash your imagination',
        image: require('@/assets/img/kitch.png'),
        description: 'Generate stunning designs for your next project',
        icon: 'Sparkles'
    },
    {
        id: '2',
        title: 'Get personalized content',
        image: require('@/assets/img/livin.png'),
        description: 'Get personalized content based on your interests and preferences',
        icon: 'Heart'
    },
    {
        id: '3',
        title: 'Redesign your space',
        image: require('@/assets/img/bathr.png'),
        description: 'Get personalized content based on your interests and preferences',
        icon: 'Home'
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const insets = useSafeAreaInsets();

    const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
    };

    return (
        <View style={{}} className='flex-1 bg-background'>

            <View className="flex-1 relative bg-background">
                <ImageBackground
                    source={require('@/assets/img/welcome.jpg')}
                    className='w-full h-full absolute top-0 left-0'
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', }}
                    >
                    <FlatList
                        className='w-full h-full'
                        data={slides}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        snapToInterval={width}
                        renderItem={({ item }) => (
                            <View style={{ width }} className="items-center justify-center">




                                <View className="items-center justify-center mt-8 flex-1" style={{}}>
                                    <Icon name={item.icon as IconName} size={30} strokeWidth={1} color="white" className='w-20 h-20 bg-black/20 border border-white/40 rounded-full' />
                                    <Text className="text-3xl font-outfit-bold text-center mt-6 text-white">
                                        {item.title}
                                    </Text>
                                    <Text className="text-center text-white opacity-80 text-lg px-20">
                                        {item.description}
                                    </Text>
                                </View>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                    />

                    <View className="flex-row justify-center mb-20 w-full absolute" style={{ top: insets.top + 10 }}>
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                className={`h-2 mx-1 rounded-full ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
                            />
                        ))}
                    </View>

                    <View style={{ bottom: insets.bottom }} className="w-full px-6 mb-global flex flex-col space-y-2 absolute bottom-0">
                        <View className='flex flex-row items-center justify-center gap-2'>
                            <Pressable
                                onPress={() => router.push('/screens/onboarding-start')}
                                className='flex-1 rounded-full flex flex-row items-center justify-center py-4'
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }}
                            >
                                <AntDesign name="google" size={22} color="white" />
                            </Pressable>
                            <Pressable
                                onPress={() => router.push('/screens/login')}
                                className='flex-1 w-1/4 rounded-full flex flex-row items-center justify-center py-4'
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                            >
                                <Icon name="Mail" size={20} color="black" />
                            </Pressable>
                            <Pressable
                                onPress={() => router.push('/screens/onboarding-start')}
                                className='flex-1 rounded-full flex flex-row items-center justify-center py-4'
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }}
                            >
                                <AntDesign name="apple" size={22} color="white" />
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
        </View >
    );
}
