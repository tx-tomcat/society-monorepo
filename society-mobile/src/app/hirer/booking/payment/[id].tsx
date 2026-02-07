/* eslint-disable max-lines-per-function */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable } from 'react-native';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import type { PaymentData } from '@/components/ui/qr-payment-view';
import { QRPaymentView, transformAccountInfo } from '@/components/ui/qr-payment-view';
import { showErrorMessage, showSuccessMessage } from '@/components/ui/utils';
import { ArrowLeft, ShieldCheck } from '@/components/ui/icons';
import { useBooking, useCreateBookingPaymentRequest } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

export default function BookingPaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const [paymentData, setPaymentData] = React.useState<PaymentData | null>(
    null
  );
  const [isInitializing, setIsInitializing] = React.useState(true);
  const hasInitialized = React.useRef(false);

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

        const transformedData: PaymentData = {
          id: result.id,
          code: result.code,
          amount: result.amount,
          qrUrl: result.qrUrl,
          expiresAt: result.expiresAt,
          bankDeeplinks: result.deeplinks,
          accountInfo: transformAccountInfo(result.accountInfo),
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

  const handleCompleted = React.useCallback(() => {
    showSuccessMessage(
      t('hirer.booking_payment.payment_success'),
      t('hirer.booking_payment.payment_success_description')
    );
    router.replace(`/hirer/orders/${bookingId}`);
  }, [router, bookingId, t]);

  const handleExpired = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

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

  const summaryCard = (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      className="mb-6 rounded-2xl bg-white p-4"
      style={cardStyle}
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
  );

  return (
    <QRPaymentView
      paymentData={paymentData}
      headerTitle={t('hirer.booking_payment.header')}
      onCompleted={handleCompleted}
      onExpired={handleExpired}
      onBack={handleBack}
      summaryCard={summaryCard}
      successDescription={t('hirer.booking_payment.auto_confirm_description')}
    />
  );
}

const cardStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};
