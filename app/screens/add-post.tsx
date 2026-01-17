import Header from '@/components/Header';
import React, { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '../_contexts/ThemeColors';
import Icon from '@/components/Icon';
import ThemedFooter from '@/components/ThemeFooter';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import { CardScroller } from '@/components/CardScroller';
import * as ImagePicker from 'expo-image-picker';
import AnimatedView from '@/components/AnimatedView';
import { Stack } from 'expo-router';

const galleryImages = [
    require('@/assets/img/scify-1.jpg'),
    require('@/assets/img/scify-2.jpg'),
    require('@/assets/img/scify-3.jpg'),
    require('@/assets/img/scify-4.jpg'),
    require('@/assets/img/scify-5.jpg'),
];

export default function AddPostScreen() {
    const colors = useThemeColors();
    const filterSheetRef = useRef<ActionSheetRef>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, result.assets[0].uri]);
        }
    };

    const selectGalleryImage = (imageSource: any) => {
        const uri = Image.resolveAssetSource(imageSource).uri;
        if (!selectedImages.includes(uri)) {
            setSelectedImages([...selectedImages, uri]);
        }
    };

    const removeImage = (uri: string) => {
        setSelectedImages(selectedImages.filter(img => img !== uri));
    };
    return (
        <>
            <Stack.Screen options={{ animation: 'slide_from_bottom', animationDuration: 250 }} />
            <Header
                showCloseButton
                rightComponents={[<Button href='/(drawer)/(tabs)/archive' size='small' className='-mr-2' textClassName='!text-highlight' variant='ghost' title="Save draft" />, <Button href='/(drawer)/(tabs)/archive' size='small' title="Create" />]}
            />

            <View className="flex-1 bg-background">
                <View>
                    <View className='px-global'>
                        <View className='border border-border bg-secondary rounded-2xl w-full'>
                            <TextInput textAlignVertical='top' style={{ height: 140 }} placeholderTextColor={colors.placeholder} className='text-base rounded-2xl p-4 w-full text-text ' placeholder="Describe your image" multiline numberOfLines={10} />
                            {selectedImages.length > 0 && (
                                <CardScroller className='mb-2 px-2 border-t border-border pt-2' space={4}>
                                    {selectedImages.map((uri, index) => (
                                        <AnimatedView animation="scaleIn" key={index} className="w-16 h-16 relative">
                                            <Pressable onPress={() => removeImage(uri)} className='absolute top-1 right-1 z-50 bg-background w-6 h-6 rounded-full items-center justify-center'>
                                                <Icon name="Trash" size={12} />
                                            </Pressable>
                                            <Image source={{ uri }} className='w-full h-full rounded-lg' />
                                        </AnimatedView>

                                    ))}
                                    <Pressable onPress={pickImage} className='w-16 h-16 rounded-lg border border-border items-center justify-center'>
                                        <Icon name="Plus" size={14} />
                                    </Pressable>
                                </CardScroller>
                            )}
                            <View className='flex flex-row border-t border-border items-center pr-2'>
                                <Icon name="ImagePlus" size={18} onPress={pickImage} className='p-2' />
                                <Icon name="SlidersHorizontal" size={18} onPress={() => filterSheetRef.current?.show()} className='p-2' />
                                <Icon name="Mic" size={18} onPress={pickImage} className=' ml-auto p-1 bg-background rounded-full' />
                            </View>
                        </View>

                    </View>
                </View>


            </View>
            <ThemedFooter className='!px-0'>
                <CardScroller className='mb-2 px-global' space={4} title='Remix recent images'>
                    
                    {galleryImages.map((image, index) => (
                        <Pressable key={index} onPress={() => selectGalleryImage(image)}>
                            <Image source={image} className='w-24 h-24 rounded-lg' />
                        </Pressable>
                    ))}
                    <View className='w-24 h-24 rounded-lg ' />
                </CardScroller>
                
            </ThemedFooter>
            <FilterSheet ref={filterSheetRef} />
        </>
    );
}

const FilterSheet = React.forwardRef<ActionSheetRef>((props, ref) => {
    return (
        <ActionSheetThemed
            gestureEnabled
            ref={ref}>
            <View className='p-global'>
                <ThemedText className='text-2xl font-bold mb-4'>Orientation</ThemedText>
                <SheetItem isSelected icon="Square" name='Square' label='1:1 ratio' />
                <SheetItem icon="RectangleVertical" name='Portrait' label='9:16 ratio' />
                <SheetItem icon="RectangleHorizontal" name='Landscape' label='16:9 ratio' />
            </View>
        </ActionSheetThemed>
    );
});

const SheetItem = (props: any) => {
    return (
        <Pressable className='flex-row items-center  bg-secondary rounded-2xl py-4'>
            <View className='relative mr-4'>
                <Icon name={props.icon} size={24} />

            </View>
            <View className='flex-1'>
                <ThemedText className='font-semibold text-xl'>{props.name}</ThemedText>
                <ThemedText className='text-sm'>{props.label}</ThemedText>
            </View>
            {props.isSelected && <Icon name='Check' color='white' size={14} strokeWidth={2} className='w-7 h-7 bg-highlight rounded-full border-2 border-secondary' />}
        </Pressable>
    );
}


