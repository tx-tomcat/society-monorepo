import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import { OTPVerificationScreen } from '@/components/auth';

export default function CompanionVerifyOTP() {
  const router = useRouter();

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleVerify = React.useCallback((_otp: string) => {
    // TODO: Verify OTP with backend
    router.push('/companion/auth/verify-identity' as Href);
  }, [router]);

  const handleResend = React.useCallback(() => {
    // TODO: Resend OTP
    console.log('Resending OTP');
  }, []);

  const handleGetHelp = React.useCallback(() => {
    // TODO: Navigate to help/support
    console.log('Get help pressed');
  }, []);

  return (
    <OTPVerificationScreen
      userType="companion"
      phoneNumber="+84 *** *** 123"
      onBack={handleBack}
      onVerify={handleVerify}
      onResend={handleResend}
      onGetHelp={handleGetHelp}
      testID="companion-verify-otp"
    />
  );
}
