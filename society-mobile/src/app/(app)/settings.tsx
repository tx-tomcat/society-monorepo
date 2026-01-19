/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  Activity,
  ArrowRight,
  Card,
  Crown,
  Document,
  Eye,
  Headset,
  Logout,
  MoreVertical,
  Shield,
  ShieldCheck,
  SocietyLogo,
  Swap,
  Users,
  Wallet,
} from '@/components/ui/icons';
import { useAuth } from '@/lib/hooks';

// Right arrow icon
function ChevronRightIcon({ color = colors.neutral[400] }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type MenuItem = {
  id: string;
  title: string;
  icon: React.ComponentType<{
    color?: string;
    width?: number;
    height?: number;
  }>;
  onPress: () => void;
  danger?: boolean;
};

function SettingsMenuItem({
  title,
  icon: IconComponent,
  onPress,
  danger,
  id,
}: MenuItem) {
  const iconColor = danger ? colors.danger[500] : colors.rose[400];
  const chevronColor = colors.text.tertiary;

  return (
    <Pressable
      className="flex-row items-center gap-4"
      onPress={onPress}
      testID={`menu-item-${id}`}
    >
      <View
        className={`size-10 items-center justify-center rounded-full ${danger ? 'bg-danger-500/10' : 'bg-softpink'}`}
      >
        <IconComponent color={iconColor} width={20} height={20} />
      </View>
      <Text
        className={`flex-1 text-base font-semibold leading-[1.4] ${
          danger ? 'text-danger-500' : 'text-midnight'
        }`}
        style={styles.menuText}
      >
        {title}
      </Text>
      {!danger && <ChevronRightIcon color={chevronColor} />}
    </Pressable>
  );
}

function UpgradeBanner() {
  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-2xl bg-rose-400 p-4"
      testID="upgrade-banner"
    >
      <View className="size-14 items-center justify-center rounded-full bg-white/20">
        <Crown color="#FFFFFF" width={28} height={28} />
      </View>

      <View className="flex-1 gap-1">
        <Text
          className="text-lg font-bold leading-[1.4] text-white"
          style={styles.upgradeTitle}
        >
          Become Premium
        </Text>
        <Text className="text-xs leading-[1.6] tracking-[0.2px] text-white/80">
          Get priority bookings and exclusive features
        </Text>
      </View>

      <ArrowRight color="#FFFFFF" width={24} height={24} />
    </Pressable>
  );
}

function UserProfileCard() {
  const handlePress = React.useCallback(() => {
    router.push('/settings/user-profile');
  }, []);

  return (
    <Pressable
      className="flex-row items-center gap-4 rounded-2xl bg-softpink p-4"
      onPress={handlePress}
      testID="profile-card"
    >
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        }}
        className="size-16 rounded-full"
        contentFit="cover"
      />

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-lg font-bold leading-[1.4] text-midnight"
            style={styles.profileName}
          >
            Nguyen Van Minh
          </Text>
          <ShieldCheck color={colors.teal[400]} width={18} height={18} />
        </View>
        <Text className="text-sm font-medium leading-[1.6] tracking-[0.2px] text-text-tertiary">
          minh.nguyen@email.com
        </Text>
        <Badge label="Verified Client" variant="verified" size="sm" />
      </View>

      <ChevronRightIcon color={colors.text.tertiary} />
    </Pressable>
  );
}

function QuickStats() {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 items-center rounded-xl bg-white p-4">
        <Text className="text-2xl font-bold text-rose-400">12</Text>
        <Text className="text-xs text-text-tertiary">Bookings</Text>
      </View>
      <View className="flex-1 items-center rounded-xl bg-white p-4">
        <Text className="text-2xl font-bold text-yellow-400">4.9</Text>
        <Text className="text-xs text-text-tertiary">Rating</Text>
      </View>
      <View className="flex-1 items-center rounded-xl bg-white p-4">
        <Text className="text-2xl font-bold text-teal-400">2</Text>
        <Text className="text-xs text-text-tertiary">Favorites</Text>
      </View>
    </View>
  );
}

export default function Profile() {
  const { signOut } = useAuth();

  const handleLogout = React.useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            // Navigation handled by _layout.tsx guard
          } catch (error) {
            console.error('Logout failed:', error);
          }
        },
      },
    ]);
  }, [signOut]);

  const menuItems: MenuItem[] = [
    {
      id: 'safety',
      title: 'Safety Center',
      icon: Shield,
      onPress: () => router.push('/safety' as Href),
    },
    {
      id: 'wallet',
      title: 'Wallet & Payments',
      icon: Wallet,
      onPress: () => console.log('Wallet'),
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: Card,
      onPress: () => console.log('Payment'),
    },
    {
      id: 'security',
      title: 'Account & Security',
      icon: ShieldCheck,
      onPress: () => router.push('/settings/account-security'),
    },
    {
      id: 'linked',
      title: 'Linked Accounts',
      icon: Swap,
      onPress: () => console.log('Linked'),
    },
    {
      id: 'appearance',
      title: 'App Appearance',
      icon: Eye,
      onPress: () => console.log('Appearance'),
    },
    {
      id: 'activity',
      title: 'Booking History',
      icon: Activity,
      onPress: () => console.log('History'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: Headset,
      onPress: () => console.log('Help'),
    },
    {
      id: 'legal',
      title: 'Legal & Policies',
      icon: Document,
      onPress: () => console.log('Legal'),
    },
    {
      id: 'invite',
      title: 'Invite Friends',
      icon: Users,
      onPress: () => console.log('Invite'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: Logout,
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-warmwhite">
        <View className="flex-row items-center justify-between px-4 py-3">
          {/* Logo */}
          <View className="w-8">
            <SocietyLogo color={colors.rose[400]} width={32} height={32} />
          </View>

          {/* Title */}
          <Text
            className="flex-1 text-center text-2xl font-bold leading-[1.4] text-midnight"
            style={styles.headerTitle}
          >
            Profile
          </Text>

          {/* Menu icon */}
          <Pressable
            className="w-8 items-center justify-center"
            testID="menu-button"
          >
            <MoreVertical
              color={colors.midnight.DEFAULT}
              width={24}
              height={24}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          {/* User Profile Card */}
          <UserProfileCard />

          {/* Quick Stats */}
          <QuickStats />

          {/* Upgrade Banner */}
          <UpgradeBanner />

          {/* Settings Menu */}
          <View className="gap-4 rounded-2xl bg-white p-4">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <SettingsMenuItem {...item} />
                {index < menuItems.length - 1 && (
                  <View className="h-px w-full bg-border-light" />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* App Version */}
          <View className="items-center py-4">
            <Text className="text-sm text-text-tertiary">Hireme v1.0.0</Text>
          </View>

          {/* Bottom spacer for safe area */}
          <View className="h-16" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  upgradeTitle: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  profileName: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  menuText: {
    fontFamily: 'Urbanist_600SemiBold',
    letterSpacing: 0,
  },
});
