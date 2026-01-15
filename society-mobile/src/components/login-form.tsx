/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';
import * as z from 'zod';

import {
  Button,
  ControlledInput,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';

const schema = z.object({
  phoneOrEmail: z
    .string({
      message: 'Phone number or email is required',
    })
    .min(1, 'This field is required'),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  onSubmit?: SubmitHandler<FormType>;
};

// Back button icon
function BackIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path
        d="M17.5 21L10.5 14L17.5 7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const LoginForm = ({ onSubmit = () => {} }: LoginFormProps) => {
  const router = useRouter();
  const { handleSubmit, control, watch } = useForm<FormType>({
    resolver: zodResolver(schema),
  });

  const formValues = watch();
  const isFormValid = formValues.phoneOrEmail;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={10}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <Pressable
              className="mb-6 mt-4 size-12 items-center justify-center"
              onPress={() => router.back()}
              testID="back-button"
            >
              <BackIcon />
            </Pressable>

            {/* Header */}
            <View className="mb-8 gap-2">
              <Text
                className="text-3xl font-bold leading-[1.4] text-midnight"
                style={styles.title}
              >
                Forgot Your Password? 🔑
              </Text>
              <Text className="text-lg leading-[1.6] tracking-[0.2px] text-neutral-700">
                Enter the email associated with your Lovify account below.
                We&apos;ll send you a one-time verification code to reset your
                password.
              </Text>
            </View>

            {/* Form */}
            <View className="gap-8">
              {/* Email Input */}
              <ControlledInput
                testID="email-input"
                control={control}
                name="phoneOrEmail"
                label="Your Registered Email"
                placeholder="andrew.ainsley@yourdomain.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Spacer */}
            <View className="h-24" />
          </ScrollView>

          {/* Bottom button */}
          <View className="border-t border-neutral-200 bg-white px-6 pb-9 pt-6">
            <Button
              testID="send-otp-button"
              label="Send OTP Code"
              onPress={handleSubmit(onSubmit)}
              disabled={!isFormValid}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
});
