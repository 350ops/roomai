import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import ListLink from '@/components/ListLink';
import { GlassToggle, GlassCard } from '../../components/LiquidGlass';
import Expandable from '@/components/Expandable';
import Input from '@/components/forms/Input';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [verification, setVerification] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [syncContacts, setSyncContacts] = useState(false);
    const [privateAccount, setPrivateAccount] = useState(false);
    const [readReceipts, setReadReceipts] = useState(true);

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            <ThemedScroller contentContainerStyle={{ paddingBottom: 120 }}>
                <Section title="Settings" titleSize="4xl" className="mt-6 mb-6" />

                {/* Account Section */}
                <Section title="Account" titleSize="lg" className="mt-10 mb-4">
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

