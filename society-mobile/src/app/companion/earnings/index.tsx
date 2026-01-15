/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Badge,
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
import { formatVND } from '@/lib/utils';

type Period = 'week' | 'month' | 'year';

type EarningsData = {
  period: string;
  amount: number;
  bookings: number;
  change: number;
};

const MOCK_EARNINGS: Record<Period, EarningsData> = {
  week: {
    period: 'companion.earnings.periods.this_week',
    amount: 2460000,
    bookings: 3,
    change: 15,
  },
  month: {
    period: 'companion.earnings.periods.this_month',
    amount: 8450000,
    bookings: 12,
    change: 23,
  },
  year: {
    period: 'companion.earnings.periods.this_year',
    amount: 42500000,
    bookings: 68,
    change: 35,
  },
};

type Transaction = {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'earning',
    description: 'Wedding Reception - Nguyen Van Minh',
    amount: 1640000,
    date: 'Jan 15, 2025',
    status: 'completed',
  },
  {
    id: '2',
    type: 'withdrawal',
    description: 'Bank Transfer - Vietcombank',
    amount: -5000000,
    date: 'Jan 12, 2025',
    status: 'completed',
  },
  {
    id: '3',
    type: 'earning',
    description: 'Corporate Dinner - Tran Hoang Long',
    amount: 820000,
    date: 'Jan 10, 2025',
    status: 'completed',
  },
  {
    id: '4',
    type: 'bonus',
    description: '5-Star Rating Bonus',
    amount: 100000,
    date: 'Jan 8, 2025',
    status: 'completed',
  },
];

export default function EarningsOverview() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = React.useState<Period>('month');

  const earnings = MOCK_EARNINGS[selectedPeriod];

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleWithdraw = React.useCallback(() => {
    router.push('/companion/earnings/withdraw' as Href);
  }, [router]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'earning':
        return { icon: Calendar, color: colors.teal[400], bg: 'bg-teal-400/10' };
      case 'withdrawal':
        return { icon: Withdraw, color: colors.rose[400], bg: 'bg-rose-400/10' };
      case 'bonus':
        return { icon: Chart, color: colors.yellow[400], bg: 'bg-yellow-400/10' };
    }
  };

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('companion.earnings.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
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
              <Text className="text-sm text-white/80">{t('companion.earnings.available_balance')}</Text>
              <Text style={styles.balance} className="text-3xl text-white">
                ₫3,460,000
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleWithdraw}
            testID="withdraw-button"
            className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-white py-4"
          >
            <Withdraw color={colors.lavender[400]} width={20} height={20} />
            <Text className="font-semibold text-lavender-400">{t('companion.earnings.withdraw_funds')}</Text>
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
            <Text className="text-sm text-text-tertiary">{t(earnings.period)}</Text>
            <View className="flex-row items-center gap-1">
              <Chart
                color={earnings.change >= 0 ? colors.teal[400] : colors.rose[400]}
                width={16}
                height={16}
              />
              <Text
                className={`text-sm font-semibold ${
                  earnings.change >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {earnings.change >= 0 ? '+' : ''}{earnings.change}%
              </Text>
            </View>
          </View>
          <Text style={styles.earnings} className="mt-2 text-3xl text-midnight">
            {formatVND(earnings.amount, { symbolPosition: 'suffix' })}
          </Text>
          <Text className="mt-1 text-sm text-text-secondary">
            {t('companion.earnings.from_bookings', { count: earnings.bookings })}
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
            <Text style={styles.sectionTitle} className="text-lg text-midnight">
              {t('companion.earnings.recent_transactions')}
            </Text>
            <Pressable testID="see-all-transactions" className="flex-row items-center gap-1">
              <Text className="text-sm font-medium text-lavender-400">{t('common.see_all')}</Text>
              <ArrowRight color={colors.lavender[400]} width={16} height={16} />
            </Pressable>
          </View>

          <View className="gap-3">
            {MOCK_TRANSACTIONS.map((transaction, index) => {
              const iconData = getTransactionIcon(transaction.type);
              return (
                <MotiView
                  key={transaction.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 400, delay: 400 + index * 50 }}
                >
                  <View className="flex-row items-center gap-4 rounded-xl bg-white p-4">
                    <View className={`size-12 items-center justify-center rounded-full ${iconData.bg}`}>
                      <iconData.icon color={iconData.color} width={24} height={24} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-midnight" numberOfLines={1}>
                        {transaction.description}
                      </Text>
                      <Text className="text-xs text-text-tertiary">
                        {transaction.date}
                      </Text>
                    </View>
                    <Text
                      className={`font-semibold ${
                        transaction.amount >= 0 ? 'text-teal-400' : 'text-rose-400'
                      }`}
                    >
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatVND(transaction.amount, { symbolPosition: 'suffix' })}
                    </Text>
                  </View>
                </MotiView>
              );
            })}
          </View>
        </MotiView>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  balance: {
    fontFamily: 'Urbanist_700Bold',
  },
  earnings: {
    fontFamily: 'Urbanist_700Bold',
  },
  sectionTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
