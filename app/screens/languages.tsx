import { TouchableOpacity, View } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { SvgXml } from 'react-native-svg';
import { US, ES, PT } from 'country-flag-icons/string/3x2';
import { useLanguage, LanguageCode } from '@/app/_contexts/LanguageContext';

interface Language {
  title: string;
  code: LanguageCode;
  flag: string;
}

const languages: Language[] = [
  { title: 'English', code: 'en', flag: US },
  { title: 'Español', code: 'es', flag: ES },
  { title: 'Português', code: 'pt', flag: PT },
];

export default function LanguagesScreen() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      <Header showBackButton />
      <ThemedScroller className="p-global">
        <Section title={t('chooseLanguage')} titleSize="4xl" className="mt-4 mb-10" />
        <View className="rounded-2xl overflow-hidden">
          {languages.map((lang, index) => (
            <LanguageItem
              key={index}
              title={lang.title}
              code={lang.code}
              flag={lang.flag}
              selected={language === lang.code}
              onSelect={() => setLanguage(lang.code)}
            />
          ))}
        </View>
      </ThemedScroller>
    </>
  );
}

interface LanguageItemProps {
  title: string;
  code: string;
  flag: string;
  selected: boolean;
  onSelect: () => void;
}

const LanguageItem = ({ title, code, flag, selected, onSelect }: LanguageItemProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      className="flex-row items-center py-4 px-6 border-b border-border"
    >
      <View className="w-7 h-7 mr-6 rounded overflow-hidden">
        <SvgXml xml={flag} width={28} height={28} />
      </View>
      <View className="flex-1">
        <ThemedText className="text-lg font-bold">{title}</ThemedText>
        <ThemedText className="text-sm opacity-60">{code.toUpperCase()}</ThemedText>
      </View>
      {selected && (
        <AnimatedView animation="bounceIn" duration={500}>
          <Icon name="Check" size={16} className="w-7 h-7 bg-highlight rounded-full" />
        </AnimatedView>
      )}
    </TouchableOpacity>
  );
};
