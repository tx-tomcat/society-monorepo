/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, CheckCircle, Plus } from '@/components/ui/icons';
import { useAllOccasions, useSafeBack } from '@/lib/hooks';

export default function EditCompanionProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useSafeBack('/companion/profile');
  const { data: occasions, isLoading: occasionsLoading } = useAllOccasions();
  const [name, setName] = React.useState('Minh Anh');
  const [bio, setBio] = React.useState(
    'Professional companion specializing in weddings and corporate events. Fluent in Vietnamese and English.'
  );
  const [hourlyRate, setHourlyRate] = React.useState('500000');
  const [selectedOccasionIds, setSelectedOccasionIds] = React.useState<string[]>([]);
  const [photos, setPhotos] = React.useState([
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  ]);

  const handleSave = React.useCallback(() => {
    Alert.alert(
      t('common.success'),
      t('companion.edit_profile.success_message'),
      [{ text: t('common.ok'), onPress: goBack }]
    );
  }, [goBack, t]);

  const handleToggleOccasion = React.useCallback((occasionId: string) => {
    setSelectedOccasionIds((prev) =>
      prev.includes(occasionId)
        ? prev.filter((o) => o !== occasionId)
        : [...prev, occasionId]
    );
  }, []);

  const handleAddPhoto = React.useCallback(() => {
    if (photos.length < 6) {
      // Simulate adding a photo
      const newPhotos = [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
      ];
      setPhotos([...photos, newPhotos[photos.length % newPhotos.length]]);
    }
  }, [photos]);

  const handleRemovePhoto = React.useCallback(
    (index: number) => {
      if (photos.length > 1) {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [photos.length]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={goBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="font-urbanist-bold flex-1 text-xl text-midnight">
            {t('companion.edit_profile.header')}
          </Text>
          <Pressable onPress={handleSave} testID="header-save-button">
            <Text className="font-semibold text-lavender-400">
              {t('common.save')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6"
        >
          <Text className="mb-3 text-lg font-semibold text-midnight">
            {t('companion.edit_profile.profile_photos')}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {photos.map((photo, index) => (
              <Pressable
                key={index}
                onLongPress={() => handleRemovePhoto(index)}
                className="relative size-[30%] overflow-hidden rounded-xl"
              >
                <Image
                  source={{ uri: photo }}
                  className="size-full"
                  contentFit="cover"
                />
                {index === 0 && (
                  <View className="absolute bottom-1 left-1 rounded bg-lavender-400 px-1.5 py-0.5">
                    <Text className="text-xs font-semibold text-white">
                      {t('companion.edit_profile.main')}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
            {photos.length < 6 && (
              <Pressable
                onPress={handleAddPhoto}
                className="size-[30%] items-center justify-center rounded-xl border-2 border-dashed border-lavender-400"
              >
                <Plus color={colors.lavender[400]} width={24} height={24} />
                <Text className="mt-1 text-xs text-lavender-400">
                  {t('common.add')}
                </Text>
              </Pressable>
            )}
          </View>
          <Text className="mt-2 text-xs text-text-tertiary">
            {t('companion.edit_profile.photo_hint')}
          </Text>
        </MotiView>

        {/* Display Name */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.edit_profile.display_name')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('companion.edit_profile.display_name_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            testID="name-input"
            className="rounded-xl border border-border-light bg-white p-4 text-base"
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
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.edit_profile.about_me')}
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={t('companion.edit_profile.about_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            testID="bio-input"
            className="min-h-[120px] rounded-xl border border-border-light bg-white p-4 text-base"
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
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.edit_profile.hourly_rate')}
          </Text>
          <View className="flex-row items-center rounded-xl border border-border-light bg-white px-4">
            <Text className="text-lg text-text-tertiary">₫</Text>
            <TextInput
              value={parseInt(hourlyRate, 10).toLocaleString('vi-VN')}
              onChangeText={(text) => setHourlyRate(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              testID="hourly-rate-input"
              className="flex-1 py-4 pl-2 text-lg font-semibold"
              style={{ fontFamily: 'Urbanist_600SemiBold', color: colors.midnight.DEFAULT }}
            />
            <Text className="text-text-secondary">
              {t('companion.edit_profile.per_hour')}
            </Text>
          </View>
        </MotiView>

        {/* Occasions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mb-6"
        >
          <Text className="mb-3 text-lg font-semibold text-midnight">
            {t('companion.edit_profile.occasions_i_accept')}
          </Text>
          {occasionsLoading ? (
            <ActivityIndicator color={colors.lavender[400]} />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {occasions?.map((occasion) => {
                const isSelected = selectedOccasionIds.includes(occasion.id);
                return (
                  <Pressable
                    key={occasion.id}
                    onPress={() => handleToggleOccasion(occasion.id)}
                    testID={`occasion-${occasion.code}`}
                    className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${
                      isSelected
                        ? 'bg-lavender-400'
                        : 'border border-border-light bg-white'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle color="#FFFFFF" width={16} height={16} />
                    )}
                    <Text
                      className={`font-medium ${
                        isSelected ? 'text-white' : 'text-midnight'
                      }`}
                    >
                      {occasion.emoji} {occasion.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </MotiView>

        {/* Availability Link */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
          className="mb-6"
        >
          <Pressable
            onPress={() => router.push('/companion/onboard/set-availability')}
            testID="update-availability-button"
            className="flex-row items-center justify-between rounded-xl bg-lavender-400/10 p-4"
          >
            <View>
              <Text className="font-semibold text-lavender-400">
                {t('companion.edit_profile.update_availability')}
              </Text>
              <Text className="text-sm text-text-secondary">
                {t('companion.edit_profile.availability_description')}
              </Text>
            </View>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <ArrowLeft color={colors.lavender[400]} size={20} />
            </View>
          </Pressable>
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
            testID="save-changes-button"
            className="w-full bg-lavender-400"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
