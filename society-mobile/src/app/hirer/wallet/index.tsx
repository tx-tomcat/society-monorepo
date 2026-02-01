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
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Wallet,
  XCircle,
} from '@/components/ui/icons';
import {
  PaymentRequestStatus,
  PaymentRequestType,
} from '@/lib/api/enums';
import { useWalletBalance, useWalletTransactions } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

export default function WalletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance();

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useWalletTransactions(1);

  const isLoading = isBalanceLoading || isTransactionsLoading;

  useFocusEffect(
    React.useCallback(() => {
      refetchBalance();
      refetchTransactions();
    }, [refetchBalance, refetchTransactions])
  );

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchBalance(), refetchTransactions()]);
    setIsRefreshing(false);
  }, [refetchBalance, refetchTransactions]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleTopup = React.useCallback(() => {
    router.push('/hirer/wallet/topup' as Href);
  }, [router]);

  const getTransactionIcon = (
    type: PaymentRequestType,
    status: PaymentRequestStatus
  ) => {
    if (status === PaymentRequestStatus.PENDING) {
      return {
        icon: Clock,
        color: colors.yellow[400],
        bg: 'bg-yellow-400/10',
      };
    }
    if (status === PaymentRequestStatus.EXPIRED || status === PaymentRequestStatus.FAILED) {
      return {
        icon: XCircle,
        color: colors.rose[400],
        bg: 'bg-rose-400/10',
      };
    }
    if (type === PaymentRequestType.TOPUP) {
      return {
        icon: Plus,
        color: colors.teal[400],
        bg: 'bg-teal-400/10',
      };
    }
    return {
      icon: Calendar,
      color: colors.lavender[400],
      bg: 'bg-lavender-400/10',
    };
  };

  const getStatusColor = (status: PaymentRequestStatus) => {
    switch (status) {
      case PaymentRequestStatus.COMPLETED:
        return 'text-teal-400';
      case PaymentRequestStatus.PENDING:
        return 'text-yellow-500';
      case PaymentRequestStatus.EXPIRED:
      case PaymentRequestStatus.FAILED:
        return 'text-rose-400';
      default:
        return 'text-text-secondary';
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  const transactions = transactionsData?.transactions || [];

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.wallet.title')}
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
        {/* Balance Card */}
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
                {t('hirer.wallet.balance')}
              </Text>
              <Text className="font-urbanist-bold text-3xl text-white">
                {formatVND(balanceData?.balance || 0, {
                  symbolPosition: 'suffix',
                })}
              </Text>
            </View>
          </View>

          {/* Pending Topups Indicator */}
          {balanceData?.pendingTopups && balanceData.pendingTopups > 0 && (
            <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
              <Clock color="#FFFFFF" width={16} height={16} />
              <Text className="flex-1 text-sm text-white/90">
                {t('hirer.wallet.pending')}
              </Text>
              <Text className="font-semibold text-white">
                {formatVND(balanceData.pendingTopups, { symbolPosition: 'suffix' })}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleTopup}
            testID="topup-button"
            className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-rose-400 py-4"
          >
            <Plus color="#FFFFFF" width={20} height={20} />
            <Text className="font-semibold text-white">
              {t('hirer.wallet.topup')}
            </Text>
          </Pressable>
        </MotiView>

        {/* Transaction History */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mx-4 mb-4"
        >
          <Text className="mb-3 font-urbanist-bold text-lg text-midnight">
            {t('hirer.wallet.transactions')}
          </Text>

          <View className="gap-3">
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => {
                const iconData = getTransactionIcon(transaction.type, transaction.status);
                const dateStr = new Date(transaction.createdAt).toLocaleDateString(
                  'vi-VN',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }
                );
                const isPositive = transaction.type === 'TOPUP' && transaction.status === 'COMPLETED';
                const displayAmount = isPositive ? transaction.amount : -transaction.amount;

                return (
                  <MotiView
                    key={transaction.id}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: 'timing',
                      duration: 400,
                      delay: 300 + index * 50,
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
                        <View className="flex-row items-center gap-2">
                          <Text
                            className="flex-1 font-medium text-midnight"
                            numberOfLines={1}
                          >
                            {transaction.type === 'TOPUP'
                              ? t('hirer.wallet.topup_title')
                              : t('hirer.wallet.booking_payment')}
                          </Text>
                          <Text className={`text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {t(`hirer.wallet.status.${transaction.status.toLowerCase()}`)}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs text-text-tertiary">
                            {transaction.code}
                          </Text>
                          <Text className="text-xs text-text-tertiary">•</Text>
                          <Text className="text-xs text-text-tertiary">
                            {dateStr}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className={`font-semibold ${
                          isPositive ? 'text-teal-400' : 'text-text-secondary'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatVND(Math.abs(transaction.amount), {
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
                  {t('hirer.wallet.no_transactions')}
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
