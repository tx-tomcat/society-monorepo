/* eslint-disable max-lines-per-function */
import { useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native';

import {
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  VerifiedBadge,
  Warning,
} from '@/components/ui/icons';
import type { VerificationStatus } from '@/lib/api/services/companions.service';
import { useMyCompanionProfile, useSafeBack } from '@/lib/hooks';

type VerificationStep = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
};

const getStatusIcon = (status: VerificationStep['status']) => {
  switch (status) {
    case 'completed':
      return { icon: CheckCircle, color: colors.teal[400] };
    case 'in_progress':
      return { icon: Clock, color: colors.yellow[500] };
    case 'rejected':
      return { icon: Warning, color: colors.danger[400] };
    default:
      return { icon: Clock, color: colors.text.tertiary };
  }
};

const getVerificationSteps = (
  verificationStatus: VerificationStatus | undefined
): VerificationStep[] => {
  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';

  return [
    {
      id: 'identity',
      labelKey: 'companion.verification.steps.identity',
      descriptionKey: 'companion.verification.steps.identity_desc',
      icon: Shield,
      status: isVerified ? 'completed' : isPending ? 'in_progress' : isRejected ? 'rejected' : 'pending',
    },
    {
      id: 'selfie',
      labelKey: 'companion.verification.steps.selfie',
      descriptionKey: 'companion.verification.steps.selfie_desc',
      icon: Shield,
      status: isVerified ? 'completed' : isPending ? 'in_progress' : 'pending',
    },
    {
      id: 'background',
      labelKey: 'companion.verification.steps.background',
      descriptionKey: 'companion.verification.steps.background_desc',
      icon: Shield,
      status: isVerified ? 'completed' : isPending ? 'in_progress' : 'pending',
    },
  ];
};

export default function CompanionVerificationScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/companion/(app)/account');

  // React Query hooks
  const { data: profile, isLoading, refetch } = useMyCompanionProfile();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleStepPress = React.useCallback((step: VerificationStep) => {
    if (step.status === 'completed') return;
    Alert.alert(t('common.coming_soon'));
  }, [t]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  const verificationStatus = profile?.verificationStatus;
  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';
  const steps = getVerificationSteps(verificationStatus);
  const completedSteps = steps.filter((s) => s.status === 'completed').length;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader title={t('companion.verification.header')} onBack={goBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className={`mx-4 mt-4 items-center rounded-xl p-6 ${isVerified ? 'bg-teal-50' : isPending ? 'bg-yellow-50' : isRejected ? 'bg-danger-50' : 'bg-neutral-100'
            }`}
        >
          <View
            className={`mb-3 size-16 items-center justify-center rounded-full ${isVerified ? 'bg-teal-100' : isPending ? 'bg-yellow-100' : isRejected ? 'bg-danger-100' : 'bg-neutral-200'
              }`}
          >
            {isVerified ? (
              <VerifiedBadge color={colors.teal[400]} width={32} height={32} />
            ) : isPending ? (
              <Clock color={colors.yellow[500]} width={32} height={32} />
            ) : isRejected ? (
              <Warning color={colors.danger[400]} width={32} height={32} />
            ) : (
              <Shield color={colors.text.tertiary} width={32} height={32} />
            )}
          </View>
          <Text
            className={`font-urbanist-bold text-xl ${isVerified ? 'text-teal-700' : isPending ? 'text-yellow-700' : isRejected ? 'text-danger-500' : 'text-midnight'
              }`}
          >
            {isVerified
              ? t('companion.verification.status.verified')
              : isPending
                ? t('companion.verification.status.pending')
                : isRejected
                  ? t('companion.verification.status.rejected')
                  : t('companion.verification.status.not_started')}
          </Text>
          <Text className="mt-1 text-center text-sm text-text-secondary">
            {isVerified
              ? t('companion.verification.status.verified_desc')
              : isPending
                ? t('companion.verification.status.pending_desc')
                : isRejected
                  ? t('companion.verification.status.rejected_desc')
                  : t('companion.verification.status.not_started_desc')}
          </Text>
          {!isVerified && (
            <View className="mt-3 flex-row items-center gap-1">
              <Text className="text-sm font-medium text-text-tertiary">
                {completedSteps}/{steps.length} {t('companion.verification.steps_completed')}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Benefits Card */}
        {!isVerified && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="mx-4 mt-4 rounded-xl bg-lavender-50 p-4"
          >
            <Text className="mb-2 font-urbanist-semibold text-base text-lavender-700">
              {t('companion.verification.benefits_title')}
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <CheckCircle color={colors.lavender[400]} width={14} height={14} />
                <Text className="text-sm text-text-secondary">
                  {t('companion.verification.benefit_1')}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <CheckCircle color={colors.lavender[400]} width={14} height={14} />
                <Text className="text-sm text-text-secondary">
                  {t('companion.verification.benefit_2')}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <CheckCircle color={colors.lavender[400]} width={14} height={14} />
                <Text className="text-sm text-text-secondary">
                  {t('companion.verification.benefit_3')}
                </Text>
              </View>
            </View>
          </MotiView>
        )}

        {/* Verification Steps */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mx-4 mt-4"
        >
          <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
            {t('companion.verification.steps_title')}
          </Text>
          <View className="rounded-xl bg-white">
            {steps.map((step, index) => {
              const StatusIcon = getStatusIcon(step.status);

              return (
                <Pressable
                  key={step.id}
                  onPress={() => handleStepPress(step)}
                  disabled={step.status === 'completed'}
                  className={`flex-row items-center p-4 ${index < steps.length - 1 ? 'border-b border-border-light' : ''
                    }`}
                >
                  <View
                    className={`mr-3 size-10 items-center justify-center rounded-full ${step.status === 'completed'
                        ? 'bg-teal-100'
                        : step.status === 'in_progress'
                          ? 'bg-yellow-100'
                          : step.status === 'rejected'
                            ? 'bg-danger-50'
                            : 'bg-neutral-100'
                      }`}
                  >
                    <StatusIcon.icon
                      color={StatusIcon.color}
                      width={20}
                      height={20}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-urbanist-semibold text-base text-midnight">
                      {t(step.labelKey)}
                    </Text>
                    <Text className="mt-0.5 text-sm text-text-secondary">
                      {t(step.descriptionKey)}
                    </Text>
                  </View>
                  {step.status !== 'completed' && (
                    <ArrowRight color={colors.text.tertiary} width={16} height={16} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* Privacy Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-6 rounded-xl bg-teal-50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-teal-700">
            {t('companion.verification.privacy_title')}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('companion.verification.privacy_message')}
          </Text>
        </MotiView>

        {/* Rejected - Contact Support */}
        {isRejected && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
            className="mx-4 mt-4"
          >
            <Pressable
              onPress={() => Alert.alert(t('common.coming_soon'))}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-lavender-900 p-4"
            >
              <Text className="font-urbanist-semibold text-base text-white">
                {t('companion.verification.contact_support')}
              </Text>
            </Pressable>
          </MotiView>
        )}
      </ScrollView>
    </View>
  );
}
