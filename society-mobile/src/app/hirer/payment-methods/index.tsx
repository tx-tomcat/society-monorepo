/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView } from 'react-native';

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
  CreditCard,
  Trash2,
} from '@/components/ui/icons';
import { useSafeBack } from '@/lib/hooks';

type PaymentMethod = {
  id: string;
  type: 'visa' | 'mastercard' | 'momo' | 'vnpay' | 'zalopay';
  lastFour?: string;
  name: string;
  isDefault: boolean;
  expiryDate?: string;
};

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'visa',
    lastFour: '4242',
    name: 'Visa ending in 4242',
    isDefault: true,
    expiryDate: '12/26',
  },
  {
    id: '2',
    type: 'momo',
    name: 'MoMo Wallet',
    isDefault: false,
  },
  {
    id: '3',
    type: 'zalopay',
    name: 'ZaloPay',
    isDefault: false,
  },
];

const PAYMENT_TYPE_CONFIG = {
  visa: {
    label: 'Visa',
    bgColor: 'bg-blue-50',
    textColor: colors.neutral[700],
  },
  mastercard: {
    label: 'Mastercard',
    bgColor: 'bg-orange-50',
    textColor: colors.coral[600],
  },
  momo: {
    label: 'MoMo',
    bgColor: 'bg-pink-50',
    textColor: colors.rose[500],
  },
  vnpay: {
    label: 'VNPay',
    bgColor: 'bg-blue-50',
    textColor: colors.neutral[700],
  },
  zalopay: {
    label: 'ZaloPay',
    bgColor: 'bg-blue-50',
    textColor: colors.neutral[700],
  },
};

function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
}: {
  method: PaymentMethod;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const config = PAYMENT_TYPE_CONFIG[method.type];

  return (
    <Pressable
      onPress={onSetDefault}
      className="mb-3 flex-row items-center gap-4 rounded-2xl bg-white p-4"
    >
      <View
        className={`size-12 items-center justify-center rounded-xl ${config.bgColor}`}
      >
        <CreditCard color={config.textColor} width={24} height={24} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-urbanist-semibold text-base text-midnight">
            {method.name}
          </Text>
          {method.isDefault && (
            <View className="rounded-full bg-rose-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-rose-500">
                {t('hirer.payment_methods.default')}
              </Text>
            </View>
          )}
        </View>
        {method.expiryDate && (
          <Text className="mt-0.5 text-sm text-text-tertiary">
            {t('hirer.payment_methods.expires')} {method.expiryDate}
          </Text>
        )}
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="size-10 items-center justify-center rounded-lg bg-danger-50"
        hitSlop={8}
      >
        <Trash2 color={colors.danger[400]} width={18} height={18} />
      </Pressable>
    </Pressable>
  );
}

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/(app)/account');
  const [methods, setMethods] =
    React.useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);

  const handleSetDefault = React.useCallback((id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
  }, []);

  const handleDelete = React.useCallback(
    (method: PaymentMethod) => {
      if (method.isDefault) {
        Alert.alert(
          t('hirer.payment_methods.cannot_delete_default_title'),
          t('hirer.payment_methods.cannot_delete_default_message')
        );
        return;
      }

      Alert.alert(
        t('hirer.payment_methods.delete_title'),
        t('hirer.payment_methods.delete_message', { name: method.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: () => {
              setMethods((prev) => prev.filter((m) => m.id !== method.id));
            },
          },
        ]
      );
    },
    [t]
  );

  const handleAddMethod = React.useCallback(() => {
    Alert.alert(t('common.coming_soon'));
  }, [t]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={goBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.payment_methods.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Payment Methods List */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
            {t('hirer.payment_methods.saved_methods')}
          </Text>

          {methods.map((method, index) => (
            <MotiView
              key={method.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <PaymentMethodCard
                method={method}
                onSetDefault={() => handleSetDefault(method.id)}
                onDelete={() => handleDelete(method)}
              />
            </MotiView>
          ))}
        </MotiView>

        {/* Add New Method */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mt-4"
        >
          <Pressable
            onPress={handleAddMethod}
            className="flex-row items-center gap-4 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/50 p-4"
          >
            <View className="size-12 items-center justify-center rounded-xl bg-rose-100">
              <CreditCard color={colors.rose[400]} width={24} height={24} />
            </View>
            <View className="flex-1">
              <Text className="font-urbanist-semibold text-base text-rose-500">
                {t('hirer.payment_methods.add_new')}
              </Text>
              <Text className="text-sm text-text-tertiary">
                {t('hirer.payment_methods.add_new_subtitle')}
              </Text>
            </View>
            <ArrowRight color={colors.rose[400]} width={20} height={20} />
          </Pressable>
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mt-6 rounded-2xl bg-lavender-100/50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-lavender-700">
            {t('hirer.payment_methods.security_title')}
          </Text>
          <Text className="text-sm leading-5 text-text-secondary">
            {t('hirer.payment_methods.security_message')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
