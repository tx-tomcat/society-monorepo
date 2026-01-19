/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';

import { Button, SafeAreaView, Text, View } from '@/components/ui';

export type OTPFormType = {
  otp: string;
};

export type OTPVerificationFormProps = {
  onSubmit?: SubmitHandler<OTPFormType>;
  onResendCode?: () => void;
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

export const OTPVerificationForm = ({
  onSubmit = () => {},
  onResendCode = () => {},
}: OTPVerificationFormProps) => {
  const router = useRouter();
  const { handleSubmit } = useForm<OTPFormType>();
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const [countdown, setCountdown] = React.useState(56);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);

  // Countdown timer
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== '') && index === 3) {
      onSubmit({ otp: newOtp.join('') });
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = () => {
    setCountdown(56);
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();
    onResendCode();
  };

  const isFormValid = otp.every((digit) => digit !== '');

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
                style={{ fontFamily: 'Urbanist_700Bold', letterSpacing: 0 }}
              >
                Enter OTP Code 🔐
              </Text>
              <Text className="text-lg leading-[1.6] tracking-[0.2px] text-neutral-700">
                Check your email inbox for a message from Hireme. Enter the
                one-time verification code below to proceed with resetting your
                password.
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View className="mb-8 flex-row gap-4">
              {otp.map((digit, index) => (
                <View
                  key={index}
                  className={`flex-1 items-center justify-center rounded-xl border ${
                    digit
                      ? 'border-neutral-300 bg-offwhite'
                      : 'border-brand-400 bg-brand-50'
                  } py-4`}
                >
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    testID={`otp-input-${index}`}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className="text-center text-2xl font-bold"
                    style={{ fontFamily: 'Urbanist_700Bold', letterSpacing: 0, color: '#1E1B4B' }}
                  />
                </View>
              ))}
            </View>

            {/* Countdown and Resend */}
            <View className="items-center gap-4">
              <Text className="text-center text-lg leading-[1.6] tracking-[0.2px] text-neutral-700">
                You can resend the code in{' '}
                <Text className="text-brand-400">{countdown}</Text> seconds
              </Text>
              <Pressable
                onPress={handleResendCode}
                disabled={countdown > 0}
                testID="resend-button"
              >
                <Text
                  className={`text-center text-lg font-semibold leading-[1.6] tracking-[0.2px] ${
                    countdown > 0 ? 'text-neutral-400' : 'text-brand-400'
                  }`}
                >
                  Resend code
                </Text>
              </Pressable>
            </View>

            {/* Spacer */}
            <View className="h-24" />
          </ScrollView>

          {/* Bottom button */}
          <View className="border-t border-neutral-200 bg-white px-6 pb-9 pt-6">
            <Button
              testID="verify-button"
              label="Verify"
              onPress={handleSubmit(() => onSubmit({ otp: otp.join('') }))}
              disabled={!isFormValid}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};
