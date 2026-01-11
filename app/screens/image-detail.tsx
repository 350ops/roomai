import React from 'react';
import Header, { HeaderIcon } from '@/components/Header';
import { View, Image, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function ImageDetail() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Header variant="transparent" middleComponent={<Text className="text-lg text-white font-bold">Nov 25, 2025</Text>} showBackButton rightComponents={[<HeaderIcon icon="Trash" />]} />

      <View className="flex-1 items-center justify-center">
        <Image source={require('@/assets/img/scify-4.jpg')} className="w-full h-full" />
      </View>
      <View style={{ bottom: insets.bottom }} className='absolute bottom-0 left-0 right-0 px-global'>
        <Pressable className="w-full py-3 px-global items-center justify-center bg-text rounded-2xl">
          <Text className="text-invert">Remix</Text>
        </Pressable>
      </View>


    </>

  );
}
