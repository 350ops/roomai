import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { GlassToggle, GlassCard } from "../../components/LiquidGlass";
import React, { useRef, useState } from "react";
import Expandable from "@/components/Expandable";
import Input from "@/components/forms/Input";
import ListLink from "@/components/ListLink";
import { ActionSheetRef } from "react-native-actions-sheet";
import ActionSheetThemed from "@/components/ActionSheetThemed";
import { View } from "react-native";
import ThemedText from "@/components/ThemedText";
import { Button } from "@/components/Button";

export default function CardControlsScreen() {
    const [verification, setVerification] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [syncContacts, setSyncContacts] = useState(false);
    const [privateAccount, setPrivateAccount] = useState(false);
    const [readReceipts, setReadReceipts] = useState(true);
    const logoutDrawerRef = useRef<ActionSheetRef>(null);
    return (
        <>
            <Header showBackButton />
            <ThemedScroller>
                <Section title="Security and privacy" titleSize="4xl" className="mt-4 mb-10" />
                <Section title="Security" titleSize="2xl" className="mt-10 mb-4">
                    <Expandable title="Passcode" description="Enable a passcode to secure your account" icon="KeyRound">
                        <Input placeholder="Password" secureTextEntry />
                        <Input placeholder="Repeat password" secureTextEntry />
                    </Expandable>
                    <Expandable title="2-step verification" description="Status: On" icon="Fingerprint">
                        <GlassCard className="p-4 mb-6" gradient>
                            <GlassToggle
                                label="Enable 2-step verification"
                                value={verification}
                                onValueChange={setVerification}
                                size="medium"
                            />
                        </GlassCard>
                    </Expandable>
                    <ListLink title="Logout" onPress={() => { logoutDrawerRef.current?.show() }} description="Logout of your account" icon="LogOut" />
                </Section>

                <Section title="Privacy" titleSize="2xl" className="mt-10 mb-4">
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
            <LogoutDrawer ref={logoutDrawerRef} />
        </>
    )
}


const LogoutDrawer = React.forwardRef<ActionSheetRef>((props, ref) => {
    return (
        <ActionSheetThemed
            gestureEnabled
            ref={ref}>
            <View className='p-global pt-10 items-center'>
                <ThemedText className='text-3xl font-bold'>Logout?</ThemedText>
                <ThemedText className='text-base text-center mb-4'>Are you sure you want to logout of your account?</ThemedText>
                <View className="flex-row items-center justify-center gap-2 mt-14">
                    <Button title="Cancel" className="flex-1" variant="outline" rounded="full" />
                    <Button title="Logout" className="flex-1" rounded="full" />
                </View>
            </View>
        </ActionSheetThemed>
    );
});
