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
  CompanionHeader,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  Chart,
  CheckCircle,
  Clock,
  Fire,
  Star,
  Zap,
} from '@/components/ui/icons';
import { showErrorMessage } from '@/components/ui/utils';
import type { BoostPricing, BoostTier } from '@/lib/api/services/companions.service';
import { useSafeBack } from '@/lib/hooks';
import {
  useActiveBoost,
  useBoostHistory,
  useBoostPricing,
  usePurchaseBoost,
} from '@/lib/hooks/use-companions';
import { formatVND } from '@/lib/utils';

type TierConfig = {
  icon: React.ComponentType<{ color?: string; width?: number; height?: number }>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  popular?: boolean;
};

const TIER_CONFIG: Record<BoostTier, TierConfig> = {
  STANDARD: {
    icon: Zap,
    iconColor: colors.lavender[400],
    bgColor: 'bg-lavender-900/10',
    borderColor: 'border-lavender-900/30',
  },
  PREMIUM: {
    icon: Fire,
    iconColor: colors.rose[400],
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/30',
    popular: true,
  },
  SUPER: {
    icon: Star,
    iconColor: colors.yellow[500],
    bgColor: 'bg-yellow-400/10',
    borderColor: 'border-yellow-400/30',
  },
};

// Memoized pricing card component to prevent unnecessary re-renders
const PricingCard = React.memo(function PricingCard({
  item,
  index,
  isSelected,
  isDisabled,
  onSelect,
  t,
}: {
  item: BoostPricing;
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (tier: BoostTier) => void;
  t: (key: string) => string;
}) {
  const config = TIER_CONFIG[item.tier];
  const IconComponent = config.icon;

  const handlePress = React.useCallback(() => {
    onSelect(item.tier);
  }, [item.tier, onSelect]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 100 + index * 100 }}
    >
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        className={`relative mb-3 rounded-2xl border-2 p-4 ${isSelected
          ? 'border-lavender-900 bg-lavender-900/5'
          : 'border-border-light bg-white'
          } ${isDisabled ? 'opacity-50' : ''}`}
      >
        {config.popular && !isDisabled && (
          <View className="absolute -top-2.5 right-4 rounded-full bg-rose-400 px-3 py-1">
            <Text className="text-xs font-semibold text-white">
              {t('common.popular')}
            </Text>
          </View>
        )}

        <View className="flex-row items-center">
          <View
            className={`mr-4 size-14 items-center justify-center rounded-2xl ${config.bgColor}`}
          >
            <IconComponent color={config.iconColor} width={28} height={28} />
          </View>

          <View className="flex-1">
            <Text className="font-urbanist-bold text-lg text-midnight">
              {item.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View className="flex-row items-center gap-1">
                <Clock color={colors.text.tertiary} width={14} height={14} />
                <Text className="text-xs text-text-secondary">
                  {item.durationHours}h
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Chart color={colors.text.tertiary} width={14} height={14} />
                <Text className="text-xs text-text-secondary">
                  {item.multiplier}x {t('companion.boost.visibility')}
                </Text>
              </View>
            </View>
          </View>

          <View className="items-end">
            <Text className="font-urbanist-bold text-xl text-midnight">
              {formatVND(item.price)}
            </Text>
            {isSelected && (
              <CheckCircle color={colors.lavender[400]} width={20} height={20} />
            )}
          </View>
        </View>

        {item.description && (
          <Text className="mt-3 text-sm text-text-secondary">
            {item.description}
          </Text>
        )}
      </Pressable>
    </MotiView>
  );
});

export default function BoostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useSafeBack('/companion/(app)/account');
  const [selectedTier, setSelectedTier] = React.useState<BoostTier | null>(null);

  // React Query hooks
  const {
    data: pricing,
    isLoading: isPricingLoading,
    refetch: refetchPricing,
    isRefetching: isRefetchingPricing,
  } = useBoostPricing();

  const {
    data: activeBoost,
    isLoading: isActiveBoostLoading,
    refetch: refetchActiveBoost,
    isRefetching: isRefetchingActiveBoost,
  } = useActiveBoost();

  const {
    data: boostHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory,
  } = useBoostHistory(5);

  const purchaseBoostMutation = usePurchaseBoost();

  const isLoading = isPricingLoading || isActiveBoostLoading || isHistoryLoading;
  const isRefreshing =
    isRefetchingPricing || isRefetchingActiveBoost || isRefetchingHistory;

  const handleRefresh = React.useCallback(() => {
    refetchPricing();
    refetchActiveBoost();
    refetchHistory();
  }, [refetchPricing, refetchActiveBoost, refetchHistory]);

  const handlePurchase = React.useCallback(async () => {
    if (!selectedTier) return;

    const tierPricing = pricing?.find((p) => p.tier === selectedTier);
    if (!tierPricing) return;

    Alert.alert(
      t('companion.boost.confirm_title'),
      `${t('companion.boost.confirm_message')} ${formatVND(tierPricing.price)}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('companion.boost.purchase'),
          onPress: async () => {
            try {
              const result = await purchaseBoostMutation.mutateAsync({
                tier: selectedTier,
              });

              // Navigate to QR payment screen
              router.push({
                pathname: '/companion/settings/boost-payment',
                params: {
                  paymentRequestId: result.paymentRequestId,
                  boostId: result.boostId,
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
              if (apiError?.data?.error === 'BOOST_ALREADY_ACTIVE') {
                showErrorMessage(t('companion.boost.already_active_error'));
              } else {
                showErrorMessage(t('companion.boost.purchase_failed'));
              }
            }
          },
        },
      ]
    );
  }, [selectedTier, pricing, t, purchaseBoostMutation, router]);

  const handleSelectTier = React.useCallback((tier: BoostTier) => {
    setSelectedTier(tier);
  }, []);

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

      <CompanionHeader title={t('companion.boost.header')} onBack={goBack} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.lavender[400]}
          />
        }
      >
        {/* Active Boost Banner */}
        {activeBoost && activeBoost.boost?.status === 'ACTIVE' && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="m-4 rounded-2xl bg-gradient-to-r from-lavender-900 to-rose-400 bg-lavender-900 p-5"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-full bg-white/20">
                <Fire color="#FFFFFF" width={24} height={24} />
              </View>
              <View className="flex-1">
                <Text className="font-urbanist-bold text-lg text-white">
                  {t('companion.boost.active_boost')}
                </Text>
                <Text className="text-sm text-white/80">
                  {activeBoost.boost?.multiplier}x {t('companion.boost.visibility')}
                </Text>
              </View>
            </View>

            {activeBoost.boost?.remainingHours !== null && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-white/20 px-4 py-3">
                <Clock color="#FFFFFF" width={18} height={18} />
                <Text className="flex-1 text-sm font-medium text-white">
                  {t('companion.boost.time_remaining')}
                </Text>
                <Text className="font-urbanist-bold text-white">
                  {activeBoost.boost?.remainingHours}h
                </Text>
              </View>
            )}
          </MotiView>
        )}

        {/* Boost Benefits */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mx-4 mb-4 mt-4"
        >
          <Text className="font-urbanist-bold mb-3 text-lg text-midnight">
            {t('companion.boost.why_boost')}
          </Text>
          <View className="rounded-2xl bg-white p-4">
            {[
              { key: 'benefit_1', icon: Chart },
              { key: 'benefit_2', icon: Star },
              { key: 'benefit_3', icon: Zap },
            ].map((benefit, index) => (
              <View
                key={benefit.key}
                className={`flex-row items-center gap-3 ${index < 2 ? 'mb-4 border-b border-border-light pb-4' : ''
                  }`}
              >
                <View className="size-10 items-center justify-center rounded-full bg-lavender-900/10">
                  <benefit.icon
                    color={colors.lavender[400]}
                    width={20}
                    height={20}
                  />
                </View>
                <Text className="flex-1 text-sm text-midnight">
                  {t(`companion.boost.${benefit.key}`)}
                </Text>
              </View>
            ))}
          </View>
        </MotiView>

        {/* Pricing Options */}
        <View className="mx-4 mb-4">
          <Text className="font-urbanist-bold mb-3 text-lg text-midnight">
            {t('companion.boost.choose_package')}
          </Text>
          {pricing?.map((item, index) => (
            <PricingCard
              key={item.tier}
              item={item}
              index={index}
              isSelected={selectedTier === item.tier}
              isDisabled={!!activeBoost?.hasActiveBoost}
              onSelect={handleSelectTier}
              t={t}
            />
          ))}
        </View>

        {/* Boost History */}
        {boostHistory && boostHistory.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 400 }}
            className="mx-4 mb-4"
          >
            <Text className="font-urbanist-bold mb-3 text-lg text-midnight">
              {t('companion.boost.history')}
            </Text>
            <View className="rounded-2xl bg-white p-4">
              {boostHistory.map((item, index) => {
                const config = TIER_CONFIG[item.tier];
                const IconComponent = config.icon;
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'short',
                  })
                  : '';

                return (
                  <View
                    key={item.id}
                    className={`flex-row items-center gap-3 ${index < boostHistory.length - 1
                      ? 'mb-3 border-b border-border-light pb-3'
                      : ''
                      }`}
                  >
                    <View
                      className={`size-10 items-center justify-center rounded-full ${config.bgColor}`}
                    >
                      <IconComponent
                        color={config.iconColor}
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
                      className={`rounded-lg px-2 py-1 ${item.status === 'ACTIVE'
                        ? 'bg-teal-400/10'
                        : item.status === 'EXPIRED'
                          ? 'bg-text-tertiary/10'
                          : 'bg-yellow-400/10'
                        }`}
                    >
                      <Text
                        className={`text-xs font-medium ${item.status === 'ACTIVE'
                          ? 'text-teal-400'
                          : item.status === 'EXPIRED'
                            ? 'text-text-tertiary'
                            : 'text-yellow-500'
                          }`}
                      >
                        {t(`companion.boost.status.${item.status.toLowerCase()}`)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Purchase Button */}
      {!activeBoost?.hasActiveBoost && selectedTier && (
        <SafeAreaView edges={['bottom']} className="bg-white">
          <View className="border-t border-border-light px-4 py-4">
            <Button
              onPress={handlePurchase}
              loading={purchaseBoostMutation.isPending}
              className="w-full"
            >
              <Text className="text-white">{t('companion.boost.purchase_now')}</Text>
            </Button>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
