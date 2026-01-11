import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Chip } from '@/components/Chip';
import { Placeholder } from '@/components/Placeholder';
import useThemeColors from '@/app/contexts/ThemeColors';
import { getFeaturedDesign } from '@/app/data/featuredDesigns';

export default function FeaturedDesignScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string }>();
  const design = getFeaturedDesign(params.id);

  if (!design) {
    return (
      <View className="flex-1 bg-background">
        <Header showBackButton title="Inspiration" />
        <Placeholder
          title="Design not found"
          subtitle="Pick another inspiration card to view the details."
          button="Back to Explore"
          href="/(tabs)/index"
          className="flex-1"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header showBackButton title={design.title} />
      <ThemedScroller className="!px-0 !pt-0">
        <Image source={design.image} className="w-full h-64" resizeMode="cover" />

        <View className="px-global pt-4 pb-10">
          <View className="flex-row items-center justify-between">
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {design.room}
            </ThemedText>
            <View className="bg-secondary rounded-full px-3 py-1">
              <ThemedText className="text-xs font-semibold">{design.style}</ThemedText>
            </View>
          </View>

          <ThemedText className="text-lg font-bold mt-3">Look and Feel</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-2">
            {design.description}
          </ThemedText>

          {design.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {design.tags.map((tag) => (
                <Chip key={tag} label={tag} size="sm" />
              ))}
            </View>
          )}

          <View className="mt-6">
            <ThemedText className="text-lg font-bold mb-3">Key Elements</ThemedText>
            <View className="gap-2">
              {design.keyElements.map((element) => (
                <View key={element} className="flex-row items-start gap-2">
                  <View
                    className="w-2 h-2 rounded-full mt-2"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <ThemedText className="text-sm flex-1">{element}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6">
            <ThemedText className="text-lg font-bold mb-3">Palette</ThemedText>
            <View className="flex-row gap-3">
              {design.palette.map((color) => (
                <View
                  key={color}
                  className="w-10 h-10 rounded-full border"
                  style={{ backgroundColor: color, borderColor: colors.border }}
                />
              ))}
            </View>
          </View>

          <Link href="/(tabs)/create" asChild>
            <Pressable className="mt-8 bg-text rounded-full py-4 items-center">
              <ThemedText className="text-white font-semibold">Use this style</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ThemedScroller>
    </View>
  );
}
