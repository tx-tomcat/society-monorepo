import { Tabs } from 'expo-router';
import React from 'react';

import { HirerTabBar } from '@/components/ui/tab-bar';

export default function HirerTabLayout() {
  return (
    <Tabs tabBar={(props) => <HirerTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarButtonTestID: 'hirer-home-tab',
        }}
      />

      <Tabs.Screen
        name="for-you"
        options={{
          title: 'For You',
          headerShown: false,
          tabBarButtonTestID: 'hirer-for-you-tab',
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          headerShown: false,
          tabBarButtonTestID: 'hirer-bookings-tab',
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          headerShown: false,
          tabBarButtonTestID: 'hirer-chat-tab',
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerShown: false,
          tabBarButtonTestID: 'hirer-account-tab',
        }}
      />
    </Tabs>
  );
}
