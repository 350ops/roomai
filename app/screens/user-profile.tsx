import Header, { HeaderIcon } from "@/components/Header";

import React, { useCallback, useRef, useState } from "react";
import AnimatedView from "@/components/AnimatedView";
import ThemeTabs, { ThemeTab } from "@/components/ThemeTabs";
import { Pressable, View, Image } from "react-native";
import { MasonryGrid } from "@/components/Masonry";
import ThemedText from "@/components/ThemedText";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/Button";
import Icon from "@/components/Icon";
import { ActionSheetRef } from 'react-native-actions-sheet';
import ActionSheetThemed from "@/components/ActionSheetThemed";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const masonryImages = [
    { id: '1', uri: Image.resolveAssetSource(require('@/assets/img/scify-2.jpg')).uri, height: 200 },
    { id: '2', uri: Image.resolveAssetSource(require('@/assets/img/scify-3.jpg')).uri, height: 250 },
    { id: '3', uri: Image.resolveAssetSource(require('@/assets/img/scify-4.jpg')).uri, height: 200 },
    { id: '4', uri: Image.resolveAssetSource(require('@/assets/img/user-3.jpg')).uri, height: 200 },
    { id: '5', uri: Image.resolveAssetSource(require('@/assets/img/user-2.jpg')).uri, height: 250 },
    { id: '6', uri: Image.resolveAssetSource(require('@/assets/img/user-1.jpg')).uri, height: 220 },
    { id: '7', uri: Image.resolveAssetSource(require('@/assets/img/user-4.jpg')).uri, height: 180 },
    { id: '8', uri: Image.resolveAssetSource(require('@/assets/img/user-2.jpg')).uri, height: 220 },
];

const masonryVideos = [
    { id: '1', uri: 'https://images.unsplash.com/photo-1656381620321-bddff61435c3?q=80&w=1015&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', height: 200, isVideo: true },
    { id: '2', uri: 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D', height: 250, isVideo: true },
    { id: '3', uri: 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?q=80&w=1359&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', height: 200, isVideo: true },
    { id: '4', uri: 'https://images.unsplash.com/photo-1457364887197-9150188c107b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', height: 200, isVideo: true },

];

export default function UserProfileScreen() {
    const userActionsSheetRef = useRef<ActionSheetRef>(null);
    const insets = useSafeAreaInsets();
    const [following, setFollowing] = useState(false);

    const toggleFollow = () => {
        setFollowing(!following);
    }
    return (
        <>
            <Header
                showBackButton
                rightComponents={[
                    <HeaderIcon onPress={() => userActionsSheetRef.current?.show()} icon="MoreHorizontal" />,
                    <Button variant={following ? 'outline' : 'primary'} onPress={toggleFollow} title={following ? 'Following' : 'Follow'} className="!my-auto" size="small" />
                ]}
            />
            <AnimatedView
                animation="scaleIn"
                className='flex-1 bg-background'
                duration={300}
            >
                <ThemeTabs
                    headerComponent={<ProfileHeader />}
                >
                    <ThemeTab name="Images">
                        <View className="p-3">
                            <MasonryGrid images={masonryImages} />
                        </View>
                    </ThemeTab>
                    <ThemeTab name="Videos">
                        <View className="p-3">
                            <MasonryGrid images={masonryVideos} />
                        </View>

                    </ThemeTab>

                </ThemeTabs>
            </AnimatedView>
            <UserActionsSheet ref={userActionsSheetRef} />
        </>
    );
}

const ProfileHeader = () => {

    return (
        <>
            <View className="p-global">
                <View className="flex-col items-center justify-between">
                    <Avatar src={require('@/assets/img/thomino.jpg')} size="xl" />
                    <ThemedText className="text-xl font-bold mt-4">Thomino</ThemedText>
                    <ThemedText className="text-sm opacity-50">Vibe crafting AI visuals</ThemedText>
                </View>
                <View className="flex-row items-center justify-center gap-10 mt-6 bg-secondary mx-auto rounded-2xl p-4">
                    <View className="items-center">
                        <ThemedText className="text-xl font-bold">184</ThemedText>
                        <ThemedText className="text-xs opacity-50">Followers</ThemedText>
                    </View>
                    <View className="items-center">
                        <ThemedText className="text-xl font-bold">21</ThemedText>
                        <ThemedText className="text-xs opacity-50">Posts</ThemedText>
                    </View>
                    <View className="items-center">
                        <ThemedText className="text-xl font-bold">19k</ThemedText>
                        <ThemedText className="text-xs opacity-50">Views</ThemedText>
                    </View>
                    <View className="items-center">
                        <ThemedText className="text-xl font-bold">10k</ThemedText>
                        <ThemedText className="text-xs opacity-50">Downloads</ThemedText>
                    </View>

                </View>


            </View>
        </>
    );
}


const UserActionsSheet = React.forwardRef<ActionSheetRef>((props, ref) => {
    return (
        <ActionSheetThemed
            gestureEnabled
            ref={ref}>
            <View className='p-global'>

                <View className="rounded-2xl bg-background mb-4">
                    <SheetItem icon="QrCode" name='QR code' />
                    <SheetItem icon="Link2" name='Copy link' />
                    <SheetItem icon="Share2" name='Share to' />
                </View>
                <View className="rounded-2xl bg-background mb-4">
                    <SheetItem icon="Volume" name='Mute' />
                    <SheetItem icon="UserLock" name='Restrict' />
                </View>
                <View className="rounded-2xl bg-background">
                    <SheetItem icon="UserX" name='Block' />
                    <SheetItem icon="ShieldAlert" name='Report' />
                </View>
            </View>
        </ActionSheetThemed>
    );
});

const SheetItem = (props: any) => {
    return (
        <Pressable className='flex-row justify-between items-center  rounded-2xl p-4 border-b border-border'>
            <ThemedText className='font-semibold text-base'>{props.name}</ThemedText>
            <Icon name={props.icon} size={20} />
        </Pressable>
    );
}


