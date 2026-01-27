/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';

import {
  Badge,
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Bank,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Info,
  MapPin,
  ShieldCheck,
  Wallet,
} from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import {
  useCompanion,
  useCreateBooking,
  useCreateBookingPayment,
  useWalletBalance,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

type PaymentMethod = {
  id: string;
  type: 'bank' | 'wallet' | 'luxe_wallet';
  name: string;
  last4?: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  isDefault?: boolean;
  balance?: number;
  insufficientFunds?: boolean;
};

// Base payment methods (excluding Luxe Wallet which is added dynamically)
const BASE_PAYMENT_METHODS: Omit<PaymentMethod, 'balance' | 'insufficientFunds'>[] = [
  {
    id: 'bank',
    type: 'bank',
    name: 'Bank Transfer (QR)',
    icon: Bank,
  },
];

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    companionId: string;
    occasionId: string;
    occasionName: string;
    occasionEmoji: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    notes: string;
  }>();
  const { t } = useTranslation();

  // API hooks
  const { data: companionData, isLoading: isLoadingCompanion } = useCompanion(
    params.companionId || ''
  );
  const createBooking = useCreateBooking();
  const createPayment = useCreateBookingPayment();

  // Wallet balance hook
  const { data: walletData } = useWalletBalance();

  // Transform companion data from API Companion type
  const companion = React.useMemo(() => {
    if (!companionData) return null;
    const c = companionData;
    return {
      id: c.id,
      name: c.displayName || '',
      image: c.avatar || getPhotoUrl(c.photos?.[0]) || '',
      hourlyRate: c.hourlyRate || 0,
    };
  }, [companionData]);

  // Calculate pricing (needed before paymentMethods)
  const duration = parseInt(params.duration || '3', 10);
  const subtotal = (companion?.hourlyRate || 0) * duration;
  const serviceFee = Math.round(subtotal * 0.18); // 18% platform fee
  const total = subtotal + serviceFee;

  // Build payment methods list with Luxe Wallet at top if user has balance
  const paymentMethods = React.useMemo(() => {
    const walletBalance = walletData?.balance || 0;
    const methods: PaymentMethod[] = [];

    // Add Luxe Wallet as first option if user has any balance
    if (walletBalance > 0) {
      methods.push({
        id: 'luxe_wallet',
        type: 'luxe_wallet',
        name: t('hirer.payment.luxe_wallet'),
        icon: Wallet,
        balance: walletBalance,
        insufficientFunds: walletBalance < total,
        isDefault: walletBalance >= total, // Default if sufficient funds
      });
    }

    // Add other payment methods
    methods.push(...BASE_PAYMENT_METHODS);

    return methods;
  }, [walletData?.balance, total, t]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  // Set default payment method when data loads
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      const defaultMethod =
        paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
      setSelectedPaymentMethod(defaultMethod.id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  const isProcessing = createBooking.isPending || createPayment.isPending;

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleConfirmPayment = React.useCallback(async () => {
    if (!agreedToTerms || !companion || !params.companionId) return;

    try {
      // Calculate start and end datetime
      const startDatetime = new Date(
        `${params.date}T${params.time}:00`
      ).toISOString();
      const endDate = new Date(`${params.date}T${params.time}:00`);
      endDate.setHours(endDate.getHours() + duration);
      const endDatetime = endDate.toISOString();

      // First create the booking
      const bookingResult = await createBooking.mutateAsync({
        companionId: params.companionId,
        // Only include occasionId if it's a valid non-empty string
        ...(params.occasionId ? { occasionId: params.occasionId } : {}),
        startDatetime,
        endDatetime,
        locationAddress: params.location,
        specialRequests: params.notes,
      });

      // Map payment method to provider
      const providerMap: Record<
        string,
        'bank_transfer' | 'wallet'
      > = {
        luxe_wallet: 'wallet',
        bank: 'bank_transfer',
      };

      // Then create the payment
      await createPayment.mutateAsync({
        bookingId: bookingResult.id,
        provider: providerMap[selectedPaymentMethod] || 'bank_transfer',
      });

      // Navigate to confirmation screen
      router.push({
        pathname: '/hirer/booking/confirmation',
        params: {
          bookingId: bookingResult.id,
          ...params,
        },
      } as unknown as Href);
    } catch (error) {
      // Error handling is done by React Query
      console.error('Payment failed:', error);
    }
  }, [
    router,
    params,
    agreedToTerms,
    companion,
    duration,
    selectedPaymentMethod,
    createBooking,
    createPayment,
  ]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoadingCompanion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar />
        <ActivityIndicator color={colors.rose[400]} size="large" />
        <Text className="mt-4 text-text-secondary">{t('common.loading')}</Text>
      </View>
    );
  }

  // Error state - companion not found
  if (!companion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar />
        <Text className="text-lg text-text-secondary">
          {t('errors.not_found')}
        </Text>
        <Button
          label={t('common.go_back')}
          onPress={handleBack}
          variant="outline"
          className="mt-4"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="size-10 items-center justify-center"
          >
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.payment.title')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.payment.booking_summary')}
          </Text>

          {/* Companion Info */}
          <View className="mb-4 flex-row items-center gap-3 border-b border-border-light pb-4">
            <Image
              source={{ uri: companion.image }}
              className="size-14 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="font-urbanist-semibold text-lg text-midnight">
                {companion.name}
              </Text>
              <Badge
                label={`${params.occasionEmoji || ''} ${params.occasionName || 'Occasion'}`}
                variant="rose"
                size="sm"
              />
            </View>
          </View>

          {/* Booking Details */}
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="size-9 items-center justify-center rounded-lg bg-lavender-400/10">
                <Calendar color={colors.lavender[400]} width={18} height={18} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-tertiary">
                  {t('hirer.payment.date')}
                </Text>
                <Text className="text-sm font-medium text-midnight">
                  {params.date ? formatDate(params.date) : '-'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="size-9 items-center justify-center rounded-lg bg-teal-400/10">
                <Clock color={colors.teal[400]} width={18} height={18} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-tertiary">
                  {t('hirer.payment.time')}
                </Text>
                <Text className="text-sm font-medium text-midnight">
                  {params.time} • {duration} {t('hirer.payment.hours')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="size-9 items-center justify-center rounded-lg bg-rose-400/10">
                <MapPin color={colors.rose[400]} width={18} height={18} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-text-tertiary">
                  {t('hirer.payment.location')}
                </Text>
                <Text
                  className="text-sm font-medium text-midnight"
                  numberOfLines={1}
                >
                  {params.location || '-'}
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Payment Methods */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.payment.payment_method')}
          </Text>

          <View className="gap-3">
            {paymentMethods.map((method) => {
              const isSelected = selectedPaymentMethod === method.id;
              const isDisabled = method.insufficientFunds;
              const MethodIcon = method.icon;
              const isLuxeWallet = method.type === 'luxe_wallet';

              return (
                <Pressable
                  key={method.id}
                  onPress={() => !isDisabled && setSelectedPaymentMethod(method.id)}
                  disabled={isDisabled}
                  className={`flex-row items-center gap-3 rounded-xl border-2 p-4 ${isDisabled
                    ? 'border-transparent bg-neutral-100 opacity-60'
                    : isSelected
                      ? 'border-rose-400 bg-rose-400/5'
                      : 'border-transparent bg-neutral-50'
                    }`}
                >
                  <View
                    className={`size-10 items-center justify-center rounded-lg ${isSelected && !isDisabled
                      ? isLuxeWallet
                        ? 'bg-lavender-400'
                        : 'bg-rose-400'
                      : isLuxeWallet
                        ? 'bg-lavender-400/20'
                        : 'bg-white'
                      }`}
                  >
                    <MethodIcon
                      color={
                        isSelected && !isDisabled
                          ? '#FFFFFF'
                          : isLuxeWallet
                            ? colors.lavender[400]
                            : colors.midnight.DEFAULT
                      }
                      width={20}
                      height={20}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-medium ${isDisabled ? 'text-text-tertiary' : 'text-midnight'}`}
                      >
                        {method.name}
                      </Text>
                      {isLuxeWallet && method.isDefault && !isDisabled && (
                        <Badge
                          label={t('hirer.payment.recommended')}
                          variant="lavender"
                          size="sm"
                        />
                      )}
                    </View>
                    {isLuxeWallet && method.balance !== undefined && (
                      <Text
                        className={`text-sm ${isDisabled ? 'text-danger-400' : 'text-text-secondary'}`}
                      >
                        {isDisabled
                          ? t('hirer.payment.insufficient_balance', {
                            balance: formatVND(method.balance, { symbolPosition: 'suffix' }),
                          })
                          : t('hirer.payment.wallet_balance', {
                            balance: formatVND(method.balance, { symbolPosition: 'suffix' }),
                          })}
                      </Text>
                    )}
                    {method.last4 && (
                      <Text className="text-sm text-text-tertiary">
                        •••• {method.last4}
                      </Text>
                    )}
                  </View>
                  {!isDisabled && (
                    <View
                      className={`size-6 items-center justify-center rounded-full border-2 ${isSelected
                        ? isLuxeWallet
                          ? 'border-lavender-400 bg-lavender-400'
                          : 'border-rose-400 bg-rose-400'
                        : 'border-border bg-white'
                        }`}
                    >
                      {isSelected && (
                        <CheckCircle color="#FFFFFF" width={14} height={14} />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3">
            <CreditCard color={colors.text.tertiary} width={18} height={18} />
            <Text className="text-sm font-medium text-text-secondary">
              {t('hirer.payment.add_new_method')}
            </Text>
          </Pressable>
        </MotiView>

        {/* Price Breakdown */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.payment.price_breakdown')}
          </Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-text-secondary">
                {formatVND(companion.hourlyRate)} × {duration}{' '}
                {t('hirer.payment.hours')}
              </Text>
              <Text className="font-medium text-midnight">
                {formatVND(subtotal)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Text className="text-text-secondary">
                  {t('hirer.payment.service_fee')}
                </Text>
                <Info color={colors.text.tertiary} width={14} height={14} />
              </View>
              <Text className="font-medium text-midnight">
                {formatVND(serviceFee)}
              </Text>
            </View>
            <View className="border-t border-border-light pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-urbanist-semibold text-lg text-midnight">
                  {t('hirer.payment.total')}
                </Text>
                <Text className="font-urbanist-bold text-2xl text-rose-400">
                  {formatVND(total)}
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Security Notice */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mx-4 mt-4 rounded-2xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-center gap-3">
            <ShieldCheck color={colors.teal[400]} width={24} height={24} />
            <View className="flex-1">
              <Text className="font-urbanist-semibold text-sm text-teal-700">
                {t('hirer.payment.secure_payment')}
              </Text>
              <Text className="text-xs text-text-secondary">
                {t('hirer.payment.secure_payment_desc')}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Terms Agreement */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 250 }}
          className="mx-4 mt-4"
        >
          <Pressable
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            className="flex-row items-start gap-3"
          >
            <View
              className={`mt-1 size-5 items-center justify-center rounded border-2 ${agreedToTerms
                ? 'border-rose-400 bg-rose-400'
                : 'border-border bg-white'
                }`}
            >
              {agreedToTerms && (
                <CheckCircle color="#FFFFFF" width={12} height={12} />
              )}
            </View>
            <Text className="flex-1 text-sm leading-relaxed text-text-secondary">
              {t('hirer.payment.terms_agreement')}
            </Text>
          </Pressable>
        </MotiView>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-text-secondary">
              {t('hirer.payment.total_to_pay')}
            </Text>
            <Text className="font-urbanist-bold text-xl text-midnight">
              {formatVND(total)}
            </Text>
          </View>
          <Button
            label={
              isProcessing
                ? t('hirer.payment.processing')
                : t('hirer.payment.confirm_pay')
            }
            onPress={handleConfirmPayment}
            variant="default"
            size="lg"
            disabled={!agreedToTerms || isProcessing || !selectedPaymentMethod}
            loading={isProcessing}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
