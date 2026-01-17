import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define all translatable strings
const translations = {
  en: {
    // Home screen
    startTransforming: 'Start Transforming!',
    takePhoto: 'Take a photo, upload one or use our AR scanner.',
    startNow: 'Start Now',
    beforeAfter: 'Before and After',
    dragSlider: 'Drag the slider to compare',
    getInspired: 'Get Inspired',
    seeAll: 'See All',
    furniture3D: '3D Furniture',
    furniture3DHelp: 'Pinch to zoom • Drag to rotate • Two fingers to pan',
    tipsTitle: 'Tips for Better Results',
    goodLighting: 'Good Lighting',
    goodLightingDesc: 'Take photos in natural light for best results',
    wideAngle: 'Wide Angle',
    wideAngleDesc: 'Capture the entire room in your photo',
    clearSpace: 'Clear Space',
    clearSpaceDesc: 'Remove clutter for cleaner transformations',
    yourActivity: 'Your Activity',
    designsCreated: 'Designs Created',
    roomsSaved: 'Rooms Saved',
    favorites: 'Favorites',
    // Languages screen
    chooseLanguage: 'Choose Language',
  },
  es: {
    // Home screen
    startTransforming: '¡Empieza a Transformar!',
    takePhoto: 'Toma una foto, sube una o usa nuestro escáner AR.',
    startNow: 'Comenzar',
    beforeAfter: 'Antes y Después',
    dragSlider: 'Desliza para comparar',
    getInspired: 'Inspírate',
    seeAll: 'Ver Todo',
    furniture3D: 'Muebles 3D',
    furniture3DHelp: 'Pellizca para zoom • Arrastra para rotar • Dos dedos para mover',
    tipsTitle: 'Consejos para Mejores Resultados',
    goodLighting: 'Buena Iluminación',
    goodLightingDesc: 'Toma fotos con luz natural para mejores resultados',
    wideAngle: 'Ángulo Amplio',
    wideAngleDesc: 'Captura toda la habitación en tu foto',
    clearSpace: 'Espacio Limpio',
    clearSpaceDesc: 'Retira el desorden para transformaciones más limpias',
    yourActivity: 'Tu Actividad',
    designsCreated: 'Diseños Creados',
    roomsSaved: 'Habitaciones Guardadas',
    favorites: 'Favoritos',
    // Languages screen
    chooseLanguage: 'Elegir Idioma',
  },
  pt: {
    // Home screen
    startTransforming: 'Comece a Transformar!',
    takePhoto: 'Tire uma foto, envie uma ou use nosso scanner AR.',
    startNow: 'Começar',
    beforeAfter: 'Antes e Depois',
    dragSlider: 'Arraste para comparar',
    getInspired: 'Inspire-se',
    seeAll: 'Ver Tudo',
    furniture3D: 'Móveis 3D',
    furniture3DHelp: 'Beliscar para zoom • Arraste para girar • Dois dedos para mover',
    tipsTitle: 'Dicas para Melhores Resultados',
    goodLighting: 'Boa Iluminação',
    goodLightingDesc: 'Tire fotos com luz natural para melhores resultados',
    wideAngle: 'Ângulo Amplo',
    wideAngleDesc: 'Capture todo o cômodo na sua foto',
    clearSpace: 'Espaço Limpo',
    clearSpaceDesc: 'Remova a desordem para transformações mais limpas',
    yourActivity: 'Sua Atividade',
    designsCreated: 'Designs Criados',
    roomsSaved: 'Cômodos Salvos',
    favorites: 'Favoritos',
    // Languages screen
    chooseLanguage: 'Escolher Idioma',
  },
};

export type LanguageCode = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load saved language on mount
  React.useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      if (saved && (saved === 'en' || saved === 'es' || saved === 'pt')) {
        setLanguageState(saved as LanguageCode);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || translations.en[key] || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider;
