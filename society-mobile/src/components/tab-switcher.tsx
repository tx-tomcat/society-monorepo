import * as React from 'react';
import { Pressable } from 'react-native';
import { tv } from 'tailwind-variants';

import { Text, View } from '@/components/ui';

const tabSwitcher = tv({
  slots: {
    container:
      'flex-row gap-0 rounded-md bg-neutral-100 p-0',
    tab: 'flex-1 items-center justify-center rounded-md px-3 py-2',
    tabText: 'text-base font-bold leading-[1.6] tracking-[0.2px]',
  },
  variants: {
    active: {
      true: {
        tab: 'bg-primary-400',
        tabText: 'text-midnight',
      },
      false: {
        tab: 'bg-transparent',
        tabText: 'text-midnight',
      },
    },
  },
});

export type Tab = {
  id: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  testID?: string;
};

export function TabSwitcher({ tabs, activeTab, onTabChange, testID }: Props) {
  const styles = tabSwitcher();

  return (
    <View className={styles.container()} testID={testID}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            className={styles.tab({ active: isActive })}
            onPress={() => onTabChange(tab.id)}
            testID={testID ? `${testID}-${tab.id}` : undefined}
          >
            <Text className={styles.tabText({ active: isActive })}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
