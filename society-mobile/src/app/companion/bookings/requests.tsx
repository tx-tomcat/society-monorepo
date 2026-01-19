/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  XCircle,
} from '@/components/ui/icons';
import {
  type Booking,
  bookingsService,
} from '@/lib/api/services/bookings.service';
import { formatVND } from '@/lib/utils';

// Helper to format time ago
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function RequestCard({
  request,
  onAccept,
  onDecline,
  onPress,
  t,
}: {
  request: Booking;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}) {
  const startTime = new Date(request.startDatetime);
  const endTime = new Date(request.endDatetime);
  const dateStr = startTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const durationStr = `${request.durationHours} hours`;
  const yourEarnings = request.totalPrice - request.platformFee;

  return (
    <Pressable onPress={onPress} className="rounded-2xl bg-white p-4">
      {/* Client Info */}
      <View className="flex-row items-center gap-3">
        <Image
          source={{
            uri:
              request.hirer.avatarUrl ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
          }}
          className="size-12 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="font-semibold text-midnight">
            {request.hirer.fullName}
          </Text>
          <Text className="text-xs text-text-tertiary">
            Trust: {request.hirer.trustScore}% • {getTimeAgo(request.createdAt)}
          </Text>
        </View>
        <Badge label={t('common.new')} variant="default" size="sm" />
      </View>

      {/* Booking Details */}
      <View className="mt-4 rounded-xl bg-softpink p-3">
        <Text className="font-semibold text-rose-400">
          {t(`companion.services.${request.occasionType}`)}
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
            "{request.specialRequests}"
          </Text>
        </View>
      )}

      {/* Earnings */}
      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-sm text-text-tertiary">
          {t('companion.requests.your_earnings')}
        </Text>
        <Text style={styles.earnings} className="text-xl text-teal-400">
          {formatVND(yourEarnings)}
        </Text>
      </View>

      {/* Actions */}
      <View className="mt-4 flex-row gap-3">
        <Pressable
          onPress={onDecline}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border-light py-3"
        >
          <XCircle color={colors.text.tertiary} width={20} height={20} />
          <Text className="font-semibold text-text-secondary">
            {t('companion.requests.decline')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-400 py-3"
        >
          <CheckCircle color="#FFFFFF" width={20} height={20} />
          <Text className="font-semibold text-white">
            {t('companion.requests.accept')}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function BookingRequests() {
  const router = useRouter();
  const { t } = useTranslation();
  const [requests, setRequests] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchRequests = React.useCallback(async () => {
    try {
      const data = await bookingsService.getBookingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch booking requests:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleAccept = React.useCallback(
    (requestId: string) => {
      Alert.alert(
        t('companion.requests.accept_booking'),
        t('companion.requests.accept_confirmation'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('companion.requests.accept'),
            onPress: async () => {
              try {
                await bookingsService.acceptBooking(requestId);
                setRequests((prev) => prev.filter((r) => r.id !== requestId));
                showMessage({
                  message: t('companion.requests.accept_success'),
                  type: 'success',
                });
              } catch (error) {
                console.error('Failed to accept booking:', error);
                showMessage({
                  message: t('errors.accept_failed'),
                  description: t('errors.try_again'),
                  type: 'danger',
                });
              }
            },
          },
        ]
      );
    },
    [t]
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
            onPress: async () => {
              try {
                await bookingsService.declineBooking(requestId, undefined);
                setRequests((prev) => prev.filter((r) => r.id !== requestId));
                showMessage({
                  message: t('companion.requests.decline_success'),
                  type: 'info',
                });
              } catch (error) {
                console.error('Failed to decline booking:', error);
                showMessage({
                  message: t('errors.decline_failed'),
                  description: t('errors.try_again'),
                  type: 'danger',
                });
              }
            },
          },
        ]
      );
    },
    [t]
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
          t={t}
        />
      </MotiView>
    ),
    [handleAccept, handleDecline, handleRequestPress, t]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text
            style={styles.headerTitle}
            className="flex-1 text-xl text-midnight"
          >
            {t('companion.requests.header')}
          </Text>
          <Badge label={`${requests.length}`} variant="default" size="sm" />
        </View>
      </SafeAreaView>

      {requests.length > 0 ? (
        <FlashList
          data={requests}
          renderItem={renderRequest}
          estimatedItemSize={350}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <View className="size-20 items-center justify-center rounded-full bg-lavender-400/20">
            <Calendar color={colors.lavender[400]} width={40} height={40} />
          </View>
          <Text
            style={styles.emptyTitle}
            className="mt-4 text-xl text-midnight"
          >
            {t('companion.requests.no_requests')}
          </Text>
          <Text className="mt-2 text-center text-text-secondary">
            {t('companion.requests.no_requests_description')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  earnings: {
    fontFamily: 'Urbanist_700Bold',
  },
  emptyTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
