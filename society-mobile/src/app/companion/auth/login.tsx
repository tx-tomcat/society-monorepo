import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import { AuthLoginScreen } from '@/components/auth';

export default function CompanionLogin() {
  const router = useRouter();

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = React.useCallback(
    (_data: { method: 'phone' | 'email'; value: string }) => {
      // TODO: Send OTP to phone/email
      router.push('/companion/auth/verify-otp' as Href);
    },
    [router]
  );

  const handleSocialLogin = React.useCallback(
    (_provider: 'google' | 'apple' | 'facebook') => {
      // TODO: Implement social authentication
      console.log('Social login:', _provider);
    },
    []
  );

  const handleTermsPress = React.useCallback(() => {
    // TODO: Navigate to terms
    console.log('Terms pressed');
  }, []);

  const handlePrivacyPress = React.useCallback(() => {
    // TODO: Navigate to privacy policy
    console.log('Privacy pressed');
  }, []);

  return (
    <AuthLoginScreen
      userType="companion"
      onBack={handleBack}
      onContinue={handleContinue}
      onSocialLogin={handleSocialLogin}
      onTermsPress={handleTermsPress}
      onPrivacyPress={handlePrivacyPress}
      showRegisterLink={false}
      testID="companion-login"
    />
  );
}
