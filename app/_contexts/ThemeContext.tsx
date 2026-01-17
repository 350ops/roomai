import React, { createContext, useContext, useState, useMemo } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colorScheme } from "nativewind";
import { themes } from "@/utils/color-theme";

interface ThemeProviderProps {
    children: React.ReactNode;
}

// Color palette for programmatic use
const colorPalettes = {
    light: {
        primary: "#ffffff",
        invert: "#000000",
        secondary: "#007334",
        background: "#D2C6B6",
        darker: "#B8A182",
        text: "#5D3A1E",
        textSecondary: "#75523C",
        highlight: "#9B744D",
        border: "#9B744D",
        card: "#B8A182",
        success: "#9B744D",
        error: "#9B744D",
        warning: "#B8A182",
        info: "#9B744D",
        green: '#007334',
    },
    dark: {
        primary: "#ffffff",
        invert: "#000000",
        secondary: "#262626",
        background: "#0A0A0A",
        darker: "#000000",
        text: "#ffffff",
        textSecondary: "#9CA3AF",
        highlight: "#FF2056",
        border: "rgba(255, 255, 255, 0.15)",
        card: "#1C1C1E",
        success: "#22C55E",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        green: '#007334',
    },
};

export type ThemeColors = typeof colorPalettes.light;

type ThemeContextType = {
    theme: "light" | "dark";
    toggleTheme: () => void;
    colors: ThemeColors;
};

export const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => { },
    colors: colorPalettes.light,
});

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

    const toggleTheme = () => {
        const newTheme = currentTheme === "light" ? "dark" : "light";
        setCurrentTheme(newTheme);
        colorScheme.set(newTheme);
    };

    const colors = useMemo(() => colorPalettes[currentTheme], [currentTheme]);

    return (
        <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme, colors }}>
            <StatusBar backgroundColor="transparent" translucent={true} style={currentTheme === "dark" ? "light" : "dark"} />
            <View style={themes[currentTheme]} className="flex-1 bg-background">
                {children}
            </View>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Default export for the ThemeProvider
export default ThemeProvider; 