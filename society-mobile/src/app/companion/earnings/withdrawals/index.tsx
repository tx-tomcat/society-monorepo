/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
} from 'react-native';

import {
    Badge,
    colors,
    CompanionHeader,
    FocusAwareStatusBar,
    Text,
    View,
} from '@/components/ui';
import {
    ArrowRight,
    Bank,
    Calendar,
    CheckCircle,
    Clock,
    Withdraw,
} from '@/components/ui/icons';
import type { WithdrawalHistoryItem } from '@/lib/api/services/earnings.service';
import { useWithdrawalHistory } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

const STATUS_CONFIG = {
    pending: {
        color: colors.yellow[500],
        bg: 'bg-yellow-400/10',
        variant: 'default' as const,
    },
    processing: {
        color: colors.lavender[900],
        bg: 'bg-lavender-900/10',
        variant: 'lavender' as const,
    },
    completed: {
        color: colors.teal[400],
        bg: 'bg-teal-400/10',
        variant: 'teal' as const,
    },
    failed: {
        color: colors.rose[400],
        bg: 'bg-rose-400/10',
        variant: 'default' as const,
    },
} as const;

const WithdrawalCard = React.memo(function WithdrawalCard({
    item,
    index,
    onPress,
}: {
    item: WithdrawalHistoryItem;
    index: number;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const dateStr = new Date(item.requestedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: index * 80 }}
        >
            <Pressable
                onPress={onPress}
                className="mx-4 mb-3 flex-row items-center gap-4 rounded-2xl bg-white p-4"
            >
                <View className={`size-12 items-center justify-center rounded-full ${config.bg}`}>
                    <Withdraw color={config.color} width={22} height={22} />
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Text className="font-urbanist-bold text-lg text-midnight">
                            {formatVND(item.amount, { symbolPosition: 'suffix' })}
                        </Text>
                        <Badge
                            label={t(`companion.withdrawals.status.${item.status}`)}
                            variant={config.variant}
                            size="sm"
                        />
                    </View>
                    <View className="mt-2 flex-row items-center gap-1.5">
                        <Bank color={colors.text.tertiary} width={14} height={14} />
                        <Text className="text-sm text-text-secondary" numberOfLines={1}>
                            {item.bankAccount.bankName} {'\u2022'} {item.bankAccount.accountNumber}
                        </Text>
                    </View>
                    <View className="mt-1 flex-row items-center gap-1.5">
                        <Calendar color={colors.text.tertiary} width={12} height={12} />
                        <Text className="text-xs text-text-tertiary">{dateStr}</Text>
                    </View>
                </View>
                <ArrowRight color={colors.text.tertiary} width={16} height={16} />
            </Pressable>
        </MotiView>
    );
});

export default function WithdrawalHistory() {
    const router = useRouter();
    const { t } = useTranslation();

    const {
        data,
        isLoading,
        refetch,
        isRefetching,
    } = useWithdrawalHistory();

    const withdrawals = data?.withdrawals ?? [];

    const totalWithdrawn = React.useMemo(
        () => withdrawals
            .filter((w) => w.status === 'completed')
            .reduce((sum, w) => sum + w.amount, 0),
        [withdrawals]
    );

    const pendingAmount = React.useMemo(
        () => withdrawals
            .filter((w) => w.status === 'pending' || w.status === 'processing')
            .reduce((sum, w) => sum + w.amount, 0),
        [withdrawals]
    );

    const handleBack = React.useCallback(() => {
        router.back();
    }, [router]);

    const handleRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const handleWithdrawalPress = React.useCallback(
        (id: string) => {
            router.push(`/companion/earnings/withdrawals/${id}` as Href);
        },
        [router]
    );

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-warmwhite">
                <ActivityIndicator size="large" color={colors.lavender[400]} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-warmwhite">
            <FocusAwareStatusBar />
            <CompanionHeader
                title={t('companion.withdrawals.header')}
                onBack={handleBack}
            />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.lavender[400]}
                    />
                }
            >
                {/* Summary Stats */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    className="mx-4 mt-4 mb-4 flex-row gap-3"
                >
                    <View className="flex-1 rounded-2xl bg-white p-4">
                        <View className="mb-2 size-10 items-center justify-center rounded-full bg-teal-400/10">
                            <CheckCircle color={colors.teal[400]} width={20} height={20} />
                        </View>
                        <Text className="text-xs text-text-tertiary">
                            {t('companion.withdrawals.total_withdrawn')}
                        </Text>
                        <Text className="font-urbanist-bold mt-1 text-lg text-midnight">
                            {formatVND(totalWithdrawn, { symbolPosition: 'suffix' })}
                        </Text>
                    </View>
                    <View className="flex-1 rounded-2xl bg-white p-4">
                        <View className="mb-2 size-10 items-center justify-center rounded-full bg-yellow-400/10">
                            <Clock color={colors.yellow[500]} width={20} height={20} />
                        </View>
                        <Text className="text-xs text-text-tertiary">
                            {t('companion.withdrawals.pending_amount')}
                        </Text>
                        <Text className="font-urbanist-bold mt-1 text-lg text-midnight">
                            {formatVND(pendingAmount, { symbolPosition: 'suffix' })}
                        </Text>
                    </View>
                </MotiView>

                {/* Section Header */}
                <Text className="mx-4 mb-3 font-urbanist-bold text-lg text-midnight">
                    {t('companion.withdrawals.recent')}
                </Text>

                {/* Withdrawal List */}
                {withdrawals.length > 0 ? (
                    withdrawals.map((item, index) => (
                        <WithdrawalCard
                            key={item.id}
                            item={item}
                            index={index}
                            onPress={() => handleWithdrawalPress(item.id)}
                        />
                    ))
                ) : (
                    <View className="items-center py-16">
                        <View className="size-16 items-center justify-center rounded-full bg-lavender-900/10">
                            <Withdraw color={colors.lavender[400]} width={32} height={32} />
                        </View>
                        <Text className="font-urbanist-bold mt-4 text-lg text-midnight">
                            {t('companion.withdrawals.empty_title')}
                        </Text>
                        <Text className="mt-1 text-center text-sm text-text-secondary">
                            {t('companion.withdrawals.empty_description')}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
