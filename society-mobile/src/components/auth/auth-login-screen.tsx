import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
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
  SocietyLogo,
} from '@/components/ui/icons';
import { isValidEmail } from '@/lib/validation';

import type { UserType } from './types';

export type { UserType };

export type AuthLoginScreenProps = {
  userType?: UserType;
  onBack: () => void;
  onContinue: (data: { method: 'email'; value: string }) => void;
  onSocialLogin?: (provider: 'google' | 'apple' | 'facebook') => void;
  onRegister?: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  showRegisterLink?: boolean;
  testID?: string;
};

const themeConfig = {
  hirer: {
    accentColor: colors.rose[400],
    accentBgClass: 'bg-softpink',
    activeToggleBgClass: 'bg-white',
    activeToggleTextClass: 'text-rose-400',
    activeIconColor: colors.rose[400],
    buttonClassName: 'w-full',
    accentTextClass: 'text-rose-400',
    logoContainerClass:
      'mb-4 size-16 items-center justify-center rounded-2xl bg-softpink',
  },
} as const;

export function AuthLoginScreen({
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
  const [email, setEmail] = React.useState('');

  const theme = themeConfig['hirer'];
  const [error, setError] = React.useState<string>('');

  // Validate email
  const isValid = React.useMemo(() => {
    return isValidEmail(email);
  }, [email]);

  // Clear error when input changes
  React.useEffect(() => {
    setError('');
  }, [email]);

  // Get validation error message
  const getValidationError = React.useCallback((): string => {
    if (email.length > 0 && !isValidEmail(email)) {
      return t('auth.validation.email_invalid');
    }
    return '';
  }, [email, t]);

  const validationError = getValidationError();

  const handleContinue = React.useCallback(() => {
    if (!isValid) {
      setError(getValidationError());
      return;
    }
    onContinue({
      method: 'email',
      value: email,
    });
  }, [email, isValid, getValidationError, onContinue]);

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
            <Text
              style={styles.title}
              className="mb-2 text-center text-2xl text-midnight"
            >
              {t(`auth.login.title`)}
            </Text>
            <Text className="text-center text-base text-text-secondary">
              {t(`auth.login.subtitle`)}
            </Text>
          </MotiView>

          {/* Email Input */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
            className="mb-6"
          >
            <View>
              <View
                className={`flex-row items-center rounded-xl border bg-white px-4 ${
                  validationError || error
                    ? 'border-red-400'
                    : 'border-border-light'
                }`}
              >
                <Mail
                  color={
                    validationError || error
                      ? colors.rose[400]
                      : colors.text.tertiary
                  }
                  width={20}
                  height={20}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.login.email_placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  testID={testID ? `${testID}-email-input` : undefined}
                  className="flex-1 py-4 pl-3 text-base"
                  style={[styles.input, { color: colors.midnight.DEFAULT }]}
                />
              </View>
              {(validationError || error) && (
                <Text className="mt-2 text-sm text-red-400">
                  {validationError || error}
                </Text>
              )}
            </View>
          </MotiView>

          {/* Continue Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
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
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            className="my-8 flex-row items-center"
          >
            <View className="h-px flex-1 bg-border-light" />
            <Text className="mx-4 text-sm text-text-tertiary">
              {t('auth.login.or_continue_with')}
            </Text>
            <View className="h-px flex-1 bg-border-light" />
          </MotiView>

          {/* Social Login */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
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
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            className="mt-8"
          >
            {showRegisterLink ? (
              <Pressable
                onPress={onRegister}
                testID={testID ? `${testID}-register` : undefined}
              >
                <Text className="text-center text-base text-text-secondary">
                  {t('auth.login.no_account')}{' '}
                  <Text className={`font-bold ${theme.accentTextClass}`}>
                    {t('auth.login.sign_up')}
                  </Text>
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
                </Text>{' '}
                {t('common.and')}{' '}
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
