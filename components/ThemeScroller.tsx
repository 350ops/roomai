import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';

interface ThemedScrollerProps extends ScrollViewProps {
  className?: string;
  children: React.ReactNode;
}

function ThemedScroller({ 
  className = '', 
  children, 
  contentContainerStyle,
  ...props 
}: ThemedScrollerProps) {
  return (
    <ScrollView
      className={`px-global bg-background ${className}`}
      bounces={false}
      contentContainerStyle={[
        { flexGrow: 1 },
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
      <View className="h-24 " />
    </ScrollView>
  );
}

// Support both named and default imports (also alias as ThemeScroller)
export { ThemedScroller, ThemedScroller as ThemeScroller };
export default ThemedScroller;
