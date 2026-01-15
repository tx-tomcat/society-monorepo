import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import {
  hirerVerificationSteps,
  IdentityVerificationScreen,
} from '@/components/auth';

export default function HirerVerifyIdentity() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleStepPress = React.useCallback((stepId: string) => {
    // Mark step as completed (in real app, this would launch verification flow)
    setCompletedSteps((prev) =>
      prev.includes(stepId) ? prev : [...prev, stepId]
    );
  }, []);

  const handleComplete = React.useCallback(() => {
    router.push('/(app)' as Href);
  }, [router]);

  const handleSkip = React.useCallback(() => {
    router.push('/(app)' as Href);
  }, [router]);

  return (
    <IdentityVerificationScreen
      userType="hirer"
      steps={hirerVerificationSteps}
      completedSteps={completedSteps}
      onBack={handleBack}
      onStepPress={handleStepPress}
      onComplete={handleComplete}
      onSkip={handleSkip}
      showSkipOption={true}
      showPrivacyNotice={true}
      showBenefits={true}
      testID="hirer-verify-identity"
    />
  );
}
