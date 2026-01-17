import React, { useRef, useState } from 'react';
import { View, Pressable, ImageBackground, Text } from 'react-native';
import useThemeColors from '../_contexts/ThemeColors';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import ThemedFooter from '@/components/ThemeFooter';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chip } from '@/components/Chip';

export default function EditProfileScreen() {
    const [selectedPlan, setSelectedPlan] = useState('Monthly');
    const actionSheetRef = useRef<ActionSheetRef>(null);
    const insets = useSafeAreaInsets();
    return (
        <>

            <View className='flex-1'>
                <ImageBackground source={require('@/assets/img/bathr.png')} className='flex-1 bg-background px-global'>
                    <View style={{ paddingTop: insets.top }} className='justify-end items-end'>
                        <Icon name='X' onPress={() => router.back()} size={30} color="white"  />
                    </View>
                    <View className='flex-1 items-end justify-end'>
                        <View className='w-full my-10 pt-10 items-center'>
                            <Text className='font-extrabold text-black text-4xl text-center font-outfit-bold'>reForma +</Text>
                            <Text className='text-lg text-white font-light mt-1 text-center'>Unlock all premium features</Text>
                        </View>
                        <View className=' flex-row gap-2 mx-auto mb-6'>
                           <Chip label='No ads' size='md' isSelected className='bg-rose-500' />
                           <Chip label='Unlimited content access' isSelected size='md' className='bg-rose-500' />
                           <Chip label='Offline access' isSelected size='md' className='bg-rose-500' />
                        </View>

                        <SubscriptionCard
                            icon='Star'
                            title='Annual'
                            description='Unlock all premium features'
                            price='29 EUR'
                            active={selectedPlan === 'Annual'}
                            onPress={() => setSelectedPlan('Annual')}
                        />
                        <SubscriptionCard
                            icon='Trophy'
                            title='Monthly'
                            description='All premium features + goal tracker'
                            price='2.90 EUR'
                            discount='20%'
                            active={selectedPlan === 'Monthly'}
                            onPress={() => setSelectedPlan('Monthly')}
                        />

                    </View>
                    <ThemedFooter className='bg-transparent mt-auto'>
                        <Text className='text-sm text-white font-light text-center mb-4'>1 month free trial then 2.90 EUR/month</Text>
                        <Button onPress={() => actionSheetRef.current?.show()} className='!bg-highlight' textClassName='!text-white' size='large' rounded='full' title="Upgrade to plus" />
                    </ThemedFooter>

                </ImageBackground>
            </View>
            <ActionSheetThemed
                gestureEnabled
                containerStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingTop: 10,
                }}
                ref={actionSheetRef}>
                <View className='px-6 pt-10 items-center'>
                    <Icon name='Check' size={24} className='w-20 h-20 bg-background rounded-full mb-6' />
                    <ThemedText className='font-semibold text-4xl'>All setup</ThemedText>
                    <ThemedText className='text-lg text-center px-14 font-light mt-2 mb-32'>Hope you are satisfied. We will update you for the next subscription date.</ThemedText>
                    <Button onPress={() => actionSheetRef.current?.hide()} className='!bg-highlight !px-10' textClassName='!text-white' size='large' rounded='full' title="Upgrade to plus" />
                </View>
            </ActionSheetThemed>
        </>
    );
}

const SubscriptionCard = (props: any) => {
    const colors = useThemeColors()
    return (
        <Pressable onPress={props.onPress} className={`bg-black/50 rounded-2xl relative flex-row items-center border mb-2 ${props.active ? 'border-highlight' : ' border-white/20'}`}>


            <View className='py-6 px-6  flex-1 flex-row justify-start items-center'>

                {props.icon && <Icon name="Check" strokeWidth={3} size={18} color={props.active ? 'white' : 'transparent'} className={`rounded-full border w-8 h-8 mr-3 ${props.active ? 'bg-highlight border-highlight' : 'bg-white/10 border-border'}`} />}

                <Text className='font-semibold text-xl text-white'>{props.title}</Text>
                {props.discount && <ThemedText className='text-xs font-semibold bg-rose-500 text-highlight rounded-full px-2 py-1  ml-2'>{props.discount} off</ThemedText>}
                <Text className='text-lg  ml-auto text-white'>{props.price}</Text>

            </View>
        </Pressable>
    );
}

const CheckItem = (props: any) => {
    return (
        <View className='flex-row items-center my-3'>
            <Icon name="Check" strokeWidth={3} size={15} color={props.active ? 'white' : 'transparent'} className={`rounded-full w-7 h-7 mr-3 ${props.active ? 'bg-lime-500/20' : 'bg-transparent'}`} />
            <ThemedText className='font-semibold text-xl'>{props.title}</ThemedText>
        </View>
    );
}
