// components/ThemedText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  className?: string;
  children: React.ReactNode;
}

function ThemedText({ className = '', children, ...props }: ThemedTextProps) {
  return (
    <Text
      className={`text-text ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

// Support both named and default imports
export { ThemedText };
export default ThemedText;
