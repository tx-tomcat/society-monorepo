/* eslint-disable max-lines-per-function */
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

import {
  colors,
  Image,
  SafeAreaView,
  Text,
  View
} from '@/components/ui';
import { ArrowLeft, Camera, Check } from '@/components/ui/icons';
import { useCurrentUser, useSafeBack } from '@/lib/hooks';

type FormData = {
  email: string;
  phone: string;
  bio: string;
};

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { data: userData } = useCurrentUser();
  const user = userData?.user;
  const goBack = useSafeBack('/(app)/account');

  const [formData, setFormData] = React.useState<FormData>({
    email: '',
    phone: '',
    bio: '',
  });
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        phone: user.phone || '',
        bio: '',
      });
      setAvatar(user.avatarUrl || null);
    }
  }, [user]);

  const handlePickImage = React.useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        t('common.error'),
        t('hirer.edit_profile.photo_permission_required')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  }, [t]);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Backend needs to support email, phone, bio updates
      Alert.alert(t('common.success'), t('hirer.edit_profile.saved_message'));
      goBack();
    } catch (error) {
      Alert.alert(t('common.error'), t('common.something_went_wrong'));
    } finally {
      setIsSaving(false);
    }
  }, [goBack, t]);

  const updateField = React.useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-warmwhite">

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={goBack}
          className="size-10 items-center justify-center"
        >
          <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
        </Pressable>
        <Text className="font-urbanist-bold text-xl text-midnight">
          {t('hirer.edit_profile.header')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          className="size-10 items-center justify-center rounded-full bg-rose-400"
        >
          <Check color="#FFFFFF" width={20} height={20} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Avatar Section */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="items-center px-4 py-6"
          >
            <Pressable onPress={handlePickImage} className="relative">
              <View className="size-28 overflow-hidden rounded-full border-4 border-rose-200">
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    className="size-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="size-full items-center justify-center bg-rose-100">
                    <Camera color={colors.rose[400]} width={32} height={32} />
                  </View>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 size-9 items-center justify-center rounded-full border-2 border-white bg-rose-400">
                <Camera color="#FFFFFF" width={16} height={16} />
              </View>
            </Pressable>
            <Text className="mt-4 font-urbanist-bold text-xl text-midnight">
              {user?.fullName || t('hirer.settings.unnamed_user')}
            </Text>

          </MotiView>

          {/* Form Fields */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="px-4"
          >
            {/* Email */}
            <View className="mb-4">
              <Text className="mb-2 font-urbanist-semibold text-sm text-midnight">
                {t('hirer.edit_profile.email')}
              </Text>
              <View className="rounded-xl border border-border bg-white px-4 py-3">
                <TextInput
                  value={formData.email}
                  onChangeText={(v) => updateField('email', v)}
                  placeholder={t('hirer.edit_profile.email_placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="text-base text-midnight"
                  style={{ fontFamily: 'Urbanist_500Medium' }}
                />
              </View>
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text className="mb-2 font-urbanist-semibold text-sm text-midnight">
                {t('hirer.edit_profile.phone')}
              </Text>
              <View className="rounded-xl border border-border bg-white px-4 py-3">
                <TextInput
                  value={formData.phone}
                  onChangeText={(v) => updateField('phone', v)}
                  placeholder={t('hirer.edit_profile.phone_placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="phone-pad"
                  className="text-base text-midnight"
                  style={{ fontFamily: 'Urbanist_500Medium' }}
                />
              </View>
            </View>

            {/* Bio */}
            <View className="mb-4">
              <Text className="mb-2 font-urbanist-semibold text-sm text-midnight">
                {t('hirer.edit_profile.bio')}
              </Text>
              <View className="rounded-xl border border-border bg-white px-4 py-3">
                <TextInput
                  value={formData.bio}
                  onChangeText={(v) => updateField('bio', v)}
                  placeholder={t('hirer.edit_profile.bio_placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="min-h-[100px] text-base text-midnight"
                  style={{ fontFamily: 'Urbanist_500Medium' }}
                />
              </View>
              <Text className="mt-1 text-right text-xs text-text-tertiary">
                {formData.bio.length}/200
              </Text>
            </View>
          </MotiView>

          {/* Verification Status Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            className="mx-4 mt-4 rounded-2xl bg-teal-400/10 p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-full bg-teal-400/20">
                <Check color={colors.teal[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="font-urbanist-semibold text-base text-teal-600">
                  {t('hirer.edit_profile.verification_status')}
                </Text>
                <Text className="text-sm text-text-secondary">
                  {t('hirer.edit_profile.verification_complete')}
                </Text>
              </View>
            </View>
          </MotiView>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
