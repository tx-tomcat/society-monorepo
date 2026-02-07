/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, CheckCircle, Phone } from '@/components/ui/icons';
import {
  isValidVietnamPhone,
  usePhoneVerification,
} from '@/lib/hooks';

export default function HirerPhoneVerification() {
  const router = useRouter();
  const { t } = useTranslation();

  const {
    verificationState,
    error,
    phoneNumber,
    retryAfter,
    isCodeSent,
    isSending,
    isVerifying,
    isSuccess,
    canResend,
    sendCode,
    verifyCode,
    reset,
  } = usePhoneVerification();

  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');

  const isPhoneValid = React.useMemo(
    () => phone.length > 0 && isValidVietnamPhone(phone),
    [phone]
  );

  const handleBack = React.useCallback(() => {
    if (isCodeSent) {
      reset();
      setOtp('');
    } else {
      router.back();
    }
  }, [isCodeSent, reset, router]);

  const handleSendCode = React.useCallback(async () => {
    if (!isPhoneValid) return;
    const result = await sendCode(phone);
    if (!result.success && result.error) {
      Alert.alert(t('common.error'), result.error);
    }
  }, [phone, isPhoneValid, sendCode, t]);

  const handleVerifyCode = React.useCallback(async () => {
    if (otp.length !== 6) return;
    const result = await verifyCode(otp);
    if (!result.success && result.error) {
      Alert.alert(t('common.error'), result.error);
    }
  }, [otp, verifyCode, t]);

  // Auto-navigate on success
  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.replace('/(app)' as Href);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-black">
            {t('onboarding.phone.header')}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View className="flex-1 px-6 pt-6">
          {isSuccess ? (
            /* Success State */
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 }}
              className="flex-1 items-center justify-center"
            >
              <View className="size-20 items-center justify-center rounded-full bg-teal-400/20">
                <CheckCircle color={colors.teal[400]} width={40} height={40} />
              </View>
              <Text className="mt-4 font-urbanist-bold text-xl text-midnight">
                {t('onboarding.phone.verified')}
              </Text>
            </MotiView>
          ) : !isCodeSent ? (
            /* Phase 1: Phone Input */
            <>
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                className="mb-8"
              >
                <View className="mb-4 size-16 items-center justify-center rounded-full bg-rose-400/10">
                  <Phone color={colors.rose[400]} width={28} height={28} />
                </View>
                <Text className="font-urbanist-bold text-2xl text-midnight">
                  {t('onboarding.phone.title')}
                </Text>
                <Text className="mt-2 text-sm text-text-secondary">
                  {t('onboarding.phone.subtitle')}
                </Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
                className="mb-6"
              >
                <View className="flex-row items-center rounded-xl border border-border-light bg-white">
                  <View className="border-r border-border-light px-4 py-4">
                    <Text className="font-urbanist-semibold text-base text-midnight">
                      +84
                    </Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={t('onboarding.phone.phone_placeholder')}
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="phone-pad"
                    autoFocus
                    className="flex-1 px-4 py-4 text-base"
                    style={{
                      fontFamily: 'Urbanist_500Medium',
                      color: colors.midnight.DEFAULT,
                    }}
                    maxLength={12}
                  />
                </View>
                {phone.length > 0 && !isPhoneValid && (
                  <Text className="mt-2 text-sm text-danger-400">
                    {t('onboarding.phone.invalid_phone')}
                  </Text>
                )}
                {error && verificationState === 'error' && (
                  <Text className="mt-2 text-sm text-danger-400">{error}</Text>
                )}
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
              >
                <Button
                  label={t('onboarding.phone.send_code')}
                  onPress={handleSendCode}
                  disabled={!isPhoneValid || isSending}
                  loading={isSending}
                  variant="default"
                  size="lg"
                  fullWidth
                />
              </MotiView>
            </>
          ) : (
            /* Phase 2: OTP Input */
            <>
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                className="mb-8"
              >
                <Text className="font-urbanist-bold text-2xl text-midnight">
                  {t('onboarding.phone.enter_code')}
                </Text>
                <Text className="mt-2 text-sm text-text-secondary">
                  {t('onboarding.phone.code_sent', { phone: phoneNumber })}
                </Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
                className="mb-6"
              >
                <TextInput
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  autoFocus
                  className="rounded-xl border border-border-light bg-white px-4 py-4 text-center text-2xl tracking-[12px]"
                  style={{
                    fontFamily: 'Urbanist_700Bold',
                    color: colors.midnight.DEFAULT,
                  }}
                  maxLength={6}
                />
                {error && verificationState === 'error' && (
                  <Text className="mt-2 text-center text-sm text-danger-400">
                    {error}
                  </Text>
                )}
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
                className="gap-4"
              >
                <Button
                  label={t('onboarding.phone.verify_code')}
                  onPress={handleVerifyCode}
                  disabled={otp.length !== 6 || isVerifying}
                  loading={isVerifying}
                  variant="default"
                  size="lg"
                  fullWidth
                />

                <Button
                  label={
                    canResend
                      ? t('onboarding.phone.resend_code')
                      : t('onboarding.phone.resend_in', {
                          seconds: retryAfter,
                        })
                  }
                  onPress={() => sendCode(phone)}
                  disabled={!canResend || isSending}
                  variant="outline"
                  size="lg"
                  fullWidth
                />
              </MotiView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
