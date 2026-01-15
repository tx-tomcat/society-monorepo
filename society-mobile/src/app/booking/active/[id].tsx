/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';

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
  Clock,
  Gps,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sos,
} from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

type BookingStatus = 'upcoming' | 'checked_in' | 'in_progress' | 'completed';

// Mock booking data
const mockBooking = {
  id: '1',
  status: 'in_progress' as BookingStatus,
  companion: {
    id: '1',
    name: 'Minh Anh',
    age: 24,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    phone: '+84 123 456 789',
    isVerified: true,
  },
  occasion: 'Wedding',
  date: 'Saturday, Jan 20, 2024',
  time: '14:00 - 17:00',
  duration: 3,
  location: 'Rex Hotel, District 1, Ho Chi Minh City',
  totalPaid: 1770000,
  checkedInAt: '14:05',
  lastCheckIn: '15:30',
};

export default function ActiveBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isCheckedIn, setIsCheckedIn] = React.useState(true);
  const [lastGpsUpdate, setLastGpsUpdate] = React.useState(mockBooking.lastCheckIn);

  const booking = mockBooking;

  const handleBackPress = () => {
    router.back();
  };

  const handleGpsCheckIn = () => {
    // Simulate GPS check-in
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    setLastGpsUpdate(timeString);
    setIsCheckedIn(true);
    Alert.alert('GPS Check-in', 'Your location has been updated successfully.');
  };

  const handleSosPress = () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to send an emergency alert? This will notify our safety team and your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual SOS functionality
            Alert.alert(
              'SOS Sent',
              'Emergency services have been notified. Stay calm, help is on the way.'
            );
          },
        },
      ]
    );
  };

  const handleCallPress = () => {
    // TODO: Implement call functionality
    Alert.alert('Call', `Calling ${booking.companion.name}...`);
  };

  const handleMessagePress = () => {
    router.push(`/chat/${booking.companion.id}` as Href);
  };

  const handleEndBooking = () => {
    Alert.alert(
      'End Booking',
      'Are you sure you want to end this booking? Payment will be released to the companion.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Booking',
          onPress: () => {
            router.push('/booking/review/1' as Href);
          },
        },
      ]
    );
  };

  const handleSafetyCenter = () => {
    router.push('/safety' as Href);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'upcoming':
        return 'lavender';
      case 'checked_in':
      case 'in_progress':
        return 'teal';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'checked_in':
        return 'Checked In';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBackPress}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-midnight">
            Active Booking
          </Text>
          <Badge
            label={getStatusLabel(booking.status)}
            variant={getStatusColor(booking.status)}
          />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Companion Card */}
        <View className="border-b border-border-light p-4">
          <View className="flex-row items-center gap-4">
            <Image
              source={{ uri: booking.companion.image }}
              className="size-20 rounded-full"
              contentFit="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-midnight">
                  {booking.companion.name}
                </Text>
                {booking.companion.isVerified && (
                  <ShieldCheck color={colors.teal[400]} width={18} height={18} />
                )}
              </View>
              <Text className="text-sm text-text-tertiary">Your companion</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={handleCallPress}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-softpink py-3"
            >
              <Phone color={colors.rose[400]} width={20} height={20} />
              <Text className="font-semibold text-rose-400">Call</Text>
            </Pressable>
            <Pressable
              onPress={handleMessagePress}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-softpink py-3"
            >
              <MessageCircle color={colors.rose[400]} width={20} height={20} />
              <Text className="font-semibold text-rose-400">Message</Text>
            </Pressable>
          </View>
        </View>

        {/* GPS Check-in Section */}
        <View className="border-b border-border-light p-4">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Safety Check-in
          </Text>
          <View className="rounded-xl bg-teal-400/10 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full bg-teal-400">
                  <Gps color="#FFFFFF" width={24} height={24} />
                </View>
                <View>
                  <Text className="font-semibold text-midnight">GPS Active</Text>
                  <Text className="text-sm text-text-tertiary">
                    Last update: {lastGpsUpdate}
                  </Text>
                </View>
              </View>
              <Button
                label="Update"
                size="sm"
                variant="teal"
                onPress={handleGpsCheckIn}
              />
            </View>
          </View>

          {/* SOS Button */}
          <Pressable
            onPress={handleSosPress}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-danger-500 py-4"
          >
            <Sos color="#FFFFFF" width={24} height={24} />
            <Text className="text-lg font-bold text-white">Emergency SOS</Text>
          </Pressable>

          <Pressable
            onPress={handleSafetyCenter}
            className="mt-3 items-center"
          >
            <Text className="text-sm text-rose-400">Go to Safety Center</Text>
          </Pressable>
        </View>

        {/* Booking Details */}
        <View className="p-4">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Booking Details
          </Text>
          <View className="gap-3 rounded-xl bg-softpink p-4">
            <View className="flex-row items-center gap-3">
              <Calendar color={colors.rose[400]} width={20} height={20} />
              <Text className="text-midnight">{booking.date}</Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Clock color={colors.rose[400]} width={20} height={20} />
              <Text className="text-midnight">
                {booking.time} ({booking.duration} hours)
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <MapPin color={colors.rose[400]} width={20} height={20} />
              <Text className="flex-1 text-midnight">{booking.location}</Text>
            </View>

            <View className="mt-2 border-t border-border-light pt-3">
              <View className="flex-row justify-between">
                <Text className="text-text-secondary">Occasion</Text>
                <Text className="font-medium text-midnight">{booking.occasion}</Text>
              </View>
              <View className="mt-2 flex-row justify-between">
                <Text className="text-text-secondary">Total Paid</Text>
                <Text className="font-bold text-rose-400">
                  {formatVND(booking.totalPaid)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View className="px-4 pb-4">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Timeline
          </Text>
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="items-center">
                <View className="size-3 rounded-full bg-teal-400" />
                <View className="mt-1 h-8 w-0.5 bg-teal-400" />
              </View>
              <View>
                <Text className="font-medium text-midnight">Booking started</Text>
                <Text className="text-sm text-text-tertiary">14:00</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="items-center">
                <View className="size-3 rounded-full bg-teal-400" />
                <View className="mt-1 h-8 w-0.5 bg-teal-400" />
              </View>
              <View>
                <Text className="font-medium text-midnight">GPS check-in</Text>
                <Text className="text-sm text-text-tertiary">{booking.checkedInAt}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="items-center">
                <View className="size-3 rounded-full bg-lavender-400" />
              </View>
              <View>
                <Text className="font-medium text-midnight">Booking ends</Text>
                <Text className="text-sm text-text-tertiary">17:00</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-24" />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute inset-x-0 bottom-0 border-t border-border-light bg-warmwhite"
      >
        <View className="p-4">
          <Button
            label="End Booking & Review"
            variant="coral"
            onPress={handleEndBooking}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
