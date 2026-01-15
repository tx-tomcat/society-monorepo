import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import { AuthLoginScreen } from '@/components/auth';

export default function HirerLogin() {
  const router = useRouter();

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = React.useCallback(
    (_data: { method: 'phone' | 'email'; value: string }) => {
      // TODO: Send OTP to phone/email
      router.push('/hirer/auth/verify-otp' as Href);
    },
    [router]
  );

  const handleSocialLogin = React.useCallback(
    (provider: 'google' | 'apple' | 'facebook') => {
      // TODO: Implement social authentication
      console.log('Social login:', provider);
      // Navigate to home after social auth
      router.push('/(app)' as Href);
    },
    [router]
  );

  const handleRegister = React.useCallback(() => {
    router.push('/hirer/auth/register' as Href);
  }, [router]);

  return (
    <AuthLoginScreen
      userType="hirer"
      onBack={handleBack}
      onContinue={handleContinue}
      onSocialLogin={handleSocialLogin}
      onRegister={handleRegister}
      showRegisterLink={true}
      testID="hirer-login"
    />
  );
}
