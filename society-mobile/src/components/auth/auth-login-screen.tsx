/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  Apple,
  ArrowLeft,
  Facebook,
  Google,
  Mail,
  Phone,
  SocietyLogo,
} from '@/components/ui/icons';

import type { UserType } from './types';

export type { UserType };
type AuthMethod = 'phone' | 'email';

export type AuthLoginScreenProps = {
  userType: UserType;
  onBack: () => void;
  onContinue: (data: { method: AuthMethod; value: string }) => void;
  onSocialLogin?: (provider: 'google' | 'apple' | 'facebook') => void;
  onRegister?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  showRegisterLink?: boolean;
  testID?: string;
};

const themeConfig = {
  companion: {
    accentColor: colors.lavender[400],
    accentBgClass: 'bg-lavender-400/20',
    activeToggleBgClass: 'bg-lavender-400',
    activeToggleTextClass: 'text-white',
    buttonClassName: 'w-full bg-lavender-400',
    accentTextClass: 'text-lavender-400',
    logoContainerClass: 'mb-4 size-20 items-center justify-center rounded-full bg-lavender-400/20',
  },
  hirer: {
    accentColor: colors.rose[400],
    accentBgClass: 'bg-softpink',
    activeToggleBgClass: 'bg-white',
    activeToggleTextClass: 'text-rose-400',
    buttonClassName: 'w-full',
    accentTextClass: 'text-rose-400',
    logoContainerClass: 'mb-4 size-16 items-center justify-center rounded-2xl bg-softpink',
  },
} as const;

export function AuthLoginScreen({
  userType,
  onBack,
  onContinue,
  onSocialLogin,
  onRegister,
  onTermsPress,
  onPrivacyPress,
  showRegisterLink = false,
  testID,
}: AuthLoginScreenProps) {
  const { t } = useTranslation();
  const [authMethod, setAuthMethod] = React.useState<AuthMethod>('phone');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');

  const theme = themeConfig[userType];

  const isValid = authMethod === 'phone'
    ? phoneNumber.length >= 9
    : email.includes('@');

  const handleContinue = React.useCallback(() => {
    onContinue({
      method: authMethod,
      value: authMethod === 'phone' ? phoneNumber : email,
    });
  }, [authMethod, phoneNumber, email, onContinue]);

  return (
    <View className="flex-1 bg-warmwhite" testID={testID}>
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable onPress={onBack} testID={testID ? `${testID}-back` : undefined}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <View className="flex-1" />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="mb-8 items-center"
          >
            <View className={theme.logoContainerClass}>
              <SocietyLogo color={theme.accentColor} width={40} height={40} />
            </View>
            <Text style={styles.title} className="mb-2 text-center text-2xl text-midnight">
              {t(`auth.login.${userType}.title`)}
            </Text>
            <Text className="text-center text-base text-text-secondary">
              {t(`auth.login.${userType}.subtitle`)}
            </Text>
          </MotiView>

          {/* Auth Method Toggle */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
            className="mb-6 flex-row gap-2 rounded-xl bg-softpink p-1"
          >
            <Pressable
              onPress={() => setAuthMethod('phone')}
              testID={testID ? `${testID}-method-phone` : undefined}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-3 ${
                authMethod === 'phone' ? theme.activeToggleBgClass : ''
              }`}
            >
              <Phone
                color={authMethod === 'phone' ? (userType === 'companion' ? '#FFFFFF' : colors.rose[400]) : colors.text.secondary}
                width={18}
                height={18}
              />
              <Text
                className={`font-semibold ${
                  authMethod === 'phone' ? theme.activeToggleTextClass : 'text-text-secondary'
                }`}
              >
                {t('auth.login.phone')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAuthMethod('email')}
              testID={testID ? `${testID}-method-email` : undefined}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-3 ${
                authMethod === 'email' ? theme.activeToggleBgClass : ''
              }`}
            >
              <Mail
                color={authMethod === 'email' ? (userType === 'companion' ? '#FFFFFF' : colors.rose[400]) : colors.text.secondary}
                width={18}
                height={18}
              />
              <Text
                className={`font-semibold ${
                  authMethod === 'email' ? theme.activeToggleTextClass : 'text-text-secondary'
                }`}
              >
                {t('auth.login.email')}
              </Text>
            </Pressable>
          </MotiView>

          {/* Input Field */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            className="mb-6"
          >
            {authMethod === 'phone' ? (
              <View className="flex-row items-center rounded-xl border border-border-light bg-white px-4">
                <Text className="mr-2 text-base font-medium text-midnight">{t('auth.login.country_code')}</Text>
                <View className="mx-2 h-6 w-px bg-border-light" />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder={t('auth.login.phone_placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="phone-pad"
                  testID={testID ? `${testID}-phone-input` : undefined}
                  className="flex-1 py-4 text-base text-midnight"
                  style={styles.input}
                />
              </View>
            ) : (
              <View className="flex-row items-center rounded-xl border border-border-light bg-white px-4">
                <Mail color={colors.text.tertiary} width={20} height={20} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.login.email_placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID={testID ? `${testID}-email-input` : undefined}
                  className="flex-1 py-4 pl-3 text-base text-midnight"
                  style={styles.input}
                />
              </View>
            )}
          </MotiView>

          {/* Continue Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
          >
            <Button
              label={t('common.continue')}
              onPress={handleContinue}
              disabled={!isValid}
              variant="default"
              size="lg"
              fullWidth
              testID={testID ? `${testID}-continue` : undefined}
              className={theme.buttonClassName}
            />
          </MotiView>

          {/* Divider */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            className="my-8 flex-row items-center"
          >
            <View className="h-px flex-1 bg-border-light" />
            <Text className="mx-4 text-sm text-text-tertiary">{t('auth.login.or_continue_with')}</Text>
            <View className="h-px flex-1 bg-border-light" />
          </MotiView>

          {/* Social Login */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            className="flex-row justify-center gap-4"
          >
            <Pressable
              onPress={() => onSocialLogin?.('google')}
              testID={testID ? `${testID}-social-google` : undefined}
              className="size-14 items-center justify-center rounded-full border border-border-light bg-white"
            >
              <Google size={24} />
            </Pressable>
            <Pressable
              onPress={() => onSocialLogin?.('apple')}
              testID={testID ? `${testID}-social-apple` : undefined}
              className="size-14 items-center justify-center rounded-full border border-border-light bg-white"
            >
              <Apple color={colors.midnight.DEFAULT} size={24} />
            </Pressable>
            <Pressable
              onPress={() => onSocialLogin?.('facebook')}
              testID={testID ? `${testID}-social-facebook` : undefined}
              className="size-14 items-center justify-center rounded-full border border-border-light bg-white"
            >
              <Facebook size={24} />
            </Pressable>
          </MotiView>

          {/* Register Link or Terms */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
            className="mt-8"
          >
            {showRegisterLink ? (
              <Pressable onPress={onRegister} testID={testID ? `${testID}-register` : undefined}>
                <Text className="text-center text-base text-text-secondary">
                  {t('auth.login.no_account')}{' '}
                  <Text className={`font-bold ${theme.accentTextClass}`}>{t('auth.login.sign_up')}</Text>
                </Text>
              </Pressable>
            ) : (
              <Text className="text-center text-sm leading-relaxed text-text-tertiary">
                {t('auth.login.terms_agreement')}{' '}
                <Text
                  className={`font-semibold ${theme.accentTextClass}`}
                  onPress={onTermsPress}
                >
                  {t('auth.login.terms_of_service')}
                </Text>
                {' '}{t('common.and')}{' '}
                <Text
                  className={`font-semibold ${theme.accentTextClass}`}
                  onPress={onPrivacyPress}
                >
                  {t('auth.login.privacy_policy')}
                </Text>
              </Text>
            )}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
  },
  input: {
    fontFamily: 'Urbanist_500Medium',
  },
});
