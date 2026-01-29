import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="account-security" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="subscription-success" />
      <Stack.Screen name="user-profile" />
    </Stack>
  );
}
