import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Calendar, CheckCircle, Clock, MapPin } from '@/components/ui/icons';
import { useCurrentUser } from '@/lib/hooks';

export default function BookingConfirmation() {
  const router = useRouter();
  const { data: userData } = useCurrentUser();

  const handleViewBooking = () => {
    router.push('/booking/active/1' as Href);
  };

  const handleBackToHome = () => {
    // Navigate to role-specific dashboard
    if (userData?.user?.role === 'COMPANION') {
      router.push('/companion/(app)' as Href);
    } else {
      router.push('/(app)' as Href);
    }
  };

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          {/* Success Icon */}
          <View className="mb-6 size-24 items-center justify-center rounded-full bg-teal-400/20">
            <CheckCircle color={colors.teal[400]} width={48} height={48} />
          </View>

          {/* Success Message */}
          <Text className="mb-2 text-2xl font-bold text-midnight">
            Booking Confirmed!
          </Text>
          <Text className="mb-8 text-center text-text-secondary">
            Your booking has been confirmed. The companion has been notified and
            will contact you shortly.
          </Text>

          {/* Booking Details Card */}
          <View className="mb-8 w-full rounded-2xl bg-softpink p-6">
            <Text className="mb-4 text-lg font-semibold text-midnight">
              Booking Details
            </Text>

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Calendar color={colors.rose[400]} width={20} height={20} />
                <Text className="text-midnight">Saturday, Jan 20, 2024</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Clock color={colors.rose[400]} width={20} height={20} />
                <Text className="text-midnight">14:00 - 17:00 (3 hours)</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <MapPin color={colors.rose[400]} width={20} height={20} />
                <Text className="text-midnight">
                  District 1, Ho Chi Minh City
                </Text>
              </View>
            </View>

            <View className="mt-4 border-t border-border-light pt-4">
              <View className="flex-row justify-between">
                <Text className="text-text-secondary">Total Paid</Text>
                <Text className="text-lg font-bold text-rose-400">
                  1,770,000 VND
                </Text>
              </View>
            </View>
          </View>

          {/* Safety Reminder */}
          <View className="mb-6 w-full rounded-xl bg-lavender-400/20 p-4">
            <Text className="text-center text-sm text-midnight">
              Remember to check in when you meet using the GPS feature for your
              safety.
            </Text>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View className="gap-3 px-6 pb-4">
          <Button label="View Booking" onPress={handleViewBooking} />
          <Button
            label="Back to Home"
            variant="outline"
            onPress={handleBackToHome}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
