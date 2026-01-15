/* eslint-disable max-lines-per-function */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { SafeAreaView, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

// Society Tab Icons - Using new Rose Pink color palette

function HomeIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.rose[400] : colors.text.tertiary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.rose[400] : colors.text.tertiary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={11}
        cy={11}
        r={7}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M16 16L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.rose[400] : colors.text.tertiary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7Z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M3 9H21" stroke={focused ? 'white' : color} strokeWidth={2} />
      <Path d="M8 3V5M16 3V5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={2} fill={focused ? 'white' : color} />
    </Svg>
  );
}

function ChatIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.rose[400] : colors.text.tertiary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12C21 16.4183 16.9706 20 12 20C10.5 20 9.1 19.7 7.8 19.2L3 21L4.5 17C3.5 15.6 3 14 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={8} cy={12} r={1} fill={focused ? 'white' : color} />
      <Circle cx={12} cy={12} r={1} fill={focused ? 'white' : color} />
      <Circle cx={16} cy={12} r={1} fill={focused ? 'white' : color} />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const color = focused ? colors.rose[400] : colors.text.tertiary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={8}
        r={4}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView
      edges={['bottom']}
      className="pt-2"
      style={{ backgroundColor: colors.warmwhite.DEFAULT }}
    >
      <View
        className="flex-row items-center justify-center px-4"
        style={{ borderTopWidth: 1, borderTopColor: colors.border.light }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          // Map route names to Society icons and labels
          const getIcon = () => {
            switch (route.name) {
              case 'index':
                return <HomeIcon focused={isFocused} />;
              case 'explore':
                return <SearchIcon focused={isFocused} />;
              case 'chats':
                return <ChatIcon focused={isFocused} />;
              case 'creation':
                return <CalendarIcon focused={isFocused} />;
              case 'settings':
                return <ProfileIcon focused={isFocused} />;
              default:
                return null;
            }
          };

          // Society-specific labels
          const getLabel = (): string => {
            switch (route.name) {
              case 'index':
                return 'Home';
              case 'explore':
                return 'Search';
              case 'chats':
                return 'Chats';
              case 'creation':
                return 'Bookings';
              case 'settings':
                return 'Profile';
              default:
                return typeof label === 'string' ? label : route.name;
            }
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center py-2"
            >
              <View className="items-center gap-0.5">
                {getIcon()}
                <Text
                  className="text-[10px] leading-[1.6] tracking-[0.2px]"
                  style={
                    isFocused
                      ? { ...styles.labelFocused, color: colors.rose[400] }
                      : { ...styles.label, color: colors.text.tertiary }
                  }
                >
                  {getLabel()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Urbanist_500Medium',
    letterSpacing: 0.2,
  },
  labelFocused: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0.2,
  },
});
