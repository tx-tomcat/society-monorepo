/* eslint-disable max-lines-per-function */
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
  StyleSheet,
  TextInput,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Camera, Plus, X } from '@/components/ui/icons';
import { useCompanionOnboarding } from '@/lib/stores';

export default function CreateProfile() {
  const router = useRouter();
  const { t } = useTranslation();

  // Get data from store
  const displayName = useCompanionOnboarding.use.displayName();
  const bio = useCompanionOnboarding.use.bio();
  const photoFiles = useCompanionOnboarding.use.photoFiles();
  const setProfileData = useCompanionOnboarding.use.setProfileData();
  const markStepComplete = useCompanionOnboarding.use.markStepComplete();

  // Local state for inputs
  const [name, setName] = React.useState(displayName);
  const [bioText, setBioText] = React.useState(bio);
  const [photos, setPhotos] = React.useState<string[]>(photoFiles);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const pickImage = async (useCamera = false): Promise<string | null> => {
    if (useCamera) {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('permissions.camera_required'),
          t('permissions.camera_description'),
          [{ text: t('common.ok') }]
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    } else {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t('permissions.photos_required'),
          t('permissions.photos_description'),
          [{ text: t('common.ok') }]
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
    }
    return null;
  };

  const handleAddPhoto = React.useCallback(
    async (index: number) => {
      if (photos.length >= 6 && index >= photos.length) {
        showMessage({
          message: t('companion.onboard.create_profile.max_photos'),
          type: 'warning',
        });
        return;
      }

      Alert.alert(
        t('companion.onboard.create_profile.add_photo'),
        t('companion.onboard.create_profile.choose_source'),
        [
          {
            text: t('common.camera'),
            onPress: async () => {
              const uri = await pickImage(true);
              if (uri) {
                const newPhotos = [...photos];
                if (index < photos.length) {
                  newPhotos[index] = uri;
                } else {
                  newPhotos.push(uri);
                }
                setPhotos(newPhotos);
              }
            },
          },
          {
            text: t('common.gallery'),
            onPress: async () => {
              const uri = await pickImage(false);
              if (uri) {
                const newPhotos = [...photos];
                if (index < photos.length) {
                  newPhotos[index] = uri;
                } else {
                  newPhotos.push(uri);
                }
                setPhotos(newPhotos);
              }
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    },
    [photos, t]
  );

  const handleRemovePhoto = React.useCallback(
    (index: number) => {
      if (index === 0 && photos.length === 1) {
        showMessage({
          message: t('companion.onboard.create_profile.need_main_photo'),
          type: 'warning',
        });
        return;
      }
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
    },
    [photos, t]
  );

  const handleContinue = React.useCallback(() => {
    // Save to store
    setProfileData({
      displayName: name,
      bio: bioText,
      photoFiles: photos,
    });
    markStepComplete('create-profile');
    router.push('/companion/onboard/set-services' as Href);
  }, [name, bioText, photos, setProfileData, markStepComplete, router]);

  // Validation states
  const MIN_NAME_LENGTH = 2;
  const MIN_BIO_LENGTH = 20;
  const MIN_PHOTOS = 3;

  const isNameTooShort = name.length > 0 && name.length < MIN_NAME_LENGTH;
  const isBioTooShort = bioText.length > 0 && bioText.length < MIN_BIO_LENGTH;
  const needsMorePhotos = photos.length > 0 && photos.length < MIN_PHOTOS;

  const isValid =
    name.length >= MIN_NAME_LENGTH &&
    bioText.length >= MIN_BIO_LENGTH &&
    photos.length >= MIN_PHOTOS;

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
            {t('companion.onboard.create_profile.header')}
          </Text>
          <Text className="text-sm text-text-tertiary">
            {t('companion.onboard.step', { current: 1, total: 4 })}
          </Text>
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
            <Pressable
              onPress={() => handleAddPhoto(0)}
              className="relative h-40 w-[48%] overflow-hidden rounded-2xl bg-softpink"
            >
              {photos[0] ? (
                <>
                  <Image
                    source={{ uri: photos[0] }}
                    className="size-full"
                    contentFit="cover"
                  />
                  <View className="absolute bottom-2 left-2 rounded-full bg-lavender-400 px-2 py-1">
                    <Text className="text-xs font-semibold text-white">
                      {t('companion.onboard.create_profile.main')}
                    </Text>
                  </View>
                  {photos.length > 1 && (
                    <Pressable
                      onPress={() => handleRemovePhoto(0)}
                      className="absolute right-2 top-2 size-6 items-center justify-center rounded-full bg-midnight/60"
                    >
                      <X color="#FFFFFF" width={14} height={14} />
                    </Pressable>
                  )}
                </>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Camera color={colors.lavender[400]} width={32} height={32} />
                  <Text className="mt-2 text-sm text-lavender-400">
                    {t('companion.onboard.create_profile.add_main')}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Additional Photos */}
            {[1, 2, 3, 4, 5].map((index) => (
              <Pressable
                key={index}
                onPress={() => handleAddPhoto(index)}
                className="relative h-24 w-[30%] overflow-hidden rounded-xl bg-softpink"
              >
                {photos[index] ? (
                  <>
                    <Image
                      source={{ uri: photos[index] }}
                      className="size-full"
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => handleRemovePhoto(index)}
                      className="absolute right-1 top-1 size-5 items-center justify-center rounded-full bg-midnight/60"
                    >
                      <X color="#FFFFFF" width={12} height={12} />
                    </Pressable>
                  </>
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Plus color={colors.lavender[400]} width={24} height={24} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Text
            className={`mt-2 text-xs ${needsMorePhotos ? 'text-danger-400' : 'text-text-tertiary'}`}
          >
            {needsMorePhotos
              ? t('companion.onboard.create_profile.need_more_photos', {
                  count: MIN_PHOTOS - photos.length,
                })
              : t('companion.onboard.create_profile.photos_count', {
                  count: photos.length,
                  max: 6,
                  min: MIN_PHOTOS,
                })}
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
            placeholder={t(
              'companion.onboard.create_profile.display_name_placeholder'
            )}
            placeholderTextColor={colors.text.tertiary}
            className={`rounded-xl border bg-white p-4 text-base ${
              isNameTooShort ? 'border-danger-400' : 'border-border-light'
            }`}
            style={{ fontFamily: 'Urbanist_500Medium', color: colors.midnight.DEFAULT }}
            maxLength={30}
          />
          <View className="mt-1 flex-row justify-between">
            {isNameTooShort ? (
              <Text className="text-xs text-danger-400">
                {t('companion.onboard.create_profile.name_too_short', {
                  min: MIN_NAME_LENGTH,
                })}
              </Text>
            ) : (
              <View />
            )}
            <Text className="text-xs text-text-tertiary">{name.length}/30</Text>
          </View>
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
            value={bioText}
            onChangeText={setBioText}
            placeholder={t(
              'companion.onboard.create_profile.about_you_placeholder'
            )}
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            className={`min-h-[120px] rounded-xl border bg-white p-4 text-base ${
              isBioTooShort ? 'border-danger-400' : 'border-border-light'
            }`}
            style={{
              fontFamily: 'Urbanist_500Medium',
              textAlignVertical: 'top',
              color: colors.midnight.DEFAULT,
            }}
            maxLength={500}
          />
          <View className="mt-1 flex-row justify-between">
            {isBioTooShort ? (
              <Text className="text-xs text-danger-400">
                {t('companion.onboard.create_profile.bio_too_short', {
                  remaining: MIN_BIO_LENGTH - bioText.length,
                })}
              </Text>
            ) : (
              <View />
            )}
            <Text
              className={`text-xs ${bioText.length >= 450 ? 'text-yellow-600' : 'text-text-tertiary'}`}
            >
              {t('companion.onboard.create_profile.bio_count', {
                count: bioText.length,
                max: 500,
                min: MIN_BIO_LENGTH,
              })}
            </Text>
          </View>
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
