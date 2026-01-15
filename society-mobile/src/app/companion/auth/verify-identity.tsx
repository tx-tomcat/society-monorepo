import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';

import {
  companionVerificationSteps,
  IdentityVerificationScreen,
} from '@/components/auth';

export default function CompanionVerifyIdentity() {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleStepPress = React.useCallback((stepId: string) => {
    // Toggle step completion (in real app, this would launch verification flow)
    setCompletedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  }, []);

  const handleComplete = React.useCallback(() => {
    router.push('/companion/onboard/create-profile' as Href);
  }, [router]);

  return (
    <IdentityVerificationScreen
      userType="companion"
      steps={companionVerificationSteps}
      completedSteps={completedSteps}
      onBack={handleBack}
      onStepPress={handleStepPress}
      onComplete={handleComplete}
      showSkipOption={false}
      showPrivacyNotice={true}
      showBenefits={false}
      testID="companion-verify-identity"
    />
  );
}
