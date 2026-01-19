/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowRight,
  Bank,
  Calendar,
  CheckCircle,
  Gallery,
  Logout,
  Star,
  Swap,
  User,
  VerifiedBadge,
} from '@/components/ui/icons';
import {
  type Companion,
  companionsService,
} from '@/lib/api/services/companions.service';
import { useAuth } from '@/lib/hooks/use-auth';

type MenuItem = {
  id: string;
  icon: React.ComponentType<{ color?: string; size?: number; width?: number; height?: number }>;
  iconColor: string;
  labelKey: string;
  route?: string;
  action?: 'logout' | 'switch-mode';
  badge?: { label: string; variant: 'verified' | 'default' };
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'edit-profile',
    icon: User,
    iconColor: colors.lavender[400],
    labelKey: 'companion.settings.edit_profile',
    route: '/companion/profile/edit',
  },
  {
    id: 'photos',
    icon: Gallery,
    iconColor: colors.rose[400],
    labelKey: 'companion.settings.my_photos',
    route: '/companion/settings/photos',
  },
  {
    id: 'availability',
    icon: Calendar,
    iconColor: colors.teal[400],
    labelKey: 'companion.settings.availability',
    route: '/companion/settings/availability',
  },
  {
    id: 'bank-account',
    icon: Bank,
    iconColor: colors.yellow[500],
    labelKey: 'companion.settings.bank_account',
    route: '/companion/settings/bank-accounts',
  },
  {
    id: 'verification',
    icon: CheckCircle,
    iconColor: colors.teal[400],
    labelKey: 'companion.settings.verification',
    route: '/companion/settings/verification',
    badge: { label: 'Verified', variant: 'verified' },
  },
];

export default function CompanionAccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [profile, setProfile] = React.useState<Companion | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      const profileData = await companionsService.getMyProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleLogout = React.useCallback(() => {
    Alert.alert(
      t('companion.settings.logout_title'),
      t('companion.settings.logout_message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('companion.settings.logout'),
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
      ]
    );
  }, [router, t, signOut]);

  const handleSwitchToHirer = React.useCallback(() => {
    router.push('/hirer/splash' as Href);
  }, [router]);

  const handleMenuPress = React.useCallback(
    (item: MenuItem) => {
      if (item.action === 'logout') {
        handleLogout();
      } else if (item.action === 'switch-mode') {
        handleSwitchToHirer();
      } else if (item.route) {
        router.push(item.route as Href);
      }
    },
    [router, handleLogout, handleSwitchToHirer]
  );

  const handleViewProfile = React.useCallback(() => {
    router.push('/companion/profile' as Href);
  }, [router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  const isVerified = profile?.verificationStatus === 'verified';

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header - Left-aligned title, no back button */}
        <View className="bg-white px-4 pb-0 pt-2">
          <Text style={styles.headerTitle} className="text-2xl text-midnight">
            {t('companion.settings.account_title')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card - Centered */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mx-4 mt-4 items-center rounded-2xl bg-white p-5"
          style={styles.card}
        >
          <Image
            source={{
              uri:
                profile?.photos?.find((p) => p.isPrimary)?.url ||
                profile?.photos?.[0]?.url ||
                profile?.user?.avatarUrl ||
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
            }}
            className="size-24 rounded-full"
            contentFit="cover"
          />
          <View className="mt-3 flex-row items-center gap-1">
            <Text style={styles.userName} className="text-lg text-midnight">
              {profile?.user?.fullName || 'Companion'}
            </Text>
            {isVerified && (
              <VerifiedBadge color={colors.teal[400]} width={18} height={18} />
            )}
          </View>
          <View className="mt-1 flex-row items-center gap-1">
            <Star color={colors.yellow[400]} width={14} height={14} />
            <Text className="text-xs text-text-secondary">
              {profile?.ratingAvg?.toFixed(1) || '0.0'} · {profile?.totalBookings || 0} bookings
            </Text>
          </View>
          <Pressable
            onPress={handleViewProfile}
            className="mt-3 rounded-lg bg-lavender-400 px-4 py-2"
          >
            <Text style={styles.buttonText} className="text-xs text-white">
              {t('companion.settings.view_public_profile')}
            </Text>
          </Pressable>
        </MotiView>

        {/* Menu Items Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
          style={styles.card}
        >
          {MENU_ITEMS.map((item, index) => {
            // Update verification badge based on actual status
            const badge =
              item.id === 'verification' && profile
                ? isVerified
                  ? { label: 'Verified', variant: 'verified' as const }
                  : { label: 'Pending', variant: 'default' as const }
                : item.badge;

            const IconComponent = item.icon;

            return (
              <Pressable
                key={item.id}
                onPress={() => handleMenuPress(item)}
                className={`flex-row items-center py-3 ${
                  index < MENU_ITEMS.length - 1 ? 'mb-3' : ''
                }`}
              >
                <View className="mr-3 size-8 items-center justify-center">
                  <IconComponent
                    color={item.iconColor}
                    size={20}
                    width={20}
                    height={20}
                  />
                </View>
                <Text className="flex-1 text-sm text-midnight">
                  {t(item.labelKey)}
                </Text>
                {badge ? (
                  <View
                    style={[
                      styles.badge,
                      badge.variant === 'verified'
                        ? styles.badgeVerified
                        : styles.badgeDefault,
                    ]}
                  >
                    <Text
                      style={
                        badge.variant === 'verified'
                          ? styles.badgeTextVerified
                          : styles.badgeTextDefault
                      }
                      className="text-xs"
                    >
                      {badge.label}
                    </Text>
                  </View>
                ) : (
                  <ArrowRight color={colors.text.tertiary} width={16} height={16} />
                )}
              </Pressable>
            );
          })}
        </MotiView>

        {/* Switch to Hirer Mode Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
          style={styles.card}
        >
          <Pressable
            onPress={handleSwitchToHirer}
            className="flex-row items-center py-1"
          >
            <View className="mr-3 size-8 items-center justify-center">
              <Swap color={colors.lavender[400]} size={20} />
            </View>
            <Text className="flex-1 text-sm text-midnight">
              {t('companion.settings.switch_to_hirer')}
            </Text>
            <ArrowRight color={colors.text.tertiary} width={16} height={16} />
          </Pressable>
        </MotiView>

        {/* Logout Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
          style={styles.card}
        >
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center py-1"
          >
            <View className="mr-3 size-8 items-center justify-center">
              <Logout color={colors.danger[400]} size={20} />
            </View>
            <Text className="flex-1 text-sm font-semibold text-danger-400">
              {t('companion.settings.logout')}
            </Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  userName: {
    fontFamily: 'Urbanist_700Bold',
  },
  buttonText: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeVerified: {
    backgroundColor: '#EDFCFB',
  },
  badgeDefault: {
    backgroundColor: '#FFFBEB',
  },
  badgeTextVerified: {
    color: '#46B9B1',
    fontWeight: '600',
  },
  badgeTextDefault: {
    color: '#E6C337',
    fontWeight: '600',
  },
});
