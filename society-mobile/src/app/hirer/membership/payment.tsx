/* eslint-disable max-lines-per-function */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { colors, Text, View } from '@/components/ui';
import type { PaymentData } from '@/components/ui/qr-payment-view';
import {
  QRPaymentView,
  transformAccountInfo,
} from '@/components/ui/qr-payment-view';
import { showSuccessMessage } from '@/components/ui/utils';
import { Crown, Star, Zap } from '@/components/ui/icons';
import type { MembershipTier } from '@/lib/api/services/membership.service';
import { formatVND } from '@/lib/utils';

// Tier-specific icon and color mappings for the summary card
const TIER_ICONS: Record<
  string,
  React.ComponentType<{ color?: string; width?: number; height?: number }>
> = {
  SILVER: Zap,
  GOLD: Star,
  PLATINUM: Crown,
};

const TIER_COLORS: Record<string, string> = {
  SILVER: '#94A3B8',
  GOLD: '#F59E0B',
  PLATINUM: colors.rose[400],
};

const TIER_BG: Record<string, string> = {
  SILVER: 'bg-slate-100',
  GOLD: 'bg-amber-50',
  PLATINUM: 'bg-rose-50',
};

const TIER_PRICE_COLOR: Record<string, string> = {
  SILVER: 'text-slate-500',
  GOLD: 'text-amber-500',
  PLATINUM: 'text-rose-400',
};

export default function MembershipPaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    paymentRequestId: string;
    membershipId: string;
    tier: string;
    amount: string;
    code: string;
    qrUrl: string;
    deeplinks: string;
    accountInfo: string;
    expiresAt: string;
  }>();

  const amount = parseInt(params.amount || '0', 10);
  const tier = (params.tier || 'GOLD') as MembershipTier;

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
      t('hirer.membership.purchase_success'),
      t('hirer.membership.purchase_success_description')
    );
    // Go back to membership screen (which will refetch and show active membership)
    router.back();
  }, [router, t]);

  const handleExpired = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const IconComponent = TIER_ICONS[tier] || Crown;
  const iconColor = TIER_COLORS[tier] || colors.rose[400];
  const bgClass = TIER_BG[tier] || 'bg-rose-50';
  const priceColorClass = TIER_PRICE_COLOR[tier] || 'text-rose-400';

  const summaryCard = (
    <View className="mb-6 rounded-2xl bg-white p-4" style={cardStyle}>
      <View className="flex-row items-center gap-3">
        <View
          className={`size-14 items-center justify-center rounded-2xl ${bgClass}`}
        >
          <IconComponent color={iconColor} width={28} height={28} />
        </View>
        <View className="flex-1">
          <Text className="font-urbanist-bold text-lg text-midnight">
            {tier} {t('hirer.membership.membership')}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('hirer.membership.purchasing')}
          </Text>
        </View>
        <Text className={`font-urbanist-bold text-xl ${priceColorClass}`}>
          {formatVND(amount, { symbolPosition: 'suffix' })}
        </Text>
      </View>
    </View>
  );

  return (
    <QRPaymentView
      paymentData={paymentData}
      headerTitle={t('hirer.membership.payment_title')}
      onCompleted={handleCompleted}
      onExpired={handleExpired}
      onBack={handleBack}
      summaryCard={summaryCard}
      successTitle={t('hirer.membership.auto_activate_title')}
      successDescription={t('hirer.membership.auto_activate_description')}
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
