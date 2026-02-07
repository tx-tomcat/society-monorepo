import type { FC } from 'react';
import React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { Text, View } from './index';

type IconComponent = FC<{ color?: string; width?: number; height?: number }>;

type StatCardProps = {
  label: string;
  value: string;
  icon: IconComponent;
  iconColor: string;
  iconBgColor: string;
  onPress?: () => void;
  testID?: string;
} & Omit<PressableProps, 'children'>;

export const StatCard = React.memo<StatCardProps>(
  ({ label, value, icon: Icon, iconColor, iconBgColor, onPress, testID, ...pressableProps }) => {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        className="flex-1 rounded-2xl bg-white p-4"
        {...pressableProps}
      >
        <View
          className="mb-2 size-10 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon color={iconColor} width={20} height={20} />
        </View>
        <Text className="font-urbanist-bold text-xl text-midnight">
          {value}
        </Text>
        <Text className="text-xs text-text-tertiary">
          {label}
        </Text>
      </Pressable>
    );
  }
);

StatCard.displayName = 'StatCard';
