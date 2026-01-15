/* eslint-disable max-lines-per-function */
import { useSignIn } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  showError,
  showErrorMessage,
  Text,
  View,
} from '@/components/ui';

// Back button icon
function BackIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path
        d="M17.5 21L10.5 14L17.5 7"
        stroke={colors.offwhite.DEFAULT}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function VerifyPhoneScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();

  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [loading, setLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(56);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);

  // Countdown timer
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
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

  const handleVerify = async (code?: string) => {
    if (!isLoaded || !signIn) return;

    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      showErrorMessage('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      // Attempt verification
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otpCode,
      });

      if (completeSignIn.status === 'complete') {
        // Set the active session
        await setActive({ session: completeSignIn.createdSessionId });

        // Navigate to main app
        router.replace('/(app)');
      } else {
        console.log('Sign in status:', completeSignIn.status);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showError(error);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn || countdown > 0) return;

    try {
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: signIn.supportedFirstFactors?.find(
          (f) => f.strategy === 'email_code'
        )?.emailAddressId as string,
      });

      setCountdown(56);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Resend code error:', error);
      showError(error);
    }
  };

  const isFormValid = otp.every((digit) => digit !== '');

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />
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
                className="font-bold leading-[1.4] text-offwhite"
                style={{
                  fontFamily: 'Urbanist_700Bold',
                  fontSize: 32,
                  letterSpacing: 0,
                }}
              >
                Enter OTP Code 🔐
              </Text>
              <Text
                className="leading-[1.6] tracking-[0.2px] text-platinum-400"
                style={{
                  fontFamily: 'Urbanist_400Regular',
                  fontSize: 18,
                }}
              >
                Enter the 6-digit code sent to {phoneNumber}
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View className="mb-8 flex-row gap-3">
              {otp.map((digit, index) => (
                <View
                  key={index}
                  className={`flex-1 items-center justify-center rounded-xl border py-4 ${
                    digit
                      ? 'border-neutral-700 bg-neutral-800'
                      : 'border-gold-400 bg-gold-900/20'
                  }`}
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
                    className="text-center text-2xl font-bold text-offwhite"
                    style={{
                      fontFamily: 'Urbanist_700Bold',
                      fontSize: 24,
                      letterSpacing: 0,
                    }}
                    placeholderTextColor={colors.neutral[600]}
                  />
                </View>
              ))}
            </View>

            {/* Countdown and Resend */}
            <View className="items-center gap-4">
              <Text
                className="text-center leading-[1.6] tracking-[0.2px] text-platinum-400"
                style={{
                  fontFamily: 'Urbanist_400Regular',
                  fontSize: 18,
                }}
              >
                You can resend the code in{' '}
                <Text style={{ color: colors.gold[400] }}>{countdown}</Text>{' '}
                seconds
              </Text>
              <Pressable
                onPress={handleResendCode}
                disabled={countdown > 0}
                testID="resend-button"
              >
                <Text
                  className="text-center font-semibold leading-[1.6] tracking-[0.2px]"
                  style={{
                    fontFamily: 'Urbanist_600SemiBold',
                    fontSize: 18,
                    color:
                      countdown > 0 ? colors.neutral[600] : colors.gold[400],
                  }}
                >
                  Resend code
                </Text>
              </Pressable>
            </View>

            <View className="h-24" />
          </ScrollView>

          {/* Bottom button */}
          <View className="border-t border-neutral-900 bg-midnight px-6 pb-9 pt-6">
            <Button
              testID="verify-button"
              label="Verify"
              onPress={() => handleVerify()}
              disabled={!isFormValid}
              loading={loading}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
