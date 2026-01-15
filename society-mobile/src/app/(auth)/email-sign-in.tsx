/* eslint-disable max-lines-per-function */
import { useSignIn } from '@clerk/clerk-expo';
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
  colors,
  ControlledInput,
  FocusAwareStatusBar,
  SafeAreaView,
  showError,
  Text,
  View,
} from '@/components/ui';

const schema = z.object({
  email: z
    .string({
      message: 'Email is required',
    })
    .email('Invalid email format'),
});

export type FormType = z.infer<typeof schema>;

function EmailIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M3.33333 3.33334H16.6667C17.5833 3.33334 18.3333 4.08334 18.3333 5.00001V15C18.3333 15.9167 17.5833 16.6667 16.6667 16.6667H3.33333C2.41667 16.6667 1.66667 15.9167 1.66667 15V5.00001C1.66667 4.08334 2.41667 3.33334 3.33333 3.33334Z"
        stroke={colors.gold[400]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.3333 5L10 10.8333L1.66667 5"
        stroke={colors.gold[400]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
        fill="#FFC107"
      />
      <Path
        d="M3.15302 7.3455L6.43851 9.755C7.32751 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z"
        fill="#FF3D00"
      />
      <Path
        d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5717 17.5742 13.3037 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z"
        fill="#4CAF50"
      />
      <Path
        d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
        fill="#1976D2"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.05 20.28C16.07 21.23 15.06 21.08 14.1 20.7C13.09 20.31 12.16 20.28 11.11 20.7C9.79997 21.23 9.06997 21.08 8.19997 20.28C2.33997 14.25 3.20997 5.59 9.75997 5.31C11.28 5.39 12.38 6.16 13.32 6.22C14.71 5.95 16.05 5.16 17.53 5.26C19.28 5.39 20.61 6.11 21.5 7.44C17.89 9.57 18.73 14.33 22 15.69C21.27 17.54 20.35 19.38 17.05 20.29V20.28ZM13.23 5.25C13.08 3.02 14.94 1.18 17.03 1C17.3 3.57 14.62 5.5 13.23 5.25Z"
        fill={colors.offwhite.DEFAULT}
      />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 17.9895 4.3882 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9701 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.34 7.875 13.875 8.80008 13.875 9.75V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9895 24 12Z"
        fill="#1877F2"
      />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        fill={colors.offwhite.DEFAULT}
      />
    </Svg>
  );
}

export default function PhoneSignInScreen() {
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const { handleSubmit, control, watch } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const formValues = watch();
  const isFormValid = formValues.email && termsAccepted;

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: 'dungnd8594@gmail.com',
      });
      console.log(data.email);
      const emailCodeFactor = supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'email_code'
      );

      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.strategy,
        });

        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: data.email },
        });
      }
    } catch (error: any) {
      console.error('Email sign in error:', error);
      showError(error);
    } finally {
      setLoading(false);
    }
  };

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
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Content */}
            <View className="flex-1 px-6 pt-8">
              {/* Title Section */}
              <View className="mb-8 gap-2">
                <Text
                  className="font-bold leading-[1.4] text-offwhite"
                  style={styles.title}
                >
                  Join Society Today ✨
                </Text>
                <Text
                  className="leading-[1.6] tracking-[0.2px] text-platinum-400"
                  style={styles.subtitle}
                >
                  Create your account and start connecting with like-minded
                  people!
                </Text>
              </View>

              {/* Form */}
              <View className="gap-4">
                {/* Email Input */}
                <View className="gap-2">
                  <Text
                    className="font-semibold leading-[1.6] tracking-[0.2px] text-offwhite"
                    style={styles.label}
                  >
                    Email Address
                  </Text>
                  <View className="w-full flex-row items-center gap-3 rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[12px]">
                    <EmailIcon />
                    <ControlledInput
                      testID="email-input"
                      control={control}
                      name="email"
                      placeholder="Email Address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="w-full flex-1 border-0 bg-neutral-800 p-0 text-offwhite"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Terms Checkbox */}
                <View className="flex-row items-center gap-4">
                  <Pressable
                    className="size-6 items-center justify-center rounded-md border-[3px]"
                    style={{
                      borderColor: termsAccepted
                        ? colors.gold[400]
                        : colors.neutral[700],
                    }}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    testID="terms-checkbox"
                  >
                    {termsAccepted && (
                      <Svg width={12} height={12} viewBox="0 0 12 12">
                        <Path
                          d="M2 6L5 9L10 3"
                          stroke={colors.gold[400]}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </Pressable>
                  <Text
                    className="flex-1 leading-[1.6] tracking-[0.2px] text-offwhite"
                    style={styles.checkboxLabel}
                  >
                    I agree to Society{' '}
                    <Text
                      className="font-medium"
                      style={{ color: colors.gold[400] }}
                    >
                      Terms & Conditions
                    </Text>
                    .
                  </Text>
                </View>

                {/* Already have account */}
                <View className="flex-row items-center justify-center gap-2 pt-6">
                  <Text
                    className="leading-[1.6] tracking-[0.2px] text-offwhite"
                    style={styles.accountText}
                  >
                    Already have an account?
                  </Text>
                  <Pressable onPress={() => router.back()}>
                    <Text
                      className="font-semibold leading-[1.6] tracking-[0.2px]"
                      style={[styles.accountText, { color: colors.gold[400] }]}
                    >
                      Sign in
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Social Login */}
              <View className="mt-9 gap-6">
                {/* Divider */}
                <View className="flex-row items-center gap-4">
                  <View className="h-px flex-1 bg-neutral-800" />
                  <Text
                    className="text-center leading-[1.4] text-platinum-500"
                    style={styles.dividerText}
                  >
                    or continue with
                  </Text>
                  <View className="h-px flex-1 bg-neutral-800" />
                </View>

                {/* Social Buttons */}
                <View className="flex-row gap-4">
                  <Pressable className="h-[56px] w-[84px] items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <GoogleIcon />
                  </Pressable>
                  <Pressable className="h-[56px] w-[83px] items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <AppleIcon />
                  </Pressable>
                  <Pressable className="h-[56px] w-[84px] items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <FacebookIcon />
                  </Pressable>
                  <Pressable className="h-[56px] flex-1 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <XIcon />
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <View className="border-t border-neutral-900 bg-midnight px-6 pb-9 pt-6">
            <Button
              testID="signup-button"
              label="Sign up"
              onPress={handleSubmit(onSubmit)}
              disabled={!isFormValid}
              loading={loading}
              className="bg-gold-400"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 32,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 18,
  },
  label: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 18,
  },
  input: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 18,
  },
  checkboxLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 18,
  },
  accountText: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 18,
  },
  dividerText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 18,
  },
});
