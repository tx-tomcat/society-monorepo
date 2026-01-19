import { WelcomeScreen } from '@/components/auth';
import { useZaloLoginHandler } from '@/lib/hooks';

export default function Welcome() {
  const { handleLoginWithZalo, isLoading } = useZaloLoginHandler();

  return (
    <WelcomeScreen
      onLoginWithZalo={handleLoginWithZalo}
      isLoading={isLoading}
      testID="welcome-screen"
    />
  );
}
