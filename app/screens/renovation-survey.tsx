import React, { useState } from 'react';
import { View, ImageBackground, Pressable, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';

// Step Types
type SurveyStep = 'area' | 'extensiveness' | 'budget' | 'timeframe';

// Data Options
const AREAS = [
    { id: 'kitchen', label: 'Kitchen', icon: 'ChefHat' }, // Assuming ChefHat exists or similar, generic fallback
    { id: 'bathroom', label: 'Bathroom', icon: 'Droplet' },
    { id: 'living', label: 'Living Room', icon: 'Tv' },
    { id: 'bedroom', label: 'Bedroom', icon: 'Moon' },
    { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

const EXTENSIVENESS = [
    { id: 'light', label: 'Light refresh', description: 'Paint, minor repairs, decor updates' },
    { id: 'partial', label: 'Partial renovation', description: 'Replacing fixtures, cabinetry, flooring' },
    { id: 'full', label: 'Full remodel', description: 'Structural changes, complete overhaul' },
];

const BUDGETS = [
    { id: 'under-5k', label: 'Under 5,000 EUR' },
    { id: '5k-20k', label: '5,000 – 20,000 EUR' },
    { id: '20k-50k', label: '20,000 – 50,000 EUR' },
    { id: '50k-plus', label: '50,000+ EUR' },
];

const TIMEFRAMES = [
    { id: 'immediately', label: 'Immediately' },
    { id: '1-3-months', label: '1–3 months' },
    { id: '3-6-months', label: '3–6 months' },
    { id: '6-plus-months', label: '6+ months' },
];

export default function RenovationSurveyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();

    const [step, setStep] = useState<SurveyStep>('area');

    // State for selections
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [selectedExtensiveness, setSelectedExtensiveness] = useState<string | null>(null);
    const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);

    // Dropdown state for budget
    const [isBudgetOpen, setIsBudgetOpen] = useState(false);

    const handleNext = () => {
        switch (step) {
            case 'area':
                if (selectedArea) setStep('extensiveness');
                break;
            case 'extensiveness':
                if (selectedExtensiveness) setStep('budget');
                break;
            case 'budget':
                if (selectedBudget) setStep('timeframe');
                break;
            case 'timeframe':
                if (selectedTimeframe) {
                    // Finish survey - go to main tabs
                    router.push('/(tabs)');
                }
                break;
        }
    };

    const handleBack = () => {
        switch (step) {
            case 'area':
                router.back();
                break;
            case 'extensiveness':
                setStep('area');
                break;
            case 'budget':
                setStep('extensiveness');
                break;
            case 'timeframe':
                setStep('budget');
                break;
        }
    };

    const getInstructionText = () => {
        switch (step) {
            case 'area': return "Which area are you planning to renovate?";
            case 'extensiveness': return "How extensive is the renovation?";
            case 'budget': return "What is your approximate total budget?";
            case 'timeframe': return "What is your preferred time frame?";
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 'area': return !!selectedArea;
            case 'extensiveness': return !!selectedExtensiveness;
            case 'budget': return !!selectedBudget;
            case 'timeframe': return !!selectedTimeframe;
        }
    };

    // Render Components
    const renderAreaStep = () => (
        <View className="gap-3">
            {AREAS.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => setSelectedArea(item.id)}
                    className={`p-5 rounded-[25px] border flex-row items-center gap-4 transition-all ${selectedArea === item.id
                        ? 'bg-white/20 border-white'
                        : 'bg-black/40 border-white/10'
                        }`}
                >

                    <ThemedText className="text-white text-lg font-medium">{item.label}</ThemedText>

                </Pressable>
            ))}
        </View>
    );

    const renderExtensivenessStep = () => (
        <View className="gap-3">
            {EXTENSIVENESS.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => setSelectedExtensiveness(item.id)}
                    className={`p-5 rounded-[25px] border ${selectedExtensiveness === item.id
                        ? 'bg-white/20 border-white'
                        : 'bg-black/40 border-white/10'
                        }`}
                >
                    <ThemedText className="text-white text-xl font-bold mb-1">{item.label}</ThemedText>
                    <ThemedText className="text-white/70 text-sm">{item.description}</ThemedText>
                </Pressable>
            ))}
        </View>
    );

    const renderBudgetStep = () => (
        <View>
            <Pressable
                onPress={() => setIsBudgetOpen(true)}
                className="bg-black/40 border border-white/30 p-5 rounded-[25px] flex-row items-center justify-between"
            >
                <ThemedText className={`text-xl ${selectedBudget ? 'text-white font-semibold' : 'text-white/50'}`}>
                    {selectedBudget ? BUDGETS.find(b => b.id === selectedBudget)?.label : 'Select a budget range'}
                </ThemedText>
                <Icon name="ChevronDown" size={24} color="white" />
            </Pressable>

            <Modal
                visible={isBudgetOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsBudgetOpen(false)}
            >
                <Pressable
                    className="flex-1 bg-black/80 justify-end"
                    onPress={() => setIsBudgetOpen(false)}
                >
                    <View className="bg-background rounded-t-3xl p-6 min-h-[40%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <ThemedText className="text-xl font-bold">Select Budget</ThemedText>
                            <Pressable onPress={() => setIsBudgetOpen(false)}>
                                <Icon name="X" size={24} color={colors.text} />
                            </Pressable>
                        </View>
                        {BUDGETS.map((item) => (
                            <Pressable
                                key={item.id}
                                onPress={() => {
                                    setSelectedBudget(item.id);
                                    setIsBudgetOpen(false);
                                }}
                                className={`p-4 rounded-[25px] mb-3 ${selectedBudget === item.id ? 'bg-highlight' : 'bg-secondary'
                                    }`}
                            >
                                <ThemedText className={`text-lg font-medium ${selectedBudget === item.id ? 'text-white' : 'text-text'
                                    }`}>
                                    {item.label}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );

    const renderTimeframeStep = () => (
        <View className="gap-3">
            {TIMEFRAMES.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => setSelectedTimeframe(item.id)}
                    className={`p-5 rounded-[25px] border flex-row items-center justify-between ${selectedTimeframe === item.id
                        ? 'bg-white/20 border-white'
                        : 'bg-black/40 border-white/10'
                        }`}
                >
                    <ThemedText className="text-white text-lg font-medium">{item.label}</ThemedText>
                    {selectedTimeframe === item.id && (
                        <Icon name="Check" size={20} color="white" />
                    )}
                </Pressable>
            ))}
        </View>
    );

    return (
        <View className="flex-1">
            <StatusBar style="light" />
            <ImageBackground
                source={require('@/assets/img/mobile.png')}
                className="flex-1"
                resizeMode="cover"
            >
                <View className="flex-1 bg-black/30" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
                    {/* Header */}
                    <View className="px-6 py-4 flex-row items-center">
                        <Pressable
                            onPress={handleBack}
                            className="bg-white/20 p-2 rounded-full backdrop-blur-md"
                        >
                            <Icon name="ChevronLeft" size={24} color="white" />
                        </Pressable>
                        <View className="flex-1 items-end">
                            <View className="bg-white/20 px-3 py-1 rounded-full">
                                <ThemedText className="text-white font-semibold text-xs">
                                    Step {['area', 'extensiveness', 'budget', 'timeframe'].indexOf(step) + 1}/4
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="flex-1 px-8 justify-center">
                        <AnimatedView
                            key={step} // Key change triggers re-animation
                            animation="slideInRight"
                            duration={400}
                            className="w-full"
                        >
                            <ThemedText className="text-white text-3xl font-bold mb-8 leading-tight shadow-md">
                                {getInstructionText()}
                            </ThemedText>

                            {step === 'area' && renderAreaStep()}
                            {step === 'extensiveness' && renderExtensivenessStep()}
                            {step === 'budget' && renderBudgetStep()}
                            {step === 'timeframe' && renderTimeframeStep()}
                        </AnimatedView>
                    </View>

                    {/* Footer */}
                    <View className="px-8 py-6">
                        <Button
                            title={step === 'timeframe' ? 'Finish' : 'Next'}
                            onPress={handleNext}
                            disabled={!isStepValid()}
                            variant="primary"
                            size="large"
                            rounded="full"
                            className="shadow-lg"
                            textClassName="text-lg font-bold"
                        />
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}
