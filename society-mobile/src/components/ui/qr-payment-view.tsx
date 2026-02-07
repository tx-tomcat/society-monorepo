/* eslint-disable max-lines-per-function */
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
} from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from '@/components/ui/utils';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Download,
  ExternalLink,
  QrCode,
} from '@/components/ui/icons';
import { walletService } from '@/lib/api/services/wallet.service';
import { formatVND } from '@/lib/utils';

const POLLING_INTERVAL = 3000;

// Bank code to display name mapping
const BANK_CODE_NAMES: Record<string, string> = {
  TPB: 'TPBank',
  VCB: 'Vietcombank',
  TCB: 'Techcombank',
  MB: 'MB Bank',
  ACB: 'ACB',
  BIDV: 'BIDV',
  ICB: 'VietinBank',
  VPB: 'VPBank',
  VBA: 'Agribank',
  OCB: 'OCB',
  LPB: 'LienVietPostBank',
};

export type BankDeeplink = {
  appId: string;
  name: string;
  logo: string;
  deeplink: string;
};

export type PaymentData = {
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

type QRPaymentViewProps = {
  paymentData: PaymentData;
  headerTitle: string;
  onCompleted: () => void;
  onExpired: () => void;
  onBack: () => void;
  summaryCard?: React.ReactNode;
  successTitle?: string;
  successDescription?: string;
};

export function transformAccountInfo(accountInfo: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}) {
  return {
    bankCode: accountInfo.bankCode,
    bankName:
      BANK_CODE_NAMES[accountInfo.bankCode] || accountInfo.bankCode,
    accountNumber: accountInfo.accountNumber,
    accountName: accountInfo.accountName,
  };
}

export function QRPaymentView({
  paymentData,
  headerTitle,
  onCompleted,
  onExpired,
  onBack,
  summaryCard,
  successTitle,
  successDescription,
}: QRPaymentViewProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = React.useState(0);
  const hasHandledExpiry = React.useRef(false);

  // Countdown timer
  React.useEffect(() => {
    if (!paymentData.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(paymentData.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !hasHandledExpiry.current) {
        hasHandledExpiry.current = true;
        Alert.alert(
          t('payment.expired_title'),
          t('payment.expired_message'),
          [{ text: t('common.ok'), onPress: onExpired }]
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentData.expiresAt, t, onExpired]);

  // Poll for payment status
  React.useEffect(() => {
    if (!paymentData.id) return;

    const isExpired = paymentData.expiresAt
      ? new Date(paymentData.expiresAt).getTime() < Date.now()
      : false;
    if (isExpired) return;

    const pollStatus = async () => {
      try {
        const status = await walletService.getPaymentRequestStatus(
          paymentData.id
        );

        if (status.status === 'COMPLETED') {
          clearInterval(interval);
          onCompleted();
          return;
        }

        if (status.status === 'EXPIRED' || status.status === 'FAILED') {
          if (!hasHandledExpiry.current) {
            hasHandledExpiry.current = true;
            Alert.alert(
              status.status === 'EXPIRED'
                ? t('payment.expired_title')
                : t('payment.failed_title'),
              status.status === 'EXPIRED'
                ? t('payment.expired_message')
                : t('payment.failed_message'),
              [{ text: t('common.ok'), onPress: onExpired }]
            );
          }
          clearInterval(interval);
          return;
        }
      } catch (error) {
        console.error('Failed to poll payment status:', error);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [paymentData.id, paymentData.expiresAt, onCompleted, onExpired, t]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = React.useCallback(() => {
    Alert.alert(
      t('payment.cancel_title'),
      t('payment.cancel_message'),
      [
        { text: t('common.no'), style: 'cancel' },
        { text: t('common.yes'), onPress: onBack },
      ]
    );
  }, [t, onBack]);

  const handleCopyCode = React.useCallback(async () => {
    await Clipboard.setStringAsync(paymentData.code);
    showSuccessMessage(t('payment.code_copied'));
  }, [paymentData.code, t]);

  const handleCopyAmount = React.useCallback(async () => {
    await Clipboard.setStringAsync(paymentData.amount.toString());
    showSuccessMessage(t('payment.amount_copied'));
  }, [paymentData.amount, t]);

  const handleOpenBank = React.useCallback(
    async (deeplink: string) => {
      try {
        const canOpen = await Linking.canOpenURL(deeplink);
        if (canOpen) {
          await Linking.openURL(deeplink);
        } else {
          showInfoMessage(t('payment.bank_app_not_installed'));
        }
      } catch (error) {
        console.error('Failed to open bank app:', error);
        showErrorMessage(t('payment.bank_open_failed'));
      }
    },
    [t]
  );

  const handleDownloadQR = React.useCallback(async () => {
    if (!paymentData.qrUrl) return;

    try {
      const filename = `qr-payment-${paymentData.code}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        paymentData.qrUrl,
        fileUri
      );

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      if (Platform.OS === 'ios') {
        await Share.share({ url: downloadResult.uri });
      } else {
        await Share.share({
          message: `${t('payment.qr_share_message')} ${paymentData.code}`,
          url: downloadResult.uri,
        });
      }
    } catch (error) {
      console.error('Failed to download QR:', error);
      showErrorMessage(t('payment.qr_download_failed'));
    }
  }, [paymentData.qrUrl, paymentData.code, t]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {headerTitle}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Summary Card */}
        {summaryCard}

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
              {t('payment.expires_in')}
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
              {t('payment.scan_qr')}
            </Text>
          </View>

          {paymentData.qrUrl ? (
            <View className="rounded-2xl bg-white p-4" style={styles.qrContainer}>
              <Image
                source={{ uri: paymentData.qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color={colors.lavender[400]} />
            </View>
          )}

          {/* Download QR Button */}
          {paymentData.qrUrl && (
            <Pressable
              onPress={handleDownloadQR}
              testID="download-qr-button"
              className="mt-3 flex-row items-center gap-2 rounded-full bg-lavender-900/10 px-4 py-2"
            >
              <Download color={colors.lavender[400]} width={16} height={16} />
              <Text className="text-sm font-medium text-lavender-500">
                {t('payment.download_qr')}
              </Text>
            </Pressable>
          )}

          {/* Amount Display */}
          <View className="mt-4 w-full rounded-xl bg-lavender-900/10 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-text-secondary">{t('payment.amount_label')}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="font-urbanist-bold text-xl text-midnight">
                  {formatVND(paymentData.amount, { symbolPosition: 'suffix' })}
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
            {t('payment.payment_code')}
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
              {paymentData.code}
            </Text>
            <View className="flex-row items-center gap-2">
              <Copy color={colors.rose[400]} width={20} height={20} />
              <Text className="text-sm font-medium text-rose-400">
                {t('common.copy')}
              </Text>
            </View>
          </Pressable>
          <Text className="mt-2 text-xs text-text-tertiary">
            {t('payment.code_instruction')}
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
            {t('payment.bank_transfer_info')}
          </Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('payment.bank_name')}</Text>
              <Text className="font-medium text-midnight">
                {paymentData.accountInfo.bankName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('payment.account_number')}</Text>
              <Text className="font-medium text-midnight">
                {paymentData.accountInfo.accountNumber}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('payment.account_name')}</Text>
              <Text className="font-medium text-midnight">
                {paymentData.accountInfo.accountName}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Bank App Shortcuts */}
        {paymentData.bankDeeplinks && paymentData.bankDeeplinks.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            className="mb-6"
          >
            <Text className="mb-3 font-semibold text-midnight">
              {t('payment.open_bank_app')}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {paymentData.bankDeeplinks.map((bank) => (
                <Pressable
                  key={bank.appId}
                  onPress={() => handleOpenBank(bank.deeplink)}
                  testID={`bank-${bank.appId}`}
                  className="flex-row items-center gap-2 rounded-full border border-border-light bg-white px-3 py-2"
                >
                  <Image
                    source={{ uri: bank.logo }}
                    className="size-7 rounded-full"
                    resizeMode="cover"
                  />
                  <Text className="font-medium text-midnight">{bank.name}</Text>
                  <ExternalLink color={colors.lavender[400]} width={14} height={14} />
                </Pressable>
              ))}
            </View>
          </MotiView>
        )}

        {/* Auto-confirm Info */}
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
                {successTitle || t('payment.auto_confirm_title')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {successDescription || t('payment.auto_confirm_description')}
              </Text>
            </View>
          </View>
        </MotiView>

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
