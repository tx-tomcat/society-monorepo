import { SplashScreen } from '@/components/auth';
import { useZaloLoginHandler } from '@/lib/hooks';

export default function HirerSplash() {
  const { handleLoginWithZalo, isLoading } = useZaloLoginHandler();

  return (
    <SplashScreen
      userType="hirer"
      onLoginWithZalo={handleLoginWithZalo}
      isLoading={isLoading}
      testID="hirer-splash"
    />
  );
}
