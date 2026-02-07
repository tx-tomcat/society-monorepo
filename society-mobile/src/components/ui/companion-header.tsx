import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from './colors';
import { ArrowLeft } from './icons';
import { Text } from './text';

type CompanionHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
};

export function CompanionHeader({ title, subtitle, onBack, rightElement }: CompanionHeaderProps) {
  return (
    <SafeAreaView edges={['top']}>
      <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
        {onBack && (
          <Pressable onPress={onBack} testID="back-button">
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="font-urbanist-bold text-xl text-midnight">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-text-tertiary">
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement}
      </View>
    </SafeAreaView>
  );
}
