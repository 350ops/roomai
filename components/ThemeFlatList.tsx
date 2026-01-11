import React, { forwardRef } from 'react';
import { FlatList, FlatListProps } from 'react-native';

// Define the props type, making it generic
export type ThemedFlatListProps<T> = FlatListProps<T> & {
  className?: string;
};

// Use forwardRef to properly handle refs
function ThemedFlatListInner<T>(
  { className, ...props }: ThemedFlatListProps<T>,
  ref: React.Ref<FlatList<T>>
) {
  return (
    <FlatList
      bounces={true}
      overScrollMode='never'
      ref={ref}
      showsVerticalScrollIndicator={false}
      className={`bg-background dark:bg-dark-primary flex-1 px-global ${className || ''}`}
      {...props}
    />
  );
}

// Create the forwardRef component with proper typing
const ThemedFlatList = forwardRef(ThemedFlatListInner) as <T>(
  props: ThemedFlatListProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement;

// Add displayName for debugging
(ThemedFlatList as any).displayName = 'ThemedFlatList';

// Support both named and default imports
export { ThemedFlatList };
export default ThemedFlatList;
