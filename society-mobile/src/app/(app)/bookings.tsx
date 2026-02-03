/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl } from 'react-native';

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
    ArrowRight,
    Calendar,
    Clock,
    CreditCard,
    MapPin,
    Star,
    VerifiedBadge,
} from '@/components/ui/icons';
import { BookingStatus, PaymentStatus } from '@/lib/api/enums';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useBookings } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

type DisplayBookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

type Booking = {
    id: string;
    companion: {
        name: string;
        image: string;
        isVerified: boolean;
        rating: number;
    };
    occasion: string;
    occasionEmoji: string;
    date: string;
    dayOfWeek: string;
    time: string;
    duration: number;
    location: string;
    totalPrice: number;
    status: DisplayBookingStatus;
    rawStatus: BookingStatus;
    paymentStatus: PaymentStatus;
};

const TABS = [
    { id: 'upcoming', labelKey: 'hirer.orders.tabs.upcoming' },
    { id: 'past', labelKey: 'hirer.orders.tabs.past' },
];

// Day of week keys for i18n
const DAY_KEYS = [
    'sun_short',
    'mon_short',
    'tue_short',
    'wed_short',
    'thu_short',
    'fri_short',
    'sat_short',
] as const;

// Month keys for i18n
const MONTH_KEYS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
] as const;

// Status configuration mapping to Badge variants
const STATUS_CONFIG: Record<
    DisplayBookingStatus,
    {
        labelKey: string;
        variant: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    }
> = {
    pending: {
        labelKey: 'hirer.orders.status.awaiting',
        variant: 'pending',
    },
    confirmed: {
        labelKey: 'hirer.orders.status.confirmed',
        variant: 'confirmed',
    },
    completed: {
        labelKey: 'hirer.orders.status.completed',
        variant: 'completed',
    },
    cancelled: {
        labelKey: 'hirer.orders.status.cancelled',
        variant: 'cancelled',
    },
};

// Premium booking card with rich information display
function BookingCard({
    booking,
    onPress,
    onPayPress,
    index,
}: {
    booking: Booking;
    onPress: () => void;
    onPayPress: () => void;
    index: number;
}) {
    const { t } = useTranslation();
    const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const needsPayment =
        booking.rawStatus === BookingStatus.CONFIRMED &&
        booking.paymentStatus === PaymentStatus.HELD;

    return (
        <MotiView
            from={{ opacity: 0, translateY: 24, scale: 0.96 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{
                type: 'timing',
                duration: 500,
                delay: index * 80,
            }}
        >
            <Pressable
                onPress={onPress}
                className="mb-5 overflow-hidden rounded-[20px] bg-white shadow-lg active:scale-[0.98] active:opacity-95"
            >
                {/* Hero section with companion image */}
                <View className="relative h-[140px]">
                    <Image
                        source={{ uri: booking.companion.image }}
                        className="size-full"
                        contentFit="cover"
                    />
                    {/* Gradient overlay for text readability */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        className="absolute inset-x-0 bottom-0 h-20"
                    />

                    {/* Status badge - top right */}
                    <Badge
                        label={t(statusConfig.labelKey)}
                        variant={statusConfig.variant}
                        size="sm"
                        className="absolute right-3 top-3 border border-white/50 uppercase"
                    />

                    {/* Date badge - top left */}
                    <View className="absolute left-3 top-3 items-center rounded-[10px] bg-white/95 px-2.5 py-1.5">
                        <Text className="font-urbanist-semibold text-xs tracking-wider text-text-tertiary">
                            {booking.dayOfWeek}
                        </Text>
                        <Text className="mt-0.5 font-urbanist-bold text-sm text-midnight">
                            {booking.date}
                        </Text>
                    </View>

                    {/* Companion name on image */}
                    <View className="absolute inset-x-3.5 bottom-3">
                        <View className="flex-row items-center gap-1.5">
                            <Text
                                className="font-urbanist-bold text-lg text-white"
                                numberOfLines={1}
                                style={{
                                    textShadowColor: 'rgba(0,0,0,0.3)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 3,
                                }}
                            >
                                {booking.companion.name}
                            </Text>
                            {booking.companion.isVerified && (
                                <VerifiedBadge
                                    color={colors.teal[400]}
                                    width={18}
                                    height={18}
                                />
                            )}
                        </View>
                        {booking.companion.rating > 0 && (
                            <View className="mt-1 flex-row items-center gap-1">
                                <Star color={colors.yellow[400]} width={14} height={14} />
                                <Text
                                    className="font-urbanist-semibold text-sm text-white"
                                    style={{
                                        textShadowColor: 'rgba(0,0,0,0.3)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 3,
                                    }}
                                >
                                    {booking.companion.rating.toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Card body with booking details */}
                <View className="p-4">
                    {/* Occasion row */}
                    <View className="mb-4 flex-row items-center justify-between">
                        <Badge
                            label={booking.occasion}
                            variant="occasion"
                            size="lg"
                            icon={<Text className="text-base">{booking.occasionEmoji}</Text>}
                            className="rounded-xl"
                        />
                        <ArrowRight color={colors.text.tertiary} width={16} height={16} />
                    </View>

                    {/* Details grid */}
                    <View className="mb-4 flex-row flex-wrap gap-3">
                        {/* Time */}
                        <View className="w-[47%] flex-row items-center gap-2.5">
                            <View className="size-8 items-center justify-center rounded-[10px] bg-neutral-100">
                                <Clock color={colors.lavender[400]} width={14} height={14} />
                            </View>
                            <View>
                                <Text className="mb-0.5 font-urbanist text-xs tracking-wide text-text-tertiary">
                                    {t('hirer.orders.time')}
                                </Text>
                                <Text className="font-urbanist-semibold text-sm text-midnight">
                                    {booking.time}
                                </Text>
                            </View>
                        </View>

                        {/* Duration */}
                        <View className="w-[47%] flex-row items-center gap-2.5">
                            <View className="size-8 items-center justify-center rounded-[10px] bg-neutral-100">
                                <Calendar color={colors.coral[400]} width={14} height={14} />
                            </View>
                            <View>
                                <Text className="mb-0.5 font-urbanist text-xs tracking-wide text-text-tertiary">
                                    {t('hirer.orders.duration')}
                                </Text>
                                <Text className="font-urbanist-semibold text-sm text-midnight">
                                    {booking.duration}h
                                </Text>
                            </View>
                        </View>

                        {/* Location */}
                        <View className="w-full flex-row items-center gap-2.5">
                            <View className="size-8 items-center justify-center rounded-[10px] bg-neutral-100">
                                <MapPin color={colors.teal[400]} width={14} height={14} />
                            </View>
                            <View className="flex-1">
                                <Text className="mb-0.5 font-urbanist text-xs tracking-wide text-text-tertiary">
                                    {t('hirer.orders.location')}
                                </Text>
                                <Text
                                    className="font-urbanist-semibold text-sm text-midnight"
                                    numberOfLines={1}
                                >
                                    {booking.location}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Price footer */}
                    <View className="flex-row items-center justify-between border-t border-border-light pt-3.5">
                        <Text className="font-urbanist-medium text-sm text-text-tertiary">
                            {t('hirer.orders.total')}
                        </Text>
                        <Text className="font-urbanist-bold text-lg text-rose-400">
                            {formatVND(booking.totalPrice)}
                        </Text>
                    </View>

                    {/* Payment Button - Show when booking is confirmed but payment is pending */}
                    {needsPayment && (
                        <Button
                            label={t('hirer.orders.pay_now')}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                onPayPress();
                            }}
                            variant="default"
                            size="sm"
                            icon={CreditCard}
                            className="mt-3 bg-rose-400"
                        />
                    )}
                </View>
            </Pressable>
        </MotiView>
    );
}

// Enhanced empty state with rich visuals
function EmptyState({ isUpcoming }: { isUpcoming: boolean }) {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            className="flex-1 items-center justify-center px-8 pt-10"
        >
            {/* Decorative background */}
            <View className="absolute size-[280px] items-center justify-center">
                <LinearGradient
                    colors={[colors.lavender[100], colors.rose[100], colors.teal[100]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute size-[220px] rounded-full opacity-30"
                />
                <View className="absolute left-[30px] top-5 size-[100px] rounded-full bg-lavender-200 opacity-50" />
                <View className="absolute right-5 top-20 size-[70px] rounded-full bg-rose-200 opacity-50" />
                <View className="absolute bottom-10 left-[70px] size-[50px] rounded-full bg-teal-200 opacity-50" />
            </View>

            {/* Illustration container */}
            <View className="relative mb-6 size-[140px] items-center justify-center">
                <View className="size-[100px] items-center justify-center rounded-[30px] bg-lavender-900/15">
                    <View className="size-[72px] items-center justify-center rounded-[22px] bg-white shadow-lg">
                        <Calendar color={colors.lavender[500]} width={40} height={40} />
                    </View>
                </View>
                {/* Small floating elements */}
                <MotiView
                    from={{ translateY: 0 }}
                    animate={{ translateY: -8 }}
                    transition={{ type: 'timing', duration: 2000, loop: true }}
                    className="absolute right-[15px] top-2.5 size-8 items-center justify-center rounded-[10px] bg-white shadow-md"
                >
                    <Star color={colors.yellow[400]} width={16} height={16} />
                </MotiView>
                <MotiView
                    from={{ translateY: 0 }}
                    animate={{ translateY: 8 }}
                    transition={{ type: 'timing', duration: 2500, loop: true }}
                    className="absolute bottom-[15px] left-2.5 size-7 items-center justify-center rounded-lg bg-white shadow-md"
                >
                    <Clock color={colors.coral[400]} width={14} height={14} />
                </MotiView>
            </View>

            <Text className="mb-2.5 text-center font-urbanist-bold text-xl text-midnight">
                {isUpcoming
                    ? t('hirer.orders.empty')
                    : t('hirer.orders.empty_past_title')}
            </Text>
            <Text className="mb-8 px-4 text-center font-urbanist text-base leading-relaxed text-text-secondary">
                {isUpcoming
                    ? t('hirer.orders.empty_upcoming_subtitle')
                    : t('hirer.orders.empty_past_subtitle')}
            </Text>

            {isUpcoming && (
                <LinearGradient
                    colors={[colors.rose[400], colors.coral[400]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-[14px] shadow-lg"
                >
                    <Pressable
                        onPress={() => router.push('/hirer/browse' as Href)}
                        className="flex-row items-center justify-center gap-2 px-7 py-4"
                    >
                        <Text className="font-urbanist-semibold text-base text-white">
                            {t('hirer.orders.browse_partners')}
                        </Text>
                        <ArrowRight color="#FFFFFF" width={18} height={18} />
                    </Pressable>
                </LinearGradient>
            )}
        </MotiView>
    );
}

export default function MyBookings() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = React.useState('upcoming');

    // Map local tab to API status
    const getApiStatus = (tab: string): string | undefined => {
        if (tab === 'upcoming')
            return `${BookingStatus.PENDING},${BookingStatus.CONFIRMED}`;
        if (tab === 'past') return BookingStatus.COMPLETED;
        return undefined;
    };

    const {
        data: bookingsData,
        isLoading,
        refetch,
        isRefetching,
    } = useBookings(getApiStatus(activeTab));

    // Map API status to local display status
    const mapStatus = (apiStatus: BookingStatus): DisplayBookingStatus => {
        switch (apiStatus) {
            case BookingStatus.PENDING:
                return 'pending';
            case BookingStatus.CONFIRMED:
            case BookingStatus.ACTIVE:
                return 'confirmed';
            case BookingStatus.COMPLETED:
                return 'completed';
            case BookingStatus.CANCELLED:
            case BookingStatus.DISPUTED:
            case BookingStatus.EXPIRED:
                return 'cancelled';
            default:
                return 'pending';
        }
    };

    // Helper to format date with i18n
    const formatDateI18n = React.useCallback(
        (date: Date) => {
            const dayKey = DAY_KEYS[date.getDay()];
            const monthKey = MONTH_KEYS[date.getMonth()];
            const day = date.getDate();
            const month = t(`common.months.${monthKey}`);
            // Vietnamese: "30 Tháng 1", English: "Jan 30"
            const isVietnamese = i18n.language === 'vi';
            return {
                dayOfWeek: t(`common.days.${dayKey}`),
                date: isVietnamese ? `${day} ${month}` : `${month} ${day}`,
            };
        },
        [t, i18n.language]
    );

    // Transform bookings data
    const bookings = React.useMemo(() => {
        if (!bookingsData?.bookings) return [];
        return bookingsData.bookings.map((b) => {
            const startDate = b.startDatetime ? new Date(b.startDatetime) : null;
            const dateInfo = startDate
                ? formatDateI18n(startDate)
                : { dayOfWeek: '', date: '' };
            return {
                id: b.id,
                companion: {
                    name: b.companion?.displayName || '',
                    image:
                        b.companion?.avatar || getPhotoUrl(b.companion?.photos?.[0]) || '',
                    isVerified:
                        b.companion?.isVerified ??
                        b.companion?.verificationStatus === 'verified',
                    rating: b.companion?.rating ?? 0,
                },
                occasion: b.occasion?.name || 'Meeting',
                occasionEmoji: b.occasion?.emoji || '📅',
                date: dateInfo.date,
                dayOfWeek: dateInfo.dayOfWeek,
                time: startDate
                    ? startDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    : `${b.durationHours}h`,
                duration: b.durationHours || 1,
                location: b.locationAddress?.split(',')[0] || 'TBD',
                totalPrice:
                    b.totalPrice ||
                    (b.durationHours || 1) * (b.companion?.hourlyRate || 0),
                status: mapStatus(b.status),
                rawStatus: b.status,
                paymentStatus: b.paymentStatus,
            };
        }) as Booking[];
    }, [bookingsData, formatDateI18n]);

    const handleBookingPress = React.useCallback(
        (booking: Booking) => {
            router.push(`/hirer/orders/${booking.id}` as Href);
        },
        [router]
    );

    const handlePayPress = React.useCallback(
        (booking: Booking) => {
            router.push(`/hirer/booking/payment/${booking.id}` as Href);
        },
        [router]
    );

    const renderBooking = React.useCallback(
        ({ item, index }: { item: Booking; index: number }) => (
            <BookingCard
                booking={item}
                onPress={() => handleBookingPress(item)}
                onPayPress={() => handlePayPress(item)}
                index={index}
            />
        ),
        [handleBookingPress, handlePayPress]
    );

    return (
        <View className="flex-1 bg-warmwhite">
            <FocusAwareStatusBar />

            {/* Header */}
            <SafeAreaView edges={['top']} className="bg-warmwhite">
                <View className="bg-warmwhite px-5 pt-3">
                    {/* Title */}
                    <Text className="mb-6 font-urbanist-bold text-3xl text-midnight">
                        {t('hirer.orders.header')}
                    </Text>

                    {/* Segmented control tab bar */}
                    <View className="mb-2 flex-row rounded-[14px] bg-neutral-100 p-1">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <Pressable
                                    key={tab.id}
                                    onPress={() => setActiveTab(tab.id)}
                                    className={`flex-1 items-center rounded-[10px] px-4 py-3 ${isActive ? 'bg-white shadow-sm' : ''
                                        }`}
                                >
                                    <Text
                                        className={`text-sm ${isActive
                                            ? 'font-urbanist-semibold text-midnight'
                                            : 'font-urbanist-medium text-text-tertiary'
                                            }`}
                                    >
                                        {t(tab.labelKey)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </SafeAreaView>

            {/* Content */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <MotiView
                        from={{ opacity: 0.3, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: 'timing',
                            duration: 800,
                            loop: true,
                        }}
                    >
                        <ActivityIndicator color={colors.lavender[400]} size="large" />
                    </MotiView>
                </View>
            ) : (
                <FlashList
                    data={bookings}
                    renderItem={renderBooking}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingTop: 20,
                        paddingHorizontal: 16,
                        paddingBottom: 32,
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={colors.lavender[400]}
                            colors={[colors.lavender[400]]}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState isUpcoming={activeTab === 'upcoming'} />
                    }
                />
            )}
        </View>
    );
}
