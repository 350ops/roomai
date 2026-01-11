import React, { forwardRef } from 'react';
import ActionSheet, { ActionSheetProps, ActionSheetRef } from 'react-native-actions-sheet';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, ViewStyle } from 'react-native';


interface ActionSheetThemedProps extends ActionSheetProps { }

const ActionSheetThemed = forwardRef<ActionSheetRef, ActionSheetThemedProps>(({ containerStyle, ...props }, ref) => {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    return (
        <View className='flex-1 absolute top-0 left-0 right-0 bottom-0 h-full w-full'>
            <ActionSheet
                {...props}
                ref={ref}
                // Disable deprecated SafeAreaView by providing our own insets
                safeAreaInsets={{ top: insets.top, bottom: insets.bottom, left: 0, right: 0 }}
                containerStyle={{
                    backgroundColor: colors.secondary,
                    paddingTop: 5,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingBottom: insets.bottom,
                    ...(containerStyle as any)
                }}
            />
        </View>
    );
});

// Add displayName for forwardRef component
ActionSheetThemed.displayName = 'ActionSheetThemed';

// Support both named and default imports
export { ActionSheetThemed };
export default ActionSheetThemed;