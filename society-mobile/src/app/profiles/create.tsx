/* eslint-disable max-lines-per-function */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

import { INTERESTS, InterestsSelector } from '@/components/interests-selector';
import {
  colors,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Camera, ChevronDown } from '@/components/ui/icons';

type _Gender = 'male' | 'female' | 'other';

const _ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const _LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
];
const _VOICES = ['Voice 1', 'Voice 2', 'Voice 3', 'Voice 4'];

function PhotoUploadPlaceholder({
  size = 'large',
  testID,
}: {
  size?: 'large' | 'small';
  testID?: string;
}) {
  const isLarge = size === 'large';

  return (
    <Pressable
      className={`items-center justify-center rounded-2xl border-2 border-dashed border-neutral-600 bg-neutral-800 ${
        isLarge ? 'h-[200px] w-full' : 'h-[100px] w-[30%]'
      }`}
      testID={testID}
    >
      <View className="items-center gap-2">
        <View className="size-12 items-center justify-center rounded-full bg-neutral-700">
          <Camera color={colors.neutral[400]} size={24} />
        </View>
        {isLarge && (
          <Text className="text-sm font-medium leading-[1.6] tracking-[0.2px] text-neutral-400">
            Add Photo
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  testID,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  testID?: string;
}) {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      testID={testID}
    />
  );
}

function DropdownField({
  label,
  placeholder,
  value,
  testID,
}: {
  label: string;
  placeholder: string;
  value: string;
  testID?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-base font-semibold leading-[1.6] tracking-[0.2px] text-white">
        {label}
      </Text>
      <Pressable
        className="flex-row items-center justify-between rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-4"
        testID={testID}
      >
        <Text
          className={`text-base leading-[1.6] tracking-[0.2px] ${
            value ? 'text-white' : 'text-neutral-500'
          }`}
        >
          {value || placeholder}
        </Text>
        <ChevronDown color="#9E9E9E" size={20} />
      </Pressable>
    </View>
  );
}

export default function CreateProfile() {
  const [name, setName] = React.useState('');
  const [age, _setAge] = React.useState('');
  const [gender, _setGender] = React.useState('');
  const [zodiac, _setZodiac] = React.useState('');
  const [occupation, setOccupation] = React.useState('');
  const [aboutMe, setAboutMe] = React.useState('');
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(
    []
  );
  const [language, _setLanguage] = React.useState('');
  const [voice, _setVoice] = React.useState('');
  const [showInterestsModal, setShowInterestsModal] = React.useState(false);

  const handleCancel = React.useCallback(() => {
    router.back();
  }, []);

  const handleSave = React.useCallback(() => {
    // TODO: Implement AI-assisted profile creation
    console.log('Save profile:', {
      name,
      age,
      gender,
      zodiac,
      occupation,
      aboutMe,
      interests: selectedInterests,
      language,
      voice,
    });
    router.back();
  }, [
    name,
    age,
    gender,
    zodiac,
    occupation,
    aboutMe,
    selectedInterests,
    language,
    voice,
  ]);

  const handleSaveInterests = React.useCallback((interestIds: string[]) => {
    setSelectedInterests(interestIds);
  }, []);

  const interestsText = React.useMemo(() => {
    if (selectedInterests.length === 0) return '';
    return selectedInterests
      .map((id) => {
        const interest = INTERESTS.find((i) => i.id === id);
        return interest ? `${interest.label} ${interest.emoji}` : '';
      })
      .filter(Boolean)
      .join(', ');
  }, [selectedInterests]);

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between p-6">
          <Pressable onPress={handleCancel} testID="cancel-button">
            <Text className="text-lg font-semibold leading-[1.4] text-gold-400">
              Cancel
            </Text>
          </Pressable>

          <Text
            className="text-2xl font-bold leading-[1.4] text-offwhite"
            style={{ fontFamily: 'Urbanist_700Bold', letterSpacing: 0 }}
          >
            Create Profile
          </Text>

          <Pressable
            onPress={handleSave}
            className="rounded-full bg-gold-400 px-6 py-2"
            testID="save-button"
          >
            <Text className="text-lg font-semibold leading-[1.4] text-midnight">
              Save
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Form */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-6">
          {/* Main Photo */}
          <View className="gap-2">
            <Text className="text-base font-semibold leading-[1.6] tracking-[0.2px] text-white">
              Profile Photo
            </Text>
            <PhotoUploadPlaceholder size="large" testID="main-photo-upload" />
          </View>

          {/* Name */}
          <InputField
            label="Name"
            placeholder="Enter name"
            value={name}
            onChangeText={setName}
            testID="name-input"
          />

          {/* Age & Gender Row */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <DropdownField
                label="Age"
                placeholder="Select age"
                value={age}
                testID="age-dropdown"
              />
            </View>
            <View className="flex-1">
              <DropdownField
                label="Gender"
                placeholder="Select gender"
                value={gender}
                testID="gender-dropdown"
              />
            </View>
          </View>

          {/* Zodiac */}
          <DropdownField
            label="Zodiac"
            placeholder="Select zodiac sign"
            value={zodiac}
            testID="zodiac-dropdown"
          />

          {/* Occupation */}
          <InputField
            label="Occupation"
            placeholder="Enter occupation"
            value={occupation}
            onChangeText={setOccupation}
            testID="occupation-input"
          />

          {/* About Me */}
          <InputField
            label="About me"
            placeholder="Tell us about yourself..."
            value={aboutMe}
            onChangeText={setAboutMe}
            multiline
            testID="about-input"
          />

          {/* Interests */}
          <View className="gap-2">
            <Text className="text-base font-semibold leading-[1.6] tracking-[0.2px] text-white">
              Interests
            </Text>
            <Pressable
              onPress={() => setShowInterestsModal(true)}
              className="min-h-[100px] rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-4"
              testID="interests-selector"
            >
              <Text
                className={`text-base leading-[1.6] tracking-[0.2px] ${
                  interestsText ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {interestsText || 'Tap to select your interests...'}
              </Text>
            </Pressable>
          </View>

          {/* Photos Grid */}
          <View className="gap-2">
            <Text className="text-base font-semibold leading-[1.6] tracking-[0.2px] text-white">
              Photos
            </Text>
            <View className="flex-row flex-wrap justify-between gap-3">
              <PhotoUploadPlaceholder size="small" testID="photo-1" />
              <PhotoUploadPlaceholder size="small" testID="photo-2" />
              <PhotoUploadPlaceholder size="small" testID="photo-3" />
              <PhotoUploadPlaceholder size="small" testID="photo-4" />
              <PhotoUploadPlaceholder size="small" testID="photo-5" />
              <PhotoUploadPlaceholder size="small" testID="photo-6" />
            </View>
          </View>

          {/* Language */}
          <DropdownField
            label="Language"
            placeholder="Select language"
            value={language}
            testID="language-dropdown"
          />

          {/* Voice */}
          <DropdownField
            label="Voice"
            placeholder="Select voice"
            value={voice}
            testID="voice-dropdown"
          />

          {/* AI Assistant Note */}
          <View className="rounded-xl border border-primary-400/30 bg-primary-400/10 p-4">
            <Text className="text-sm leading-[1.6] tracking-[0.2px] text-primary-600">
              💡 AI will help suggest content for your profile based on the
              information you provide
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Interests Selector Modal */}
      <InterestsSelector
        visible={showInterestsModal}
        selectedInterests={selectedInterests}
        onClose={() => setShowInterestsModal(false)}
        onSave={handleSaveInterests}
      />
    </View>
  );
}
