/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Calendar, Clock, MapPin } from '@/components/ui/icons';

type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

type Booking = {
  id: string;
  companion: {
    name: string;
    image: string;
  };
  occasion: string;
  date: string;
  time: string;
  location: string;
  status: BookingStatus;
  price: number;
};

const TABS = [
  { id: 'all', labelKey: 'hirer.orders.tabs.all' },
  { id: 'upcoming', labelKey: 'hirer.orders.tabs.upcoming' },
  { id: 'active', labelKey: 'hirer.orders.tabs.active' },
  { id: 'completed', labelKey: 'hirer.orders.tabs.past' },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    companion: {
      name: 'Minh Anh',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    },
    occasion: 'Wedding Reception',
    date: 'Jan 15, 2025',
    time: '2:00 PM - 6:00 PM',
    location: 'Rex Hotel, District 1',
    status: 'upcoming',
    price: 2000000,
  },
  {
    id: '2',
    companion: {
      name: 'Thu Hương',
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    },
    occasion: 'Coffee Date',
    date: 'Today',
    time: '3:00 PM - 5:00 PM',
    location: 'The Coffee House, D3',
    status: 'active',
    price: 800000,
  },
  {
    id: '3',
    companion: {
      name: 'Ngọc Trâm',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    },
    occasion: 'Family Dinner',
    date: 'Dec 28, 2024',
    time: '6:00 PM - 9:00 PM',
    location: 'Home - District 7',
    status: 'completed',
    price: 1500000,
  },
  {
    id: '4',
    companion: {
      name: 'Hoàng Yến',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    },
    occasion: 'Corporate Event',
    date: 'Dec 20, 2024',
    time: '7:00 PM - 10:00 PM',
    location: 'Sofitel Saigon',
    status: 'cancelled',
    price: 3000000,
  },
];

const getStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case 'upcoming':
      return { variant: 'lavender' as const, labelKey: 'hirer.orders.status.upcoming' };
    case 'active':
      return { variant: 'teal' as const, labelKey: 'hirer.orders.status.in_progress' };
    case 'completed':
      return { variant: 'secondary' as const, labelKey: 'hirer.orders.status.completed' };
    case 'cancelled':
      return { variant: 'secondary' as const, labelKey: 'hirer.orders.status.cancelled' };
    default:
      return { variant: 'secondary' as const, labelKey: status };
  }
};

function BookingCard({
  booking,
  onPress,
  t,
}: {
  booking: Booking;
  onPress: () => void;
  t: (key: string) => string;
}) {
  const statusConfig = getStatusConfig(booking.status);

  return (
    <Pressable onPress={onPress}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        className="mx-4 mb-4 overflow-hidden rounded-2xl border border-border-light bg-white"
      >
        <View className="flex-row p-4">
          {/* Companion Image */}
          <Image
            source={{ uri: booking.companion.image }}
            className="size-20 rounded-xl"
            contentFit="cover"
          />

          {/* Details */}
          <View className="ml-4 flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-midnight">
                {booking.companion.name}
              </Text>
              <Badge label={t(statusConfig.labelKey)} variant={statusConfig.variant} size="sm" />
            </View>

            <Text className="mt-1 font-medium text-rose-400">{booking.occasion}</Text>

            <View className="mt-2 flex-row items-center gap-1">
              <Calendar color={colors.text.tertiary} width={14} height={14} />
              <Text className="text-sm text-text-tertiary">{booking.date}</Text>
            </View>

            <View className="mt-1 flex-row items-center gap-1">
              <Clock color={colors.text.tertiary} width={14} height={14} />
              <Text className="text-sm text-text-tertiary">{booking.time}</Text>
            </View>
          </View>
        </View>

        {/* Location Bar */}
        <View className="flex-row items-center gap-2 border-t border-border-light bg-softpink/50 px-4 py-3">
          <MapPin color={colors.rose[400]} width={16} height={16} />
          <Text className="flex-1 text-sm text-text-secondary" numberOfLines={1}>
            {booking.location}
          </Text>
          <Text className="font-bold text-midnight">
            {booking.price.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </MotiView>
    </Pressable>
  );
}

export default function MyBookings() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('all');

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleBookingPress = React.useCallback(
    (booking: Booking) => {
      router.push(`/hirer/orders/${booking.id}` as Href);
    },
    [router]
  );

  const filteredBookings = React.useMemo(() => {
    if (activeTab === 'all') return MOCK_BOOKINGS;
    return MOCK_BOOKINGS.filter(b => b.status === activeTab);
  }, [activeTab]);

  const renderBooking = React.useCallback(
    ({ item }: { item: Booking }) => (
      <BookingCard booking={item} onPress={() => handleBookingPress(item)} t={t} />
    ),
    [handleBookingPress, t]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('hirer.orders.header')}
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 px-4 py-3">
          {TABS.map(tab => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)}>
              <Badge
                label={t(tab.labelKey)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="default"
              />
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {/* Bookings List */}
      <FlashList
        data={filteredBookings}
        renderItem={renderBooking}
        estimatedItemSize={150}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-lg text-text-tertiary">{t('hirer.orders.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
