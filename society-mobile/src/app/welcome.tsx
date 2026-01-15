import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import { WelcomeScreen } from '@/components/auth';

export default function Welcome() {
  const router = useRouter();

  const handleGetStartedAsHirer = React.useCallback(() => {
    router.push('/hirer/auth/login' as Href);
  }, [router]);

  const handleGetStartedAsCompanion = React.useCallback(() => {
    router.push('/companion/auth/login' as Href);
  }, [router]);

  const handleLoginAsHirer = React.useCallback(() => {
    router.push('/hirer/auth/login' as Href);
  }, [router]);

  const handleLoginAsCompanion = React.useCallback(() => {
    router.push('/companion/auth/login' as Href);
  }, [router]);

  return (
    <WelcomeScreen
      onGetStartedAsHirer={handleGetStartedAsHirer}
      onGetStartedAsCompanion={handleGetStartedAsCompanion}
      onLoginAsHirer={handleLoginAsHirer}
      onLoginAsCompanion={handleLoginAsCompanion}
      testID="welcome-screen"
    />
  );
}
