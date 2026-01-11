import Header, { HeaderIcon } from "@/components/Header";
import ThemedText from "@/components/ThemedText";
import ThemedScroller from "@/components/ThemeScroller";
import React, { useRef, useState } from "react";
import { Image, Pressable, View, Dimensions, Text } from "react-native";
import ActionSheetThemed from "@/components/ActionSheetThemed";
import { ActionSheetRef } from "react-native-actions-sheet";
import Avatar from "@/components/Avatar";
import Icon from "@/components/Icon";
import Favorite from "@/components/Favorite";
import { Button } from "@/components/Button";

const similarImages = [
    { id: 1, source: require("@/assets/img/scify-1.jpg") },
    { id: 2, source: require("@/assets/img/scify-3.jpg") },
    { id: 3, source: require("@/assets/img/scify-4.jpg") },
    { id: 4, source: require("@/assets/img/scify-5.jpg") },
];

export default function PostScreen() {
    const [isLiked, setIsLiked] = useState(false);
    const [activeTab, setActiveTab] = useState<'subject' | 'vibes'>('subject');
    const userActionsSheetRef = useRef<ActionSheetRef>(null);
    const { width } = Dimensions.get('window');

    return (
        <>
            <Header
                showBackButton
                rightComponents={[
                    <HeaderIcon icon="Ellipsis" onPress={() => userActionsSheetRef.current?.show()} />,
                    <Favorite />,
                    <HeaderIcon icon="Download" />
                ]}
            />

            <ThemedScroller className="!px-0 !pt-0">
                <View className="w-full flex-row px-global items-center mb-4 ">
                    <Avatar size="sm" src={require("@/assets/img/user.png")} link="/screens/user-profile" />
                    <View className="ml-3">
                        <ThemedText className="text-base font-medium">" "</ThemedText>
                        <ThemedText className="text-sm opacity-50">1h ago</ThemedText>
                    </View>
                </View>
                <Image
                    source={require("@/assets/img/scify-2.jpg")}
                    style={{ width: '100%', height: width * 1.2 }}
                    resizeMode="cover"
                />
                <View className="p-global">
                    <View className="flex-row gap-2 mb-2">
                        <View className="w-8 h-8 rounded-full bg-rose-500" />
                        <View className="w-8 h-8 rounded-full bg-purple-900" />
                        <View className="w-8 h-8 rounded-full bg-blue-900" />
                    </View>
                    <View className="flex-row items-center justify-between">
                        <ThemedText className="text-sm font-bold mb-2">Prompt</ThemedText>
                        <Icon name="Copy" size={16} />
                    </View>
                    <ThemedText className="text-base opacity-60">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</ThemedText>
                    <Button iconStart="Sparkles" title="Remix" className="mt-4 !rounded-xl" />
                </View>

                <View className="px-global py-4 border-t-4 border-darker">


                    <View className="mt-6">
                        <ThemedText className="text-2xl font-bold mb-4">Similar images</ThemedText>

                        <View className="flex-row gap-2 mb-4">
                            <Pressable
                                onPress={() => setActiveTab('subject')}
                                className={`flex-1 py-2 rounded-xl ${activeTab === 'subject' ? 'bg-text' : 'bg-secondary'}`}
                            >
                                <ThemedText className={`text-center text-xs font-semibold ${activeTab === 'subject' ? '!text-background' : 'text-text'}`}>
                                    By Subject
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveTab('vibes')}
                                className={`flex-1 py-2 rounded-xl ${activeTab === 'vibes' ? 'bg-text' : 'bg-secondary'}`}
                            >
                                <ThemedText className={`text-center text-xs font-semibold ${activeTab === 'vibes' ? '!text-background' : 'text-text'}`}>
                                    By Vibes
                                </ThemedText>
                            </Pressable>
                        </View>

                        <View className="flex-row flex-wrap gap-2">
                            {similarImages.map((img) => (
                                <View key={img.id} className="w-[48%] aspect-square">
                                    <Image
                                        source={img.source}
                                        className="w-full h-full rounded-xl"
                                        resizeMode="cover"
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ThemedScroller>

            <UserActionsSheet ref={userActionsSheetRef} />
        </>
    );
}

const UserActionsSheet = React.forwardRef<ActionSheetRef>((props, ref) => {
    return (
        <ActionSheetThemed gestureEnabled ref={ref}>
            <View className='p-global'>
                <SheetItem icon="Image" name='Use to create image' hasArrow />
                <SheetItem icon="Video" name='Use to create video' hasArrow />
                <SheetItem icon="Edit" name='Edit' />
                <SheetItem icon="Wand2" name='Add FX' />
                <View className="h-px bg-border my-2" />
                <SheetItem icon="Plus" name='Add to collection' />
                <View className="h-px bg-border my-2" />
                <SheetItem icon="Share2" name='Share to Twitter' />
                <SheetItem icon="Flag" name='Report' hasArrow />
            </View>
        </ActionSheetThemed>
    );
});

const SheetItem = (props: any) => {
    return (
        <Pressable onPress={props.onPress} className='flex-row items-center py-4'>
            <Icon name={props.icon} size={22} className="mr-4" />
            <ThemedText className='text-lg flex-1'>{props.name}</ThemedText>
            {props.hasArrow && <Icon name="ChevronRight" size={20} />}
        </Pressable>
    );
};

