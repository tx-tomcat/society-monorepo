import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { CompanionTabBar } from '@/components/ui/tab-bar';

export default function CompanionTabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs tabBar={(props) => <CompanionTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.companion.home'),
          headerShown: false,
          tabBarButtonTestID: 'companion-home-tab',
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: t('tabs.companion.requests'),
          headerShown: false,
          tabBarButtonTestID: 'companion-requests-tab',
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.companion.schedule'),
          headerShown: false,
          tabBarButtonTestID: 'companion-schedule-tab',
        }}
      />

      <Tabs.Screen
        name="earnings"
        options={{
          title: t('tabs.companion.earnings'),
          headerShown: false,
          tabBarButtonTestID: 'companion-earnings-tab',
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.companion.account'),
          headerShown: false,
          tabBarButtonTestID: 'companion-account-tab',
        }}
      />
    </Tabs>
  );
}
