
import ThemedScroller from "@/components/ThemeScroller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useThemeColors from "../contexts/ThemeColors";
import { View, TextInput } from "react-native";
import Icon from "@/components/Icon";
import { router } from "expo-router";
import { MasonryGrid } from "@/components/Masonry";
import { Chip } from "@/components/Chip";

const masonryImages = [
    { id: '1', uri: 'https://images.unsplash.com/photo-1656381620321-bddff61435c3?q=80&w=1015&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', height: 200,},
    { id: '2', uri: 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BhY2V8ZW58MHx8MHx8fDA%3D', height: 250, isVideo: true },
    { id: '3', uri: 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?q=80&w=1359&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', height: 200, },
    { id: '4', uri: 'https://images.unsplash.com/photo-1457364887197-9150188c107b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', height: 200, isVideo: true },
    { id: '5', uri: 'https://images.pexels.com/photos/8474497/pexels-photo-8474497.jpeg', height: 200, },
    { id: '6', uri: 'https://images.pexels.com/photos/325812/pexels-photo-325812.jpeg', height: 250, },
    { id: '7', uri: 'https://images.pexels.com/photos/1557183/pexels-photo-1557183.jpeg', height: 200, isVideo: true },
    { id: '8', uri: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg', height: 200, isVideo: true },

];
export default function SearchScreen() {

    return (
        <>
            <SearchInput />
            <ThemedScroller className="pt-0">
                <View className="flex-row gap-2 mb-4">
                    <Chip label='All' size='md' isSelected />
                    <Chip label='Photos' size='md' />
                    <Chip label='Videos' size='md' />
                    <Chip label='Illustrations' size='md' />
                </View>
                <MasonryGrid images={masonryImages} />
            </ThemedScroller>
        </>
    )
}


const SearchInput = () => {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    return (
        <View style={{ paddingTop: insets.top }} className='flex-row px-4 pb-4 items-center  bg-background justify-between'>

            <View className="bg-secondary rounded-full py-4 flex-row items-center">
                <Icon name='ArrowLeft' onPress={() => router.back()} size={20} className='pl-2' />
                <TextInput className='flex-1 text-text rounded-xl px-4' placeholder='Search images and videos' placeholderTextColor={colors.placeholder} />
                <Icon name="X" size={20} className="opacity-40 mr-4" />
            </View>
        </View>
    )
}

