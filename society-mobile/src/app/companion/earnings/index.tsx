/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Chart,
  Wallet,
  Withdraw,
} from '@/components/ui/icons';
import {
  type EarningsOverview as EarningsOverviewData,
  earningsService,
  type EarningsTransaction,
} from '@/lib/api/services/earnings.service';
import { formatVND } from '@/lib/utils';

type Period = 'week' | 'month' | 'year';

export default function EarningsOverview() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = React.useState<Period>('month');
  const [overview, setOverview] = React.useState<EarningsOverviewData | null>(
    null
  );
  const [transactions, setTransactions] = React.useState<EarningsTransaction[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [overviewData, transactionsData] = await Promise.all([
        earningsService.getEarningsOverview(),
        earningsService.getTransactionHistory(1, 10, selectedPeriod),
      ]);
      setOverview(overviewData);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Failed to fetch earnings data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleWithdraw = React.useCallback(() => {
    router.push('/companion/earnings/withdraw' as Href);
  }, [router]);

  // Get earnings data based on selected period
  const getPeriodEarnings = React.useCallback(() => {
    if (!overview) return { amount: 0, change: 0 };
    switch (selectedPeriod) {
      case 'week':
        return { amount: overview.thisWeek, change: overview.weeklyChange };
      case 'month':
        return { amount: overview.thisMonth, change: overview.monthlyChange };
      case 'year':
        return { amount: overview.thisYear, change: 0 };
      default:
        return { amount: 0, change: 0 };
    }
  }, [overview, selectedPeriod]);

  const getTransactionIcon = (type: EarningsTransaction['type']) => {
    switch (type) {
      case 'earning':
        return {
          icon: Calendar,
          color: colors.teal[400],
          bg: 'bg-teal-400/10',
        };
      case 'withdrawal':
        return {
          icon: Withdraw,
          color: colors.rose[400],
          bg: 'bg-rose-400/10',
        };
      case 'bonus':
        return {
          icon: Chart,
          color: colors.yellow[400],
          bg: 'bg-yellow-400/10',
        };
      case 'refund':
        return {
          icon: Withdraw,
          color: colors.rose[400],
          bg: 'bg-rose-400/10',
        };
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  const periodEarnings = getPeriodEarnings();

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="font-urbanist-bold flex-1 text-xl text-midnight">
            {t('companion.earnings.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Earnings Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="m-4 rounded-3xl bg-lavender-400 p-6"
        >
          <View className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-full bg-white/20">
              <Wallet color="#FFFFFF" width={24} height={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-white/80">
                {t('companion.earnings.available_balance')}
              </Text>
              <Text className="font-urbanist-bold text-3xl text-white">
                {formatVND(overview?.availableBalance || 0, {
                  symbolPosition: 'suffix',
                })}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleWithdraw}
            testID="withdraw-button"
            className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-white py-4"
          >
            <Withdraw color={colors.lavender[400]} width={20} height={20} />
            <Text className="font-semibold text-lavender-400">
              {t('companion.earnings.withdraw_funds')}
            </Text>
          </Pressable>
        </MotiView>

        {/* Period Selector */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mx-4 flex-row gap-2"
        >
          {(['week', 'month', 'year'] as Period[]).map((period) => (
            <Pressable
              key={period}
              onPress={() => setSelectedPeriod(period)}
              testID={`period-selector-${period}`}
              className={`flex-1 items-center rounded-xl py-3 ${
                selectedPeriod === period
                  ? 'bg-lavender-400'
                  : 'border border-border-light bg-white'
              }`}
            >
              <Text
                className={`text-sm font-semibold capitalize ${
                  selectedPeriod === period ? 'text-white' : 'text-midnight'
                }`}
              >
                {t(`companion.earnings.period_labels.${period}`)}
              </Text>
            </Pressable>
          ))}
        </MotiView>

        {/* Stats */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="m-4 rounded-2xl bg-white p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-text-tertiary">
              {t(`companion.earnings.periods.this_${selectedPeriod}`)}
            </Text>
            {periodEarnings.change !== 0 && (
              <View className="flex-row items-center gap-1">
                <Chart
                  color={
                    periodEarnings.change >= 0
                      ? colors.teal[400]
                      : colors.rose[400]
                  }
                  width={16}
                  height={16}
                />
                <Text
                  className={`text-sm font-semibold ${
                    periodEarnings.change >= 0
                      ? 'text-teal-400'
                      : 'text-rose-400'
                  }`}
                >
                  {periodEarnings.change >= 0 ? '+' : ''}
                  {periodEarnings.change}%
                </Text>
              </View>
            )}
          </View>
          <Text className="font-urbanist-bold mt-2 text-3xl text-midnight">
            {formatVND(periodEarnings.amount, { symbolPosition: 'suffix' })}
          </Text>
          <Text className="mt-1 text-sm text-text-secondary">
            {t('companion.earnings.total_earnings')}:{' '}
            {formatVND(overview?.totalEarnings || 0, {
              symbolPosition: 'suffix',
            })}
          </Text>
        </MotiView>

        {/* Transaction History */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mx-4 mb-4"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-urbanist-bold text-lg text-midnight">
              {t('companion.earnings.recent_transactions')}
            </Text>
            <Pressable
              testID="see-all-transactions"
              className="flex-row items-center gap-1"
            >
              <Text className="text-sm font-medium text-lavender-400">
                {t('common.see_all')}
              </Text>
              <ArrowRight color={colors.lavender[400]} width={16} height={16} />
            </Pressable>
          </View>

          <View className="gap-3">
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => {
                const iconData = getTransactionIcon(transaction.type);
                const dateStr = new Date(
                  transaction.createdAt
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const isPositive =
                  transaction.type === 'earning' ||
                  transaction.type === 'bonus';
                const displayAmount = isPositive
                  ? transaction.amount
                  : -transaction.amount;
                return (
                  <MotiView
                    key={transaction.id}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: 'timing',
                      duration: 400,
                      delay: 400 + index * 50,
                    }}
                  >
                    <View className="flex-row items-center gap-4 rounded-xl bg-white p-4">
                      <View
                        className={`size-12 items-center justify-center rounded-full ${iconData.bg}`}
                      >
                        <iconData.icon
                          color={iconData.color}
                          width={24}
                          height={24}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-medium text-midnight"
                          numberOfLines={1}
                        >
                          {transaction.description}
                        </Text>
                        <Text className="text-xs text-text-tertiary">
                          {dateStr}
                        </Text>
                      </View>
                      <Text
                        className={`font-semibold ${
                          isPositive ? 'text-teal-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatVND(Math.abs(displayAmount), {
                          symbolPosition: 'suffix',
                        })}
                      </Text>
                    </View>
                  </MotiView>
                );
              })
            ) : (
              <View className="items-center py-8">
                <Text className="text-text-secondary">
                  {t('companion.earnings.no_transactions')}
                </Text>
              </View>
            )}
          </View>
        </MotiView>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
