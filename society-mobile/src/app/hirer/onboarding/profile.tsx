/* eslint-disable max-lines-per-function */
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  User,
} from '@/components/ui/icons';
import { useUpdateProfile, useUploadAvatar } from '@/lib/hooks';
import { isAdult } from '@/lib/validation';

type Gender = 'male' | 'female' | 'other';

const GENDER_OPTIONS: { value: Gender; labelKey: string }[] = [
  { value: 'male', labelKey: 'common.male' },
  { value: 'female', labelKey: 'common.female' },
  { value: 'other', labelKey: 'common.other' },
];

export default function HirerOnboardingProfile() {
  const router = useRouter();
  const { t } = useTranslation();

  // API hooks
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  // Form state
  const [fullName, setFullName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = React.useState<{
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
  }>({});
  const [touched, setTouched] = React.useState<{
    fullName?: boolean;
    dateOfBirth?: boolean;
    gender?: boolean;
  }>({});

  // Validate individual fields
  const validateName = React.useCallback(
    (name: string): string | undefined => {
      if (!name.trim())
        return t('hirer.onboarding.profile.errors.name_required');
      if (name.trim().length < 2) return t('auth.validation.name_min_length');
      if (name.trim().length > 50) return t('auth.validation.name_max_length');
      if (!/^[a-zA-ZÀ-ỹ\s'-]+$/.test(name.trim()))
        return t('auth.validation.name_invalid');
      return undefined;
    },
    [t]
  );

  const validateDob = React.useCallback(
    (dob: Date | null): string | undefined => {
      if (!dob) return t('hirer.onboarding.profile.errors.dob_required');
      if (!isAdult(dob))
        return t('hirer.onboarding.profile.errors.age_minimum');
      return undefined;
    },
    [t]
  );

  const validateGender = React.useCallback(
    (g: Gender | null): string | undefined => {
      if (!g) return t('hirer.onboarding.profile.errors.gender_required');
      return undefined;
    },
    [t]
  );

  // Update errors when form values change
  React.useEffect(() => {
    const newErrors: typeof errors = {};
    if (touched.fullName) {
      newErrors.fullName = validateName(fullName);
    }
    if (touched.dateOfBirth) {
      newErrors.dateOfBirth = validateDob(dateOfBirth);
    }
    if (touched.gender) {
      newErrors.gender = validateGender(gender);
    }
    setErrors(newErrors);
  }, [
    fullName,
    dateOfBirth,
    gender,
    touched,
    validateName,
    validateDob,
    validateGender,
  ]);

  // Overall form validity
  const isFormValid = React.useMemo(() => {
    return (
      !validateName(fullName) &&
      !validateDob(dateOfBirth) &&
      !validateGender(gender)
    );
  }, [
    fullName,
    dateOfBirth,
    gender,
    validateName,
    validateDob,
    validateGender,
  ]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handlePickAvatar = React.useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error'),
        t('auth.verification.gallery_permission_required')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, [t]);

  const handleDateChange = React.useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setDateOfBirth(selectedDate);
      }
    },
    []
  );

  const formatDate = React.useCallback((date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const handleContinue = React.useCallback(async () => {
    // Mark all fields as touched to show validation errors
    setTouched({ fullName: true, dateOfBirth: true, gender: true });

    if (!isFormValid || !dateOfBirth || !gender) return;

    try {
      // Update the user profile with the provided information
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        gender,
      });

      // Upload avatar if selected
      if (avatarUri) {
        const formData = new FormData();
        formData.append('file', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as unknown as Blob);
        await uploadAvatar.mutateAsync(formData);
      }

      // Navigate to main hirer app after profile completion
      router.replace('/(app)' as Href);
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert(
        t('common.error'),
        t('auth.onboarding.profile_creation_failed')
      );
    }
  }, [
    isFormValid,
    dateOfBirth,
    gender,
    fullName,
    avatarUri,
    updateProfile,
    uploadAvatar,
    router,
    t,
  ]);

  const isLoading = updateProfile.isPending || uploadAvatar.isPending;

  // Calculate max date (18 years ago)
  const maxDate = React.useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  }, []);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text
            style={styles.headerTitle}
            className="flex-1 text-xl text-black"
          >
            {t('auth.onboarding.create_profile')}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="mb-8 items-center"
          >
            <Pressable onPress={handlePickAvatar} className="relative">
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="size-28 rounded-full"
                  contentFit="cover"
                />
              ) : (
                <View className="size-28 items-center justify-center rounded-full bg-softpink">
                  <User color={colors.rose[400]} width={48} height={48} />
                </View>
              )}
              <View className="absolute bottom-0 right-0 size-9 items-center justify-center rounded-full bg-rose-400">
                <Camera color="#FFFFFF" width={18} height={18} />
              </View>
            </Pressable>
            <Text className="mt-3 text-sm text-black">
              {t('auth.onboarding.tap_to_add_photo')}
            </Text>
          </MotiView>



          {/* Date of Birth */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            className="mb-4"
          >
            <Text className="mb-2 text-sm font-medium text-text-secondary">
              {t('hirer.onboarding.profile.date_of_birth')}
            </Text>
            <Pressable
              onPress={() => {
                setShowDatePicker(true);
                setTouched((prev) => ({ ...prev, dateOfBirth: true }));
              }}
              className={`flex-row items-center rounded-xl border bg-white p-4 ${errors.dateOfBirth ? 'border-red-400' : 'border-border-light'
                }`}
            >
              <Calendar
                color={
                  errors.dateOfBirth ? colors.rose[400] : colors.text.tertiary
                }
                width={20}
                height={20}
              />
              <Text
                className={`flex-1 pl-3 text-base ${dateOfBirth ? 'text-midnight' : 'text-text-tertiary'
                  }`}
                style={styles.input}
              >
                {dateOfBirth
                  ? formatDate(dateOfBirth)
                  : t('auth.onboarding.select_date')}
              </Text>
            </Pressable>
            {errors.dateOfBirth ? (
              <Text className="mt-1 text-sm text-red-400">
                {errors.dateOfBirth}
              </Text>
            ) : (
              <Text className="mt-1 text-xs text-text-tertiary">
                {t('auth.onboarding.age_requirement')}
              </Text>
            )}
          </MotiView>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || maxDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={maxDate}
            />
          )}

          {/* Gender */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            className="mb-8"
          >
            <Text className="mb-2 text-sm font-medium text-text-secondary">
              {t('hirer.onboarding.profile.gender')}
            </Text>
            <View className="flex-row gap-3">
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setGender(option.value);
                    setTouched((prev) => ({ ...prev, gender: true }));
                  }}
                  className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 ${gender === option.value
                    ? 'border-rose-400 bg-softpink'
                    : errors.gender
                      ? 'border-red-200 bg-white'
                      : 'border-border-light bg-white'
                    }`}
                >
                  {gender === option.value && (
                    <Check color={colors.rose[400]} width={16} height={16} />
                  )}
                  <Text
                    className={`font-medium ${gender === option.value
                      ? 'text-rose-400'
                      : 'text-text-secondary'
                      }`}
                  >
                    {t(
                      `hirer.onboarding.profile.gender_options.${option.value}`
                    )}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.gender && (
              <Text className="mt-1 text-sm text-red-400">{errors.gender}</Text>
            )}
          </MotiView>

          {/* Continue Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
          >
            <Button
              label={t('common.continue')}
              onPress={handleContinue}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              variant="default"
              size="lg"
              fullWidth
            />
          </MotiView>

          {/* Terms Notice */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            className="mt-6"
          >
            <Text className="text-center text-xs leading-relaxed text-text-tertiary">
              {t('auth.onboarding.terms_notice')}
            </Text>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  input: {
    fontFamily: 'Urbanist_500Medium',
  },
});
