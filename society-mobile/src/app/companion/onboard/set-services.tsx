/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import {
  Badge,
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  Coffee,
  Confetti,
  Family,
  MaiFlower,
  WeddingRings,
} from '@/components/ui/icons';
import { useCompanionOnboarding } from '@/lib/stores';

type OccasionType = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: typeof WeddingRings;
  popular?: boolean;
};

const OCCASIONS: OccasionType[] = [
  {
    id: 'wedding',
    labelKey: 'companion.onboard.set_services.occasions.wedding.label',
    descriptionKey:
      'companion.onboard.set_services.occasions.wedding.description',
    icon: WeddingRings,
    popular: true,
  },
  {
    id: 'tet',
    labelKey: 'companion.onboard.set_services.occasions.tet.label',
    descriptionKey: 'companion.onboard.set_services.occasions.tet.description',
    icon: MaiFlower,
    popular: true,
  },
  {
    id: 'family',
    labelKey: 'companion.onboard.set_services.occasions.family.label',
    descriptionKey:
      'companion.onboard.set_services.occasions.family.description',
    icon: Family,
  },
  {
    id: 'corporate',
    labelKey: 'companion.onboard.set_services.occasions.corporate.label',
    descriptionKey:
      'companion.onboard.set_services.occasions.corporate.description',
    icon: Briefcase,
  },
  {
    id: 'coffee',
    labelKey: 'companion.onboard.set_services.occasions.coffee.label',
    descriptionKey:
      'companion.onboard.set_services.occasions.coffee.description',
    icon: Coffee,
  },
  {
    id: 'social',
    labelKey: 'companion.onboard.set_services.occasions.social.label',
    descriptionKey:
      'companion.onboard.set_services.occasions.social.description',
    icon: Confetti,
  },
];

export default function SetServices() {
  const router = useRouter();
  const { t } = useTranslation();

  // Get data from store
  const selectedServices = useCompanionOnboarding.use.selectedServices();
  const setServicesData = useCompanionOnboarding.use.setServicesData();
  const markStepComplete = useCompanionOnboarding.use.markStepComplete();

  const [selectedOccasions, setSelectedOccasions] =
    React.useState<string[]>(selectedServices);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleToggleOccasion = React.useCallback((occasionId: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occasionId)
        ? prev.filter((id) => id !== occasionId)
        : [...prev, occasionId]
    );
  }, []);

  const handleContinue = React.useCallback(() => {
    // Save to store
    setServicesData(selectedOccasions);
    markStepComplete('set-services');
    router.push('/companion/onboard/set-pricing' as Href);
  }, [selectedOccasions, setServicesData, markStepComplete, router]);

  // Validation state
  const hasNoServicesSelected = selectedOccasions.length === 0;

  const isValid = selectedOccasions.length >= 1;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text
            style={styles.headerTitle}
            className="flex-1 text-xl text-midnight"
          >
            {t('companion.onboard.set_services.header')}
          </Text>
          <Text className="text-sm text-text-tertiary">
            {t('companion.onboard.step', { current: 2, total: 4 })}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.onboard.set_services.title')}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('companion.onboard.set_services.description')}
          </Text>
        </MotiView>

        {/* Occasions Grid */}
        <View className="gap-3">
          {OCCASIONS.map((occasion, index) => {
            const isSelected = selectedOccasions.includes(occasion.id);
            return (
              <MotiView
                key={occasion.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: 100 + index * 50,
                }}
              >
                <Pressable
                  onPress={() => handleToggleOccasion(occasion.id)}
                  className={`flex-row items-center gap-4 rounded-2xl p-4 ${
                    isSelected
                      ? 'border border-lavender-400 bg-lavender-400/10'
                      : 'border border-border-light bg-white'
                  }`}
                >
                  <View
                    className={`size-12 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-lavender-400' : 'bg-lavender-400/20'
                    }`}
                  >
                    <occasion.icon
                      color={isSelected ? '#FFFFFF' : colors.lavender[400]}
                      width={24}
                      height={24}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-midnight">
                        {t(occasion.labelKey)}
                      </Text>
                      {occasion.popular && (
                        <Badge
                          label={t('common.popular')}
                          variant="lavender"
                          size="sm"
                        />
                      )}
                    </View>
                    <Text className="mt-0.5 text-sm text-text-secondary">
                      {t(occasion.descriptionKey)}
                    </Text>
                  </View>

                  <View
                    className={`size-6 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-lavender-400 bg-lavender-400'
                        : 'border-border-light'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle color="#FFFFFF" width={16} height={16} />
                    )}
                  </View>
                </Pressable>
              </MotiView>
            );
          })}
        </View>

        {/* Selected Count / Validation */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mt-4"
        >
          {hasNoServicesSelected ? (
            <Text className="text-center text-sm text-danger-400">
              {t('companion.onboard.set_services.select_service_error')}
            </Text>
          ) : (
            <Text className="text-center text-sm text-text-tertiary">
              {t('companion.onboard.set_services.selected_count', {
                count: selectedOccasions.length,
              })}
            </Text>
          )}
        </MotiView>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="px-6 py-4">
          <Button
            label={t('common.continue')}
            onPress={handleContinue}
            disabled={!isValid}
            variant="default"
            size="lg"
            className="w-full bg-lavender-400"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
