import { Tabs } from 'expo-router';
import React from 'react';

import { CompanionTabBar } from '@/components/ui/tab-bar';

export default function CompanionTabLayout() {
  return (
    <Tabs tabBar={(props) => <CompanionTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarButtonTestID: 'companion-home-tab',
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          headerShown: false,
          tabBarButtonTestID: 'companion-requests-tab',
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          headerShown: false,
          tabBarButtonTestID: 'companion-schedule-tab',
        }}
      />

      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          headerShown: false,
          tabBarButtonTestID: 'companion-earnings-tab',
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerShown: false,
          tabBarButtonTestID: 'companion-account-tab',
        }}
      />
    </Tabs>
  );
}
