import DateTimePicker from '@react-native-community/datetimepicker';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Calendar, Check, ChevronDown, MapPin, X } from '@/components/ui/icons';
import { VIETNAM_PROVINCES, getProvinceName } from '@/lib/constants';
import { usePhoneVerificationStatus, useUpdateProfile } from '@/lib/hooks';
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
  const { data: phoneStatus } = usePhoneVerificationStatus();

  // Form state
  const [dateOfBirth, setDateOfBirth] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [gender, setGender] = React.useState<Gender | null>(null);
  const [province, setProvince] = React.useState<string>('');
  const [showProvincePicker, setShowProvincePicker] = React.useState(false);

  // Validation errors
  const [errors, setErrors] = React.useState<{
    dateOfBirth?: string;
    gender?: string;
    province?: string;
  }>({});
  const [touched, setTouched] = React.useState<{
    dateOfBirth?: boolean;
    gender?: boolean;
    province?: boolean;
  }>({});

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

  const validateProvince = React.useCallback(
    (p: string): string | undefined => {
      if (!p) return t('location.province_required');
      return undefined;
    },
    [t]
  );

  // Update errors when form values change
  React.useEffect(() => {
    const newErrors: typeof errors = {};

    if (touched.dateOfBirth) {
      newErrors.dateOfBirth = validateDob(dateOfBirth);
    }
    if (touched.gender) {
      newErrors.gender = validateGender(gender);
    }
    if (touched.province) {
      newErrors.province = validateProvince(province);
    }
    setErrors(newErrors);
  }, [dateOfBirth, gender, province, touched, validateDob, validateGender, validateProvince]);

  // Overall form validity
  const isFormValid = React.useMemo(() => {
    return !validateDob(dateOfBirth) && !validateGender(gender) && !validateProvince(province);
  }, [dateOfBirth, gender, province, validateDob, validateGender, validateProvince]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

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
    setTouched({ dateOfBirth: true, gender: true, province: true });

    if (!isFormValid || !dateOfBirth || !gender || !province) return;

    // Check phone verification - redirect if not verified
    if (!phoneStatus?.isVerified) {
      router.push('/phone-verification' as Href);
      return;
    }

    try {
      // Update the user profile with the provided information
      await updateProfile.mutateAsync({
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        gender,
        province,
      });

      console.log('Profile updated successfully');
      // Navigate to main hirer app after profile completion
      router.replace('/(app)' as Href);
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert(
        t('common.error'),
        t('auth.onboarding.profile_creation_failed')
      );
    }
  }, [isFormValid, dateOfBirth, gender, province, phoneStatus, updateProfile, router, t]);

  const isLoading = updateProfile.isPending;

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
          <Text className="flex-1 font-urbanist-bold text-xl text-black">
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
          {/* Date of Birth */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
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
                className={`flex-1 pl-3 font-urbanist-medium text-base ${dateOfBirth ? 'text-midnight' : 'text-text-tertiary'
                  }`}
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
              themeVariant="light"
            />
          )}

          {/* Gender */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
            className="mb-4"
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

          {/* Location */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            className="mb-8"
          >
            <Text className="mb-2 text-sm font-medium text-text-secondary">
              {t('location.province')}
            </Text>
            <Pressable
              onPress={() => {
                setShowProvincePicker(true);
                setTouched((prev) => ({ ...prev, province: true }));
              }}
              className={`flex-row items-center rounded-xl border bg-white p-4 ${
                errors.province ? 'border-red-400' : 'border-border-light'
              }`}
            >
              <MapPin
                color={errors.province ? colors.rose[400] : colors.text.tertiary}
                width={20}
                height={20}
              />
              <Text
                className={`flex-1 pl-3 font-urbanist-medium text-base ${
                  province ? 'text-midnight' : 'text-text-tertiary'
                }`}
              >
                {province
                  ? getProvinceName(province, 'vi')
                  : t('location.select_province')}
              </Text>
              <ChevronDown color={colors.text.tertiary} width={20} height={20} />
            </Pressable>
            {errors.province && (
              <Text className="mt-1 text-sm text-red-400">{errors.province}</Text>
            )}
          </MotiView>

          {/* Province Picker Modal */}
          {showProvincePicker && (
            <View className="absolute inset-0 z-50 bg-black/50">
              <Pressable
                className="flex-1"
                onPress={() => setShowProvincePicker(false)}
              />
              <View className="max-h-[70%] rounded-t-3xl bg-white">
                <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3">
                  <Text className="text-lg font-semibold text-midnight">
                    {t('location.select_province')}
                  </Text>
                  <Pressable onPress={() => setShowProvincePicker(false)}>
                    <X color={colors.midnight.DEFAULT} width={24} height={24} />
                  </Pressable>
                </View>
                <ScrollView className="p-4">
                  {VIETNAM_PROVINCES.map((p) => (
                    <Pressable
                      key={p.code}
                      onPress={() => {
                        setProvince(p.code);
                        setShowProvincePicker(false);
                      }}
                      className={`mb-2 rounded-xl border p-4 ${
                        province === p.code
                          ? 'border-rose-400 bg-softpink'
                          : 'border-border-light bg-white'
                      }`}
                    >
                      <Text
                        className={`text-base ${
                          province === p.code ? 'text-rose-400 font-semibold' : 'text-midnight'
                        }`}
                      >
                        {p.name}
                      </Text>
                      <Text className="text-sm text-text-tertiary">{p.nameEn}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Continue Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
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
            transition={{ type: 'timing', duration: 500, delay: 300 }}
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
