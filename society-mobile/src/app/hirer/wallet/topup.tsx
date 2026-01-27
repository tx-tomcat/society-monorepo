/* eslint-disable max-lines-per-function */
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Info,
  QrCode,
} from '@/components/ui/icons';
import { useCreateTopup } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];
const MIN_AMOUNT = 100000;
const MAX_AMOUNT = 50000000;

// Bank name mapping for display
const BANK_NAMES: Record<string, string> = {
  tpbank: 'TPBank',
  vietcombank: 'Vietcombank',
  techcombank: 'Techcombank',
  mbbank: 'MB Bank',
  acb: 'ACB',
  bidv: 'BIDV',
};

// Bank code to display name mapping
const BANK_CODE_NAMES: Record<string, string> = {
  TPB: 'TPBank',
  VCB: 'Vietcombank',
  TCB: 'Techcombank',
  MB: 'MB Bank',
  ACB: 'ACB',
  BIDV: 'BIDV',
};

type TopupStep = 'amount' | 'payment';

type BankDeeplink = {
  bankCode: string;
  bankName: string;
  deeplink: string;
};

type TopupData = {
  id: string;
  code: string;
  amount: number;
  qrUrl: string;
  expiresAt: string;
  bankDeeplinks: BankDeeplink[];
  accountInfo: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
};

export default function TopupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = React.useState<TopupStep>('amount');
  const [amount, setAmount] = React.useState('');
  const [topupData, setTopupData] = React.useState<TopupData | null>(null);
  const [timeLeft, setTimeLeft] = React.useState(0);

  const createTopupMutation = useCreateTopup();

  // Countdown timer
  React.useEffect(() => {
    if (!topupData?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(topupData.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        Alert.alert(
          t('hirer.wallet.topup_expired_title'),
          t('hirer.wallet.topup_expired_message'),
          [{ text: t('common.ok'), onPress: () => setStep('amount') }]
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [topupData?.expiresAt, t]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = React.useCallback(() => {
    if (step === 'payment') {
      Alert.alert(
        t('hirer.wallet.cancel_topup_title'),
        t('hirer.wallet.cancel_topup_message'),
        [
          { text: t('common.no'), style: 'cancel' },
          {
            text: t('common.yes'),
            onPress: () => {
              setStep('amount');
              setTopupData(null);
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [step, router, t]);

  const handleSelectAmount = React.useCallback((value: number) => {
    setAmount(value.toString());
  }, []);

  const handleContinue = React.useCallback(async () => {
    const topupAmount = parseInt(amount, 10);

    if (topupAmount < MIN_AMOUNT) {
      Alert.alert(
        t('hirer.wallet.error'),
        t('hirer.wallet.minimum_error', {
          amount: formatVND(MIN_AMOUNT, { symbolPosition: 'suffix' }),
        })
      );
      return;
    }

    if (topupAmount > MAX_AMOUNT) {
      Alert.alert(
        t('hirer.wallet.error'),
        t('hirer.wallet.maximum_error', {
          amount: formatVND(MAX_AMOUNT, { symbolPosition: 'suffix' }),
        })
      );
      return;
    }

    try {
      const result = await createTopupMutation.mutateAsync(topupAmount);

      // Transform API response to TopupData format
      const bankDeeplinks: BankDeeplink[] = Object.entries(result.deeplinks).map(
        ([bankCode, deeplink]) => ({
          bankCode,
          bankName: BANK_NAMES[bankCode] || bankCode.toUpperCase(),
          deeplink,
        })
      );

      const transformedData: TopupData = {
        id: result.id,
        code: result.code,
        amount: result.amount,
        qrUrl: result.qrUrl,
        expiresAt: result.expiresAt,
        bankDeeplinks,
        accountInfo: {
          bankCode: result.accountInfo.bankCode,
          bankName: BANK_CODE_NAMES[result.accountInfo.bankCode] || result.accountInfo.bankCode,
          accountNumber: result.accountInfo.accountNumber,
          accountName: result.accountInfo.accountName,
        },
      };

      setTopupData(transformedData);
      setStep('payment');
    } catch (error) {
      console.error('Failed to create topup:', error);
      showMessage({
        message: t('hirer.wallet.topup_create_failed'),
        type: 'danger',
      });
    }
  }, [amount, createTopupMutation, t]);

  const handleCopyCode = React.useCallback(async () => {
    if (!topupData?.code) return;
    await Clipboard.setStringAsync(topupData.code);
    showMessage({
      message: t('hirer.wallet.code_copied'),
      type: 'success',
    });
  }, [topupData?.code, t]);

  const handleCopyAmount = React.useCallback(async () => {
    if (!topupData?.amount) return;
    await Clipboard.setStringAsync(topupData.amount.toString());
    showMessage({
      message: t('hirer.wallet.amount_copied'),
      type: 'success',
    });
  }, [topupData?.amount, t]);

  const handleOpenBank = React.useCallback(
    async (deeplink: string) => {
      try {
        const canOpen = await Linking.canOpenURL(deeplink);
        if (canOpen) {
          await Linking.openURL(deeplink);
        } else {
          showMessage({
            message: t('hirer.wallet.bank_app_not_installed'),
            type: 'warning',
          });
        }
      } catch (error) {
        console.error('Failed to open bank app:', error);
        showMessage({
          message: t('hirer.wallet.bank_open_failed'),
          type: 'danger',
        });
      }
    },
    [t]
  );

  const amountNum = parseInt(amount, 10) || 0;
  const isBelowMinimum = amountNum > 0 && amountNum < MIN_AMOUNT;
  const isAboveMaximum = amountNum > MAX_AMOUNT;
  const isValid =
    amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT && !createTopupMutation.isPending;

  // Amount Selection Step
  if (step === 'amount') {
    return (
      <View className="flex-1 bg-warmwhite">
        <FocusAwareStatusBar />

        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
            <Pressable onPress={handleBack} testID="back-button">
              <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
            </Pressable>
            <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
              {t('hirer.wallet.topup_header')}
            </Text>
          </View>
        </SafeAreaView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Input Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="mb-6"
          >
            <Text className="mb-2 text-lg font-semibold text-midnight">
              {t('hirer.wallet.enter_amount')}
            </Text>
            <View
              className={`flex-row items-center rounded-2xl border bg-white px-5 ${
                isBelowMinimum || isAboveMaximum
                  ? 'border-danger-400'
                  : 'border-border-light'
              }`}
            >
              <Text className="text-2xl text-text-tertiary">₫</Text>
              <TextInput
                value={amount ? parseInt(amount, 10).toLocaleString('vi-VN') : ''}
                onChangeText={(text) => setAmount(text.replace(/\D/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                testID="amount-input"
                className="flex-1 py-5 text-right text-3xl"
                style={{ fontFamily: 'Urbanist_700Bold', color: colors.midnight.DEFAULT }}
              />
            </View>

            {/* Validation Messages */}
            {isBelowMinimum && (
              <Text className="mt-2 text-sm text-danger-400">
                {t('hirer.wallet.minimum_error', {
                  amount: formatVND(MIN_AMOUNT, { symbolPosition: 'suffix' }),
                })}
              </Text>
            )}
            {isAboveMaximum && (
              <Text className="mt-2 text-sm text-danger-400">
                {t('hirer.wallet.maximum_error', {
                  amount: formatVND(MAX_AMOUNT, { symbolPosition: 'suffix' }),
                })}
              </Text>
            )}

            {/* Quick Amounts */}
            <View className="mt-4 flex-row flex-wrap gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => handleSelectAmount(value)}
                  testID={`quick-amount-${value}`}
                  className={`rounded-full px-4 py-2.5 ${
                    amountNum === value
                      ? 'bg-rose-400'
                      : 'border border-border-light bg-white'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      amountNum === value ? 'text-white' : 'text-midnight'
                    }`}
                  >
                    {value >= 1000000
                      ? `${value / 1000000}M`
                      : `${value / 1000}K`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </MotiView>

          {/* Info Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
            className="rounded-2xl bg-lavender-400/10 p-4"
          >
            <View className="flex-row items-start gap-3">
              <Info color={colors.lavender[400]} width={20} height={20} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-lavender-600">
                  {t('hirer.wallet.topup_info_title')}
                </Text>
                <Text className="mt-1 text-sm text-text-secondary">
                  {t('hirer.wallet.topup_info_description')}
                </Text>
              </View>
            </View>
          </MotiView>
        </ScrollView>

        {/* Bottom CTA */}
        <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-white">
          <View className="px-6 py-4">
            <Button
              label={
                createTopupMutation.isPending
                  ? t('common.loading')
                  : t('hirer.wallet.continue_to_payment')
              }
              onPress={handleContinue}
              disabled={!isValid}
              loading={createTopupMutation.isPending}
              variant="default"
              size="lg"
              testID="continue-button"
              className="w-full bg-rose-400"
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Payment Step with QR Code
  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.wallet.complete_payment')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mb-6 flex-row items-center justify-center gap-3 rounded-2xl bg-yellow-400/10 p-4"
        >
          <Clock color={colors.yellow[600]} width={24} height={24} />
          <View>
            <Text className="text-center text-sm text-yellow-700">
              {t('hirer.wallet.payment_expires_in')}
            </Text>
            <Text className="text-center font-urbanist-bold text-2xl text-yellow-600">
              {formatTime(timeLeft)}
            </Text>
          </View>
        </MotiView>

        {/* QR Code Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6 items-center rounded-3xl bg-white p-6"
          style={styles.qrCard}
        >
          <View className="mb-4 flex-row items-center gap-2">
            <QrCode color={colors.lavender[400]} width={20} height={20} />
            <Text className="font-semibold text-midnight">
              {t('hirer.wallet.scan_qr')}
            </Text>
          </View>

          {topupData?.qrUrl ? (
            <View className="rounded-2xl bg-white p-4" style={styles.qrContainer}>
              <Image
                source={{ uri: topupData.qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color={colors.lavender[400]} />
            </View>
          )}

          {/* Amount Display */}
          <View className="mt-4 w-full rounded-xl bg-lavender-400/10 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-text-secondary">{t('hirer.wallet.amount_label')}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="font-urbanist-bold text-xl text-midnight">
                  {formatVND(topupData?.amount || 0, { symbolPosition: 'suffix' })}
                </Text>
                <Pressable onPress={handleCopyAmount} testID="copy-amount-button">
                  <Copy color={colors.lavender[400]} width={18} height={18} />
                </Pressable>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Payment Code Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6 rounded-2xl bg-white p-5"
          style={styles.infoCard}
        >
          <Text className="mb-3 font-semibold text-midnight">
            {t('hirer.wallet.payment_code')}
          </Text>
          <Pressable
            onPress={handleCopyCode}
            testID="copy-code-button"
            className="flex-row items-center justify-between rounded-xl bg-rose-400/10 p-4"
          >
            <Text
              className="font-urbanist-bold text-xl text-rose-500"
              style={{ letterSpacing: 2 }}
            >
              {topupData?.code || '---'}
            </Text>
            <View className="flex-row items-center gap-2">
              <Copy color={colors.rose[400]} width={20} height={20} />
              <Text className="text-sm font-medium text-rose-400">
                {t('common.copy')}
              </Text>
            </View>
          </Pressable>
          <Text className="mt-2 text-xs text-text-tertiary">
            {t('hirer.wallet.code_instruction')}
          </Text>
        </MotiView>

        {/* Bank Account Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mb-6 rounded-2xl bg-white p-5"
          style={styles.infoCard}
        >
          <Text className="mb-3 font-semibold text-midnight">
            {t('hirer.wallet.bank_transfer_info')}
          </Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('hirer.wallet.bank_name')}</Text>
              <Text className="font-medium text-midnight">
                {topupData?.accountInfo.bankName || '---'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('hirer.wallet.account_number')}</Text>
              <Text className="font-medium text-midnight">
                {topupData?.accountInfo.accountNumber || '---'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('hirer.wallet.account_name')}</Text>
              <Text className="font-medium text-midnight">
                {topupData?.accountInfo.accountName || '---'}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Bank App Shortcuts */}
        {topupData?.bankDeeplinks && topupData.bankDeeplinks.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            className="mb-6"
          >
            <Text className="mb-3 font-semibold text-midnight">
              {t('hirer.wallet.open_bank_app')}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {topupData.bankDeeplinks.map((bank) => (
                <Pressable
                  key={bank.bankCode}
                  onPress={() => handleOpenBank(bank.deeplink)}
                  testID={`bank-${bank.bankCode}`}
                  className="flex-row items-center gap-2 rounded-full border border-border-light bg-white px-4 py-3"
                >
                  <Text className="font-medium text-midnight">{bank.bankName}</Text>
                  <ExternalLink color={colors.lavender[400]} width={16} height={16} />
                </Pressable>
              ))}
            </View>
          </MotiView>
        )}

        {/* Success Info */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
          className="rounded-2xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-start gap-3">
            <CheckCircle color={colors.teal[400]} width={20} height={20} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-teal-700">
                {t('hirer.wallet.auto_confirm_title')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {t('hirer.wallet.auto_confirm_description')}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

const styles = {
  qrCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};
