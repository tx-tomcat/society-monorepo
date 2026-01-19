import { SplashScreen } from '@/components/auth';
import { useZaloLoginHandler } from '@/lib/hooks';

export default function CompanionSplash() {
  const { handleLoginWithZalo, isLoading } = useZaloLoginHandler();

  return (
    <SplashScreen
      userType="companion"
      onLoginWithZalo={handleLoginWithZalo}
      isLoading={isLoading}
      testID="companion-splash"
    />
  );
}
