/* eslint-disable max-lines-per-function */
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';

import {
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Image,
  Text,
  View,
} from '@/components/ui';
import {
  Camera,
  CheckCircle,
  Clock,
  Gallery,
  IdCard,
  Shield,
  User,
  VerifiedBadge,
  Warning,
} from '@/components/ui/icons';
import type { VerificationStatus } from '@/lib/api/services/companions.service';
import {
  useMyCompanionProfile,
  usePhotoVerificationStatus,
  useSafeBack,
  useSubmitPhotoVerification,
  useUploadFile,
} from '@/lib/hooks';

type StepKey = 'id_front' | 'id_back' | 'selfie';

const STEPS: {
  key: StepKey;
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
}[] = [
  {
    key: 'id_front',
    titleKey: 'companion.verification.upload_id_front',
    descKey: 'companion.verification.id_front_desc',
    icon: IdCard,
  },
  {
    key: 'id_back',
    titleKey: 'companion.verification.upload_id_back',
    descKey: 'companion.verification.id_back_desc',
    icon: IdCard,
  },
  {
    key: 'selfie',
    titleKey: 'companion.verification.upload_selfie',
    descKey: 'companion.verification.selfie_desc',
    icon: User,
  },
];

function canSubmitVerification(status?: VerificationStatus): boolean {
  return !status || status === 'FAILED';
}

function pickImageSource(
  t: (key: string) => string,
  onCamera: () => void,
  onLibrary: () => void,
) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          t('common.cancel'),
          t('companion.verification.take_photo'),
          t('companion.verification.from_library'),
        ],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) onCamera();
        if (index === 2) onLibrary();
      },
    );
  } else {
    Alert.alert(
      t('companion.verification.choose_source'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('companion.verification.take_photo'), onPress: onCamera },
        { text: t('companion.verification.from_library'), onPress: onLibrary },
      ],
    );
  }
}

export default function CompanionVerificationScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/companion/(app)/account');

  const { data: profile, isLoading: profileLoading } = useMyCompanionProfile();
  const { data: verification, isLoading: verificationLoading } =
    usePhotoVerificationStatus();
  const uploadFile = useUploadFile();
  const submitVerification = useSubmitPhotoVerification();

  const [currentStep, setCurrentStep] = React.useState(0);
  const [photos, setPhotos] = React.useState<Record<StepKey, string | null>>({
    id_front: null,
    id_back: null,
    selfie: null,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const verificationStatus = (verification?.status ??
    profile?.verificationStatus) as VerificationStatus | undefined;
  const canSubmit = canSubmitVerification(verificationStatus);
  const isUnderReview =
    verificationStatus === 'PENDING' ||
    verificationStatus === 'UNDER_REVIEW';
  const isVerified = verificationStatus === 'VERIFIED';
  const isFailed = verificationStatus === 'FAILED';

  const launchCamera = React.useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('companion.verification.camera_permission'),
        t('companion.verification.camera_permission_desc'),
      );
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  }, [t]);

  const launchLibrary = React.useCallback(async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('companion.verification.library_permission'),
        t('companion.verification.library_permission_desc'),
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  }, [t]);

  const handlePickPhoto = React.useCallback(
    (stepKey: StepKey) => {
      const setUri = (uri: string | null) => {
        if (uri) {
          setPhotos((prev) => ({ ...prev, [stepKey]: uri }));
        }
      };

      pickImageSource(
        t,
        async () => setUri(await launchCamera()),
        async () => setUri(await launchLibrary()),
      );
    },
    [t, launchCamera, launchLibrary],
  );

  const handleSubmit = React.useCallback(async () => {
    const { id_front, id_back, selfie } = photos;
    if (!id_front || !id_back || !selfie) return;

    setIsSubmitting(true);
    try {
      const [front, back, selfieResult] = await Promise.all([
        uploadFile.mutateAsync({ uri: id_front, category: 'verification_doc' }),
        uploadFile.mutateAsync({ uri: id_back, category: 'verification_doc' }),
        uploadFile.mutateAsync({ uri: selfie, category: 'verification_doc' }),
      ]);

      await submitVerification.mutateAsync({
        idFrontUrl: front.url,
        idBackUrl: back.url,
        selfieUrl: selfieResult.url,
      });

      setPhotos({ id_front: null, id_back: null, selfie: null });
      setCurrentStep(0);
    } catch (error) {
      console.error('Verification submission failed:', error);
      Alert.alert(t('common.error'), t('companion.verification.upload_failed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [photos, uploadFile, submitVerification, t]);

  const allPhotosReady =
    photos.id_front && photos.id_back && photos.selfie;

  if (profileLoading || verificationLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />
      <CompanionHeader
        title={t('companion.verification.header')}
        onBack={goBack}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className={`items-center rounded-2xl p-6 ${
            isVerified
              ? 'bg-teal-50'
              : isUnderReview
                ? 'bg-yellow-50'
                : isFailed
                  ? 'bg-danger-50'
                  : 'bg-neutral-100'
          }`}
        >
          <View
            className={`mb-3 size-16 items-center justify-center rounded-full ${
              isVerified
                ? 'bg-teal-100'
                : isUnderReview
                  ? 'bg-yellow-100'
                  : isFailed
                    ? 'bg-danger-100'
                    : 'bg-neutral-200'
            }`}
          >
            {isVerified ? (
              <VerifiedBadge color={colors.teal[400]} width={32} height={32} />
            ) : isUnderReview ? (
              <Clock color={colors.yellow[500]} width={32} height={32} />
            ) : isFailed ? (
              <Warning color={colors.danger[400]} width={32} height={32} />
            ) : (
              <Shield color={colors.text.tertiary} width={32} height={32} />
            )}
          </View>
          <Text
            className={`font-urbanist-bold text-xl ${
              isVerified
                ? 'text-teal-700'
                : isUnderReview
                  ? 'text-yellow-700'
                  : isFailed
                    ? 'text-danger-500'
                    : 'text-midnight'
            }`}
          >
            {isVerified
              ? t('companion.verification.status.verified')
              : isUnderReview
                ? t('companion.verification.status.pending')
                : isFailed
                  ? t('companion.verification.status.rejected')
                  : t('companion.verification.status.not_started')}
          </Text>
          <Text className="mt-1 text-center text-sm text-text-secondary">
            {isVerified
              ? t('companion.verification.status.verified_desc')
              : isUnderReview
                ? t('companion.verification.review_in_progress')
                : isFailed
                  ? t('companion.verification.status.rejected_desc')
                  : t('companion.verification.status.not_started_desc')}
          </Text>

          {/* Rejection reason */}
          {isFailed && verification?.failureReason && (
            <View className="mt-3 w-full rounded-lg bg-danger-100 p-3">
              <Text className="text-xs font-medium text-danger-500">
                {t('companion.verification.rejection_reason')}:
              </Text>
              <Text className="mt-0.5 text-sm text-danger-500">
                {verification.failureReason}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Under Review — show submitted thumbnails */}
        {isUnderReview && verification && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="mt-4 rounded-2xl bg-white p-4"
          >
            <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
              {t('companion.verification.submitted_photos')}
            </Text>
            <View className="flex-row gap-3">
              {[
                verification.idFrontUrl,
                verification.idBackUrl,
                verification.selfieUrl,
              ].map((url, idx) =>
                url ? (
                  <View
                    key={idx}
                    className="flex-1 overflow-hidden rounded-xl"
                    style={{ aspectRatio: 3 / 2 }}
                  >
                    <Image
                      source={{ uri: url }}
                      className="size-full"
                      contentFit="cover"
                    />
                  </View>
                ) : null,
              )}
            </View>
            <Text className="mt-3 text-center text-xs text-text-tertiary">
              {t('companion.verification.review_estimate')}
            </Text>
          </MotiView>
        )}

        {/* Verified — benefits */}
        {isVerified && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="mt-4 rounded-2xl bg-white p-4"
          >
            <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
              {t('companion.verification.benefits_title')}
            </Text>
            <View className="gap-2.5">
              {(['benefit_1', 'benefit_2', 'benefit_3'] as const).map((key) => (
                <View key={key} className="flex-row items-center gap-2">
                  <CheckCircle
                    color={colors.teal[400]}
                    width={16}
                    height={16}
                  />
                  <Text className="flex-1 text-sm text-text-secondary">
                    {t(`companion.verification.${key}`)}
                  </Text>
                </View>
              ))}
            </View>
          </MotiView>
        )}

        {/* Upload Flow — shown when canSubmit */}
        {canSubmit && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="mt-4"
          >
            {/* Progress indicator */}
            <Text className="mb-1 text-center text-sm text-text-secondary">
              {t('companion.verification.step_progress', {
                current: currentStep + 1,
                total: STEPS.length,
              })}
            </Text>
            <View className="mb-4 flex-row gap-2 px-4">
              {STEPS.map((_, idx) => (
                <View
                  key={idx}
                  className={`h-1 flex-1 rounded-full ${
                    photos[STEPS[idx].key]
                      ? 'bg-lavender-900'
                      : idx === currentStep
                        ? 'bg-lavender-400'
                        : 'bg-neutral-200'
                  }`}
                />
              ))}
            </View>

            {/* Step cards */}
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const photo = photos[step.key];
              const isActive = idx === currentStep;

              return (
                <MotiView
                  key={step.key}
                  animate={{
                    opacity: isActive ? 1 : 0.5,
                    scale: isActive ? 1 : 0.97,
                  }}
                  transition={{ type: 'timing', duration: 250 }}
                  className={`mb-3 overflow-hidden rounded-2xl bg-white ${
                    isActive
                      ? 'border-2 border-lavender-900'
                      : 'border border-border-light'
                  }`}
                >
                  <Pressable
                    onPress={() => {
                      setCurrentStep(idx);
                      if (!photo) handlePickPhoto(step.key);
                    }}
                    className="p-4"
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`size-10 items-center justify-center rounded-full ${
                          photo ? 'bg-teal-100' : 'bg-lavender-50'
                        }`}
                      >
                        {photo ? (
                          <CheckCircle
                            color={colors.teal[400]}
                            width={20}
                            height={20}
                          />
                        ) : (
                          <StepIcon
                            color={colors.lavender[400]}
                            width={20}
                            height={20}
                          />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-urbanist-semibold text-base text-midnight">
                          {t(step.titleKey)}
                        </Text>
                        <Text className="mt-0.5 text-xs text-text-secondary">
                          {t(step.descKey)}
                        </Text>
                      </View>
                      {photo && (
                        <Pressable
                          onPress={() => handlePickPhoto(step.key)}
                          hitSlop={8}
                          className="rounded-lg bg-lavender-50 px-3 py-1.5"
                        >
                          <Text className="text-xs font-medium text-lavender-900">
                            {t('companion.verification.retake_photo')}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Photo preview */}
                    {photo && (
                      <View
                        className="mt-3 overflow-hidden rounded-xl"
                        style={{ aspectRatio: 3 / 2 }}
                      >
                        <Image
                          source={{ uri: photo }}
                          className="size-full"
                          contentFit="cover"
                        />
                      </View>
                    )}

                    {/* Upload buttons when active and no photo */}
                    {isActive && !photo && (
                      <View className="mt-3 flex-row gap-3">
                        <Pressable
                          onPress={() =>
                            launchCamera().then((uri) => {
                              if (uri)
                                setPhotos((prev) => ({
                                  ...prev,
                                  [step.key]: uri,
                                }));
                            })
                          }
                          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-900 py-3"
                        >
                          <Camera color="white" width={18} height={18} />
                          <Text className="font-urbanist-semibold text-sm text-white">
                            {t('companion.verification.take_photo')}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            launchLibrary().then((uri) => {
                              if (uri)
                                setPhotos((prev) => ({
                                  ...prev,
                                  [step.key]: uri,
                                }));
                            })
                          }
                          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-lavender-900 py-3"
                        >
                          <Gallery
                            color={colors.lavender[900]}
                            width={18}
                            height={18}
                          />
                          <Text className="font-urbanist-semibold text-sm text-lavender-900">
                            {t('companion.verification.from_library')}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </Pressable>
                </MotiView>
              );
            })}

            {/* Submit button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!allPhotosReady || isSubmitting}
              className={`mt-2 items-center rounded-2xl py-4 ${
                allPhotosReady && !isSubmitting
                  ? 'bg-lavender-900'
                  : 'bg-neutral-300'
              }`}
            >
              {isSubmitting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="font-urbanist-semibold text-base text-white">
                    {t('companion.verification.submitting')}
                  </Text>
                </View>
              ) : (
                <Text
                  className={`font-urbanist-semibold text-base ${
                    allPhotosReady ? 'text-white' : 'text-text-tertiary'
                  }`}
                >
                  {isFailed
                    ? t('companion.verification.resubmit')
                    : t('companion.verification.submit_verification')}
                </Text>
              )}
            </Pressable>
          </MotiView>
        )}

        {/* Privacy Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mt-6 rounded-2xl bg-teal-50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-teal-700">
            {t('companion.verification.privacy_title')}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('companion.verification.privacy_message')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
