import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Check, MessageCircle } from '@/components/ui/icons';
import {
  isValidVietnamPhone,
  usePhoneVerification,
} from '@/lib/hooks/use-phone-verification';

const OTP_LENGTH = 6;

export default function PhoneVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    error,
    isCodeSent,
    isSending,
    isVerifying,
    isSuccess,
    retryAfter,
    canResend,
    sendCode,
    verifyCode,
    reset,
    phoneNumber,
  } = usePhoneVerification();

  // Phone input state
  const [phone, setPhone] = React.useState('');
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  // OTP input state
  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpInputRefs = React.useRef<(RNTextInput | null)[]>([]);

  // Validate phone on change
  const handlePhoneChange = React.useCallback(
    (value: string) => {
      // Only allow digits and + symbol
      const cleaned = value.replace(/[^\d+]/g, '');
      setPhone(cleaned);

      if (cleaned.length > 0 && !isValidVietnamPhone(cleaned)) {
        setPhoneError(t('phone_verification.invalid_phone'));
      } else {
        setPhoneError(null);
      }
    },
    [t]
  );

  // Send verification code
  const handleSendCode = React.useCallback(async () => {
    if (!isValidVietnamPhone(phone)) {
      setPhoneError(t('phone_verification.invalid_phone'));
      return;
    }

    const result = await sendCode(phone);
    if (!result.success && result.error) {
      Alert.alert(t('common.error'), result.error);
    }
  }, [phone, sendCode, t]);

  // Handle OTP input
  const handleOtpChange = React.useCallback(
    (value: string, index: number) => {
      // Only allow single digit
      const digit = value.replace(/\D/g, '').slice(-1);

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus next input
      if (digit && index < OTP_LENGTH - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when complete
      if (digit && index === OTP_LENGTH - 1) {
        const code = newOtp.join('');
        if (code.length === OTP_LENGTH) {
          verifyCode(code);
        }
      }
    },
    [otp, verifyCode]
  );

  // Handle backspace
  const handleOtpKeyPress = React.useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  // Handle verification
  const handleVerify = React.useCallback(async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert(t('common.error'), t('phone_verification.enter_code'));
      return;
    }

    const result = await verifyCode(code);
    if (result.success) {
      // Navigate back or to next screen
      router.back();
    } else if (result.error) {
      Alert.alert(t('common.error'), result.error);
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      otpInputRefs.current[0]?.focus();
    }
  }, [otp, verifyCode, router, t]);

  // Handle resend
  const handleResend = React.useCallback(() => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    sendCode(phone);
  }, [canResend, phone, sendCode]);

  // Success state
  if (isSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite px-6">
        <FocusAwareStatusBar />
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-teal-100"
        >
          <Check color={colors.teal[500]} width={48} height={48} />
        </MotiView>
        <Text className="mb-2 text-center text-2xl font-bold text-midnight">
          {t('phone_verification.success_title')}
        </Text>
        <Text className="mb-8 text-center text-base text-text-secondary">
          {t('phone_verification.success_message')}
        </Text>
        <Button
          label={t('common.continue')}
          onPress={() => router.back()}
          variant="default"
          size="lg"
          fullWidth
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable onPress={() => (isCodeSent ? reset() : router.back())}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-black">
            {t('phone_verification.title')}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View className="flex-1 px-6 pt-8">
          {/* SMS Notice Badge */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="mb-8 flex-row items-center gap-3 rounded-xl bg-teal-50 p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <MessageCircle color={colors.teal[500]} width={24} height={24} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-teal-600">
                {t('phone_verification.sms_notice_title')}
              </Text>
              <Text className="text-xs text-teal-500">
                {t('phone_verification.sms_notice_desc')}
              </Text>
            </View>
          </MotiView>

          {!isCodeSent ? (
            // Phone Input Screen
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <Text className="mb-2 text-lg font-semibold text-midnight">
                {t('phone_verification.enter_phone')}
              </Text>
              <Text className="mb-6 text-sm text-text-secondary">
                {t('phone_verification.phone_description_sms')}
              </Text>

              <View className="mb-6 flex-row items-center">
                <View className="mr-3 rounded-xl border border-border-light bg-white px-4 py-4">
                  <Text className="text-lg font-semibold text-midnight">
                    +84
                  </Text>
                </View>
                <View className="flex-1">
                  <Input
                    placeholder="912 345 678"
                    value={phone.replace(/^\+?84/, '')}
                    onChangeText={(v) => handlePhoneChange('+84' + v)}
                    keyboardType="phone-pad"
                    error={phoneError || undefined}
                    autoFocus
                  />
                </View>
              </View>

              {error && (
                <View className="mb-4 rounded-lg bg-red-50 p-3">
                  <Text className="text-sm text-red-500">{error}</Text>
                </View>
              )}

              <Button
                label={t('phone_verification.send_code_sms')}
                onPress={handleSendCode}
                disabled={!isValidVietnamPhone(phone) || isSending}
                loading={isSending}
                variant="default"
                size="lg"
                fullWidth
              />
            </MotiView>
          ) : (
            // OTP Input Screen
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <Text className="mb-2 text-lg font-semibold text-midnight">
                {t('phone_verification.enter_code')}
              </Text>
              <Text className="mb-6 text-sm text-text-secondary">
                {t('phone_verification.code_sent_sms', { phone: phoneNumber })}
              </Text>

              {/* OTP Input Boxes */}
              <View className="mb-6 flex-row justify-between">
                {Array(OTP_LENGTH)
                  .fill(0)
                  .map((_, index) => (
                    <RNTextInput
                      key={index}
                      ref={(ref) => { otpInputRefs.current[index] = ref; }}
                      style={{ fontFamily: 'Urbanist_700Bold', color: colors.midnight.DEFAULT }}
                      className={`h-14 w-12 rounded-xl border-2 bg-white text-center text-2xl font-bold ${otp[index] ? 'border-rose-400' : 'border-border-light'
                        }`}
                      value={otp[index]}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
              </View>

              {error && (
                <View className="mb-4 rounded-lg bg-red-50 p-3">
                  <Text className="text-sm text-red-500">{error}</Text>
                </View>
              )}

              <Button
                label={t('phone_verification.verify')}
                onPress={handleVerify}
                disabled={otp.join('').length !== OTP_LENGTH || isVerifying}
                loading={isVerifying}
                variant="default"
                size="lg"
                fullWidth
              />

              {/* Resend Code */}
              <Pressable
                onPress={handleResend}
                disabled={!canResend}
                className="mt-4"
              >
                <Text
                  className={`text-center text-sm ${canResend ? 'text-rose-400' : 'text-text-tertiary'
                    }`}
                >
                  {canResend
                    ? t('phone_verification.resend_code')
                    : t('phone_verification.resend_in', { seconds: retryAfter })}
                </Text>
              </Pressable>
            </MotiView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

