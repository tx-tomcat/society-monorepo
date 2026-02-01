/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  TextInput as NTextInput,
  Pressable,
  ScrollView,
} from 'react-native';

import {
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  Text,
  View
} from '@/components/ui';
import { ArrowRight } from '@/components/ui/icons';
import {
  useAllOccasions,
  useMyCompanionProfile,
  useSafeBack,
  useUpdateCompanionProfile,
  useUpdateCompanionServices,
} from '@/lib/hooks';

export default function EditCompanionProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useSafeBack('/companion/(app)/account');

  // React Query hooks
  const { data: profile, isLoading } = useMyCompanionProfile();
  const { data: occasions, isLoading: occasionsLoading } = useAllOccasions();
  const updateProfile = useUpdateCompanionProfile();
  const updateServices = useUpdateCompanionServices();

  const [displayName, setDisplayName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState('');
  const [selectedOccasionIds, setSelectedOccasionIds] = React.useState<string[]>([]);

  // Pre-populate form fields when profile loads
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setHourlyRate(profile.hourlyRate?.toString() || '500000');
      setSelectedOccasionIds(profile.services?.map((s) => s.occasionId) || []);
    }
  }, [profile]);

  const isSaving = updateProfile.isPending || updateServices.isPending;

  const handleSave = React.useCallback(async () => {
    if (isSaving) return;

    try {
      // Update profile information
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim(),
        hourlyRate: parseInt(hourlyRate, 10) || 500000,
      });

      await updateServices.mutateAsync(
        selectedOccasionIds.map((occasionId) => ({ occasionId, isEnabled: true }))
      );

      Alert.alert(
        t('common.success'),
        t('companion.edit_profile.success_message'),
        [{ text: t('common.ok'), onPress: goBack }]
      );
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert(t('common.error'), t('errors.try_again'));
    }
  }, [displayName, bio, hourlyRate, selectedOccasionIds, goBack, t, isSaving, updateProfile, updateServices]);

  const handleToggleOccasion = React.useCallback((occasionId: string) => {
    setSelectedOccasionIds((prev) =>
      prev.includes(occasionId)
        ? prev.filter((o) => o !== occasionId)
        : [...prev, occasionId]
    );
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader title={t('companion.edit_profile.header')} onBack={goBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos Link */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6"
        >
          <Pressable
            onPress={() => router.push('/companion/settings/photos')}
            testID="manage-photos-button"
            className="flex-row items-center justify-between rounded-xl bg-lavender-400/10 p-4"
          >
            <View>
              <Text className="font-semibold text-lavender-400">
                {t('companion.edit_profile.manage_photos')}
              </Text>
              <Text className="text-sm text-text-secondary">
                {t('companion.edit_profile.manage_photos_description')}
              </Text>
            </View>
            <ArrowRight color={colors.lavender[400]} width={20} height={20} />
          </Pressable>
        </MotiView>

        {/* Display Name */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6"
        >
          <Input
            label={t('companion.edit_profile.display_name')}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('companion.edit_profile.display_name_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            testID="name-input"
            style={{ fontFamily: 'Urbanist_500Medium', color: colors.midnight.DEFAULT }}
            maxLength={30}
          />
        </MotiView>

        {/* Bio */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6"
        >
          <Input
            label={t('companion.edit_profile.about_me')}
            value={bio}
            onChangeText={setBio}
            placeholder={t('companion.edit_profile.about_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            testID="bio-input"
            style={{
              fontFamily: 'Urbanist_500Medium',
              textAlignVertical: 'top',
              color: colors.midnight.DEFAULT,
            }}
            maxLength={500}
          />
          <Text className="mt-1 text-right text-xs text-text-tertiary">
            {bio.length}/500
          </Text>
        </MotiView>

        {/* Hourly Rate */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mb-4"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.edit_profile.hourly_rate')}
          </Text>
          <View className="flex-row items-center rounded-[10px] border border-border-light bg-warmwhite px-5">
            <Text
              style={{ fontSize: 18, fontFamily: 'Urbanist_600SemiBold' }}
              className="text-text-tertiary"
            >
              ₫
            </Text>
            <NTextInput
              value={hourlyRate ? parseInt(hourlyRate, 10).toLocaleString('vi-VN') : ''}
              onChangeText={(text) => setHourlyRate(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              testID="hourly-rate-input"
              placeholder="0"
              placeholderTextColor={colors.neutral[400]}
              className="min-h-[65px] flex-1 pl-2"
              style={{ fontSize: 18, fontFamily: 'Urbanist_600SemiBold', color: colors.midnight.DEFAULT }}
            />
            <Text className="text-sm text-text-secondary">
              {t('companion.edit_profile.per_hour')}
            </Text>
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
            label={t('companion.edit_profile.save_changes')}
            onPress={handleSave}
            variant="default"
            size="lg"
            loading={isSaving}
            disabled={isSaving}
            testID="save-changes-button"
            className="w-full bg-lavender-900"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
