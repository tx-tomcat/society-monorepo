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
  StyleSheet,
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
import {
  useCompanion,
  useCreateBooking,
  useCreateBookingPayment,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

type PaymentMethod = {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  last4?: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  isDefault?: boolean;
};

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
  },
  {
    id: 'bank',
    type: 'bank',
    name: 'Bank Transfer',
    icon: Bank,
  },
  {
    id: 'momo',
    type: 'wallet',
    name: 'MoMo',
    icon: Wallet,
  },
  {
    id: 'zalopay',
    type: 'wallet',
    name: 'ZaloPay',
    icon: Wallet,
  },
];

const PAYMENT_ICONS: Record<
  string,
  React.ComponentType<{ color: string; width: number; height: number }>
> = {
  card: CreditCard,
  bank: Bank,
  wallet: Wallet,
};

const OCCASION_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  family: 'Family Event',
  business: 'Business',
  tet: 'Tết Celebration',
  casual: 'Casual Outing',
  party: 'Party',
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    companionId: string;
    occasion: string;
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

  // Transform companion data from API Companion type
  const companion = React.useMemo(() => {
    if (!companionData) return null;
    const c = companionData;
    return {
      id: c.id,
      name: c.user?.fullName || '',
      image: c.user?.avatarUrl || c.photos?.[0]?.url || '',
      hourlyRate: c.hourlyRate || 0,
    };
  }, [companionData]);

  // Use default payment methods since we don't have a payment methods API
  const paymentMethods = DEFAULT_PAYMENT_METHODS;

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

  const duration = parseInt(params.duration || '3', 10);
  const subtotal = (companion?.hourlyRate || 0) * duration;
  const serviceFee = Math.round(subtotal * 0.18); // 18% platform fee
  const total = subtotal + serviceFee;

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

      // Map occasion to ServiceType
      const occasionMap: Record<
        string,
        | 'FAMILY_INTRODUCTION'
        | 'WEDDING_ATTENDANCE'
        | 'TET_COMPANIONSHIP'
        | 'BUSINESS_EVENT'
        | 'CASUAL_OUTING'
        | 'CLASS_REUNION'
        | 'OTHER'
      > = {
        wedding: 'WEDDING_ATTENDANCE',
        family: 'FAMILY_INTRODUCTION',
        business: 'BUSINESS_EVENT',
        tet: 'TET_COMPANIONSHIP',
        casual: 'CASUAL_OUTING',
        party: 'OTHER',
      };

      // First create the booking
      const bookingResult = await createBooking.mutateAsync({
        companionId: params.companionId,
        occasionType:
          occasionMap[params.occasion || 'casual'] || 'CASUAL_OUTING',
        startDatetime,
        endDatetime,
        locationAddress: params.location,
        specialRequests: params.notes,
      });

      // Map payment method to provider
      const providerMap: Record<
        string,
        'vnpay' | 'momo' | 'stripe' | 'bank_transfer'
      > = {
        card: 'stripe',
        bank: 'bank_transfer',
        momo: 'momo',
        zalopay: 'vnpay',
      };

      // Then create the payment
      await createPayment.mutateAsync({
        bookingId: bookingResult.id,
        provider: providerMap[selectedPaymentMethod] || 'stripe',
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
          <Text
            style={styles.headerTitle}
            className="flex-1 text-xl text-midnight"
          >
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
          <Text
            style={styles.sectionTitle}
            className="mb-4 text-base text-midnight"
          >
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
              <Text
                style={styles.companionName}
                className="text-lg text-midnight"
              >
                {companion.name}
              </Text>
              <Badge
                label={OCCASION_LABELS[params.occasion || 'casual']}
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
          <Text
            style={styles.sectionTitle}
            className="mb-4 text-base text-midnight"
          >
            {t('hirer.payment.payment_method')}
          </Text>

          <View className="gap-3">
            {paymentMethods.map((method) => {
              const isSelected = selectedPaymentMethod === method.id;
              const MethodIcon = method.icon;
              return (
                <Pressable
                  key={method.id}
                  onPress={() => setSelectedPaymentMethod(method.id)}
                  className={`flex-row items-center gap-3 rounded-xl border-2 p-4 ${
                    isSelected
                      ? 'border-rose-400 bg-rose-400/5'
                      : 'border-transparent bg-neutral-50'
                  }`}
                >
                  <View
                    className={`size-10 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-rose-400' : 'bg-white'
                    }`}
                  >
                    <MethodIcon
                      color={isSelected ? '#FFFFFF' : colors.midnight.DEFAULT}
                      width={20}
                      height={20}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-midnight">
                      {method.name}
                    </Text>
                    {method.last4 && (
                      <Text className="text-sm text-text-tertiary">
                        •••• {method.last4}
                      </Text>
                    )}
                  </View>
                  {method.isDefault && (
                    <Badge
                      label={t('hirer.payment.default')}
                      variant="teal"
                      size="sm"
                    />
                  )}
                  <View
                    className={`size-6 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-rose-400 bg-rose-400'
                        : 'border-border bg-white'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle color="#FFFFFF" width={14} height={14} />
                    )}
                  </View>
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
          <Text
            style={styles.sectionTitle}
            className="mb-4 text-base text-midnight"
          >
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
                <Text
                  style={styles.totalLabel}
                  className="text-lg text-midnight"
                >
                  {t('hirer.payment.total')}
                </Text>
                <Text
                  style={styles.totalAmount}
                  className="text-2xl text-rose-400"
                >
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
              <Text
                style={styles.securityTitle}
                className="text-sm text-teal-700"
              >
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
              className={`mt-1 size-5 items-center justify-center rounded border-2 ${
                agreedToTerms
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
            <Text style={styles.bottomTotal} className="text-xl text-midnight">
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

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  sectionTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  companionName: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  totalLabel: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  totalAmount: {
    fontFamily: 'Urbanist_700Bold',
  },
  securityTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  bottomTotal: {
    fontFamily: 'Urbanist_700Bold',
  },
});
