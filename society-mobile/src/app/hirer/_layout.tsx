import { Stack } from 'expo-router';

export default function HirerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="browse/index" />
      <Stack.Screen name="browse/for-you" />
      <Stack.Screen name="browse/search" />
      <Stack.Screen name="browse/filter" />
      <Stack.Screen name="companion/[id]" />
      <Stack.Screen name="companion/[id]/reviews" />
      <Stack.Screen name="booking/new" />
      <Stack.Screen name="booking/payment" />
      <Stack.Screen name="booking/confirmation" />
      <Stack.Screen name="chat/index" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="favorites/index" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="wallet/index" />
      <Stack.Screen name="wallet/topup" />
      <Stack.Screen name="payment-methods/index" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="settings/language" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
    </Stack>
  );
}
