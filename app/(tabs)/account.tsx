import React, { useState } from 'react';
import { View, ImageBackground, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { BlurView } from 'expo-blur';

import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import ListLink from '@/components/ListLink';
import { GlassToggle, GlassCard } from '../../components/LiquidGlass';
import Expandable from '@/components/Expandable';
import Input from '@/components/forms/Input';
import Avatar from '@/components/Avatar';
import ThemeToggle from '@/components/ThemeToggle';
import Header from '@/components/Header';

export default function AccountScreen() {
    const insets = useSafeAreaInsets();
    const [verification, setVerification] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [syncContacts, setSyncContacts] = useState(false);
    const [privateAccount, setPrivateAccount] = useState(false);
    const [readReceipts, setReadReceipts] = useState(true);

    return (
        <View className="flex-1 bg-background">
            <Header 
                leftComponent={<Avatar src={require('@/assets/img/user.png')} size="sm" />}
                rightComponents={[<ThemeToggle key="theme" />]}
            />
            <ThemedScroller contentContainerStyle={{ paddingBottom: 120 }}>
                <Section title="Account" titleSize="4xl" className="mt-10 mb-10" />
                
                {/* Subscription Card */}
                <SubscribeCard />

                {/* Settings Section */}
                <Section title="Settings" titleSize="lg" className="mt-10 mb-4">
                    <View className="rounded-2xl overflow-hidden">
                        <ListLink 
                            title="Notifications" 
                            description="Customize how you get updates" 
                            showChevron 
                            icon="Bell" 
                            href="/screens/notification-settings" 
                        />
                        <ListLink 
                            title="Help" 
                            description="Get help with your account" 
                            showChevron 
                            icon="HelpCircle" 
                            href="/screens/help" 
                        />
                        <ListLink 
                            title="Edit Profile" 
                            description="Manage your profile" 
                            showChevron 
                            icon="User" 
                            href="/screens/edit-profile" 
                        />
                        <ListLink 
                            title="Language" 
                            description="Change your language" 
                            showChevron 
                            icon="Globe" 
                            href="/screens/languages" 
                        />
                        <ListLink 
                            title="Logout" 
                            className="!border-b-0" 
                            description="Logout of your account" 
                            icon="LogOut" 
                            href="/screens/welcome" 
                        />
                    </View>
                </Section>

                {/* Security Section */}
                <Section title="Security" titleSize="lg" className="mt-10 mb-4">
                    <View className="rounded-2xl overflow-hidden">
                        <Expandable 
                            title="Passcode" 
                            description="Enable a passcode to secure your account" 
                            icon="KeyRound"
                        >
                            <Input placeholder="Password" secureTextEntry />
                            <Input placeholder="Repeat password" secureTextEntry />
                        </Expandable>
                        <Expandable
                            title="2-step verification"
                            className="!border-b-0"
                            description="Status: On"
                            icon="Fingerprint"
                        >
                            <GlassCard className="p-4 mb-6" gradient>
                                <GlassToggle
                                    label="Enable 2-step verification"
                                    value={verification}
                                    onValueChange={setVerification}
                                    size="medium"
                                />
                            </GlassCard>
                        </Expandable>
                    </View>
                </Section>

                {/* Privacy Section */}
                <Section title="Privacy" titleSize="lg" className="mt-10 mb-4">
                    <GlassCard className="p-6" gradient>
                        <GlassToggle
                            label="Sync your contacts"
                            value={syncContacts}
                            onValueChange={setSyncContacts}
                            size="medium"
                        />

                        <View className="h-4" />

                        <GlassToggle
                            label="Location sharing"
                            value={locationTracking}
                            onValueChange={setLocationTracking}
                            size="medium"
                        />

                        <View className="h-4" />

                        <GlassToggle
                            label="Private account"
                            value={privateAccount}
                            onValueChange={setPrivateAccount}
                            size="medium"
                        />

                        <View className="h-4" />

                        <GlassToggle
                            label="Read receipts"
                            value={readReceipts}
                            onValueChange={setReadReceipts}
                            size="medium"
                        />
                    </GlassCard>
                </Section>
            </ThemedScroller>
        </View>
    );
}

const SubscribeCard = () => {
    return (
        <Link asChild href="/screens/subscription">
            <Pressable className="bg-rose-500 flex flex-row rounded-3xl overflow-hidden w-full">
                <ImageBackground 
                    source={require('@/assets/img/livin.png')} 
                    className="flex-row items-center min-h-[180px] pl-8 pr-6 flex-1"
                    imageStyle={{ borderRadius: 24 }}
                >
                    <BlurView
                        intensity={10}
                        tint="light"
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 24 }}
                    />
                    <View className="pr-6 w-2/3">
                        <ThemedText className="text-xl font-extrabold text-white">NOVAHOGAR.io</ThemedText>
                        <ThemedText className="text-sm font-extrabold text-white">Unleash your imagination</ThemedText>
                        <View className="px-3 py-2 bg-white rounded-lg mr-auto mt-3">
                            <Text className="text-black text-sm">Upgrade to novaHogar + </Text>
                        </View>
                    </View>
                </ImageBackground>
            </Pressable>
        </Link>
    );
};
