import React, { useState, useRef } from 'react';
import { View, Pressable, Image, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import useThemeColors from '@/app/_contexts/ThemeColors';
import { FEATURED_DESIGNS } from '@/app/_data/featuredDesigns';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import WebView3DModel from '@/components/WebView3DModel';
import { useLanguage } from '@/app/_contexts/LanguageContext';

// 3D furniture models from TinyGLB
const FURNITURE_3D_MODELS = [
  'https://cdn.tinyglb.com/models/7d7bbf4c7dc64c63b6682e54107a12bd.glb',
  'https://cdn.tinyglb.com/models/448daa85f82d4b6a8161082c40ac0ef7.glb',
  'https://cdn.tinyglb.com/models/f17a8822499146be98f59b2f787eb51d.glb',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExploreScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const modelScrollRef = useRef<ScrollView>(null);

  const handleModelScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = SCREEN_WIDTH - 32;
    const gap = 12;
    // Account for the card width + gap when calculating index
    const index = Math.round(offsetX / (cardWidth + gap));
    setCurrentModelIndex(Math.max(0, Math.min(index, FURNITURE_3D_MODELS.length - 1)));
  };

  // Tips for better results - using translations
  const TIPS = [
    { id: '1', icon: 'Camera' as const, titleKey: 'goodLighting' as const, descKey: 'goodLightingDesc' as const },
    { id: '2', icon: 'Maximize' as const, titleKey: 'wideAngle' as const, descKey: 'wideAngleDesc' as const },
    { id: '3', icon: 'Sparkles' as const, titleKey: 'clearSpace' as const, descKey: 'clearSpaceDesc' as const },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="items-center px-global py-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Image
          source={require('@/assets/img/logo.png')}
          style={{ width: 180, height: 50 }}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <AnimatedView animation="fadeInUp" className="mt-4" style={{ paddingHorizontal: 4 }}>
          <Link href="/(tabs)/create" asChild>
            <Pressable className="bg-green-900 rounded-3xl overflow-hidden">
              <View className="p-6">
                <View className="flex-row items-center gap-2 mb-2">
                  <Icon name="Sparkles" size={25} color="white" />
                  <ThemedText className="text-white text-2xl font-bold mb-2">
                    {t('startTransforming')}
                  </ThemedText>
                </View>

                <ThemedText className="text-white/80 mb-4">
                  {t('takePhoto')}
                </ThemedText>
                <View className="flex-row items-center justify-center gap-12">
                  <View className="px-14 py-4 rounded-full bg-white/90">
                    <ThemedText className="text-black font-semibold">{t('startNow')}</ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          </Link>
        </AnimatedView>

        {/* Before/After Demo */}
        <AnimatedView animation="fadeInUp" delay={50} className="mt-6 px-4">
          <View className="mb-3">
            <ThemedText className="text-lg font-bold">{t('beforeAfter')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('dragSlider')}
            </ThemedText>
          </View>
          <BeforeAfterSlider
            beforeImage={require('@/assets/img/IMG_1238.jpg')}
            afterImage={require('@/assets/img/IMG_1239.jpg')}
            width={SCREEN_WIDTH - 32}
            height={280}
            borderRadius={20}
          />
        </AnimatedView>

        {/* Get Inspired */}
        <AnimatedView animation="fadeInUp" delay={150} className="mt-8">
          <View className="flex-row items-center justify-between px-global mb-4">
            <ThemedText className="text-lg font-bold">{t('getInspired')}</ThemedText>
            <Pressable>
              <ThemedText className="font-medium" style={{ color: colors.accent }}>
                {t('seeAll')}
              </ThemedText>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {FEATURED_DESIGNS.map((design) => (
              <Link key={design.id} href={`/screens/featured-design/${design.id}`} asChild>
                <Pressable className="w-64">
                  <View className="rounded-2xl overflow-hidden">
                    <Image
                      source={design.image}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                  </View>
                  <ThemedText className="font-semibold mt-2">{design.title}</ThemedText>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {design.style}
                  </ThemedText>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </AnimatedView>

        {/* Interactive 3D Model Viewer - Carousel */}
        <AnimatedView animation="fadeInUp" delay={100} className="mt-6">
          <View className="mb-3 px-4">
            <ThemedText className="text-lg font-bold">{t('furniture3D')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('furniture3DHelp')}
            </ThemedText>
          </View>
          
          {/* Model Carousel */}
          <ScrollView
            ref={modelScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleModelScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToOffsets={FURNITURE_3D_MODELS.map((_, i) => i * (SCREEN_WIDTH - 32 + 12))}
            snapToAlignment="start"
            contentInset={{ left: 16, right: 16 }}
            contentOffset={{ x: -16, y: 0 }}
          >
            {FURNITURE_3D_MODELS.map((modelUrl, index) => (
              <View
                key={index}
                style={{
                  width: SCREEN_WIDTH - 32,
                  height: 320,
                  borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: colors.bg,
                  marginLeft: index === 0 ? 16 : 0,
                  marginRight: index < FURNITURE_3D_MODELS.length - 1 ? 12 : 16,
                }}
              >
                <WebView3DModel
                  modelUrl={modelUrl}
                  width={SCREEN_WIDTH - 32}
                  height={320}
                  autoRotate
                  cameraControls
                  backgroundColor={colors.bg}
                />
              </View>
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          <View className="flex-row justify-center mt-3 gap-2">
            {FURNITURE_3D_MODELS.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentModelIndex === index ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentModelIndex === index ? colors.accent : colors.border,
                }}
              />
            ))}
          </View>
        </AnimatedView>

        {/* Tips Section */}
        <AnimatedView animation="fadeInUp" delay={250} className="mt-8" style={{ paddingHorizontal: 4 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <ThemedText className="text-3xl font-black">{t('tipsTitle')}</ThemedText>
          </View>
          <View className="gap-3" style={{ paddingHorizontal: 4 }}>
            {TIPS.map((tip) => {
              const tipHref =
                tip.id === '1'
                  ? '/screens/lighting-tips'
                  : tip.id === '2'
                    ? '/screens/wide-angle-tips'
                    : tip.id === '3'
                      ? '/screens/clear-space-tips'
                      : null;
              const content = (
                <>
                  <View className="w-12 h-12 rounded-full items-center justify-center">
                    <Icon name={tip.icon} size={22} color={colors.iconAccent} />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="font-semibold">{t(tip.titleKey)}</ThemedText>
                    <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                      {t(tip.descKey)}
                    </ThemedText>
                  </View>
                  {tipHref && <Icon name="ChevronRight" size={18} color={colors.placeholder} />}
                </>
              );

              const itemClassName = 'flex-row items-center rounded-2xl p-4 gap-4';

              if (tipHref) {
                return (
                  <Link key={tip.id} href={tipHref} asChild>
                    <Pressable className={itemClassName}>{content}</Pressable>
                  </Link>
                );
              }

              return (
                <View key={tip.id} className={itemClassName}>
                  {content}
                </View>
              );
            })}
          </View>
        </AnimatedView>

        {/* Stats Section */}
        <AnimatedView animation="fadeInUp" delay={350} className="mt-8" style={{ paddingHorizontal: 4 }}>
          <View className="bg-gray-100 border-border rounded-3xl p-6">
            <ThemedText className="text-lg font-bold mb-4">{t('yourActivity')}</ThemedText>
            <View className="flex-row">
              <View className="flex-1 items-center">
                <ThemedText className="text-3xl font-bold" style={{ color: colors.accent }}>
                  0
                </ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('designsCreated')}
                </ThemedText>
              </View>
              <View className="w-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-1 items-center">
                <ThemedText className="text-3xl font-bold" style={{ color: colors.accent }}>
                  0
                </ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('roomsSaved')}
                </ThemedText>
              </View>
              <View className="w-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-1 items-center">
                <ThemedText className="text-3xl font-bold" style={{ color: colors.accent }}>
                  0
                </ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('favorites')}
                </ThemedText>
              </View>
            </View>
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
}
