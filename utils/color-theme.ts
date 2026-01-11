import { vars } from "nativewind";

export const themes = {
  light: vars({
    "--color-primary": "#05AAC3",     // Teal (brand / navigation)
    "--color-invert": "#ffffff",
    "--color-secondary": "#FFF3D6",   // Pastel yellow accents
    "--color-background": "#FFFFFF",
    "--color-darker": "#015D4C",      // Text / strong contrast
    "--color-text": "#000000",     
    "--color-highlight": "#DF3872",   // Pink CTA
    "--color-border": "rgba(1, 93, 76, 0.2)",
  }),

  dark: vars({
    "--color-primary": "#05AAC3",
    "--color-invert": "#000000",
    "--color-secondary": "#1A1A1E",
    "--color-background": "#0B0B0D",
    "--color-darker": "#000000",
    "--color-text": "#ffffff",  
    "--color-highlight": "#FF62A7",   // Brighter pink for dark mode
    "--color-border": "rgba(255, 255, 255, 0.15)",
  }),
}; 