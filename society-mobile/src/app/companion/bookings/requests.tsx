/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  XCircle,
} from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

type BookingRequest = {
  id: string;
  clientName: string;
  clientImage: string;
  clientRating: number;
  occasion: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  totalAmount: number;
  message?: string;
  requestedAt: string;
};

const MOCK_REQUESTS: BookingRequest[] = [
  {
    id: '1',
    clientName: 'Nguyen Van Minh',
    clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    clientRating: 4.8,
    occasion: 'Wedding Reception',
    date: 'January 20, 2025',
    time: '2:00 PM',
    duration: '4 hours',
    location: 'Rex Hotel, District 1, HCMC',
    totalAmount: 2200000,
    message: 'Looking for someone who can wear a formal red áo dài',
    requestedAt: '10 minutes ago',
  },
  {
    id: '2',
    clientName: 'Le Thi Hong',
    clientImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
    clientRating: 4.9,
    occasion: 'Tết Family Gathering',
    date: 'January 28, 2025',
    time: '10:00 AM',
    duration: '6 hours',
    location: 'Binh Thanh District',
    totalAmount: 3300000,
    requestedAt: '1 hour ago',
  },
];

function RequestCard({
  request,
  onAccept,
  onDecline,
  onPress,
  t,
}: {
  request: BookingRequest;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
  t: (key: string) => string;
}) {
  return (
    <Pressable onPress={onPress} className="rounded-2xl bg-white p-4">
      {/* Client Info */}
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: request.clientImage }}
          className="size-12 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="font-semibold text-midnight">{request.clientName}</Text>
          <Text className="text-xs text-text-tertiary">
            ⭐ {request.clientRating} • {request.requestedAt}
          </Text>
        </View>
        <Badge label={t('common.new')} variant="default" size="sm" />
      </View>

      {/* Booking Details */}
      <View className="mt-4 rounded-xl bg-softpink p-3">
        <Text className="font-semibold text-rose-400">{request.occasion}</Text>
        <View className="mt-2 gap-2">
          <View className="flex-row items-center gap-2">
            <Calendar color={colors.text.tertiary} width={14} height={14} />
            <Text className="text-sm text-text-secondary">{request.date}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock color={colors.text.tertiary} width={14} height={14} />
            <Text className="text-sm text-text-secondary">
              {request.time} ({request.duration})
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPin color={colors.text.tertiary} width={14} height={14} />
            <Text className="text-sm text-text-secondary">{request.location}</Text>
          </View>
        </View>
      </View>

      {/* Message */}
      {request.message && (
        <View className="mt-3 rounded-lg bg-lavender-400/10 p-3">
          <Text className="text-sm italic text-text-secondary">
            "{request.message}"
          </Text>
        </View>
      )}

      {/* Earnings */}
      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-sm text-text-tertiary">{t('companion.requests.your_earnings')}</Text>
        <Text style={styles.earnings} className="text-xl text-teal-400">
          {formatVND(request.totalAmount * 0.82)}
        </Text>
      </View>

      {/* Actions */}
      <View className="mt-4 flex-row gap-3">
        <Pressable
          onPress={onDecline}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border-light py-3"
        >
          <XCircle color={colors.text.tertiary} width={20} height={20} />
          <Text className="font-semibold text-text-secondary">{t('companion.requests.decline')}</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-400 py-3"
        >
          <CheckCircle color="#FFFFFF" width={20} height={20} />
          <Text className="font-semibold text-white">{t('companion.requests.accept')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function BookingRequests() {
  const router = useRouter();
  const { t } = useTranslation();
  const [requests, setRequests] = React.useState(MOCK_REQUESTS);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleAccept = React.useCallback((requestId: string) => {
    Alert.alert(
      t('companion.requests.accept_booking'),
      t('companion.requests.accept_confirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('companion.requests.accept'),
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            Alert.alert(t('common.success'), t('companion.requests.accept_success'));
          },
        },
      ]
    );
  }, [t]);

  const handleDecline = React.useCallback((requestId: string) => {
    Alert.alert(
      t('companion.requests.decline_booking'),
      t('companion.requests.decline_confirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('companion.requests.decline'),
          style: 'destructive',
          onPress: () => {
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
          },
        },
      ]
    );
  }, [t]);

  const handleRequestPress = React.useCallback(
    (request: BookingRequest) => {
      router.push(`/companion/bookings/${request.id}` as Href);
    },
    [router]
  );

  const renderRequest = React.useCallback(
    ({ item, index }: { item: BookingRequest; index: number }) => (
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
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
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
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <View className="size-20 items-center justify-center rounded-full bg-lavender-400/20">
            <Calendar color={colors.lavender[400]} width={40} height={40} />
          </View>
          <Text style={styles.emptyTitle} className="mt-4 text-xl text-midnight">
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
