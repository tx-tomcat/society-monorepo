/* eslint-disable max-lines-per-function */
import * as ImagePicker from 'expo-image-picker';
import { Href, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView } from 'react-native';

import {
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { showErrorMessage, showSuccessMessage } from '@/components/ui/utils';
import { Camera, CheckCircle, IdCard, X } from '@/components/ui/icons';
import { useSubmitCompanionOnboarding } from '@/lib/hooks';
import { useCompanionOnboarding } from '@/lib/stores';

export default function VerifyIdentity() {
  const router = useRouter();
  const { t } = useTranslation();

  // Get data from store
  const storedFrontImage = useCompanionOnboarding.use.idFrontImage();
  const storedBackImage = useCompanionOnboarding.use.idBackImage();
  const bio = useCompanionOnboarding.use.bio();
  const photoFiles = useCompanionOnboarding.use.photoFiles();
  const province = useCompanionOnboarding.use.province();
  const hourlyRate = useCompanionOnboarding.use.hourlyRate();
  const setVerificationData = useCompanionOnboarding.use.setVerificationData();
  const markStepComplete = useCompanionOnboarding.use.markStepComplete();
  const resetStore = useCompanionOnboarding.use.reset();

  // Submission mutation
  const submitOnboarding = useSubmitCompanionOnboarding();

  // Local state
  const [frontImage, setFrontImage] = React.useState(storedFrontImage);
  const [backImage, setBackImage] = React.useState(storedBackImage);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const pickImage = async (useCamera = false): Promise<string | null> => {
    if (useCamera) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('auth.verification.camera_permission_required'),
          t('auth.verification.camera_description'),
          [{ text: t('common.ok') }]
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 10], // ID card aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    } else {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('auth.verification.gallery_permission_required'),
          t('auth.verification.photos_description'),
          [{ text: t('common.ok') }]
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 10], // ID card aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    }
    return null;
  };

  const handleSelectImage = React.useCallback(
    (side: 'front' | 'back') => {
      Alert.alert(
        t('companion.onboard.verify_identity.upload_title'),
        t('companion.onboard.verify_identity.upload_description'),
        [
          {
            text: t('common.camera'),
            onPress: async () => {
              const uri = await pickImage(true);
              if (uri) {
                if (side === 'front') {
                  setFrontImage(uri);
                } else {
                  setBackImage(uri);
                }
              }
            },
          },
          {
            text: t('common.gallery'),
            onPress: async () => {
              const uri = await pickImage(false);
              if (uri) {
                if (side === 'front') {
                  setFrontImage(uri);
                } else {
                  setBackImage(uri);
                }
              }
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    },
    [t]
  );

  const handleRemoveImage = React.useCallback((side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage('');
    } else {
      setBackImage('');
    }
  }, []);

  const submitProfile = React.useCallback(async (includeCccd: boolean) => {
    console.log('submitProfile', includeCccd);
    setIsSubmitting(true);
    try {
      // Save verification data to store if provided
      if (includeCccd && frontImage && backImage) {
        setVerificationData({
          idType: 'cccd',
          idFrontImage: frontImage,
          idBackImage: backImage,
        });
        markStepComplete('verify-identity');
      }

      // Submit onboarding
      console.log('submitOnboarding', 'Submit onboarding');
      await submitOnboarding.mutateAsync({
        localPhotoUris: photoFiles,
        profile: {
          bio,
          hourlyRate,
          province,
        },
        services: [],
        availability: [],
      });

      // Clear onboarding store
      resetStore();

      // Navigate to companion dashboard
      showSuccessMessage(
        t('companion.onboard.success_title'),
        t('companion.onboard.success_message')
      );
      router.replace('/companion/(app)' as Href);
    } catch (error) {
      showErrorMessage(
        error instanceof Error ? error.message : t('companion.onboard.error_message')
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [frontImage, backImage, setVerificationData, markStepComplete, submitOnboarding, photoFiles, bio, hourlyRate, province, resetStore, router, t]);

  const handleContinue = React.useCallback(() => {
    submitProfile(true);
  }, [submitProfile]);

  const handleSkip = React.useCallback(() => {
    Alert.alert(
      t('auth.verification.skip_title'),
      t('auth.verification.skip_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.verification.skip_confirm'),
          onPress: () => {
            submitProfile(false);
          },
        },
      ]
    );
  }, [t, submitProfile]);

  const isValid = frontImage && backImage;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader
        title={t('companion.onboard.verify_identity.header')}
        subtitle={`${t('companion.onboard.step')} 3/3`}
        onBack={handleBack}
        rightElement={
          <Pressable onPress={handleSkip}>
            <Text className="text-sm text-lavender-900">
              {t('common.skip')}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6 rounded-2xl bg-lavender-900/10 p-4"
        >
          <View className="flex-row items-start gap-3">
            <IdCard color={colors.lavender[400]} width={24} height={24} />
            <View className="flex-1">
              <Text className="mb-1 font-semibold text-midnight">
                {t('companion.onboard.verify_identity.why_verify')}
              </Text>
              <Text className="text-sm text-text-secondary">
                {t('companion.onboard.verify_identity.why_verify_description')}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Front of CCCD */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.onboard.verify_identity.front_side')}
          </Text>
          <Text className="mb-3 text-sm text-text-secondary">
            {t('companion.onboard.verify_identity.front_description')}
          </Text>

          <Pressable
            onPress={() => handleSelectImage('front')}
            className="relative h-48 overflow-hidden rounded-2xl bg-softpink"
          >
            {frontImage ? (
              <>
                <Image
                  source={{ uri: frontImage }}
                  className="size-full"
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => handleRemoveImage('front')}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5"
                >
                  <X color="white" width={16} height={16} />
                </Pressable>
                <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-teal-400/90 px-2 py-1">
                  <CheckCircle color="white" width={14} height={14} />
                  <Text className="text-xs font-medium text-white">
                    {t('companion.onboard.verify_identity.uploaded')}
                  </Text>
                </View>
              </>
            ) : (
              <View className="size-full items-center justify-center">
                <View className="mb-2 rounded-full bg-lavender-900/20 p-3">
                  <Camera color={colors.lavender[400]} width={28} height={28} />
                </View>
                <Text className="text-sm font-medium text-lavender-900">
                  {t('companion.onboard.verify_identity.tap_to_upload')}
                </Text>
              </View>
            )}
          </Pressable>
        </MotiView>

        {/* Back of CCCD */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.onboard.verify_identity.back_side')}
          </Text>
          <Text className="mb-3 text-sm text-text-secondary">
            {t('companion.onboard.verify_identity.back_description')}
          </Text>

          <Pressable
            onPress={() => handleSelectImage('back')}
            className="relative h-48 overflow-hidden rounded-2xl bg-softpink"
          >
            {backImage ? (
              <>
                <Image
                  source={{ uri: backImage }}
                  className="size-full"
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => handleRemoveImage('back')}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5"
                >
                  <X color="white" width={16} height={16} />
                </Pressable>
                <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-teal-400/90 px-2 py-1">
                  <CheckCircle color="white" width={14} height={14} />
                  <Text className="text-xs font-medium text-white">
                    {t('companion.onboard.verify_identity.uploaded')}
                  </Text>
                </View>
              </>
            ) : (
              <View className="size-full items-center justify-center">
                <View className="mb-2 rounded-full bg-lavender-900/20 p-3">
                  <Camera color={colors.lavender[400]} width={28} height={28} />
                </View>
                <Text className="text-sm font-medium text-lavender-900">
                  {t('companion.onboard.verify_identity.tap_to_upload')}
                </Text>
              </View>
            )}
          </Pressable>
        </MotiView>

        {/* Tips */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="rounded-xl bg-white p-4"
        >
          <Text className="mb-3 font-semibold text-midnight">
            {t('companion.onboard.verify_identity.tips_title')}
          </Text>
          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text className="text-teal-400">•</Text>
              <Text className="flex-1 text-sm text-text-secondary">
                {t('companion.onboard.verify_identity.tip_1')}
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-teal-400">•</Text>
              <Text className="flex-1 text-sm text-text-secondary">
                {t('companion.onboard.verify_identity.tip_2')}
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-teal-400">•</Text>
              <Text className="flex-1 text-sm text-text-secondary">
                {t('companion.onboard.verify_identity.tip_3')}
              </Text>
            </View>
          </View>
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
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            variant="default"
            size="lg"
            className="w-full bg-lavender-900"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
