/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

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
  MapPin,
  ShieldCheck,
} from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

// Booking steps
type BookingStep = 'details' | 'datetime' | 'payment';

// Mock companion data
const mockCompanion = {
  id: '1',
  name: 'Minh Anh',
  age: 24,
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  rating: 4.9,
  pricePerHour: 500000,
  isVerified: true,
};

// Mock occasion types
const occasionTypes = [
  { id: 'wedding', label: 'Wedding', icon: 'wedding-rings' },
  { id: 'family', label: 'Family Event', icon: 'family' },
  { id: 'tet', label: 'Tet Celebration', icon: 'mai-flower' },
  { id: 'corporate', label: 'Corporate', icon: 'briefcase' },
  { id: 'coffee', label: 'Coffee Date', icon: 'coffee' },
  { id: 'other', label: 'Other', icon: 'confetti' },
];

// Time slots
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export default function BookingFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = React.useState<BookingStep>('details');
  const [selectedOccasion, setSelectedOccasion] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState(2); // hours
  const [location, setLocation] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const companion = mockCompanion;

  const totalPrice = companion.pricePerHour * duration;
  const serviceFee = totalPrice * 0.18; // 18% commission
  const grandTotal = totalPrice + serviceFee;

  const handleBackPress = () => {
    if (step === 'details') {
      router.back();
    } else if (step === 'datetime') {
      setStep('details');
    } else {
      setStep('datetime');
    }
  };

  const handleNextPress = () => {
    if (step === 'details') {
      setStep('datetime');
    } else if (step === 'datetime') {
      setStep('payment');
    } else {
      // Submit booking
      router.push('/booking/confirmation' as Href);
    }
  };

  const canProceed = () => {
    if (step === 'details') {
      return selectedOccasion !== null;
    } else if (step === 'datetime') {
      return selectedDate !== null && selectedTime !== null;
    }
    return true;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'details':
        return 'Booking Details';
      case 'datetime':
        return 'Date & Time';
      case 'payment':
        return 'Confirm & Pay';
    }
  };

  const getNextButtonLabel = () => {
    switch (step) {
      case 'details':
        return 'Continue';
      case 'datetime':
        return 'Review Booking';
      case 'payment':
        return `Pay ${formatVND(grandTotal)}`;
    }
  };

  // Generate next 7 days
  const availableDates = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const formatDateShort = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
    };
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
            {getStepTitle()}
          </Text>
          <Text className="text-sm text-text-tertiary">
            Step {step === 'details' ? 1 : step === 'datetime' ? 2 : 3} of 3
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Companion Summary */}
        <View className="flex-row items-center gap-3 border-b border-border-light p-4">
          <Image
            source={{ uri: companion.image }}
            className="size-16 rounded-full"
            contentFit="cover"
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-midnight">
                {companion.name}, {companion.age}
              </Text>
              {companion.isVerified && (
                <ShieldCheck color={colors.teal[400]} width={16} height={16} />
              )}
            </View>
            <Text className="text-sm text-text-tertiary">
              {formatVND(companion.pricePerHour)}/hour
            </Text>
          </View>
        </View>

        {/* Step Content */}
        {step === 'details' && (
          <View className="gap-6 p-4">
            {/* Occasion Type */}
            <View>
              <Text className="mb-3 text-lg font-semibold text-midnight">
                What is the occasion?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {occasionTypes.map((occasion) => (
                  <Pressable
                    key={occasion.id}
                    onPress={() => setSelectedOccasion(occasion.id)}
                  >
                    <Badge
                      label={occasion.label}
                      variant={selectedOccasion === occasion.id ? 'default' : 'outline'}
                      size="lg"
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View>
              <Text className="mb-3 text-lg font-semibold text-midnight">
                How long do you need?
              </Text>
              <View className="flex-row gap-2">
                {[2, 3, 4, 5, 6].map((hours) => (
                  <Pressable
                    key={hours}
                    onPress={() => setDuration(hours)}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      duration === hours
                        ? 'border-rose-400 bg-softpink'
                        : 'border-border-light bg-white'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        duration === hours ? 'text-rose-400' : 'text-midnight'
                      }`}
                    >
                      {hours}h
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Location */}
            <View>
              <Text className="mb-3 text-lg font-semibold text-midnight">
                Meeting location
              </Text>
              <Pressable className="flex-row items-center gap-3 rounded-xl border border-border-light bg-white p-4">
                <MapPin color={colors.text.tertiary} width={20} height={20} />
                <Text className="flex-1 text-text-secondary">
                  {location || 'Add meeting location'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'datetime' && (
          <View className="gap-6 p-4">
            {/* Date Selection */}
            <View>
              <Text className="mb-3 text-lg font-semibold text-midnight">
                Select Date
              </Text>
              <View className="flex-row gap-2">
                {availableDates.map((date) => {
                  const { day, date: dateNum } = formatDateShort(date);
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  return (
                    <Pressable
                      key={date.toISOString()}
                      onPress={() => setSelectedDate(date)}
                      className={`flex-1 items-center rounded-xl border py-3 ${
                        isSelected
                          ? 'border-rose-400 bg-softpink'
                          : 'border-border-light bg-white'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isSelected ? 'text-rose-400' : 'text-text-tertiary'
                        }`}
                      >
                        {day}
                      </Text>
                      <Text
                        className={`text-lg font-semibold ${
                          isSelected ? 'text-rose-400' : 'text-midnight'
                        }`}
                      >
                        {dateNum}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Time Selection */}
            <View>
              <Text className="mb-3 text-lg font-semibold text-midnight">
                Select Time
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {timeSlots.map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    className={`rounded-xl border px-4 py-2 ${
                      selectedTime === time
                        ? 'border-rose-400 bg-softpink'
                        : 'border-border-light bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedTime === time ? 'text-rose-400' : 'text-midnight'
                      }`}
                    >
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration Display */}
            <View className="flex-row items-center gap-2 rounded-xl bg-lavender-400/20 p-4">
              <Clock color={colors.lavender[400]} width={20} height={20} />
              <Text className="text-midnight">
                Duration: <Text className="font-semibold">{duration} hours</Text>
              </Text>
            </View>
          </View>
        )}

        {step === 'payment' && (
          <View className="gap-6 p-4">
            {/* Booking Summary */}
            <View className="rounded-xl bg-softpink p-4">
              <Text className="mb-3 text-lg font-semibold text-midnight">
                Booking Summary
              </Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Occasion</Text>
                  <Text className="font-medium text-midnight">
                    {occasionTypes.find((o) => o.id === selectedOccasion)?.label}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Date</Text>
                  <Text className="font-medium text-midnight">
                    {selectedDate?.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Time</Text>
                  <Text className="font-medium text-midnight">{selectedTime}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Duration</Text>
                  <Text className="font-medium text-midnight">{duration} hours</Text>
                </View>
              </View>
            </View>

            {/* Price Breakdown */}
            <View className="rounded-xl border border-border-light bg-white p-4">
              <Text className="mb-3 text-lg font-semibold text-midnight">
                Price Details
              </Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">
                    {formatVND(companion.pricePerHour)} x {duration} hours
                  </Text>
                  <Text className="text-midnight">{formatVND(totalPrice)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Service fee</Text>
                  <Text className="text-midnight">{formatVND(serviceFee)}</Text>
                </View>
                <View className="my-2 h-px bg-border-light" />
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-midnight">Total</Text>
                  <Text className="text-lg font-bold text-rose-400">
                    {formatVND(grandTotal)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Escrow Notice */}
            <View className="flex-row items-start gap-3 rounded-xl bg-teal-400/10 p-4">
              <ShieldCheck color={colors.teal[400]} width={24} height={24} />
              <View className="flex-1">
                <Text className="font-semibold text-teal-400">
                  Secure Escrow Payment
                </Text>
                <Text className="mt-1 text-sm text-text-secondary">
                  Your payment is held securely until the booking is completed.
                  Full refund if cancelled 24+ hours before.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-warmwhite"
      >
        <View className="p-4">
          <Button
            label={getNextButtonLabel()}
            onPress={handleNextPress}
            disabled={!canProceed()}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
