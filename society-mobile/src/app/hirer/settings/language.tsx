/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Check, Language } from '@/components/ui/icons';
import { useSafeBack } from '@/lib/hooks';
import { useSelectedLanguage } from '@/lib/i18n/utils';
import type { Language as LanguageType } from '@/lib/i18n/resources';

type LanguageOption = {
  code: LanguageType;
  name: string;
  nativeName: string;
  flag: string;
};

const LANGUAGES: LanguageOption[] = [
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
];

function LanguageCard({
  language,
  isSelected,
  onSelect,
}: {
  language: LanguageOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`mb-3 flex-row items-center gap-4 rounded-2xl p-4 ${
        isSelected
          ? 'border-2 border-rose-400 bg-rose-50'
          : 'border border-border bg-white'
      }`}
    >
      <Text className="text-3xl">{language.flag}</Text>
      <View className="flex-1">
        <Text
          className={`font-urbanist-semibold text-base ${isSelected ? 'text-rose-600' : 'text-midnight'}`}
        >
          {language.nativeName}
        </Text>
        <Text className="text-sm text-text-tertiary">{language.name}</Text>
      </View>
      {isSelected && (
        <View className="size-6 items-center justify-center rounded-full bg-rose-400">
          <Check color="#FFFFFF" width={14} height={14} />
        </View>
      )}
    </Pressable>
  );
}

export default function LanguageSettingsScreen() {
  const { t, i18n } = useTranslation();
  const { language: currentLanguage, setLanguage } = useSelectedLanguage();
  const goBack = useSafeBack('/(app)/account');

  const handleSelectLanguage = React.useCallback(
    (langCode: LanguageType) => {
      setLanguage(langCode);
      i18n.changeLanguage(langCode);
    },
    [setLanguage, i18n]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={goBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.language.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Language Icon Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center py-6"
        >
          <View className="mb-3 size-16 items-center justify-center rounded-full bg-lavender-100">
            <Language color={colors.lavender[400]} width={32} height={32} />
          </View>
          <Text className="text-center text-sm text-text-secondary">
            {t('hirer.language.subtitle')}
          </Text>
        </MotiView>

        {/* Language Options */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="px-4"
        >
          <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
            {t('hirer.language.select_language')}
          </Text>

          {LANGUAGES.map((lang, index) => (
            <MotiView
              key={lang.code}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <LanguageCard
                language={lang}
                isSelected={currentLanguage === lang.code}
                onSelect={() => handleSelectLanguage(lang.code)}
              />
            </MotiView>
          ))}
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-6 rounded-2xl bg-lavender-100/50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-lavender-700">
            {t('hirer.language.info_title')}
          </Text>
          <Text className="text-sm leading-5 text-text-secondary">
            {t('hirer.language.info_message')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
