/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';

import {
  Badge,
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  Bank,
  CheckCircle,
  Info,
  Wallet,
} from '@/components/ui/icons';
import {
  useBankAccounts,
  useEarningsOverview,
  useRequestWithdrawal,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

const QUICK_AMOUNTS = [500000, 1000000, 2000000, 3000000];

export default function WithdrawFunds() {
  const router = useRouter();
  const { t } = useTranslation();
  const [amount, setAmount] = React.useState('');
  const [selectedBank, setSelectedBank] = React.useState('');

  // React Query hooks
  const { data: bankAccountsData, isLoading: isLoadingBanks } = useBankAccounts();
  const { data: overview, isLoading: isLoadingOverview } = useEarningsOverview();
  const requestWithdrawal = useRequestWithdrawal();

  const bankAccounts = bankAccountsData?.accounts ?? [];
  const isLoading = isLoadingBanks || isLoadingOverview;

  // Set default selected bank when data loads
  React.useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBank) {
      const primary = bankAccounts.find((b) => b.isPrimary);
      if (primary) {
        setSelectedBank(primary.id);
      } else {
        setSelectedBank(bankAccounts[0].id);
      }
    }
  }, [bankAccounts, selectedBank]);

  const availableBalance = overview?.availableBalance || 0;

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleSelectAmount = React.useCallback((value: number) => {
    setAmount(value.toString());
  }, []);

  const handleWithdraw = React.useCallback(async () => {
    const withdrawAmount = parseInt(amount, 10);
    if (withdrawAmount > availableBalance) {
      Alert.alert(
        t('companion.withdraw.error'),
        t('companion.withdraw.insufficient_balance')
      );
      return;
    }
    if (withdrawAmount < 100000) {
      Alert.alert(
        t('companion.withdraw.error'),
        t('companion.withdraw.minimum_amount')
      );
      return;
    }

    Alert.alert(
      t('companion.withdraw.confirm_title'),
      t('companion.withdraw.confirm_message', {
        amount: formatVND(withdrawAmount, { symbolPosition: 'suffix' }),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            requestWithdrawal.mutate(
              {
                bankAccountId: selectedBank,
                amount: withdrawAmount,
              },
              {
                onSuccess: () => {
                  Toast.show({
                    type: 'success',
                    text1: t('companion.withdraw.success'),
                    text2: t('companion.withdraw.success_description'),
                  });
                  router.back();
                },
                onError: (error) => {
                  console.error('Withdrawal request failed:', error);
                  Toast.show({
                    type: 'error',
                    text1: t('companion.withdraw.request_failed'),
                    text2: t('companion.withdraw.request_failed_description'),
                  });
                },
              }
            );
          },
        },
      ]
    );
  }, [amount, availableBalance, selectedBank, router, t, requestWithdrawal]);

  const amountNum = parseInt(amount, 10) || 0;

  // Validation states
  const isBelowMinimum = amountNum > 0 && amountNum < 100000;
  const isAboveBalance = amountNum > availableBalance;
  const hasNoBankSelected = !selectedBank && bankAccounts.length > 0;

  const isValid =
    amountNum >= 100000 &&
    amountNum <= availableBalance &&
    selectedBank &&
    !requestWithdrawal.isPending;

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

      <CompanionHeader title={t('companion.withdraw.header')} onBack={handleBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Available Balance */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6 flex-row items-center justify-between rounded-2xl bg-lavender-400 p-4"
        >
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-white/20">
              <Wallet color="#FFFFFF" width={20} height={20} />
            </View>
            <View>
              <Text className="text-sm text-white/80">
                {t('companion.earnings.available_balance')}
              </Text>
              <Text className="font-urbanist-bold text-xl text-white">
                {formatVND(availableBalance, { symbolPosition: 'suffix' })}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Amount Input */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.withdraw.amount_label')}
          </Text>
          <View
            className={`flex-row items-center rounded-xl border bg-white px-4 ${
              isBelowMinimum || isAboveBalance
                ? 'border-danger-400'
                : 'border-border-light'
            }`}
          >
            <Text className="text-xl text-text-tertiary">₫</Text>
            <TextInput
              value={amount ? parseInt(amount, 10).toLocaleString('vi-VN') : ''}
              onChangeText={(text) => setAmount(text.replace(/\D/g, ''))}
              placeholder="0"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="number-pad"
              testID="amount-input"
              className="flex-1 py-4 text-right text-2xl font-bold"
              style={{ fontFamily: 'Urbanist_700Bold', color: colors.midnight.DEFAULT }}
            />
          </View>

          {/* Validation Messages */}
          {isBelowMinimum && (
            <Text className="mt-2 text-sm text-danger-400">
              {t('companion.withdraw.minimum_error', {
                amount: formatVND(100000, { symbolPosition: 'suffix' }),
              })}
            </Text>
          )}
          {isAboveBalance && (
            <Text className="mt-2 text-sm text-danger-400">
              {t('companion.withdraw.exceeds_balance_error', {
                amount: formatVND(availableBalance, {
                  symbolPosition: 'suffix',
                }),
              })}
            </Text>
          )}

          {/* Quick Amounts */}
          <View className="mt-3 flex-row flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <Pressable
                key={value}
                onPress={() => handleSelectAmount(value)}
                testID={`quick-amount-${value}`}
                className={`rounded-full px-4 py-2 ${
                  amountNum === value
                    ? 'bg-lavender-400'
                    : 'border border-border-light bg-white'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    amountNum === value ? 'text-white' : 'text-midnight'
                  }`}
                >
                  {formatVND(value, { symbolPosition: 'suffix' })}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => handleSelectAmount(availableBalance)}
              testID="withdraw-all-button"
              className="rounded-full border border-lavender-400 bg-lavender-400/10 px-4 py-2"
            >
              <Text className="text-sm font-medium text-lavender-400">
                {t('companion.withdraw.withdraw_all')}
              </Text>
            </Pressable>
          </View>
        </MotiView>

        {/* Bank Account Selection */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6"
        >
          <Text className="mb-3 text-lg font-semibold text-midnight">
            {t('companion.withdraw.withdraw_to')}
          </Text>

          <View className="gap-3">
            {bankAccounts.length > 0 ? (
              bankAccounts.map((bank) => (
                <Pressable
                  key={bank.id}
                  onPress={() => setSelectedBank(bank.id)}
                  testID={`bank-account-${bank.id}`}
                  className={`flex-row items-center gap-4 rounded-xl p-4 ${
                    selectedBank === bank.id
                      ? 'border border-lavender-400 bg-lavender-400/10'
                      : 'border border-border-light bg-white'
                  }`}
                >
                  <View className="size-12 items-center justify-center rounded-full bg-lavender-400/20">
                    <Bank color={colors.lavender[400]} width={24} height={24} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold text-midnight">
                        {bank.bankName}
                      </Text>
                      {bank.isPrimary && (
                        <Badge
                          label={t('common.default')}
                          variant="lavender"
                          size="sm"
                        />
                      )}
                    </View>
                    <Text className="text-sm text-text-secondary">
                      {bank.accountNumber} • {bank.accountHolder}
                    </Text>
                  </View>
                  <View
                    className={`size-6 items-center justify-center rounded-full border-2 ${
                      selectedBank === bank.id
                        ? 'border-lavender-400 bg-lavender-400'
                        : 'border-border-light'
                    }`}
                  >
                    {selectedBank === bank.id && (
                      <CheckCircle color="#FFFFFF" width={16} height={16} />
                    )}
                  </View>
                </Pressable>
              ))
            ) : (
              <View className="items-center rounded-xl bg-white py-8">
                <Text className="text-text-secondary">
                  {t('companion.withdraw.no_bank_accounts')}
                </Text>
              </View>
            )}
          </View>

          {hasNoBankSelected && amountNum > 0 && (
            <Text className="mt-2 text-sm text-danger-400">
              {t('companion.withdraw.select_bank_error')}
            </Text>
          )}

          <Pressable testID="add-bank-account" className="mt-3 items-center">
            <Text className="text-sm font-semibold text-lavender-400">
              + {t('companion.withdraw.add_bank_account')}
            </Text>
          </Pressable>
        </MotiView>

        {/* Processing Time */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="rounded-xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-start gap-3">
            <Info color={colors.teal[400]} width={20} height={20} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-teal-700">
                {t('companion.withdraw.processing_time')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {t('companion.withdraw.processing_info')}
              </Text>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="px-6 py-4">
          <View className="mb-3 flex-row justify-between">
            <Text className="text-text-secondary">
              {t('companion.withdraw.you_will_receive')}
            </Text>
            <Text className="font-urbanist-bold text-lg text-midnight">
              {formatVND(amountNum, { symbolPosition: 'suffix' })}
            </Text>
          </View>
          <Button
            label={t('companion.withdraw.submit_button')}
            onPress={handleWithdraw}
            disabled={!isValid}
            loading={requestWithdrawal.isPending}
            variant="default"
            size="lg"
            testID="submit-withdraw-button"
            className="w-full bg-lavender-400"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
