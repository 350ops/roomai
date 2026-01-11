import { Button, TouchableOpacity, View } from "react-native";
import Header from "@/components/Header";
import ThemedScroller from "@/components/ThemeScroller";
import Section from "@/components/layout/Section";
import { useState } from "react";
import Icon from "@/components/Icon";
import AnimatedView from "@/components/AnimatedView";
import ThemedText from "@/components/ThemedText";
import { SvgXml } from 'react-native-svg';
import { US, ES, PT, FR, DE, IT, SA, TR } from 'country-flag-icons/string/3x2';

interface Language {
    title: string;
    code: string;
    flag: string;
}

export default function LanguagesScreen() {
    const languages: Language[] = [
        { title: "English", code: "EN", flag: US },
        { title: "Spanish", code: "ES", flag: ES },
        { title: "Portuguese", code: "PT", flag: PT },
  
    ];

    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    return (
        <>
            <Header showBackButton />
            <ThemedScroller className="p-global">
                <Section title="Choose Language" titleSize="4xl" className="mt-4 mb-10" />
                <View className="rounded-2xl overflow-hidden">
                    {languages.map((language, index) => (
                        <LanguageItem key={index} title={language.title} code={language.code} flag={language.flag} selected={selectedLanguage === language.title} onSelect={() => { setSelectedLanguage(language.title) }} />
                    ))}
                </View>
            </ThemedScroller>
        </>
    )
}

interface LanguageItemProps {
    title: string;
    code: string;
    flag: string;
    selected: boolean;
    onSelect: () => void;
}

const LanguageItem = ({ title, code, flag, selected, onSelect }: LanguageItemProps) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSelect}
            className={`flex-row items-center py-4 px-6 border-b border-border ${selected ? 'opacity-100' : 'opacity-100 '}`}
        >
            <View className="w-7 h-7 mr-6 rounded overflow-hidden">
                <SvgXml
                    xml={flag}
                    width={28}
                    height={28}
                />
            </View>
            <View className="flex-1">
                <ThemedText className='text-lg font-bold'>{title}</ThemedText>
                <ThemedText className='text-sm opacity-60'>{code}</ThemedText>
            </View>
            {selected &&
                <AnimatedView animation="bounceIn" duration={500}>
                    <Icon name="Check" size={16} className="w-7 h-7 bg-highlight rounded-full" />
                </AnimatedView>
            }
        </TouchableOpacity>
    );
};

