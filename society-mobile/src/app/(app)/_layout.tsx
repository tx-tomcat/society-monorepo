import { Tabs } from 'expo-router';
import React from 'react';

import { HirerTabBar } from '@/components/ui/tab-bar';

export default function HirerTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <HirerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      backBehavior="history"
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="for-you" options={{ title: 'For You' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      {/* <Tabs.Screen name="chat" options={{ title: 'Chat' }} /> */}
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
