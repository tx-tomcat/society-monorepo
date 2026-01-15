/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  Camera,
  Gallery,
  Plus,
} from '@/components/ui/icons';

export default function CreateProfile() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [photos, setPhotos] = React.useState<string[]>([
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  ]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleAddPhoto = React.useCallback(() => {
    // Simulate adding a photo
    const newPhotos = [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    ];
    if (photos.length < 6) {
      setPhotos([...photos, newPhotos[photos.length % newPhotos.length]]);
    }
  }, [photos]);

  const handleContinue = React.useCallback(() => {
    router.push('/companion/onboard/set-services' as Href);
  }, [router]);

  const isValid = name.length >= 2 && bio.length >= 20 && photos.length >= 3;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('companion.onboard.create_profile.header')}
          </Text>
          <Text className="text-sm text-text-tertiary">{t('companion.onboard.step', { current: 1, total: 4 })}</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6"
        >
          <Text className="mb-1 text-lg font-semibold text-midnight">
            {t('companion.onboard.create_profile.photos_title')}
          </Text>
          <Text className="mb-4 text-sm text-text-secondary">
            {t('companion.onboard.create_profile.photos_description')}
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {/* Main Photo */}
            <Pressable className="relative h-40 w-[48%] overflow-hidden rounded-2xl bg-softpink">
              {photos[0] ? (
                <>
                  <Image
                    source={{ uri: photos[0] }}
                    className="size-full"
                    contentFit="cover"
                  />
                  <View className="absolute bottom-2 left-2 rounded-full bg-lavender-400 px-2 py-1">
                    <Text className="text-xs font-semibold text-white">{t('companion.onboard.create_profile.main')}</Text>
                  </View>
                </>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Camera color={colors.lavender[400]} size={32} />
                  <Text className="mt-2 text-sm text-lavender-400">{t('companion.onboard.create_profile.add_main')}</Text>
                </View>
              )}
            </Pressable>

            {/* Additional Photos */}
            {[1, 2, 3, 4, 5].map((index) => (
              <Pressable
                key={index}
                onPress={handleAddPhoto}
                className="h-24 w-[30%] overflow-hidden rounded-xl bg-softpink"
              >
                {photos[index] ? (
                  <Image
                    source={{ uri: photos[index] }}
                    className="size-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Plus color={colors.lavender[400]} width={24} height={24} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Text className="mt-2 text-xs text-text-tertiary">
            {t('companion.onboard.create_profile.photos_count', { count: photos.length, max: 6, min: 3 })}
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
            {t('companion.onboard.create_profile.display_name')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('companion.onboard.create_profile.display_name_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            className="rounded-xl border border-border-light bg-white px-4 py-4 text-base text-midnight"
            style={{ fontFamily: 'Urbanist_500Medium' }}
            maxLength={30}
          />
          <Text className="mt-1 text-right text-xs text-text-tertiary">
            {name.length}/30
          </Text>
        </MotiView>

        {/* Bio */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.onboard.create_profile.about_you')}
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={t('companion.onboard.create_profile.about_you_placeholder')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            className="min-h-[120px] rounded-xl border border-border-light bg-white px-4 py-4 text-base text-midnight"
            style={{ fontFamily: 'Urbanist_500Medium', textAlignVertical: 'top' }}
            maxLength={500}
          />
          <Text className="mt-1 text-right text-xs text-text-tertiary">
            {t('companion.onboard.create_profile.bio_count', { count: bio.length, max: 500, min: 20 })}
          </Text>
        </MotiView>

        {/* Tips */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="rounded-xl bg-lavender-400/10 p-4"
        >
          <Text className="mb-2 text-sm font-semibold text-lavender-400">
            {t('companion.onboard.create_profile.tips_title')}
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-text-secondary">
              • {t('companion.onboard.create_profile.tip_1')}
            </Text>
            <Text className="text-sm text-text-secondary">
              • {t('companion.onboard.create_profile.tip_2')}
            </Text>
            <Text className="text-sm text-text-secondary">
              • {t('companion.onboard.create_profile.tip_3')}
            </Text>
            <Text className="text-sm text-text-secondary">
              • {t('companion.onboard.create_profile.tip_4')}
            </Text>
          </View>
        </MotiView>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-white">
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
