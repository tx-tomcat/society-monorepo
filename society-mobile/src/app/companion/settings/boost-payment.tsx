import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { colors, Text, View } from '@/components/ui';
import type { PaymentData } from '@/components/ui/qr-payment-view';
import { QRPaymentView, transformAccountInfo } from '@/components/ui/qr-payment-view';
import { showSuccessMessage } from '@/components/ui/utils';
import { Fire, Star, Zap } from '@/components/ui/icons';
import type { BoostTier } from '@/lib/api/services/companions.service';
import { formatVND } from '@/lib/utils';

const TIER_ICONS: Record<string, React.ComponentType<{ color?: string; width?: number; height?: number }>> = {
  STANDARD: Zap,
  PREMIUM: Fire,
  SUPER: Star,
};

const TIER_COLORS: Record<string, string> = {
  STANDARD: colors.lavender[400],
  PREMIUM: colors.rose[400],
  SUPER: colors.yellow[500],
};

const TIER_BG: Record<string, string> = {
  STANDARD: 'bg-lavender-900/10',
  PREMIUM: 'bg-rose-400/10',
  SUPER: 'bg-yellow-400/10',
};

export default function BoostPaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    paymentRequestId: string;
    boostId: string;
    tier: string;
    amount: string;
    code: string;
    qrUrl: string;
    deeplinks: string;
    accountInfo: string;
    expiresAt: string;
  }>();

  const amount = parseInt(params.amount || '0', 10);
  const tier = (params.tier || 'STANDARD') as BoostTier;

  const paymentData: PaymentData = React.useMemo(() => {
    const rawAccountInfo = params.accountInfo
      ? JSON.parse(params.accountInfo)
      : { bankCode: '', accountNumber: '', accountName: '' };

    return {
      id: params.paymentRequestId || '',
      code: params.code || '',
      amount,
      qrUrl: params.qrUrl || '',
      expiresAt: params.expiresAt || '',
      bankDeeplinks: params.deeplinks ? JSON.parse(params.deeplinks) : [],
      accountInfo: transformAccountInfo(rawAccountInfo),
    };
  }, [params, amount]);

  const handleCompleted = React.useCallback(() => {
    showSuccessMessage(
      t('companion.boost.payment_success'),
      t('companion.boost.payment_success_description')
    );
    router.replace('/companion/settings/boost');
  }, [router, t]);

  const handleExpired = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const IconComponent = TIER_ICONS[tier] || Fire;
  const iconColor = TIER_COLORS[tier] || colors.rose[400];
  const bgClass = TIER_BG[tier] || 'bg-rose-400/10';

  const summaryCard = (
    <View className="mb-6 rounded-2xl bg-white p-4" style={cardStyle}>
      <View className="flex-row items-center gap-3">
        <View className={`size-14 items-center justify-center rounded-2xl ${bgClass}`}>
          <IconComponent color={iconColor} width={28} height={28} />
        </View>
        <View className="flex-1">
          <Text className="font-urbanist-bold text-lg text-midnight">
            {tier} Boost
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('companion.boost.purchase_label')}
          </Text>
        </View>
        <Text className="font-urbanist-bold text-xl text-rose-400">
          {formatVND(amount, { symbolPosition: 'suffix' })}
        </Text>
      </View>
    </View>
  );

  return (
    <QRPaymentView
      paymentData={paymentData}
      headerTitle={t('companion.boost.complete_payment')}
      onCompleted={handleCompleted}
      onExpired={handleExpired}
      onBack={handleBack}
      summaryCard={summaryCard}
      successTitle={t('companion.boost.auto_activate_title')}
      successDescription={t('companion.boost.auto_activate_description')}
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
