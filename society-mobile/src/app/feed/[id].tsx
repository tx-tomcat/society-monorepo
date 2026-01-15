import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { usePost } from '@/api';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';

export default function Post() {
  const local = useLocalSearchParams<{ id: string }>();

  const { data, isPending, isError } = usePost({
    //@ts-ignore
    variables: { id: local.id },
  });

  if (isPending) {
    return (
      <View className="flex-1 bg-midnight">
        <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Feed' }} />
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          <View className="flex-1 justify-center p-3">
            <ActivityIndicator />
          </View>
        </SafeAreaView>
      </View>
    );
  }
  if (isError) {
    return (
      <View className="flex-1 bg-midnight">
        <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Feed' }} />
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          <View className="flex-1 justify-center p-3">
            <Text className="text-center text-offwhite">Error loading post</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-midnight">
      <Stack.Screen options={{ title: 'Post', headerBackTitle: 'Feed' }} />
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-1 p-3">
          <Text className="text-xl text-offwhite">{data.title}</Text>
          <Text className="text-offwhite">{data.body} </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
