import React, { useRef } from "react";
import Icon from "./Icon";
import { Pressable, TouchableOpacity, View } from "react-native";
import ActionSheetThemed from "./ActionSheetThemed";
import { ActionSheetRef } from "react-native-actions-sheet";
import ThemedText from "./ThemedText";
import { Link } from "expo-router";
import Grid from "./layout/Grid";

const ActionTab = () => {
    const actionSheetRef = useRef<ActionSheetRef>(null);

    const handlePress = () => {
        actionSheetRef.current?.show();
    };

    return (
        <>
            <View className="relative flex flex-col items-center justify-center">
                <Pressable
                    onPress={handlePress}
                    className='w-16 h-16  -translate-y-2  bg-highlight rounded-full flex items-center justify-center'
                >
                    <Icon name="Plus" size={20} strokeWidth={2} color="white" />
                </Pressable>
            </View>
            <ActionSheetThemed ref={actionSheetRef}

                gestureEnabled
                containerStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingTop: 10
                }}
            >
                <View className="p-global">
                    <Grid columns={2} spacing={10}>
                        <ActionItem onPress={() => actionSheetRef.current?.hide()} href="/screens/add-workout" label="Workout" icon="BicepsFlexed" />
                        <ActionItem onPress={() => actionSheetRef.current?.hide()} href="/screens/add-meal" label="Meal" icon="Apple" />
                        <ActionItem onPress={() => actionSheetRef.current?.hide()} href="/screens/add-water" label="Water" icon="Droplet" />
                        <ActionItem onPress={() => actionSheetRef.current?.hide()} href="/screens/add-weight" label="Weight" icon="Scale" />
                    </Grid>

                </View>

            </ActionSheetThemed>
        </>
    )
}

const ActionItem = (props: any) => {
    return (
        <Link asChild href={props.href}>
            <Pressable onPress={props.onPress} className="py-10 rounded-2xl bg-background flex-col flex items-center justify-start">
                <Icon name={props.icon} size={20} strokeWidth={2} color="white" className="w-14 h-14 bg-highlight mb-2 rounded-full" />
                <ThemedText className="text-base">{props.label}</ThemedText>
            </Pressable>
        </Link>
    )
}

export default ActionTab;