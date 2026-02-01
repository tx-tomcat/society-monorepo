import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HirerTabBar } from '@/components/ui/tab-bar';

export default function HirerTabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <HirerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      backBehavior="history"
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.hirer.home') }} />
      <Tabs.Screen name="for-you" options={{ title: t('tabs.hirer.for_you') }} />
      <Tabs.Screen name="bookings" options={{ title: t('tabs.hirer.bookings') }} />
      {/* <Tabs.Screen name="chat" options={{ title: 'Chat' }} /> */}
      <Tabs.Screen name="account" options={{ title: t('tabs.hirer.account') }} />
    </Tabs>
  );
}
