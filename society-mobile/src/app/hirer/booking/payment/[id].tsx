/* eslint-disable max-lines-per-function */
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Button,
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
  ShieldCheck,
} from '@/components/ui/icons';
import { walletService } from '@/lib/api/services/wallet.service';
import { useBooking, useCreateBookingPaymentRequest } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

const POLLING_INTERVAL = 3000; // 3 seconds

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

type BankDeeplink = {
  appId: string;
  name: string;
  logo: string;
  deeplink: string;
};

type PaymentData = {
  id: string;
  code: string;
  amount: number;
  bookingId: string;
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

export default function BookingPaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const [paymentData, setPaymentData] = React.useState<PaymentData | null>(
    null
  );
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const hasInitialized = React.useRef(false);
  const hasHandledExpiry = React.useRef(false);

  const { data: bookingData, isLoading: isBookingLoading } = useBooking(
    bookingId || ''
  );
  const createPaymentMutation = useCreateBookingPaymentRequest();

  // Initialize payment request on mount
  React.useEffect(() => {
    if (!bookingId || hasInitialized.current) return;
    hasInitialized.current = true;

    const initializePayment = async () => {
      try {
        const result = await createPaymentMutation.mutateAsync(bookingId);

        // API now returns deeplinks as array with logo info
        const transformedData: PaymentData = {
          id: result.id,
          code: result.code,
          amount: result.amount,
          bookingId: result.bookingId,
          qrUrl: result.qrUrl,
          expiresAt: result.expiresAt,
          bankDeeplinks: result.deeplinks,
          accountInfo: {
            bankCode: result.accountInfo.bankCode,
            bankName:
              BANK_CODE_NAMES[result.accountInfo.bankCode] ||
              result.accountInfo.bankCode,
            accountNumber: result.accountInfo.accountNumber,
            accountName: result.accountInfo.accountName,
          },
        };

        setPaymentData(transformedData);
      } catch (error) {
        console.error('Failed to create booking payment:', error);
        showErrorMessage(t('hirer.booking_payment.create_failed'));
        router.back();
      } finally {
        setIsInitializing(false);
      }
    };

    initializePayment();
  }, [bookingId, createPaymentMutation, router, t]);

  // Poll for payment status
  React.useEffect(() => {
    if (!paymentData?.id) return;

    // Check if payment is still valid (not expired)
    const isExpired = paymentData.expiresAt
      ? new Date(paymentData.expiresAt).getTime() < Date.now()
      : false;
    if (isExpired) return;

    const pollStatus = async () => {
      try {
        const status = await walletService.getPaymentRequestStatus(paymentData.id);

        if (status.status === 'COMPLETED') {
          showSuccessMessage(
            t('hirer.booking_payment.payment_success'),
            t('hirer.booking_payment.payment_success_description')
          );
          // Navigate to booking detail after successful payment
          router.replace(`/hirer/orders/${bookingId}`);
          clearInterval(interval)
          return;
        }

        if (status.status === 'EXPIRED' || status.status === 'FAILED') {
          if (!hasHandledExpiry.current) {
            hasHandledExpiry.current = true;
            Alert.alert(
              t('hirer.booking_payment.payment_failed_title'),
              status.status === 'EXPIRED'
                ? t('hirer.booking_payment.expired_message')
                : t('hirer.booking_payment.payment_failed_message'),
              [{ text: t('common.ok'), onPress: () => router.back() }]
            );
          }
          clearInterval(interval);
          return;
        }
      } catch (error) {
        console.error('Failed to poll payment status:', error);
      }
    };

    // Poll immediately on mount, then every POLLING_INTERVAL
    pollStatus();
    const interval = setInterval(pollStatus, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [paymentData?.id, paymentData?.expiresAt, bookingId, router, t]);

  // Countdown timer
  React.useEffect(() => {
    if (!paymentData?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(paymentData.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        if (!hasHandledExpiry.current) {
          hasHandledExpiry.current = true;
          Alert.alert(
            t('hirer.booking_payment.expired_title'),
            t('hirer.booking_payment.expired_message'),
            [{ text: t('common.ok'), onPress: () => router.back() }]
          );
        }
        return;
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentData?.expiresAt, t, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = React.useCallback(() => {
    Alert.alert(
      t('hirer.booking_payment.cancel_title'),
      t('hirer.booking_payment.cancel_message'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: () => router.back(),
        },
      ]
    );
  }, [router, t]);

  const handleCopyCode = React.useCallback(async () => {
    if (!paymentData?.code) return;
    await Clipboard.setStringAsync(paymentData.code);
    showSuccessMessage(t('hirer.wallet.code_copied'));
  }, [paymentData?.code, t]);

  const handleCopyAmount = React.useCallback(async () => {
    if (!paymentData?.amount) return;
    await Clipboard.setStringAsync(paymentData.amount.toString());
    showSuccessMessage(t('hirer.wallet.amount_copied'));
  }, [paymentData?.amount, t]);

  const handleOpenBank = React.useCallback(
    async (deeplink: string) => {
      try {
        const canOpen = await Linking.canOpenURL(deeplink);
        if (canOpen) {
          await Linking.openURL(deeplink);
        } else {
          showInfoMessage(t('hirer.wallet.bank_app_not_installed'));
        }
      } catch (error) {
        console.error('Failed to open bank app:', error);
        showErrorMessage(t('hirer.wallet.bank_open_failed'));
      }
    },
    [t]
  );

  const handleDownloadQR = React.useCallback(async () => {
    if (!paymentData?.qrUrl) return;

    try {
      // Download QR image to cache
      const filename = `qr-payment-${paymentData.code}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        paymentData.qrUrl,
        fileUri
      );

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Share the image (allows save to photos or share)
      if (Platform.OS === 'ios') {
        await Share.share({
          url: downloadResult.uri,
        });
      } else {
        await Share.share({
          message: `${t('hirer.wallet.qr_share_message')} ${paymentData.code}`,
          url: downloadResult.uri,
        });
      }
    } catch (error) {
      console.error('Failed to download QR:', error);
      showErrorMessage(t('hirer.wallet.qr_download_failed'));
    }
  }, [paymentData?.qrUrl, paymentData?.code, t]);

  // Loading state
  if (isInitializing || isBookingLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.rose[400]} />
        <Text className="mt-4 text-text-secondary">
          {t('hirer.booking_payment.initializing')}
        </Text>
      </View>
    );
  }

  if (!paymentData || !bookingData) {
    return (
      <View className="flex-1 bg-warmwhite">
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
            <Pressable onPress={() => router.back()}>
              <ArrowLeft
                color={colors.midnight.DEFAULT}
                width={24}
                height={24}
              />
            </Pressable>
            <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
              {t('hirer.booking_payment.header')}
            </Text>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-text-secondary">
            {t('hirer.booking_payment.error')}
          </Text>
          <Button
            label={t('common.go_back')}
            onPress={() => router.back()}
            variant="outline"
            size="default"
            className="mt-4"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.booking_payment.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mb-6 rounded-2xl bg-white p-4"
          style={styles.card}
        >
          <View className="flex-row items-center gap-3">
            <Image
              source={{ uri: bookingData.companion?.avatar || '' }}
              className="size-14 rounded-xl"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-urbanist-bold text-lg text-midnight">
                  {bookingData.companion?.displayName}
                </Text>
                {bookingData.companion?.isVerified && (
                  <ShieldCheck
                    color={colors.teal[400]}
                    width={16}
                    height={16}
                  />
                )}
              </View>
              <Text className="text-sm text-text-secondary">
                {bookingData.occasion?.name || t('common.booking')}
              </Text>
            </View>
          </View>
          <View className="mt-3 border-t border-border-light pt-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('hirer.booking_payment.total_amount')}
              </Text>
              <Text className="font-urbanist-bold text-xl text-rose-400">
                {formatVND(bookingData.totalPrice, {
                  symbolPosition: 'suffix',
                })}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Timer Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
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
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6 items-center rounded-3xl bg-white p-6"
          style={styles.qrCard}
        >
          <View className="mb-4 flex-row items-center gap-2">
            <QrCode color={colors.lavender[400]} width={20} height={20} />
            <Text className="font-semibold text-midnight">
              {t('hirer.wallet.scan_qr')}
            </Text>
          </View>

          {paymentData.qrUrl ? (
            <View
              className="rounded-2xl bg-white p-4"
              style={styles.qrContainer}
            >
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
                {t('hirer.wallet.download_qr')}
              </Text>
            </Pressable>
          )}

          {/* Amount Display */}
          <View className="mt-4 w-full rounded-xl bg-lavender-900/10 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-text-secondary">
                {t('hirer.wallet.amount_label')}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="font-urbanist-bold text-xl text-midnight">
                  {formatVND(paymentData.amount, { symbolPosition: 'suffix' })}
                </Text>
                <Pressable
                  onPress={handleCopyAmount}
                  testID="copy-amount-button"
                >
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
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mb-6 rounded-2xl bg-white p-5"
          style={styles.card}
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
            {t('hirer.wallet.code_instruction')}
          </Text>
        </MotiView>

        {/* Bank Account Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mb-6 rounded-2xl bg-white p-5"
          style={styles.card}
        >
          <Text className="mb-3 font-semibold text-midnight">
            {t('hirer.wallet.bank_transfer_info')}
          </Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('hirer.wallet.bank_name')}
              </Text>
              <Text className="font-medium text-midnight">
                {paymentData.accountInfo.bankName}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('hirer.wallet.account_number')}
              </Text>
              <Text className="font-medium text-midnight">
                {paymentData.accountInfo.accountNumber}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('hirer.wallet.account_name')}
              </Text>
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
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            className="mb-6"
          >
            <Text className="mb-3 font-semibold text-midnight">
              {t('hirer.wallet.open_bank_app')}
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
                  <ExternalLink
                    color={colors.lavender[400]}
                    width={14}
                    height={14}
                  />
                </Pressable>
              ))}
            </View>
          </MotiView>
        )}

        {/* Success Info */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 600 }}
          className="rounded-2xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-start gap-3">
            <CheckCircle color={colors.teal[400]} width={20} height={20} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-teal-700">
                {t('hirer.wallet.auto_confirm_title')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {t('hirer.booking_payment.auto_confirm_description')}
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
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
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
};
