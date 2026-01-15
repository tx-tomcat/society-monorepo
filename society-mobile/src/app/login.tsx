/* eslint-disable max-lines-per-function */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';
import * as z from 'zod';

import {
  Button,
  colors,
  ControlledInput,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
} from '@/components/ui';
import {
  Apple,
  ArrowLeft,
  EyeOff,
  Facebook,
  Google,
  Lock,
  Mail,
  XLogo,
} from '@/components/ui/icons';
import { useAuth } from '@/lib';

const schema = z.object({
  email: z
    .string({
      message: 'Email is required',
    })
    .email('Invalid email format'),
  password: z
    .string({
      message: 'Password is required',
    })
    .min(6, 'Password must be at least 6 characters'),
});

export type FormType = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const signIn = useAuth.use.signIn();
  const [loading, setLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const { handleSubmit, control, watch } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'dung@gmail.com',
      password: '123123',
    },
  });

  const formValues = watch();
  const isFormValid = formValues.email && formValues.password;

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    setLoading(true);
    try {
      // Bypass authentication for now
      console.log('Login:', data, 'Remember me:', rememberMe);
      signIn({ access: 'access-token', refresh: 'refresh-token' });
      router.replace('/(app)');
    } catch (error) {
      console.error('Login error:', error);
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
            {/* Back Button */}
            <View className="px-6 py-3">
              <Pressable
                className="size-12 items-center justify-center"
                onPress={() => router.back()}
                testID="back-button"
              >
                <ArrowLeft color={colors.offwhite.DEFAULT} />
              </Pressable>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 pt-2">
              {/* Title Section */}
              <View className="mb-8 gap-2">
                <Text
                  className="font-bold leading-[1.4] text-offwhite"
                  style={styles.title}
                >
                  Welcome Back! 👋
                </Text>
                <Text
                  className="leading-[1.6] tracking-[0.2px] text-platinum-400"
                  style={styles.subtitle}
                >
                  Your AI-powered dating adventure awaits
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
                    Email
                  </Text>
                  <View className="w-full flex-row items-center gap-3 rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]">
                    <Mail />
                    <ControlledInput
                      testID="email-input"
                      control={control}
                      name="email"
                      placeholder="andrew.ainsley@yourdomain.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 border-0 bg-neutral-800 p-0 text-offwhite"
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="gap-2">
                  <Text
                    className="font-semibold leading-[1.6] tracking-[0.2px] text-offwhite"
                    style={styles.label}
                  >
                    Password
                  </Text>
                  <View className="w-full flex-row items-center gap-3 rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]">
                    <Lock />
                    <ControlledInput
                      testID="password-input"
                      control={control}
                      name="password"
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      className="flex-1 border-0 bg-neutral-800 p-0 text-offwhite"
                      style={styles.input}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      testID="toggle-password"
                    >
                      <EyeOff />
                    </Pressable>
                  </View>
                </View>

                {/* Remember Me & Forgot Password */}
                <View className="flex-row items-center justify-between">
                  <Pressable
                    className="flex-row items-center gap-4"
                    onPress={() => setRememberMe(!rememberMe)}
                    testID="remember-me-checkbox"
                  >
                    <View
                      className="size-6 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: rememberMe
                          ? colors.gold[400]
                          : 'transparent',
                        borderWidth: rememberMe ? 0 : 3,
                        borderColor: colors.neutral[700],
                      }}
                    >
                      {rememberMe && (
                        <Svg width={12} height={12} viewBox="0 0 12 12">
                          <Path
                            d="M2 6L5 9L10 3"
                            stroke={colors.white}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </View>
                    <Text
                      className="leading-[1.6] tracking-[0.2px] text-offwhite"
                      style={styles.checkboxLabel}
                    >
                      Remember me
                    </Text>
                  </Pressable>
                  <Pressable testID="forgot-password">
                    <Text
                      className="font-semibold leading-[1.6] tracking-[0.2px]"
                      style={[
                        styles.checkboxLabel,
                        { color: colors.gold[400] },
                      ]}
                    >
                      Forgot Password?
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Social Login */}
              <View className="mt-6 gap-6">
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
                    <Google />
                  </Pressable>
                  <Pressable className="h-[56px] w-[83px] items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <Apple />
                  </Pressable>
                  <Pressable className="h-[56px] w-[84px] items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <Facebook />
                  </Pressable>
                  <Pressable className="h-[56px] flex-1 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
                    <XLogo />
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <View className="border-t border-neutral-900 bg-midnight px-6 pb-9 pt-6">
            <Button
              testID="signin-button"
              label="Sign in"
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
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 18,
  },
  checkboxLabel: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 18,
  },
  dividerText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 18,
  },
});
