/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView } from 'react-native';

import {
    Button,
    colors,
    CompanionHeader,
    FocusAwareStatusBar,
    Text,
    View,
} from '@/components/ui';
import {
    Bank,
    Calendar,
    CheckCircle,
    Clock,
    Info,
    User,
    Warning,
    XCircle,
} from '@/components/ui/icons';
import type { WithdrawalHistoryItem } from '@/lib/api/services/earnings.service';
import { useWithdrawalHistory } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

const WITHDRAWAL_FEE_RATE = 0.01;
const WITHDRAWAL_MIN_FEE = 10000;

const STATUS_CONFIG = {
    pending: {
        icon: Clock,
        color: colors.yellow[500],
        bg: 'bg-yellow-400/20',
        subtitle: 'companion.withdrawals.detail.pending_subtitle',
    },
    processing: {
        icon: Clock,
        color: colors.lavender[900],
        bg: 'bg-lavender-900/20',
        subtitle: 'companion.withdrawals.detail.processing_subtitle',
    },
    completed: {
        icon: CheckCircle,
        color: colors.teal[400],
        bg: 'bg-teal-400/20',
        subtitle: 'companion.withdrawals.detail.completed_subtitle',
    },
    failed: {
        icon: XCircle,
        color: colors.rose[400],
        bg: 'bg-rose-400/20',
        subtitle: 'companion.withdrawals.detail.failed_subtitle',
    },
} as const;

type TimelineStep = {
    label: string;
    date?: string | null;
    status: 'done' | 'current' | 'upcoming';
};

function getTimeline(withdrawal: WithdrawalHistoryItem): TimelineStep[] {
    const steps: TimelineStep[] = [
        {
            label: 'companion.withdrawals.detail.step_requested',
            date: withdrawal.requestedAt,
            status: 'done',
        },
        {
            label: 'companion.withdrawals.detail.step_processing',
            date: withdrawal.status === 'processing' || withdrawal.status === 'completed' ? withdrawal.requestedAt : null,
            status: withdrawal.status === 'processing' ? 'current'
                : withdrawal.status === 'completed' ? 'done'
                    : withdrawal.status === 'failed' ? 'done' : 'upcoming',
        },
        {
            label: withdrawal.status === 'failed'
                ? 'companion.withdrawals.detail.step_failed'
                : 'companion.withdrawals.detail.step_completed',
            date: withdrawal.completedAt,
            status: withdrawal.status === 'completed' || withdrawal.status === 'failed' ? 'done' : 'upcoming',
        },
    ];
    return steps;
}

export default function WithdrawalDetail() {
    const router = useRouter();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data, isLoading } = useWithdrawalHistory();

    const withdrawal = React.useMemo(
        () => data?.withdrawals.find((w) => w.id === id),
        [data, id]
    );

    const handleBack = React.useCallback(() => {
        router.back();
    }, [router]);

    const handleTryAgain = React.useCallback(() => {
        router.push('/companion/earnings/withdraw' as Href);
    }, [router]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-warmwhite">
                <ActivityIndicator size="large" color={colors.lavender[400]} />
            </View>
        );
    }

    if (!withdrawal) {
        return (
            <View className="flex-1 bg-warmwhite">
                <FocusAwareStatusBar />
                <CompanionHeader
                    title={t('companion.withdrawals.detail.header')}
                    onBack={handleBack}
                />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text-secondary">
                        {t('companion.withdrawals.detail.not_found')}
                    </Text>
                </View>
            </View>
        );
    }

    const config = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    const fee = Math.max(
        Math.round(withdrawal.amount * WITHDRAWAL_FEE_RATE),
        WITHDRAWAL_MIN_FEE
    );
    const netAmount = withdrawal.amount - fee;
    const timeline = getTimeline(withdrawal);

    const requestedDate = new Date(withdrawal.requestedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const completedDate = withdrawal.completedAt
        ? new Date(withdrawal.completedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : null;

    return (
        <View className="flex-1 bg-warmwhite">
            <FocusAwareStatusBar />
            <CompanionHeader
                title={t('companion.withdrawals.detail.header')}
                onBack={handleBack}
            />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Status Indicator */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-6 mb-6 items-center"
                >
                    <View className={`size-16 items-center justify-center rounded-full ${config.bg}`}>
                        <StatusIcon color={config.color} width={32} height={32} />
                    </View>
                    <Text className="font-urbanist-bold mt-4 text-2xl text-midnight">
                        {formatVND(withdrawal.amount, { symbolPosition: 'suffix' })}
                    </Text>
                    <Text className="mt-2 text-sm text-text-secondary">
                        {t(config.subtitle)}
                    </Text>
                </MotiView>

                {/* Status Timeline */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 100 }}
                    className="mx-4 mb-4 rounded-2xl bg-white p-5"
                >
                    {timeline.map((step, index) => {
                        const isLast = index === timeline.length - 1;
                        const isFailed = withdrawal.status === 'failed' && isLast;
                        const stepDate = step.date
                            ? new Date(step.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            })
                            : null;

                        return (
                            <View key={step.label} className={`flex-row gap-4 ${isLast ? '' : 'mb-6'}`}>
                                <View className="items-center">
                                    <View
                                        className={`size-8 items-center justify-center rounded-full ${step.status === 'done'
                                            ? isFailed ? 'bg-rose-400' : 'bg-teal-400'
                                            : step.status === 'current'
                                                ? 'border-2 border-lavender-900 bg-lavender-900/20'
                                                : 'border-2 border-gray-300 bg-gray-100'
                                            }`}
                                    >
                                        {step.status === 'done' && (
                                            isFailed
                                                ? <Warning color="#FFFFFF" width={14} height={14} />
                                                : <CheckCircle color="#FFFFFF" width={14} height={14} />
                                        )}
                                    </View>
                                    {!isLast && (
                                        <View className={`mt-1 h-6 w-0.5 ${step.status === 'done' ? 'bg-teal-400' : 'bg-gray-200'}`} />
                                    )}
                                </View>
                                <View className="flex-1 pt-1">
                                    <Text className={`font-semibold ${step.status === 'upcoming' ? 'text-text-tertiary' : 'text-midnight'}`}>
                                        {t(step.label)}
                                    </Text>
                                    {stepDate && (
                                        <Text className="mt-0.5 text-xs text-text-tertiary">
                                            {stepDate}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </MotiView>

                {/* Amount Breakdown */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 200 }}
                    className="mx-4 mb-4 rounded-2xl bg-white p-5"
                >
                    <Text className="font-urbanist-bold mb-4 text-base text-midnight">
                        {t('companion.withdrawals.detail.breakdown')}
                    </Text>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm text-text-secondary">
                            {t('companion.withdrawals.detail.amount')}
                        </Text>
                        <Text className="font-urbanist-bold text-base text-midnight">
                            {formatVND(withdrawal.amount, { symbolPosition: 'suffix' })}
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-sm text-text-secondary">
                            {t('companion.withdrawals.detail.fee')}
                        </Text>
                        <Text className="font-urbanist-bold text-base text-rose-400">
                            -{formatVND(fee, { symbolPosition: 'suffix' })}
                        </Text>
                    </View>
                    <View className="border-t border-border-light pt-4 flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-midnight">
                            {t('companion.withdrawals.detail.net_amount')}
                        </Text>
                        <Text className="font-urbanist-bold text-xl text-teal-400">
                            {formatVND(netAmount, { symbolPosition: 'suffix' })}
                        </Text>
                    </View>
                </MotiView>

                {/* Bank Account Info */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 300 }}
                    className="mx-4 mb-4 rounded-2xl bg-white p-5"
                >
                    <Text className="font-urbanist-bold mb-4 text-base text-midnight">
                        {t('companion.withdrawals.detail.bank_info')}
                    </Text>
                    <View className="flex-row items-center gap-3 mb-4">
                        <Bank color={colors.lavender[900]} width={20} height={20} />
                        <View className="flex-1">
                            <Text className="text-xs text-text-tertiary">
                                {t('companion.withdrawals.detail.bank_name')}
                            </Text>
                            <Text className="text-sm font-semibold text-midnight">
                                {withdrawal.bankAccount.bankName}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-3 mb-4">
                        <Info color={colors.lavender[900]} width={20} height={20} />
                        <View className="flex-1">
                            <Text className="text-xs text-text-tertiary">
                                {t('companion.withdrawals.detail.account_number')}
                            </Text>
                            <Text className="text-sm font-semibold text-midnight">
                                {withdrawal.bankAccount.accountNumber}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-3">
                        <User color={colors.lavender[900]} width={20} height={20} />
                        <View className="flex-1">
                            <Text className="text-xs text-text-tertiary">
                                {t('companion.withdrawals.detail.account_holder')}
                            </Text>
                            <Text className="text-sm font-semibold text-midnight">
                                {withdrawal.bankAccount.accountHolder}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Dates */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 400 }}
                    className="mx-4 mb-4 rounded-2xl bg-white p-5"
                >
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-2">
                            <Calendar color={colors.lavender[900]} width={16} height={16} />
                            <Text className="text-sm text-text-secondary">
                                {t('companion.withdrawals.detail.requested_date')}
                            </Text>
                        </View>
                        <Text className="text-sm font-semibold text-midnight">
                            {requestedDate}
                        </Text>
                    </View>
                    {completedDate && (
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <CheckCircle color={colors.teal[400]} width={16} height={16} />
                                <Text className="text-sm text-text-secondary">
                                    {t('companion.withdrawals.detail.completed_date')}
                                </Text>
                            </View>
                            <Text className="text-sm font-semibold text-teal-400">
                                {completedDate}
                            </Text>
                        </View>
                    )}
                </MotiView>

                {/* Processing Info */}
                {(withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 500 }}
                        className="mx-4 mb-4 rounded-xl bg-teal-400/10 p-4"
                    >
                        <View className="flex-row items-start gap-3">
                            <Info color={colors.teal[400]} width={20} height={20} />
                            <Text className="flex-1 text-sm text-teal-700">
                                {t('companion.withdrawals.detail.processing_info')}
                            </Text>
                        </View>
                    </MotiView>
                )}

                {/* Try Again Button for Failed */}
                {withdrawal.status === 'failed' && (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 500 }}
                        className="mx-4 mb-4"
                    >
                        <Button
                            label={t('companion.withdrawals.detail.try_again')}
                            onPress={handleTryAgain}
                            variant="default"
                            size="lg"
                            className="w-full bg-lavender-900"
                        />
                    </MotiView>
                )}
            </ScrollView>
        </View>
    );
}
