import { Tabs } from 'expo-router';
import React from 'react';

import { TabBar } from '@/components/ui/tab-bar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'For You',
          headerShown: false,
          tabBarButtonTestID: 'for-you-tab',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarButtonTestID: 'explore-tab',
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarButtonTestID: 'chats-tab',
        }}
      />

      <Tabs.Screen
        name="creation"
        options={{
          title: 'My Creation',
          headerShown: false,
          tabBarButtonTestID: 'creation-tab',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Account',
          headerShown: false,
          tabBarButtonTestID: 'account-tab',
        }}
      />
    </Tabs>
  );
}
