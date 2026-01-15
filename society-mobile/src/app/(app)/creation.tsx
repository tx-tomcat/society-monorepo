/* eslint-disable max-lines-per-function */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { LovifyLogo, MoreVertical, Plus, Search } from '@/components/ui/icons';

type Profile = {
  id: string;
  name: string;
  age: number;
  image: string;
  gender: 'female' | 'male';
};

// Mock data for AI-generated profiles
const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    name: 'Freya',
    age: 24,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    gender: 'female',
  },
  {
    id: '2',
    name: 'Maggie',
    age: 26,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    gender: 'female',
  },
  {
    id: '3',
    name: 'Lisa',
    age: 23,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    gender: 'female',
  },
  {
    id: '4',
    name: 'Alexis',
    age: 25,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    gender: 'female',
  },
  {
    id: '5',
    name: 'Grace',
    age: 27,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    gender: 'female',
  },
  {
    id: '6',
    name: 'Emma',
    age: 24,
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    gender: 'female',
  },
  {
    id: '7',
    name: 'James',
    age: 28,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    gender: 'male',
  },
  {
    id: '8',
    name: 'Michael',
    age: 30,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    gender: 'male',
  },
];

type GenderTab = 'female' | 'male';

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <View className="h-[280px] overflow-hidden rounded-lg">
      {/* Profile Image */}
      <Image
        source={{ uri: profile.image }}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
        className="absolute bottom-0 left-0 right-0 h-[100px]"
      />

      {/* Three-dot Menu Button */}
      <Pressable
        className="absolute right-2 top-2 size-8 items-center justify-center rounded-full bg-white/50"
        testID={`profile-menu-${profile.id}`}
      >
        <MoreVertical color={colors.offwhite.DEFAULT} size={20} />
      </Pressable>

      {/* Profile Info */}
      <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between">
        <Text
          className="flex-1 text-xl font-bold leading-[1.4] text-offwhite"
          style={{ fontFamily: 'Urbanist_700Bold', letterSpacing: 0 }}
        >
          {profile.name}
        </Text>

        {/* Chat Button */}
        <Pressable
          className="rounded-full bg-gold-400 px-4 py-1.5"
          testID={`chat-${profile.id}`}
        >
          <Text
            className="text-sm font-semibold leading-[1.6] tracking-[0.2px] text-midnight"
            style={{ fontFamily: 'Urbanist_600SemiBold' }}
          >
            Chat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Creation() {
  const [selectedGender, setSelectedGender] =
    React.useState<GenderTab>('female');

  const filteredProfiles = React.useMemo(
    () => MOCK_PROFILES.filter((p) => p.gender === selectedGender),
    [selectedGender]
  );

  const femaleCount = MOCK_PROFILES.filter((p) => p.gender === 'female').length;
  const maleCount = MOCK_PROFILES.filter((p) => p.gender === 'male').length;

  const handleCreateNew = React.useCallback(() => {
    router.push('/profiles/create');
  }, []);

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />

      {/* Navbar */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between px-6 py-3">
          {/* Logo */}
          <View className="size-7 items-center justify-center">
            <LovifyLogo color={colors.gold[400]} size={28} />
          </View>

          {/* Title */}
          <Text
            className="text-2xl font-bold leading-[1.4] text-offwhite"
            style={{ fontFamily: 'Urbanist_700Bold', letterSpacing: 0 }}
          >
            My Creation
          </Text>

          {/* Search Icon */}
          <Pressable testID="search-button">
            <Search color={colors.offwhite.DEFAULT} size={28} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gender Tabs */}
        <View className="mb-6 flex-row gap-0 rounded-md bg-neutral-800 p-0">
          <Pressable
            className={`flex-1 items-center justify-center rounded-md py-2 ${
              selectedGender === 'female' ? 'bg-gold-400' : 'bg-transparent'
            }`}
            onPress={() => setSelectedGender('female')}
            testID="female-tab"
          >
            <Text
              className={`text-base font-bold leading-[1.6] tracking-[0.2px] ${
                selectedGender === 'female' ? 'text-midnight' : 'text-offwhite'
              }`}
              style={{ fontFamily: 'Urbanist_700Bold' }}
            >
              Female ({femaleCount})
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 items-center justify-center rounded-md py-2 ${
              selectedGender === 'male' ? 'bg-gold-400' : 'bg-transparent'
            }`}
            onPress={() => setSelectedGender('male')}
            testID="male-tab"
          >
            <Text
              className={`text-base font-bold leading-[1.6] tracking-[0.2px] ${
                selectedGender === 'male' ? 'text-midnight' : 'text-offwhite'
              }`}
              style={{ fontFamily: 'Urbanist_700Bold' }}
            >
              Male ({maleCount})
            </Text>
          </Pressable>
        </View>

        {/* Profile Grid */}
        <View className="gap-4">
          {filteredProfiles.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-center text-lg text-neutral-400">
                No {selectedGender} profiles yet
              </Text>
              <Text className="mt-2 text-center text-sm text-neutral-500">
                Tap the + button to create your first profile
              </Text>
            </View>
          ) : (
            filteredProfiles.reduce<Profile[][]>((rows, profile, index) => {
              if (index % 2 === 0) {
                rows.push([profile]);
              } else {
                rows[rows.length - 1].push(profile);
              }
              return rows;
            }, []).map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-4">
                {row.map((profile) => (
                  <View key={profile.id} className="flex-1">
                    <ProfileCard profile={profile} />
                  </View>
                ))}
                {row.length === 1 && <View className="flex-1" />}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-24 right-6">
        <Pressable
          className="size-14 items-center justify-center rounded-full bg-gold-400 shadow-lg"
          onPress={handleCreateNew}
          testID="create-button"
        >
          <Plus color={colors.midnight.DEFAULT} size={28} />
        </Pressable>
      </View>
    </View>
  );
}
