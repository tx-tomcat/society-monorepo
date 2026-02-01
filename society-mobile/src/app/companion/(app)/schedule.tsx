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
    Image,
    Text,
    View,
} from '@/components/ui';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Clock,
    MapPin,
} from '@/components/ui/icons';
import { BookingStatus } from '@/lib/api/enums';
import type { Booking } from '@/lib/api/services/bookings.service';
import { useCompanionSchedule } from '@/lib/hooks';

const DAYS_OF_WEEK_KEYS = [
    'common.days.sun_short',
    'common.days.mon_short',
    'common.days.tue_short',
    'common.days.wed_short',
    'common.days.thu_short',
    'common.days.fri_short',
    'common.days.sat_short',
];

// Helper to get start/end of week
function getWeekRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Start from Sunday
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

export default function CompanionSchedule() {
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = React.useState(new Date());

    // Calculate week range for the query
    const { start: weekStart, end: weekEnd } = React.useMemo(
        () => getWeekRange(selectedDate),
        [selectedDate]
    );

    // React Query hook
    const {
        data: schedule = [],
        isLoading,
        refetch,
        isRefetching,
    } = useCompanionSchedule(weekStart.toISOString(), weekEnd.toISOString());

    // Generate calendar dates for current week
    const weekDates = React.useMemo(() => {
        const dates = [];
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - start.getDay()); // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [selectedDate]);

    // Get all bookings as a flat array for easier lookup
    const allBookings = React.useMemo(() => {
        return schedule.flatMap((item) => item.bookings);
    }, [schedule]);

    // Filter bookings for selected date
    const dayBookings = React.useMemo(() => {
        const selectedDateStr = selectedDate.toDateString();
        return allBookings.filter((booking) => {
            const bookingDate = new Date(booking.startDatetime);
            return bookingDate.toDateString() === selectedDateStr;
        });
    }, [allBookings, selectedDate]);

    const handleBack = React.useCallback(() => {
        router.back();
    }, [router]);

    const handlePrevWeek = React.useCallback(() => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        setSelectedDate(newDate);
    }, [selectedDate]);

    const handleNextWeek = React.useCallback(() => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        setSelectedDate(newDate);
    }, [selectedDate]);

    const handleRefresh = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const handleBookingPress = React.useCallback(
        (booking: Booking) => {
            router.push(`/companion/bookings/${booking.id}` as Href);
        },
        [router]
    );

    const hasBookingsOnDate = React.useCallback(
        (date: Date) => {
            const dateStr = date.toDateString();
            return allBookings.some((b) => {
                const bookingDate = new Date(b.startDatetime);
                return bookingDate.toDateString() === dateStr;
            });
        },
        [allBookings]
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
                title={t('companion.schedule.header')}
                onBack={handleBack}
                rightElement={
                    <Pressable>
                        <Calendar color={colors.lavender[400]} width={24} height={24} />
                    </Pressable>
                }
            />

            {/* Calendar Week View */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                className="bg-white p-4"
            >
                {/* Month Header */}
                <View className="mb-4 flex-row items-center justify-between">
                    <Pressable onPress={handlePrevWeek} className="p-2">
                        <ArrowLeft color={colors.midnight.DEFAULT} width={20} height={20} />
                    </Pressable>
                    <Text className="font-urbanist-bold text-lg text-midnight">
                        {selectedDate.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </Text>
                    <Pressable onPress={handleNextWeek} className="p-2">
                        <ArrowRight
                            color={colors.midnight.DEFAULT}
                            width={20}
                            height={20}
                        />
                    </Pressable>
                </View>

                {/* Week Days */}
                <View className="flex-row">
                    {weekDates.map((date, index) => {
                        const isSelected =
                            date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();
                        const hasBookings = hasBookingsOnDate(date);

                        return (
                            <Pressable
                                key={index}
                                onPress={() => setSelectedDate(date)}
                                className={`flex-1 items-center rounded-xl py-3 ${isSelected ? 'bg-lavender-400' : ''
                                    }`}
                            >
                                <Text
                                    className={`text-xs ${isSelected ? 'text-white' : 'text-text-tertiary'
                                        }`}
                                >
                                    {t(DAYS_OF_WEEK_KEYS[date.getDay()])}
                                </Text>
                                <Text
                                    className={`mt-1 text-lg font-semibold ${isSelected
                                            ? 'text-white'
                                            : isToday
                                                ? 'text-lavender-400'
                                                : 'text-midnight'
                                        }`}
                                >
                                    {date.getDate()}
                                </Text>
                                {hasBookings && !isSelected && (
                                    <View className="mt-1 size-1.5 rounded-full bg-rose-400" />
                                )}
                                {hasBookings && isSelected && (
                                    <View className="mt-1 size-1.5 rounded-full bg-white" />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </MotiView>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.lavender[400]}
                    />
                }
            >
                {/* Selected Date Header */}
                <Text className="mb-4 text-sm font-medium text-text-tertiary">
                    {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Text>

                {/* Bookings */}
                {dayBookings.length > 0 ? (
                    <View className="gap-3">
                        {dayBookings.map((booking, index) => {
                            const startTime = new Date(booking.startDatetime);
                            const endTime = new Date(booking.endDatetime);
                            const startTimeStr = startTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                            });
                            const endTimeStr = endTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                            });
                            const statusVariant =
                                booking.status === BookingStatus.CONFIRMED
                                    ? 'teal'
                                    : booking.status === BookingStatus.ACTIVE
                                        ? 'lavender'
                                        : 'default';
                            const statusLabel =
                                booking.status === BookingStatus.CONFIRMED
                                    ? t('common.status.confirmed')
                                    : booking.status === BookingStatus.ACTIVE
                                        ? t('common.status.active')
                                        : t('common.status.pending');

                            return (
                                <MotiView
                                    key={booking.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{
                                        type: 'timing',
                                        duration: 400,
                                        delay: index * 100,
                                    }}
                                >
                                    <Pressable
                                        onPress={() => handleBookingPress(booking)}
                                        className="flex-row gap-4 rounded-2xl bg-white p-4"
                                    >
                                        {/* Time Indicator */}
                                        <View className="items-center">
                                            <Text className="text-sm font-semibold text-lavender-400">
                                                {startTimeStr}
                                            </Text>
                                            <View className="my-2 h-12 w-0.5 bg-lavender-400/30" />
                                            <Text className="text-xs text-text-tertiary">
                                                {endTimeStr}
                                            </Text>
                                        </View>

                                        {/* Booking Card */}
                                        <View className="flex-1 rounded-xl bg-softpink p-3">
                                            <View className="flex-row items-center gap-3">
                                                <Image
                                                    source={{
                                                        uri:
                                                            booking.hirer?.avatar ||
                                                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
                                                    }}
                                                    className="size-10 rounded-full"
                                                    contentFit="cover"
                                                />
                                                <View className="flex-1">
                                                    <Text className="font-semibold text-midnight">
                                                        {booking.hirer?.displayName || 'Anonymous'}
                                                    </Text>
                                                    <Text className="text-sm text-rose-400">
                                                        {booking.occasion ? `${booking.occasion.emoji} ${booking.occasion.name}` : t('common.occasion')}
                                                    </Text>
                                                </View>
                                                <Badge
                                                    label={statusLabel}
                                                    variant={statusVariant}
                                                    size="sm"
                                                />
                                            </View>
                                            <View className="mt-3 flex-row items-center gap-4">
                                                <View className="flex-row items-center gap-1">
                                                    <Clock
                                                        color={colors.text.tertiary}
                                                        width={12}
                                                        height={12}
                                                    />
                                                    <Text className="text-xs text-text-tertiary">
                                                        {booking.durationHours} {t('common.hours')}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center gap-1">
                                                    <MapPin
                                                        color={colors.text.tertiary}
                                                        width={12}
                                                        height={12}
                                                    />
                                                    <Text
                                                        className="flex-1 text-xs text-text-tertiary"
                                                        numberOfLines={1}
                                                    >
                                                        {booking.locationAddress}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </Pressable>
                                </MotiView>
                            );
                        })}
                    </View>
                ) : (
                    <View className="items-center py-16">
                        <View className="size-16 items-center justify-center rounded-full bg-lavender-400/20">
                            <Calendar color={colors.lavender[400]} width={32} height={32} />
                        </View>
                        <Text className="font-urbanist-bold mt-4 text-lg text-midnight">
                            {t('companion.schedule.no_bookings')}
                        </Text>
                        <Text className="mt-1 text-center text-sm text-text-secondary">
                            {t('companion.schedule.no_bookings_description')}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
