/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Crown,
  MapPin,
  Star,
  Users,
  Zap,
} from '@/components/ui/icons';
import { showErrorMessage } from '@/components/ui/utils';
import type {
  MembershipPricing,
  MembershipTier,
} from '@/lib/api/services/membership.service';
import { useSafeBack } from '@/lib/hooks';
import {
  useActiveMembership,
  useMembershipPricing,
  usePurchaseMembership,
} from '@/lib/hooks/use-membership';
import { formatVND } from '@/lib/utils';

// ============================================================
// Tier Theme Configuration - Premium visual identity per tier
// ============================================================

type TierTheme = {
  icon: React.ComponentType<{ color?: string; width?: number; height?: number }>;
  iconColor: string;
  bgColor: string;
  selectedBgColor: string;
  borderColor: string;
  selectedBorderColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  bannerBgColor: string;
  bannerIconBgColor: string;
  buttonBgColor: string;
  popular?: boolean;
};

const TIER_THEMES: Record<MembershipTier, TierTheme> = {
  SILVER: {
    icon: Zap,
    iconColor: '#94A3B8',
    bgColor: 'bg-slate-100',
    selectedBgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    selectedBorderColor: 'border-slate-400',
    badgeBgColor: 'bg-slate-200',
    badgeTextColor: 'text-slate-600',
    bannerBgColor: 'bg-slate-500',
    bannerIconBgColor: 'bg-white/20',
    buttonBgColor: 'bg-slate-500',
  },
  GOLD: {
    icon: Star,
    iconColor: '#F59E0B',
    bgColor: 'bg-amber-50',
    selectedBgColor: 'bg-amber-50/80',
    borderColor: 'border-amber-200',
    selectedBorderColor: 'border-amber-500',
    badgeBgColor: 'bg-amber-100',
    badgeTextColor: 'text-amber-700',
    bannerBgColor: 'bg-amber-500',
    bannerIconBgColor: 'bg-white/20',
    buttonBgColor: 'bg-amber-500',
    popular: true,
  },
  PLATINUM: {
    icon: Crown,
    iconColor: colors.rose[400],
    bgColor: 'bg-rose-50',
    selectedBgColor: 'bg-rose-50/80',
    borderColor: 'border-rose-200',
    selectedBorderColor: 'border-rose-400',
    badgeBgColor: 'bg-rose-100',
    badgeTextColor: 'text-rose-600',
    bannerBgColor: 'bg-lavender-900',
    bannerIconBgColor: 'bg-white/20',
    buttonBgColor: 'bg-rose-400',
  },
};

// Tier ordering for comparison (higher is better)
const TIER_ORDER: Record<MembershipTier, number> = {
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

// ============================================================
// Benefit list items for selected tier display
// ============================================================

type BenefitItem = {
  key: string;
  labelKey: string;
  getValue: (pricing: MembershipPricing) => string | boolean;
};

const BENEFIT_ITEMS: BenefitItem[] = [
  {
    key: 'forYou',
    labelKey: 'hirer.membership.benefit_for_you',
    getValue: (p) => `${p.forYouLimit} images`,
  },
  {
    key: 'nearby',
    labelKey: 'hirer.membership.benefit_nearby',
    getValue: (p) => p.nearbySearch,
  },
  {
    key: 'priority',
    labelKey: 'hirer.membership.benefit_priority',
    getValue: (p) => p.priorityBooking,
  },
  {
    key: 'pending',
    labelKey: 'hirer.membership.benefit_pending',
    getValue: (p) => `${p.maxPendingBookings} bookings`,
  },
  {
    key: 'cancellation',
    labelKey: 'hirer.membership.benefit_cancellation',
    getValue: (p) => `${p.freeCancellationHours}h`,
  },
  {
    key: 'earlyAccess',
    labelKey: 'hirer.membership.benefit_early_access',
    getValue: (p) => p.earlyAccess,
  },
  {
    key: 'support',
    labelKey: 'hirer.membership.benefit_support',
    getValue: (p) => p.dedicatedSupport,
  },
];

// ============================================================
// PricingCard - Memoized tier selection card component
// ============================================================

const PricingCard = React.memo(function PricingCard({
  item,
  index,
  isSelected,
  isDisabled,
  onSelect,
  t,
}: {
  item: MembershipPricing;
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (tier: MembershipTier) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const theme = TIER_THEMES[item.tier];
  const IconComponent = theme.icon;

  const handlePress = React.useCallback(() => {
    onSelect(item.tier);
  }, [item.tier, onSelect]);

  // Key benefit bullets for card preview
  const bulletPoints = React.useMemo(() => {
    const points: string[] = [];
    points.push(
      t('hirer.membership.card_for_you', { count: item.forYouLimit })
    );
    if (item.priorityBooking) {
      points.push(t('hirer.membership.card_priority'));
    }
    if (item.nearbySearch) {
      points.push(t('hirer.membership.card_nearby'));
    }
    if (item.dedicatedSupport) {
      points.push(t('hirer.membership.card_support'));
    }
    return points.slice(0, 3);
  }, [item, t]);

  // Monthly price calculation
  const monthlyPrice = React.useMemo(() => {
    if (item.durationDays >= 28) {
      return item.price;
    }
    return Math.round((item.price / item.durationDays) * 30);
  }, [item.price, item.durationDays]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 100 + index * 120 }}
    >
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        className={`relative mb-3 rounded-2xl border-2 p-4 ${
          isSelected
            ? `${theme.selectedBorderColor} ${theme.selectedBgColor}`
            : `${theme.borderColor} bg-white`
        } ${isDisabled ? 'opacity-50' : ''}`}
      >
        {/* Popular badge for Gold tier */}
        {theme.popular && !isDisabled && (
          <View className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-3 py-1">
            <Text className="text-xs font-semibold text-white">
              {t('common.popular')}
            </Text>
          </View>
        )}

        <View className="flex-row items-center">
          {/* Tier icon */}
          <View
            className={`mr-4 size-14 items-center justify-center rounded-2xl ${theme.bgColor}`}
          >
            <IconComponent
              color={theme.iconColor}
              width={28}
              height={28}
            />
          </View>

          {/* Tier name + bullet points */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-urbanist-bold text-lg text-midnight">
                {item.name}
              </Text>
              <View className={`rounded-full px-2 py-0.5 ${theme.badgeBgColor}`}>
                <Text className={`text-[10px] font-semibold ${theme.badgeTextColor}`}>
                  {item.tier}
                </Text>
              </View>
            </View>
            <View className="mt-1 gap-0.5">
              {bulletPoints.map((point) => (
                <View key={point} className="flex-row items-center gap-1.5">
                  <CheckCircle color={colors.teal[400]} width={12} height={12} />
                  <Text className="text-xs text-text-secondary">{point}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Price + selection indicator */}
          <View className="items-end">
            <Text className="font-urbanist-bold text-xl text-midnight">
              {formatVND(monthlyPrice, { abbreviated: true })}
            </Text>
            <Text className="text-xs text-text-tertiary">
              /{t('hirer.membership.month')}
            </Text>
            {isSelected && (
              <CheckCircle color={colors.teal[400]} width={20} height={20} />
            )}
          </View>
        </View>

        {/* Description if available */}
        {item.description && (
          <Text className="mt-3 text-sm text-text-secondary">
            {item.description}
          </Text>
        )}
      </Pressable>
    </MotiView>
  );
});

// ============================================================
// Main Membership Screen
// ============================================================

export default function MembershipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useSafeBack('/(app)');
  const [selectedTier, setSelectedTier] = React.useState<MembershipTier | null>(
    null
  );

  // React Query hooks
  const {
    data: pricing,
    isLoading: isPricingLoading,
    refetch: refetchPricing,
    isRefetching: isRefetchingPricing,
  } = useMembershipPricing();

  const {
    data: membershipData,
    isLoading: isMembershipLoading,
    refetch: refetchMembership,
    isRefetching: isRefetchingMembership,
  } = useActiveMembership();

  const purchaseMutation = usePurchaseMembership();

  const activeMembership = membershipData?.active;
  const history = membershipData?.history;

  const isLoading = isPricingLoading || isMembershipLoading;
  const isRefreshing = isRefetchingPricing || isRefetchingMembership;

  const handleRefresh = React.useCallback(() => {
    refetchPricing();
    refetchMembership();
  }, [refetchPricing, refetchMembership]);

  // Determine if a tier is disabled (already have same or higher)
  const isTierDisabled = React.useCallback(
    (tier: MembershipTier): boolean => {
      if (!activeMembership || activeMembership.status !== 'ACTIVE') {
        return false;
      }
      return TIER_ORDER[tier] <= TIER_ORDER[activeMembership.tier];
    },
    [activeMembership]
  );

  // Days remaining for active membership
  const daysRemaining = React.useMemo(() => {
    if (!activeMembership?.expiresAt) return null;
    const now = Date.now();
    const expiry = new Date(activeMembership.expiresAt).getTime();
    return Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
  }, [activeMembership]);

  const handleSelectTier = React.useCallback((tier: MembershipTier) => {
    setSelectedTier(tier);
  }, []);

  const handlePurchase = React.useCallback(async () => {
    if (!selectedTier) return;

    const tierPricing = pricing?.find((p) => p.tier === selectedTier);
    if (!tierPricing) return;

    Alert.alert(
      t('hirer.membership.confirm_title'),
      `${t('hirer.membership.confirm_message', {
        tier: tierPricing.name,
        price: formatVND(tierPricing.price),
      })}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('hirer.membership.purchase'),
          onPress: async () => {
            try {
              const result =
                await purchaseMutation.mutateAsync(selectedTier);

              // Navigate to QR payment screen
              router.push({
                pathname: '/hirer/membership/payment',
                params: {
                  paymentRequestId: result.paymentRequestId,
                  membershipId: result.membershipId,
                  tier: result.tier,
                  amount: result.price.toString(),
                  code: result.code,
                  qrUrl: result.qrUrl,
                  deeplinks: JSON.stringify(result.deeplinks),
                  accountInfo: JSON.stringify(result.accountInfo),
                  expiresAt: result.expiresAt,
                },
              } as never);

              setSelectedTier(null);
            } catch (error: unknown) {
              const apiError = error as { data?: { error?: string } };
              if (
                apiError?.data?.error === 'MEMBERSHIP_ALREADY_ACTIVE'
              ) {
                showErrorMessage(
                  t('hirer.membership.already_active_error')
                );
              } else {
                showErrorMessage(
                  t('hirer.membership.purchase_failed')
                );
              }
            }
          },
        },
      ]
    );
  }, [selectedTier, pricing, t, purchaseMutation, router]);

  // Selected tier pricing for benefits section
  const selectedPricing = React.useMemo(
    () => pricing?.find((p) => p.tier === selectedTier),
    [pricing, selectedTier]
  );

  // Active membership theme
  const activeTheme = activeMembership
    ? TIER_THEMES[activeMembership.tier]
    : null;

  // Purchase button theme
  const purchaseTheme = selectedTier ? TIER_THEMES[selectedTier] : null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.rose[400]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header with ArrowLeft back button (hirer pattern) */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={goBack} testID="back-button">
            <ArrowLeft
              color={colors.midnight.DEFAULT}
              width={24}
              height={24}
            />
          </Pressable>
          <View className="flex-1 flex-row items-center gap-2">
            <Crown color={colors.rose[400]} width={22} height={22} />
            <Text className="font-urbanist-bold text-xl text-midnight">
              {t('hirer.membership.header')}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.rose[400]}
          />
        }
      >
        {/* Active Membership Banner */}
        {activeMembership && activeMembership.status === 'ACTIVE' && activeTheme && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className={`m-4 rounded-2xl ${activeTheme.bannerBgColor} p-5`}
          >
            <View className="flex-row items-center gap-3">
              <View
                className={`size-12 items-center justify-center rounded-full ${activeTheme.bannerIconBgColor}`}
              >
                <activeTheme.icon color="#FFFFFF" width={24} height={24} />
              </View>
              <View className="flex-1">
                <Text className="font-urbanist-bold text-lg text-white">
                  {activeMembership.tier}{' '}
                  {t('hirer.membership.member')}
                </Text>
                <Text className="text-sm text-white/80">
                  {t('hirer.membership.active_membership')}
                </Text>
              </View>
            </View>

            {daysRemaining !== null && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-white/20 px-4 py-3">
                <Clock color="#FFFFFF" width={18} height={18} />
                <Text className="flex-1 text-sm font-medium text-white">
                  {t('hirer.membership.expires_in')}
                </Text>
                <Text className="font-urbanist-bold text-white">
                  {daysRemaining} {t('hirer.membership.days')}
                </Text>
              </View>
            )}
          </MotiView>
        )}

        {/* Tier Selection Title */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 50 }}
          className="mx-4 mb-3 mt-4"
        >
          <Text className="font-urbanist-bold text-lg text-midnight">
            {t('hirer.membership.choose_plan')}
          </Text>
          <Text className="mt-1 text-sm text-text-secondary">
            {t('hirer.membership.choose_plan_description')}
          </Text>
        </MotiView>

        {/* Tier Selection Cards */}
        <View className="mx-4 mb-4">
          {pricing?.map((item, index) => (
            <PricingCard
              key={item.tier}
              item={item}
              index={index}
              isSelected={selectedTier === item.tier}
              isDisabled={isTierDisabled(item.tier)}
              onSelect={handleSelectTier}
              t={t}
            />
          ))}
        </View>

        {/* Benefits Detail Section for Selected Tier */}
        {selectedPricing && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="mx-4 mb-4"
          >
            <Text className="font-urbanist-bold mb-3 text-lg text-midnight">
              {t('hirer.membership.benefits_title', {
                tier: selectedPricing.name,
              })}
            </Text>
            <View className="rounded-2xl bg-white p-4">
              {BENEFIT_ITEMS.map((benefit, index) => {
                const value = benefit.getValue(selectedPricing);
                const isIncluded =
                  typeof value === 'boolean' ? value : true;

                return (
                  <View
                    key={benefit.key}
                    className={`flex-row items-center gap-3 ${
                      index < BENEFIT_ITEMS.length - 1
                        ? 'mb-3 border-b border-border-light pb-3'
                        : ''
                    }`}
                  >
                    <View
                      className={`size-8 items-center justify-center rounded-full ${
                        isIncluded ? 'bg-teal-400/10' : 'bg-neutral-100'
                      }`}
                    >
                      {benefit.key === 'nearby' ? (
                        <MapPin
                          color={
                            isIncluded
                              ? colors.teal[400]
                              : colors.neutral[400]
                          }
                          width={16}
                          height={16}
                        />
                      ) : benefit.key === 'pending' ? (
                        <Users
                          color={
                            isIncluded
                              ? colors.teal[400]
                              : colors.neutral[400]
                          }
                          size={16}
                        />
                      ) : (
                        <CheckCircle
                          color={
                            isIncluded
                              ? colors.teal[400]
                              : colors.neutral[400]
                          }
                          width={16}
                          height={16}
                        />
                      )}
                    </View>
                    <Text
                      className={`flex-1 text-sm ${
                        isIncluded
                          ? 'text-midnight'
                          : 'text-text-tertiary'
                      }`}
                    >
                      {t(benefit.labelKey)}
                    </Text>
                    {typeof value === 'string' && (
                      <Text
                        className={`text-sm font-semibold ${
                          isIncluded
                            ? 'text-teal-500'
                            : 'text-text-tertiary'
                        }`}
                      >
                        {value}
                      </Text>
                    )}
                    {typeof value === 'boolean' && (
                      <Text
                        className={`text-sm font-semibold ${
                          value
                            ? 'text-teal-500'
                            : 'text-text-tertiary'
                        }`}
                      >
                        {value
                          ? t('common.included')
                          : t('common.not_included')}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </MotiView>
        )}

        {/* Membership History */}
        {history && history.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
            className="mx-4 mb-4"
          >
            <Text className="font-urbanist-bold mb-3 text-lg text-midnight">
              {t('hirer.membership.history')}
            </Text>
            <View className="rounded-2xl bg-white p-4">
              {history.slice(0, 5).map((item, index) => {
                const theme = TIER_THEMES[item.tier];
                const TierIcon = theme.icon;
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : '';

                return (
                  <View
                    key={item.id}
                    className={`flex-row items-center gap-3 ${
                      index < Math.min(history.length, 5) - 1
                        ? 'mb-3 border-b border-border-light pb-3'
                        : ''
                    }`}
                  >
                    <View
                      className={`size-10 items-center justify-center rounded-full ${theme.bgColor}`}
                    >
                      <TierIcon
                        color={theme.iconColor}
                        width={20}
                        height={20}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-midnight">
                        {item.tier}
                      </Text>
                      <Text className="text-xs text-text-tertiary">
                        {dateStr}
                      </Text>
                    </View>
                    <View
                      className={`rounded-lg px-2 py-1 ${
                        item.status === 'ACTIVE'
                          ? 'bg-teal-400/10'
                          : item.status === 'EXPIRED'
                            ? 'bg-text-tertiary/10'
                            : item.status === 'CANCELLED'
                              ? 'bg-danger-400/10'
                              : 'bg-yellow-400/10'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          item.status === 'ACTIVE'
                            ? 'text-teal-400'
                            : item.status === 'EXPIRED'
                              ? 'text-text-tertiary'
                              : item.status === 'CANCELLED'
                                ? 'text-danger-400'
                                : 'text-yellow-500'
                        }`}
                      >
                        {t(
                          `hirer.membership.status.${item.status.toLowerCase()}`
                        )}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Purchase Button - Themed to selected tier */}
      {selectedTier &&
        !isTierDisabled(selectedTier) &&
        purchaseTheme && (
          <SafeAreaView edges={['bottom']} className="bg-white">
            <View className="border-t border-border-light px-4 py-4">
              <Button
                onPress={handlePurchase}
                loading={purchaseMutation.isPending}
                className={`w-full ${purchaseTheme.buttonBgColor}`}
              >
                <Text className="font-bold text-white">
                  {t('hirer.membership.upgrade_to', {
                    tier: selectedTier,
                  })}
                </Text>
              </Button>
            </View>
          </SafeAreaView>
        )}
    </View>
  );
}
