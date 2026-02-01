/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';

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
    Calendar,
    CheckCircle,
    Clock,
    MapPin,
    XCircle,
} from '@/components/ui/icons';
import { BookingStatus } from '@/lib/api/enums';
import type { Booking } from '@/lib/api/services/bookings.service';
import {
    useAcceptBooking,
    useCompanionBookings,
    useDeclineBooking,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

// Status filter tabs
const STATUS_TABS = [
    { key: 'pending', status: BookingStatus.PENDING },
    { key: 'confirmed', status: BookingStatus.CONFIRMED },
    { key: 'active', status: BookingStatus.ACTIVE },
    { key: 'completed', status: BookingStatus.COMPLETED },
    { key: 'cancelled', status: BookingStatus.CANCELLED },
] as const;

type StatusTabKey = (typeof STATUS_TABS)[number]['key'];

// Helper to format time ago
function getTimeAgo(dateString: string, t: (key: string) => string): string {
    if (!dateString) return t('common.time.just_now');
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('common.time.just_now');
    if (diffMins < 60) return `${diffMins} ${t('common.time.minutes_ago')}`;
    if (diffHours < 24) return `${diffHours} ${t('common.time.hours_ago')}`;
    return `${diffDays} ${t('common.time.days_ago')}`;
}

// Get badge variant based on status
function getStatusBadgeVariant(
    status: BookingStatus
): 'default' | 'teal' | 'lavender' | 'rose' {
    switch (status) {
        case BookingStatus.PENDING:
            return 'default';
        case BookingStatus.CONFIRMED:
            return 'teal';
        case BookingStatus.ACTIVE:
            return 'lavender';
        case BookingStatus.COMPLETED:
            return 'teal';
        case BookingStatus.CANCELLED:
            return 'rose';
        default:
            return 'default';
    }
}

function RequestCard({
    request,
    onAccept,
    onDecline,
    onPress,
    isAccepting,
    isDeclining,
    showActions,
    t,
    i18n,
}: {
    request: Booking;
    onAccept: () => void;
    onDecline: () => void;
    onPress: () => void;
    isAccepting: boolean;
    isDeclining: boolean;
    showActions: boolean;
    t: (key: string, params?: Record<string, unknown>) => string;
    i18n: { language: string };
}) {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const startTime = new Date(request.startDatetime);
    const dateStr = startTime.toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const timeStr = startTime.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
    });
    const durationStr = `${request.durationHours} ${t('common.hours')}`;
    const yourEarnings = request.totalPrice;

    return (
        <Pressable onPress={onPress} className="rounded-2xl bg-white p-4">
            {/* Client Info */}
            <View className="flex-row items-center gap-3">
                <Image
                    source={{
                        uri:
                            request.hirer?.avatar ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
                    }}
                    className="size-12 rounded-full"
                    contentFit="cover"
                />
                <View className="flex-1">
                    <Text className="font-semibold text-midnight">
                        {request.hirer?.displayName || t('common.anonymous')}
                    </Text>
                    <Text className="text-xs text-text-tertiary">
                        ⭐ {request.hirer?.rating?.toFixed(1) || '5.0'} •{' '}
                        {getTimeAgo(request.createdAt, t)}
                    </Text>
                </View>
                {request.status === BookingStatus.PENDING && (
                    <Badge label={t('common.new')} variant="default" size="sm" />
                )}
                {request.status !== BookingStatus.PENDING && (
                    <Badge
                        label={t(`common.status.${request.status.toLowerCase()}`)}
                        variant={getStatusBadgeVariant(request.status)}
                        size="sm"
                    />
                )}
            </View>

            {/* Booking Details */}
            <View className="mt-4 rounded-xl bg-softpink p-3">
                <Text className="font-semibold text-rose-400">
                    {request.occasion
                        ? `${request.occasion.emoji} ${request.occasion.name}`
                        : t('common.occasion')}
                </Text>
                <View className="mt-2 gap-2">
                    <View className="flex-row items-center gap-2">
                        <Calendar color={colors.text.tertiary} width={14} height={14} />
                        <Text className="text-sm text-text-secondary">{dateStr}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Clock color={colors.text.tertiary} width={14} height={14} />
                        <Text className="text-sm text-text-secondary">
                            {timeStr} ({durationStr})
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <MapPin color={colors.text.tertiary} width={14} height={14} />
                        <Text className="text-sm text-text-secondary" numberOfLines={1}>
                            {request.locationAddress}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Message */}
            {request.specialRequests && (
                <View className="mt-3 rounded-lg bg-lavender-400/10 p-3">
                    <Text className="text-sm italic text-text-secondary">
                        &ldquo;{request.specialRequests}&rdquo;
                    </Text>
                </View>
            )}

            {/* Earnings */}
            <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-sm text-text-tertiary">
                    {request.status === BookingStatus.COMPLETED
                        ? t('companion.requests.earned')
                        : t('companion.requests.your_earnings')}
                </Text>
                <Text className="font-urbanist-bold text-xl text-teal-400">
                    {formatVND(yourEarnings || 0)}
                </Text>
            </View>

            {/* Actions - Only show for pending requests */}
            {showActions && (
                <View className="mt-4 flex-row gap-3">
                    <Button
                        label={t('companion.requests.decline')}
                        onPress={onDecline}
                        variant="outline"
                        size="default"
                        loading={isDeclining}
                        disabled={isAccepting || isDeclining}
                        icon={XCircle}
                        iconColor={colors.text.tertiary}
                        className="flex-1 border-border-light"
                        textClassName="text-text-secondary"
                    />
                    <Button
                        label={t('companion.requests.accept')}
                        onPress={onAccept}
                        variant="default"
                        size="default"
                        loading={isAccepting}
                        disabled={isAccepting || isDeclining}
                        icon={CheckCircle}
                        className="flex-1 bg-lavender-400"
                    />
                </View>
            )}
        </Pressable>
    );
}

function StatusTab({
    label,
    isActive,
    count,
    onPress,
}: {
    label: string;
    isActive: boolean;
    count: number;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${isActive ? 'bg-lavender-400' : 'bg-white'
                }`}
        >
            <Text
                className={`font-medium ${isActive ? 'text-white' : 'text-text-secondary'}`}
            >
                {label}
            </Text>
            {count > 0 && (
                <View
                    className={`min-w-[20px] items-center rounded-full px-1.5 py-0.5 ${isActive ? 'bg-white/20' : 'bg-lavender-400/20'
                        }`}
                >
                    <Text
                        className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-lavender-400'}`}
                    >
                        {count}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

function EmptyState({
    statusKey,
    t,
}: {
    statusKey: StatusTabKey;
    t: (key: string) => string;
}) {
    const emptyMessages: Record<StatusTabKey, { title: string; desc: string }> = {
        pending: {
            title: t('companion.requests.no_pending'),
            desc: t('companion.requests.no_pending_desc'),
        },
        confirmed: {
            title: t('companion.requests.no_confirmed'),
            desc: t('companion.requests.no_confirmed_desc'),
        },
        active: {
            title: t('companion.requests.no_active'),
            desc: t('companion.requests.no_active_desc'),
        },
        completed: {
            title: t('companion.requests.no_completed'),
            desc: t('companion.requests.no_completed_desc'),
        },
        cancelled: {
            title: t('companion.requests.no_cancelled'),
            desc: t('companion.requests.no_cancelled_desc'),
        },
    };

    const message = emptyMessages[statusKey];

    return (
        <View className="flex-1 items-center justify-center px-6">
            <View className="size-20 items-center justify-center rounded-full bg-lavender-400/20">
                <Calendar color={colors.lavender[400]} width={40} height={40} />
            </View>
            <Text className="mt-4 font-urbanist-bold text-xl text-midnight">
                {message.title}
            </Text>
            <Text className="mt-2 text-center text-text-secondary">
                {message.desc}
            </Text>
        </View>
    );
}

export default function BookingRequests() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = React.useState<StatusTabKey>('pending');

    // React Query hooks - fetch all bookings for companion
    const {
        data: bookingsData,
        isLoading,
        refetch,
        isRefetching,
    } = useCompanionBookings();
    const acceptBooking = useAcceptBooking();
    const declineBooking = useDeclineBooking();

    const allBookings = React.useMemo(
        () => bookingsData?.bookings || [],
        [bookingsData?.bookings]
    );

    // Filter bookings by status
    const filteredBookings = React.useMemo(() => {
        const currentTab = STATUS_TABS.find((tab) => tab.key === activeTab);
        if (!currentTab) return [];
        return allBookings.filter(
            (booking) => booking.status === currentTab.status
        );
    }, [allBookings, activeTab]);

    // Count bookings per status for badges
    const statusCounts = React.useMemo(() => {
        const counts: Record<StatusTabKey, number> = {
            pending: 0,
            confirmed: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
        };
        allBookings.forEach((booking) => {
            const tab = STATUS_TABS.find((t) => t.status === booking.status);
            if (tab) {
                counts[tab.key]++;
            }
        });
        return counts;
    }, [allBookings]);

    const handleRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const handleAccept = React.useCallback(
        (requestId: string) => {
            Alert.alert(
                t('companion.requests.accept_booking'),
                t('companion.requests.accept_confirmation'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('companion.requests.accept'),
                        onPress: () => {
                            acceptBooking.mutate(requestId, {
                                onSuccess: () => {
                                    Toast.show({
                                        type: 'success',
                                        text1: t('companion.requests.accept_success'),
                                    });
                                },
                                onError: (error) => {
                                    console.error('Failed to accept booking:', error);
                                    Toast.show({
                                        type: 'error',
                                        text1: t('errors.accept_failed'),
                                        text2: t('errors.try_again'),
                                    });
                                },
                            });
                        },
                    },
                ]
            );
        },
        [t, acceptBooking]
    );

    const handleDecline = React.useCallback(
        (requestId: string) => {
            Alert.alert(
                t('companion.requests.decline_booking'),
                t('companion.requests.decline_confirmation'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('companion.requests.decline'),
                        style: 'destructive',
                        onPress: () => {
                            declineBooking.mutate(
                                { bookingId: requestId },
                                {
                                    onSuccess: () => {
                                        Toast.show({
                                            type: 'info',
                                            text1: t('companion.requests.decline_success'),
                                        });
                                    },
                                    onError: (error) => {
                                        console.error('Failed to decline booking:', error);
                                        Toast.show({
                                            type: 'error',
                                            text1: t('errors.decline_failed'),
                                            text2: t('errors.try_again'),
                                        });
                                    },
                                }
                            );
                        },
                    },
                ]
            );
        },
        [t, declineBooking]
    );

    const handleRequestPress = React.useCallback(
        (request: Booking) => {
            router.push(`/companion/bookings/${request.id}` as Href);
        },
        [router]
    );

    const renderRequest = React.useCallback(
        ({ item, index }: { item: Booking; index: number }) => (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400, delay: index * 100 }}
                className="px-4 pb-4"
            >
                <RequestCard
                    request={item}
                    onAccept={() => handleAccept(item.id)}
                    onDecline={() => handleDecline(item.id)}
                    onPress={() => handleRequestPress(item)}
                    isAccepting={acceptBooking.isPending}
                    isDeclining={declineBooking.isPending}
                    showActions={item.status === BookingStatus.PENDING}
                    t={t}
                    i18n={i18n}
                />
            </MotiView>
        ),
        [
            handleAccept,
            handleDecline,
            handleRequestPress,
            acceptBooking.isPending,
            declineBooking.isPending,
            t,
            i18n,
        ]
    );

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-warmwhite">
                <ActivityIndicator color={colors.lavender[400]} size="large" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-warmwhite">
            <FocusAwareStatusBar />

            <SafeAreaView edges={['top']}>
                <View className="border-b border-border-light px-4 py-3">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-urbanist-bold text-xl text-midnight">
                                {t('companion.requests.header')}
                            </Text>
                            <Text className="mt-0.5 text-sm text-text-tertiary">
                                {t('companion.requests.subtitle')}
                            </Text>
                        </View>
                        <Badge
                            label={`${allBookings.length}`}
                            variant="lavender"
                            size="sm"
                        />
                    </View>
                </View>
            </SafeAreaView>

            {/* Status Filter Tabs */}
            <View className="border-b border-border-light bg-warmwhite py-3">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    {STATUS_TABS.map((tab) => (
                        <StatusTab
                            key={tab.key}
                            label={t(`common.status.${tab.key}`)}
                            isActive={activeTab === tab.key}
                            count={statusCounts[tab.key]}
                            onPress={() => setActiveTab(tab.key)}
                        />
                    ))}
                </ScrollView>
            </View>

            {filteredBookings.length > 0 ? (
                <FlashList
                    data={filteredBookings}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 16 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={colors.lavender[400]}
                        />
                    }
                />
            ) : (
                <EmptyState statusKey={activeTab} t={t} />
            )}
        </View>
    );
}
