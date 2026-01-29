/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Calendar, Clock, MapPin } from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useBookings } from '@/lib/hooks';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

type Booking = {
  id: string;
  companion: {
    name: string;
    image: string;
  };
  occasion: string;
  occasionEmoji: string;
  date: string;
  dayOfWeek: string;
  time: string;
  location: string;
  status: BookingStatus;
};

const TABS = [
  { id: 'upcoming', labelKey: 'hirer.orders.tabs.upcoming' },
  { id: 'past', labelKey: 'hirer.orders.tabs.past' },
];

// Refined status configuration - quiet luxury approach
const STATUS_CONFIG: Record<BookingStatus, { labelKey: string; accentColor: string; textColor: string }> = {
  pending: {
    labelKey: 'hirer.orders.status.awaiting',
    accentColor: '#D4A853', // Muted gold
    textColor: '#8B7355',
  },
  confirmed: {
    labelKey: 'hirer.orders.status.confirmed',
    accentColor: colors.teal[400],
    textColor: colors.teal[500],
  },
  completed: {
    labelKey: 'hirer.orders.status.completed',
    accentColor: '#9CA3AF',
    textColor: '#6B7280',
  },
  cancelled: {
    labelKey: 'hirer.orders.status.cancelled',
    accentColor: '#DC7C7C',
    textColor: '#9B5555',
  },
};

// Premium booking card with quiet luxury aesthetics
function BookingCard({
  booking,
  onPress,
  index,
}: {
  booking: Booking;
  onPress: () => void;
  index: number;
}) {
  const { t } = useTranslation();
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

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
        style={({ pressed }) => [
          styles.cardContainer,
          pressed && styles.cardPressed,
        ]}
      >
        {/* Subtle accent line on left edge */}
        <View
          style={[styles.accentLine, { backgroundColor: statusConfig.accentColor }]}
        />

        <View style={styles.cardContent}>
          {/* Top section: Date badge + Status */}
          <View style={styles.cardHeader}>
            {/* Date display - like a luxury calendar */}
            <View style={styles.dateContainer}>
              <Text style={styles.dayOfWeek}>{booking.dayOfWeek}</Text>
              <Text style={styles.dateText}>{booking.date}</Text>
            </View>

            {/* Status - refined typography */}
            <View style={styles.statusContainer}>
              <View
                style={[styles.statusDot, { backgroundColor: statusConfig.accentColor }]}
              />
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {t(statusConfig.labelKey)}
              </Text>
            </View>
          </View>

          {/* Divider with subtle gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.04)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* Main content: Companion info */}
          <View style={styles.mainContent}>
            {/* Companion photo with refined corners */}
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: booking.companion.image }}
                style={styles.avatar}
                contentFit="cover"
              />
              {/* Subtle inner shadow overlay */}
              <LinearGradient
                colors={['rgba(0,0,0,0.08)', 'transparent', 'transparent']}
                style={styles.avatarOverlay}
              />
            </View>

            {/* Companion details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.companionName} numberOfLines={1}>
                {booking.companion.name}
              </Text>

              {/* Occasion with elegant styling */}
              <View style={styles.occasionRow}>
                <Text style={styles.occasionEmoji}>{booking.occasionEmoji}</Text>
                <Text style={styles.occasionText} numberOfLines={1}>
                  {booking.occasion}
                </Text>
              </View>

              {/* Time and location - subtle metadata */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock
                    color={colors.text.tertiary}
                    width={11}
                    height={11}
                  />
                  <Text style={styles.metaText}>{booking.time}</Text>
                </View>
                <View style={styles.metaSeparator} />
                <View style={styles.metaItem}>
                  <MapPin
                    color={colors.text.tertiary}
                    width={11}
                    height={11}
                  />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {booking.location}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

// Elegant empty state
function EmptyState({ isUpcoming }: { isUpcoming: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 200 }}
      style={styles.emptyContainer}
    >
      {/* Decorative circles */}
      <View style={styles.emptyDecoration}>
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
        <View style={[styles.decorCircle, styles.decorCircle3]} />
      </View>

      {/* Icon */}
      <View style={styles.emptyIconContainer}>
        <Calendar color={colors.lavender[400]} width={32} height={32} />
      </View>

      <Text style={styles.emptyTitle}>
        {isUpcoming ? t('hirer.orders.empty') : t('hirer.orders.empty_past_title')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isUpcoming
          ? t('hirer.orders.empty_upcoming_subtitle')
          : t('hirer.orders.empty_past_subtitle')}
      </Text>

      {isUpcoming && (
        <Pressable
          onPress={() => router.push('/hirer/browse' as Href)}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonText}>{t('hirer.orders.browse_partners')}</Text>
        </Pressable>
      )}
    </MotiView>
  );
}

export default function MyBookings() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('upcoming');

  // Map local tab to API status
  const getApiStatus = (tab: string): string | undefined => {
    if (tab === 'upcoming') return 'PENDING,CONFIRMED';
    if (tab === 'past') return 'COMPLETED';
    return undefined;
  };

  const {
    data: bookingsData,
    isLoading,
    refetch,
    isRefetching,
  } = useBookings(getApiStatus(activeTab));

  // Map API status to local display status
  const mapStatus = (apiStatus: string): BookingStatus => {
    switch (apiStatus) {
      case 'PENDING':
        return 'pending';
      case 'CONFIRMED':
      case 'ACTIVE':
        return 'confirmed';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
      case 'DISPUTED':
      case 'EXPIRED':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  // Transform bookings data
  const bookings = React.useMemo(() => {
    if (!bookingsData?.bookings) return [];
    return bookingsData.bookings.map((b) => {
      const startDate = b.startDatetime ? new Date(b.startDatetime) : null;
      return {
        id: b.id,
        companion: {
          name: b.companion?.displayName || '',
          image: b.companion?.avatar || getPhotoUrl(b.companion?.photos?.[0]) || '',
        },
        occasion: b.occasion?.name || 'Meeting',
        occasionEmoji: b.occasion?.emoji || '📅',
        date: startDate
          ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '',
        dayOfWeek: startDate
          ? startDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
          : '',
        time: startDate
          ? startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : `${b.durationHours}h`,
        location: b.locationAddress?.split(',')[0] || 'TBD',
        status: mapStatus(b.status),
      };
    }) as Booking[];
  }, [bookingsData]);

  const handleBookingPress = React.useCallback(
    (booking: Booking) => {
      router.push(`/hirer/orders/${booking.id}` as Href);
    },
    [router]
  );

  const renderBooking = React.useCallback(
    ({ item, index }: { item: Booking; index: number }) => (
      <BookingCard
        booking={item}
        onPress={() => handleBookingPress(item)}
        index={index}
      />
    ),
    [handleBookingPress]
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          {/* Title */}
          <Text style={styles.headerTitle}>{t('hirer.orders.header')}</Text>

          {/* Elegant tab bar */}
          <View style={styles.tabContainer}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={styles.tabButton}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.tabTextActive,
                    ]}
                  >
                    {t(tab.labelKey)}
                  </Text>
                  {isActive && (
                    <MotiView
                      from={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ type: 'timing', duration: 250 }}
                      style={styles.tabIndicator}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
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
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.lavender[400]}
              colors={[colors.lavender[400]]}
            />
          }
          ListEmptyComponent={<EmptyState isUpcoming={activeTab === 'upcoming'} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7', // Warm off-white
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 28,
    color: colors.midnight.DEFAULT,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  tabButton: {
    paddingBottom: 16,
    position: 'relative',
  },
  tabText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 15,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    fontFamily: 'Urbanist_600SemiBold',
    color: colors.midnight.DEFAULT,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.midnight.DEFAULT,
    borderRadius: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Card styles
  cardContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cardContent: {
    padding: 16,
    paddingLeft: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dayOfWeek: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 1.2,
  },
  dateText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 18,
    color: colors.midnight.DEFAULT,
    letterSpacing: -0.3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  companionName: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 16,
    color: colors.midnight.DEFAULT,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  occasionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  occasionEmoji: {
    fontSize: 13,
  },
  occasionText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 13,
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.tertiary,
    opacity: 0.5,
  },
  metaText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 12,
    color: colors.text.tertiary,
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyDecoration: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  decorCircle1: {
    width: 120,
    height: 120,
    backgroundColor: colors.lavender[400],
    top: 0,
    left: 20,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    backgroundColor: colors.rose[400],
    top: 60,
    right: 10,
  },
  decorCircle3: {
    width: 60,
    height: 60,
    backgroundColor: colors.teal[400],
    bottom: 20,
    left: 60,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 18,
    color: colors.midnight.DEFAULT,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.midnight.DEFAULT,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
