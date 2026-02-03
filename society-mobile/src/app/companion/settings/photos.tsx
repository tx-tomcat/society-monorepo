/* eslint-disable max-lines-per-function */
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native';

import {
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Image,
  Text,
  View,
} from '@/components/ui';
import { Plus, Trash2 } from '@/components/ui/icons';
import {
  type CompanionPhoto,
  getPhotoUrl,
  isCompanionPhoto,
} from '@/lib/api/services/companions.service';
import {
  useAddCompanionPhoto,
  useMyCompanionProfile,
  useRemoveCompanionPhoto,
  useSafeBack,
  useUploadFile,
} from '@/lib/hooks';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 1;

export default function CompanionPhotosScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/companion/(app)/account');
  const [deletingPhotoId, setDeletingPhotoId] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // React Query hooks
  const { data: profile, isLoading, refetch } = useMyCompanionProfile();
  const uploadFile = useUploadFile();
  const addPhoto = useAddCompanionPhoto();
  const removePhoto = useRemoveCompanionPhoto();

  const photos = profile?.photos || [];

  const handleAddPhoto = React.useCallback(async () => {
    if (!profile || photos.length >= MAX_PHOTOS) {
      Alert.alert(t('companion.photos.max_photos_title'), t('companion.photos.max_photos_message'));
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('auth.verification.photos_required'),
        t('auth.verification.photos_description')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const asset = result.assets[0];
      const uploadResult = await uploadFile.mutateAsync({
        uri: asset.uri,
        category: 'profile_photo',
      });
      const isPrimary = photos.length === 0;
      await addPhoto.mutateAsync({ url: uploadResult.url, isPrimary });
      refetch();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      Alert.alert(t('common.error'), t('companion.photos.upload_failed'));
    } finally {
      setIsUploading(false);
    }
  }, [profile, photos, t, uploadFile, addPhoto, refetch]);

  const handleDeletePhoto = React.useCallback(
    async (photo: CompanionPhoto | string) => {
      if (!profile) return;

      if (photos.length <= MIN_PHOTOS) {
        Alert.alert(
          t('companion.photos.min_photos_title'),
          t('companion.photos.min_photos_message')
        );
        return;
      }

      const photoId = isCompanionPhoto(photo) ? photo.id : null;
      if (!photoId) {
        Alert.alert(t('common.error'), t('errors.try_again'));
        return;
      }

      Alert.alert(
        t('companion.photos.delete_title'),
        t('companion.photos.delete_message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: async () => {
              setDeletingPhotoId(photoId);
              try {
                await removePhoto.mutateAsync(photoId);
                refetch();
              } catch (error) {
                console.error('Failed to delete photo:', error);
                Alert.alert(t('common.error'), t('companion.photos.delete_failed'));
              } finally {
                setDeletingPhotoId(null);
              }
            },
          },
        ]
      );
    },
    [profile, photos, t, removePhoto, refetch]
  );

  const handleSetPrimary = React.useCallback(
    async (photo: CompanionPhoto | string) => {
      if (!isCompanionPhoto(photo) || photo.isPrimary) return;

      try {
        await addPhoto.mutateAsync({ url: photo.url, isPrimary: true });
        refetch();
      } catch (error) {
        console.error('Failed to set primary photo:', error);
        Alert.alert(t('common.error'), t('errors.try_again'));
      }
    },
    [t, addPhoto, refetch]
  );

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

      <CompanionHeader
        title={t('companion.photos.header')}
        onBack={goBack}
        rightElement={
          <Text className="text-sm text-text-secondary">
            {photos.length}/{MAX_PHOTOS}
          </Text>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mb-4 rounded-xl bg-lavender-50 p-4"
        >
          <Text className="text-sm text-lavender-700">
            {t('companion.photos.info_message')}
          </Text>
        </MotiView>

        {/* Photos Grid */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="flex-row flex-wrap gap-3"
        >
          {photos.map((photo, index) => {
            const photoUrl = getPhotoUrl(photo);
            const isPrimary = isCompanionPhoto(photo) && photo.isPrimary;
            const photoId = isCompanionPhoto(photo) ? photo.id : `photo-${index}`;
            const isDeleting = deletingPhotoId === photoId;

            return (
              <View
                key={photoId}
                className="relative w-[31%] overflow-hidden rounded-xl"
                style={{ aspectRatio: 3 / 4 }}
              >
                <Pressable
                  onPress={() => handleSetPrimary(photo)}
                  onLongPress={() => handleDeletePhoto(photo)}
                  disabled={isDeleting}
                >
                  <Image
                    source={{ uri: photoUrl }}
                    className="size-full"
                    contentFit="cover"
                  />
                  {isPrimary && (
                    <View className="absolute bottom-1 left-1 rounded bg-lavender-900 px-1.5 py-0.5">
                      <Text className="text-xs font-semibold text-white">
                        {t('companion.photos.main')}
                      </Text>
                    </View>
                  )}
                  {isDeleting && (
                    <View className="absolute inset-0 items-center justify-center bg-black/50">
                      <ActivityIndicator color="white" />
                    </View>
                  )}
                </Pressable>
                {/* Delete Button */}
                <Pressable
                  onPress={() => handleDeletePhoto(photo)}
                  disabled={isDeleting}
                  className="absolute right-1 top-1 size-7 items-center justify-center rounded-full bg-black/50"
                >
                  <Trash2 color="white" width={14} height={14} />
                </Pressable>
              </View>
            );
          })}

          {/* Add Photo Button */}
          {photos.length < MAX_PHOTOS && (
            <Pressable
              onPress={handleAddPhoto}
              disabled={isUploading}
              className="w-[31%] items-center justify-center rounded-xl border-2 border-dashed border-lavender-900 bg-lavender-50/50"
              style={{ aspectRatio: 3 / 4 }}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.lavender[400]} />
              ) : (
                <>
                  <Plus color={colors.lavender[400]} width={24} height={24} />
                  <Text className="mt-1 text-xs text-lavender-900">
                    {t('common.add')}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </MotiView>

        {/* Tips Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mt-6 rounded-xl bg-white p-4"
        >
          <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
            {t('companion.photos.tips_title')}
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-text-secondary">
              • {t('companion.photos.tip_1')}
            </Text>
            <Text className="text-sm text-text-secondary">
              • {t('companion.photos.tip_2')}
            </Text>
            <Text className="text-sm text-text-secondary">
              • {t('companion.photos.tip_3')}
            </Text>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}
