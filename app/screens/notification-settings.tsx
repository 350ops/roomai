import { View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { GlassToggle, GlassCard } from "../../components/LiquidGlass";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function NotificationSettingsScreen() {
    const [generationComplete, setGenerationComplete] = useState(true);
    const [projectUpdates, setProjectUpdates] = useState(false);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const { theme } = useTheme();

    const dividerColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

    return (
        <>
            <Header showBackButton />
            <ThemedScroller className="p-global">
                <Section title="Notification Settings" titleSize="4xl" className="mt-4 mb-10" />

                <GlassCard className="px-6 py-2" gradient>
                    <GlassToggle
                        label="Generation complete"
                        value={generationComplete}
                        onValueChange={setGenerationComplete}
                        size="medium"
                    />

                    <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 0 }} />

                    <GlassToggle
                        label="Project updates"
                        value={projectUpdates}
                        onValueChange={setProjectUpdates}
                        size="medium"
                    />

                    <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 0 }} />

                    <GlassToggle
                        label="Marketing emails"
                        value={marketingEmails}
                        onValueChange={setMarketingEmails}
                        size="medium"
                    />
                </GlassCard>
            </ThemedScroller>
        </>
    )
}

