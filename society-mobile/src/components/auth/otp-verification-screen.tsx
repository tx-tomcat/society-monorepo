/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Mail } from '@/components/ui/icons';
import { isValidOtp } from '@/lib/validation';

import type { UserType } from './types';

export type { UserType };

export type OTPVerificationScreenProps = {
  userType?: UserType;
  email: string;
  onBack: () => void;
  onVerify: (otp: string) => void;
  onResend?: () => void;
  onGetHelp?: () => void;
  testID?: string;
};

const themeConfig = {
  companion: {
    accentColor: colors.lavender[400],
    accentBgClass: 'bg-lavender-400/20',
    accentBorderClass: 'border-lavender-400',
    accentInputBgClass: 'bg-lavender-400/10',
    accentTextClass: 'text-lavender-400',
    buttonClassName: 'w-full bg-lavender-400',
  },
  hirer: {
    accentColor: colors.rose[400],
    accentBgClass: 'bg-softpink',
    accentBorderClass: 'border-rose-400',
    accentInputBgClass: 'bg-softpink',
    accentTextClass: 'text-rose-400',
    buttonClassName: 'w-full',
  },
  neutral: {
    accentColor: colors.midnight.DEFAULT,
    accentBgClass: 'bg-midnight/10',
    accentBorderClass: 'border-midnight',
    accentInputBgClass: 'bg-midnight/5',
    accentTextClass: 'text-midnight',
    buttonClassName: 'w-full bg-midnight',
  },
} as const;

export function OTPVerificationScreen({
  userType = 'neutral',
  email,
  onBack,
  onVerify,
  onResend,
  onGetHelp,
  testID,
}: OTPVerificationScreenProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState(60);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);

  const theme = themeConfig[userType];

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = React.useCallback(
    (value: string, index: number) => {
      // Only allow numeric input
      const numericValue = value.replace(/[^0-9]/g, '').slice(-1);
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyPress = React.useCallback(
    (e: { nativeEvent: { key: string } }, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerify = React.useCallback(() => {
    const otpCode = otp.join('');
    if (isValidOtp(otpCode)) {
      onVerify(otpCode);
    }
  }, [otp, onVerify]);

  // Paste handler for clipboard OTP
  const handlePaste = React.useCallback((pastedText: string) => {
    const cleanedOtp = pastedText.replace(/[^0-9]/g, '').slice(0, 6);
    if (cleanedOtp.length === 6) {
      const newOtp = cleanedOtp.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  }, []);

  const handleResend = React.useCallback(() => {
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    onResend?.();
  }, [onResend]);

  const isComplete = otp.every((digit) => digit !== '');

  return (
    <View className="flex-1 bg-warmwhite" testID={testID}>
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable
            onPress={onBack}
            testID={testID ? `${testID}-back` : undefined}
          >
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <View className="flex-1" />
        </View>
      </SafeAreaView>

      <View className="flex-1 px-6">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-8 items-center"
        >
          <View
            className={`mb-4 size-20 items-center justify-center rounded-full ${theme.accentBgClass}`}
          >
            <Mail color={theme.accentColor} width={36} height={36} />
          </View>
          <Text
            style={styles.title}
            className="mb-2 text-center text-2xl text-midnight"
          >
            {t('auth.otp.title')}
          </Text>
          <Text className="text-center text-base text-text-secondary">
            {t('auth.otp.subtitle')}
            {'\n'}
            <Text className="font-semibold text-midnight">{email}</Text>
          </Text>
        </MotiView>

        {/* OTP Input */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-8 flex-row justify-center gap-3"
        >
          {otp.map((digit, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'timing',
                duration: 300,
                delay: 150 + index * 50,
              }}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                testID={testID ? `${testID}-otp-${index}` : undefined}
                value={digit}
                onChangeText={(value) =>
                  handleOtpChange(value.slice(-1), index)
                }
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                className={`size-14 rounded-xl border-2 text-center text-2xl font-bold ${
                  digit
                    ? `${theme.accentBorderClass} ${theme.accentInputBgClass}`
                    : 'border-border-light bg-white'
                }`}
                style={[
                  styles.otpInput,
                  { color: digit ? colors.midnight.DEFAULT : colors.text.tertiary },
                ]}
              />
            </MotiView>
          ))}
        </MotiView>

        {/* Resend */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-8 items-center"
        >
          {countdown > 0 ? (
            <Text className="text-text-tertiary">
              {t('auth.otp.resend_in')}{' '}
              <Text className={`font-semibold ${theme.accentTextClass}`}>
                {countdown}s
              </Text>
            </Text>
          ) : (
            <Pressable
              onPress={handleResend}
              testID={testID ? `${testID}-resend` : undefined}
            >
              <Text className={`font-semibold ${theme.accentTextClass}`}>
                {t('auth.otp.resend_code')}
              </Text>
            </Pressable>
          )}
        </MotiView>

        {/* Verify Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
        >
          <Button
            label={t('auth.otp.verify')}
            onPress={handleVerify}
            disabled={!isComplete}
            variant="default"
            size="lg"
            fullWidth
            className={theme.buttonClassName}
            testID={testID ? `${testID}-verify` : undefined}
          />
        </MotiView>

        {/* Help Text */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mt-6 items-center"
        >
          <Pressable
            onPress={onGetHelp}
            testID={testID ? `${testID}-help` : undefined}
          >
            <Text className="text-sm text-text-tertiary">
              {t('auth.otp.didnt_receive')}{' '}
              <Text className={`font-semibold ${theme.accentTextClass}`}>
                {t('auth.otp.get_help')}
              </Text>
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
  },
  otpInput: {
    fontFamily: 'Urbanist_700Bold',
  },
});
