/* eslint-disable max-lines-per-function */
import { router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  Input,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  CaretDown,
  Edit,
  Mail,
} from '@/components/ui/icons';

// Mock user data
const MOCK_USER = {
  name: 'Andrew Ainsley',
  email: 'andrew.ainsley@yourdomain.com',
  phone: '+1 111 467 378 399',
  gender: 'Male',
  dateOfBirth: '12-27-1995',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
};

export default function PersonalInfo() {
  const [fullName, setFullName] = React.useState(MOCK_USER.name);
  const [email, setEmail] = React.useState(MOCK_USER.email);
  const [phone, setPhone] = React.useState(MOCK_USER.phone);
  const [gender, _setGender] = React.useState(MOCK_USER.gender);
  const [dateOfBirth, _setDateOfBirth] = React.useState(MOCK_USER.dateOfBirth);

  const handleBackPress = React.useCallback(() => {
    router.back();
  }, []);

  const handleAvatarEdit = React.useCallback(() => {
    console.log('Edit avatar pressed');
  }, []);

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-6 py-3">
          {/* Back Button */}
          <Pressable onPress={handleBackPress} testID="back-button">
            <ArrowLeft color={colors.offwhite.DEFAULT} size={28} />
          </Pressable>

          {/* Title */}
          <Text className="flex-1 text-center font-urbanist-bold text-2xl leading-[1.4] tracking-[0px] text-offwhite">
            Personal Info
          </Text>

          {/* Spacer for alignment */}
          <View className="w-7" />
        </View>
      </SafeAreaView>

      {/* Content */}
      <View className="flex-1 gap-6 px-6 py-2">
        {/* Avatar */}
        <View className="items-center py-7">
          <View className="relative">
            <Image
              source={{ uri: MOCK_USER.avatar }}
              className="size-[100px] rounded-full"
              testID="avatar-image"
            />
            {/* Edit Button */}
            <Pressable
              className="absolute bottom-0 right-0 size-[25px] items-center justify-center rounded-full bg-gold-400"
              onPress={handleAvatarEdit}
              testID="edit-avatar-button"
            >
              <Edit color={colors.midnight.DEFAULT} size={14} />
            </Pressable>
          </View>
        </View>

        {/* Full Name */}
        <View className="gap-2">
          <Text className="font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
            Full Name
          </Text>
          <View className="rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]">
            <Input
              className="flex-1 p-0 font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor={colors.neutral[500]}
              testID="full-name-input"
            />
          </View>
        </View>

        {/* Email */}
        <View className="gap-2">
          <Text className="font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
            Email
          </Text>
          <View className="flex-row items-center gap-3 rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]">
            <Mail color={colors.offwhite.DEFAULT} size={20} />
            <Input
              className="flex-1 p-0 font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite"
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="email-input"
            />
          </View>
        </View>

        {/* Phone Number */}
        <View className="gap-2">
          <Text className="font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
            Phone Number
          </Text>
          <View className="flex-row items-center gap-3 rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]">
            <Text className="text-lg font-semibold">🇺🇸</Text>
            <CaretDown />
            <Input
              className="flex-1 p-0 font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="phone-pad"
              testID="phone-input"
            />
          </View>
        </View>

        {/* Gender */}
        <View className="gap-2">
          <Text className="font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
            Gender
          </Text>
          <Pressable
            className="flex-row items-center justify-between rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]"
            testID="gender-dropdown"
          >
            <Text className="flex-1 font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
              {gender}
            </Text>
            <CaretDown />
          </Pressable>
        </View>

        {/* Date of Birth */}
        <View className="gap-2">
          <Text className="font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
            Date of Birth
          </Text>
          <Pressable
            className="flex-row items-center justify-between rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]"
            testID="date-picker"
          >
            <Text className="flex-1 font-urbanist-semibold text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
              {dateOfBirth}
            </Text>
            <Calendar color={colors.offwhite.DEFAULT} size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

