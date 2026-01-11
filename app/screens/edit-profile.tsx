import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import Input from '@/components/forms/Input';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { GlassToggle, GlassCard } from '../../components/LiquidGlass';
import { useTheme } from '../contexts/ThemeContext';

export default function EditProfileScreen() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(true);
  const { theme } = useTheme();

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <>
      <Header showBackButton
        title="Profile Settings"
        rightComponents={[
          <Button title="Save changes" />
        ]}
      />
      <ThemedScroller>

        <View className="items-center flex-col mb-8 my-14  rounded-2xl">
          <TouchableOpacity
            onPress={pickImage}
            className="relative"
            activeOpacity={0.9}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-28 h-28 rounded-full"
              />
            ) : (
              <View className="w-28 h-28 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <Icon name="Plus" size={25} className="text-light-subtext dark:text-dark-subtext" />
              </View>
            )}

          </TouchableOpacity>
          <View className='mt-4'>
            <Button variant='outline' title={profileImage ? 'Change photo' : 'Upload photo'} className="text-sm text-light-subtext dark:text-dark-subtext" onPress={pickImage} />

            {profileImage && (
              <Button
                className='mt-2'
                title="Remove photo"
                variant="outline"
                onPress={() => setProfileImage(null)}
              />
            )}
          </View>
        </View>
        <View className='px-global pt-10 pb-4 rounded-2xl'>
          <Input
            label="Nickname"
            value=""
            variant='underlined'
            keyboardType="email-address"
            autoCapitalize="none"
          //containerClassName='mt-8' 
          />
          <Input
            label="Name"
            value=""
            variant='underlined'
            containerClassName='flex-1'
            keyboardType="email-address"
            autoCapitalize="none" />

          <Input
            label="Email"
            keyboardType="email-address"
            value=""
            variant='underlined'
            autoCapitalize="none"
            containerClassName='mb-6' />

          <GlassCard className="p-6" gradient>
            <GlassToggle
              label="Show email"
              value={showEmail}
              onValueChange={setShowEmail}
              size="medium"
            />

            <View className="h-4" />

            <GlassToggle
              label="Private account"
              value={privateAccount}
              onValueChange={setPrivateAccount}
              size="medium"
            />
          </GlassCard>
        </View>




      </ThemedScroller>
    </>
  );
}


