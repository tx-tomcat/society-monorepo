/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Gps,
  Headset,
  Help,
  Info,
  Phone,
  Shield,
  ShieldCheck,
  Sos,
  Warning,
} from '@/components/ui/icons';

type SafetyFeature = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
};

export default function SafetyCenter() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  const handleSosPress = () => {
    Alert.alert(
      'Emergency SOS',
      'This will immediately alert our safety team and notify your emergency contacts with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'SOS Activated',
              'Emergency services have been notified. Stay calm, help is on the way.'
            );
          },
        },
      ]
    );
  };

  const safetyFeatures: SafetyFeature[] = [
    {
      id: 'gps-tracking',
      title: 'Live GPS Tracking',
      description: 'Share your real-time location during bookings',
      icon: <Gps color={colors.teal[400]} width={24} height={24} />,
      color: 'bg-teal-400/10',
      onPress: () =>
        Alert.alert(
          'GPS Tracking',
          'GPS tracking is enabled for all active bookings.'
        ),
    },
    {
      id: 'verified-profiles',
      title: 'Verified Profiles',
      description: 'All companions verified with zkTLS technology',
      icon: <ShieldCheck color={colors.teal[400]} width={24} height={24} />,
      color: 'bg-teal-400/10',
      onPress: () =>
        Alert.alert(
          'Verified Profiles',
          'We use zkTLS to verify identity without storing personal data.'
        ),
    },
    {
      id: 'escrow-payment',
      title: 'Secure Escrow',
      description: 'Payments held until booking completes',
      icon: <Shield color={colors.rose[400]} width={24} height={24} />,
      color: 'bg-softpink',
      onPress: () =>
        Alert.alert(
          'Escrow Payment',
          'Your payment is held securely and only released after successful booking completion.'
        ),
    },
    {
      id: 'emergency-contacts',
      title: 'Emergency Contacts',
      description: 'Set up trusted contacts for alerts',
      icon: <Phone color={colors.coral[400]} width={24} height={24} />,
      color: 'bg-coral-400/10',
      onPress: () =>
        Alert.alert(
          'Emergency Contacts',
          'Add up to 3 emergency contacts who will be notified in case of SOS.'
        ),
    },
  ];

  const supportOptions = [
    {
      id: 'live-support',
      title: '24/7 Live Support',
      description: 'Chat with our safety team anytime',
      icon: <Headset color={colors.rose[400]} width={24} height={24} />,
    },
    {
      id: 'safety-tips',
      title: 'Safety Tips',
      description: 'Best practices for safe meetups',
      icon: <Info color={colors.lavender[400]} width={24} height={24} />,
    },
    {
      id: 'report-issue',
      title: 'Report an Issue',
      description: 'Report inappropriate behavior',
      icon: <Warning color={colors.yellow[400]} width={24} height={24} />,
    },
    {
      id: 'faq',
      title: 'Safety FAQ',
      description: 'Common questions about safety',
      icon: <Help color={colors.text.tertiary} width={24} height={24} />,
    },
  ];

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
            Safety Center
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* SOS Section */}
        <View className="p-4">
          <Pressable
            onPress={handleSosPress}
            className="items-center gap-3 rounded-2xl bg-danger-500 p-6"
          >
            <View className="size-16 items-center justify-center rounded-full bg-white/20">
              <Sos color="#FFFFFF" width={32} height={32} />
            </View>
            <Text className="text-xl font-bold text-white">Emergency SOS</Text>
            <Text className="text-center text-sm text-white/80">
              Tap to immediately alert our safety team and your emergency
              contacts
            </Text>
          </Pressable>
        </View>

        {/* Safety Features */}
        <View className="px-4">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Safety Features
          </Text>
          <View className="gap-3">
            {safetyFeatures.map((feature) => (
              <Pressable
                key={feature.id}
                onPress={feature.onPress}
                className="flex-row items-center gap-4 rounded-xl bg-white p-4"
              >
                <View
                  className={`size-12 items-center justify-center rounded-full ${feature.color}`}
                >
                  {feature.icon}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-midnight">
                    {feature.title}
                  </Text>
                  <Text className="text-sm text-text-tertiary">
                    {feature.description}
                  </Text>
                </View>
                <ArrowRight
                  color={colors.text.tertiary}
                  width={20}
                  height={20}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Safety Status */}
        <View className="p-4">
          <View className="rounded-xl bg-teal-400/10 p-4">
            <View className="flex-row items-center gap-3">
              <ShieldCheck color={colors.teal[400]} width={24} height={24} />
              <View className="flex-1">
                <Text className="font-semibold text-teal-400">
                  All Systems Active
                </Text>
                <Text className="text-sm text-text-secondary">
                  GPS tracking, verified profiles, and escrow protection are
                  enabled
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support Options */}
        <View className="px-4 pb-8">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Get Help
          </Text>
          <View className="gap-3">
            {supportOptions.map((option) => (
              <Pressable
                key={option.id}
                className="flex-row items-center gap-4 rounded-xl bg-white p-4"
              >
                <View className="size-10 items-center justify-center rounded-full bg-softpink">
                  {option.icon}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-midnight">
                    {option.title}
                  </Text>
                  <Text className="text-sm text-text-tertiary">
                    {option.description}
                  </Text>
                </View>
                <ArrowRight
                  color={colors.text.tertiary}
                  width={20}
                  height={20}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Trust & Safety Info */}
        <View className="mx-4 mb-8 rounded-xl bg-lavender-900/20 p-4">
          <Text className="mb-2 font-semibold text-midnight">
            Our Commitment
          </Text>
          <Text className="text-sm leading-5 text-text-secondary">
            Hireme is committed to providing a safe platform for all users. We
            use advanced verification technology, secure payments, and 24/7
            monitoring to ensure every booking is safe and trustworthy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
