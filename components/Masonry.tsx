import { View, Pressable, Image } from "react-native";
import { Link } from "expo-router";
import Icon from "./Icon";

export const MasonryGrid = ({ images }: { images: any[] }) => {
    // Split images into two columns
    const leftColumn = images.filter((_, index) => index % 2 === 0);
    const rightColumn = images.filter((_, index) => index % 2 === 1);

    return (
        <View className="flex-row">
            {/* Left Column */}
            <View className="flex-1 pr-1">
                {leftColumn.map((image) => (
                    <MasonryItem key={image.id} image={image} />
                ))}
            </View>
            
            {/* Right Column */}
            <View className="flex-1 pl-1">
                {rightColumn.map((image) => (
                    <MasonryItem key={image.id} image={image} />
                ))}
            </View>
        </View>
    );
};

export const MasonryItem = ({ image }: { image: any }) => {
    return (
        <Link href="/screens/post-detail" asChild>
            <Pressable className="mb-2 rounded-xl overflow-hidden relative">
                {image.isVideo && (
                    <View className="absolute top-0 left-0 right-0 bottom-0 justify-start items-start z-20 p-4">
                        <Icon name="Video" size={18}  className=' rounded-full items-center justify-center' />
                    </View>
                )}
                <Image
                    source={{ uri: image.uri }}
                    style={{ 
                        width: '100%', 
                        height: image.height,
                        //borderRadius: 12
                    }}
                    resizeMode="cover"
                />
            </Pressable>
        </Link>
    );
};