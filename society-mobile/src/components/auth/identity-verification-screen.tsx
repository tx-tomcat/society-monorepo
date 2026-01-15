/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import type { ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  IdCard,
  ShieldCheck,
} from '@/components/ui/icons';

import type { UserType } from './types';

export type { UserType };

export type VerificationStepConfig = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ color: string; width: number; height: number }>;
  required?: boolean;
};

export type VerificationStep = VerificationStepConfig & {
  completed: boolean;
};

export type IdentityVerificationScreenProps = {
  userType: UserType;
  steps: VerificationStepConfig[];
  onBack: () => void;
  onStepPress: (stepId: string) => void;
  onComplete: () => void;
  onSkip?: () => void;
  completedSteps?: string[];
  showSkipOption?: boolean;
  showPrivacyNotice?: boolean;
  showBenefits?: boolean;
  benefits?: string[];
  testID?: string;
};

const themeConfig = {
  companion: {
    accentColor: colors.lavender[400],
    accentBgClass: 'bg-lavender-400/10',
    accentBorderClass: 'border-lavender-400',
    activeItemBgClass: 'bg-lavender-400',
    inactiveIconBgClass: 'bg-lavender-400/20',
    progressBgClass: 'bg-lavender-400/30',
    progressFillClass: 'bg-lavender-400',
    accentTextClass: 'text-lavender-400',
    buttonClassName: 'w-full bg-lavender-400',
    requiredBadgeBgClass: 'bg-lavender-400/20',
  },
  hirer: {
    accentColor: colors.rose[400],
    accentBgClass: 'bg-softpink',
    accentBorderClass: 'border-rose-400',
    activeItemBgClass: 'bg-teal-400',
    inactiveIconBgClass: 'bg-softpink',
    progressBgClass: 'bg-rose-400/30',
    progressFillClass: 'bg-rose-400',
    accentTextClass: 'text-rose-400',
    buttonClassName: 'w-full',
    requiredBadgeBgClass: 'bg-rose-400/20',
  },
} as const;

const defaultBenefitKeys = [
  'auth.verify_identity.benefits.access_verified',
  'auth.verify_identity.benefits.build_trust',
  'auth.verify_identity.benefits.priority_support',
  'auth.verify_identity.benefits.exclusive_benefits',
];

export function IdentityVerificationScreen({
  userType,
  steps: stepConfigs,
  onBack,
  onStepPress,
  onComplete,
  onSkip,
  completedSteps = [],
  showSkipOption = false,
  showPrivacyNotice = true,
  showBenefits = false,
  benefits,
  testID,
}: IdentityVerificationScreenProps) {
  const { t } = useTranslation();
  const theme = themeConfig[userType];

  // Use translated default benefits if none provided
  const displayBenefits = benefits ?? defaultBenefitKeys.map((key) => t(key));

  const steps: VerificationStep[] = stepConfigs.map((step) => ({
    ...step,
    completed: completedSteps.includes(step.id),
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const requiredCompleted = steps
    .filter((s) => s.required)
    .every((s) => s.completed);
  const allComplete = steps.every((s) => s.completed);

  const canContinue = userType === 'companion' ? requiredCompleted : allComplete;

  return (
    <View className="flex-1 bg-warmwhite" testID={testID}>
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={onBack} testID={testID ? `${testID}-back` : undefined}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('auth.verify_identity.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className={`mb-6 items-center rounded-2xl p-6 ${theme.accentBgClass}`}
        >
          <View className={`mb-3 size-16 items-center justify-center rounded-full ${theme.activeItemBgClass}`}>
            <ShieldCheck color="#FFFFFF" width={32} height={32} />
          </View>
          <Text style={styles.progressTitle} className="mb-1 text-xl text-midnight">
            {t(`auth.verify_identity.${userType}.title`)}
          </Text>
          <Text className="mb-4 text-center text-sm text-text-secondary">
            {t(`auth.verify_identity.${userType}.subtitle`)}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className={`h-2 flex-1 overflow-hidden rounded-full ${theme.progressBgClass}`}>
              <View
                className={`h-full rounded-full ${theme.progressFillClass}`}
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </View>
            <Text className={`text-sm font-semibold ${theme.accentTextClass}`}>
              {completedCount}/{steps.length}
            </Text>
          </View>
        </MotiView>

        {/* Steps */}
        <View className="gap-4">
          {steps.map((step, index) => (
            <MotiView
              key={step.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 + index * 100 }}
            >
              <Pressable
                onPress={() => onStepPress(step.id)}
                testID={testID ? `${testID}-step-${step.id}` : undefined}
                className={`flex-row items-center gap-4 rounded-2xl border-2 p-4 ${
                  step.completed
                    ? `${theme.accentBorderClass} ${theme.accentBgClass}`
                    : 'border-border-light bg-white'
                }`}
              >
                <View
                  className={`size-12 items-center justify-center rounded-full ${
                    step.completed ? theme.activeItemBgClass : theme.inactiveIconBgClass
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle color="#FFFFFF" width={24} height={24} />
                  ) : (
                    <step.icon color={theme.accentColor} width={24} height={24} />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-midnight">
                      {t(step.title)}
                    </Text>
                    {step.required && (
                      <View className={`rounded px-1.5 py-0.5 ${theme.requiredBadgeBgClass}`}>
                        <Text className={`text-xs font-medium ${theme.accentTextClass}`}>
                          {t('auth.verify_identity.required')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="mt-0.5 text-sm text-text-secondary">
                    {t(step.description)}
                  </Text>
                </View>
                {!step.completed && userType === 'hirer' && (
                  <View className="rounded-lg bg-rose-400 px-4 py-2">
                    <Text className="font-semibold text-white">{t('auth.verify_identity.start')}</Text>
                  </View>
                )}
                {userType === 'companion' && (
                  <View
                    className={`size-6 items-center justify-center rounded-full border-2 ${
                      step.completed
                        ? `${theme.accentBorderClass} ${theme.activeItemBgClass}`
                        : 'border-border-light'
                    }`}
                  >
                    {step.completed && (
                      <CheckCircle color="#FFFFFF" width={16} height={16} />
                    )}
                  </View>
                )}
              </Pressable>
            </MotiView>
          ))}
        </View>

        {/* Privacy Notice */}
        {showPrivacyNotice && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            className="mt-6 rounded-xl bg-teal-400/10 p-4"
          >
            <View className="flex-row items-start gap-3">
              <ShieldCheck color={colors.teal[400]} width={20} height={20} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-teal-700">
                  {t('auth.verify_identity.privacy_title')}
                </Text>
                <Text className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {t('auth.verify_identity.privacy_description')}
                </Text>
              </View>
            </View>
          </MotiView>
        )}

        {/* Benefits */}
        {showBenefits && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
            className="mt-6 rounded-2xl bg-lavender-400/10 p-4"
          >
            <Text className="mb-3 font-semibold text-midnight">{t('auth.verify_identity.why_verify')}</Text>
            <View className="gap-2">
              {displayBenefits.map((benefit, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <View className="size-2 rounded-full bg-lavender-400" />
                  <Text className="text-sm text-text-secondary">{benefit}</Text>
                </View>
              ))}
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-white">
        <View className="px-6 py-4">
          <Button
            label={canContinue ? t('common.continue') : t('auth.verify_identity.complete_all_steps')}
            onPress={onComplete}
            disabled={!canContinue}
            variant="default"
            size="lg"
            className={theme.buttonClassName}
            testID={testID ? `${testID}-continue` : undefined}
          />
          {showSkipOption && !canContinue && (
            <Pressable
              onPress={onSkip}
              className="mt-4 py-2"
              testID={testID ? `${testID}-skip` : undefined}
            >
              <Text className="text-center text-base text-text-tertiary">
                {t('auth.verify_identity.skip_for_now')}
              </Text>
            </Pressable>
          )}
          {userType === 'companion' && (
            <Text className="mt-3 text-center text-xs text-text-tertiary">
              {t('auth.verify_identity.verification_time')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// Default step configurations for each user type
// Note: title and description are translation keys, translated at render time
export const companionVerificationSteps: VerificationStepConfig[] = [
  {
    id: 'vneid',
    title: 'auth.verify_identity.steps.vneid.title',
    description: 'auth.verify_identity.steps.vneid.description_companion',
    icon: IdCard,
    required: true,
  },
  {
    id: 'selfie',
    title: 'auth.verify_identity.steps.selfie.title',
    description: 'auth.verify_identity.steps.selfie.description_companion',
    icon: Camera,
    required: true,
  },
  {
    id: 'background',
    title: 'auth.verify_identity.steps.background.title',
    description: 'auth.verify_identity.steps.background.description',
    icon: ShieldCheck,
    required: true,
  },
];

export const hirerVerificationSteps: VerificationStepConfig[] = [
  {
    id: 'vneid',
    title: 'auth.verify_identity.steps.vneid.title',
    description: 'auth.verify_identity.steps.vneid.description_hirer',
    icon: IdCard,
    required: true,
  },
  {
    id: 'selfie',
    title: 'auth.verify_identity.steps.selfie.title',
    description: 'auth.verify_identity.steps.selfie.description_hirer',
    icon: Camera,
    required: true,
  },
];

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  progressTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
