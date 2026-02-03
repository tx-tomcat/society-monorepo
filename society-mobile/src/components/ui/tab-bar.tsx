/* eslint-disable max-lines-per-function */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { type TabTriggerSlotProps } from 'expo-router/ui';
import React, { type Ref } from 'react';
import { Pressable, type View as RNView } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { SafeAreaView, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

// Tab Icon Components

function HomeIcon({ focused, color }: { focused: boolean; color: string }) {
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

function CalendarIcon({ focused, color }: { focused: boolean; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7Z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M3 9H21" stroke={focused ? 'white' : color} strokeWidth={2} />
      <Path
        d="M8 3V5M16 3V5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={15} r={2} fill={focused ? 'white' : color} />
    </Svg>
  );
}

function ChatIcon({ focused, color }: { focused: boolean; color: string }) {
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

function ProfileIcon({ focused, color }: { focused: boolean; color: string }) {
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

function RequestsIcon({ focused, color }: { focused: boolean; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={4}
        width={18}
        height={16}
        rx={2}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M7 9H17M7 13H13"
        stroke={focused ? 'white' : color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EarningsIcon({ focused, color }: { focused: boolean; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={9}
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M12 7V17M9 9.5C9 8.67 9.9 8 11 8H13C14.1 8 15 8.67 15 9.5C15 10.33 14.1 11 13 11H11C9.9 11 9 11.67 9 12.5C9 13.33 9.9 14 11 14H13C14.1 14 15 14.67 15 15.5"
        stroke={focused ? 'white' : color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ForYouIcon({ focused, color }: { focused: boolean; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill={focused ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Icon mapping by route name
const iconMap: Record<string, React.FC<{ focused: boolean; color: string }>> = {
  index: HomeIcon,
  home: HomeIcon,
  'for-you': ForYouIcon,
  bookings: CalendarIcon,
  requests: RequestsIcon,
  schedule: CalendarIcon,
  earnings: EarningsIcon,
  chat: ChatIcon,
  account: ProfileIcon,
  settings: ProfileIcon,
};

// Fallback label mapping by route name (used when options.title is not provided)
const fallbackLabelMap: Record<string, string> = {
  index: 'Home',
  home: 'Home',
  'for-you': 'For You',
  bookings: 'Bookings',
  requests: 'Requests',
  schedule: 'Schedule',
  earnings: 'Earnings',
  chat: 'Chat',
  account: 'Account',
  settings: 'Account',
};

type TabBarProps = BottomTabBarProps & {
  accentColor?: string;
};

export function TabBar({
  state,
  descriptors,
  navigation,
  accentColor = colors.rose[400],
}: TabBarProps) {
  const handleTabPress = React.useCallback(
    (route: (typeof state.routes)[0], index: number) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (state.index !== index && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation, state.index]
  );

  const handleTabLongPress = React.useCallback(
    (route: (typeof state.routes)[0]) => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    },
    [navigation]
  );

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
          const isFocused = state.index === index;
          const color = isFocused ? accentColor : colors.text.tertiary;

          // Get icon component
          const IconComponent = iconMap[route.name] || HomeIcon;

          // Get label from options.title (i18n) or fallback to route name mapping
          const label =
            (options.title as string) ||
            fallbackLabelMap[route.name] ||
            route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={() => handleTabPress(route, index)}
              onLongPress={() => handleTabLongPress(route)}
              className="flex-1 items-center justify-center py-2"
            >
              <View className="items-center gap-0.5">
                <IconComponent focused={isFocused} color={color} />
                <Text
                  className={`text-xs leading-[1.6] tracking-[0.2px] ${
                    isFocused ? 'font-urbanist-bold' : 'font-urbanist-medium'
                  }`}
                  style={{ color: isFocused ? color : colors.text.tertiary }}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// Pre-configured tab bars for each role (React Navigation style - legacy)
export function HirerTabBar(props: BottomTabBarProps) {
  return <TabBar {...props} accentColor={colors.rose[400]} />;
}

export function CompanionTabBar(props: BottomTabBarProps) {
  return <TabBar {...props} accentColor={colors.lavender[900]} />;
}

// Custom Tab Button for expo-router/ui
type CustomTabButtonProps = TabTriggerSlotProps & {
  name: string;
  accentColor?: string;
  ref?: Ref<RNView>;
};

function CustomTabButton({
  name,
  accentColor = colors.rose[400],
  isFocused = false,
  ...props
}: CustomTabButtonProps) {
  const focused = isFocused ?? false;
  const color = focused ? accentColor : colors.text.tertiary;
  const IconComponent = iconMap[name] || HomeIcon;
  const label = fallbackLabelMap[name] || name;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      className="flex flex-1 items-center justify-center py-2 "
    >
      <View className="items-center w-full gap-0.5 ">
        <IconComponent focused={focused} color={color} />
        <Text
          className={`text-xs leading-[1.6] tracking-[0.2px] ${focused ? 'font-urbanist-bold' : 'font-urbanist-medium'
            }`}
          style={{ color: focused ? color : colors.text.tertiary }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// Custom Tab List wrapper for expo-router/ui (used with TabList asChild)
type CustomTabListProps = {
  accentColor?: string;
  children: React.ReactNode;
};

export const CustomTabList = React.forwardRef<RNView, CustomTabListProps>(
  function CustomTabList({ accentColor = colors.rose[400], children }, ref) {
    return (
      <SafeAreaView
        edges={['bottom']}
        className="w-full"
        style={{ backgroundColor: colors.warmwhite.DEFAULT }}
      >
        <View
          ref={ref}
          className="flex-row items-center justify-between px-4 w-full"
          style={{ borderTopWidth: 1, borderTopColor: colors.border.light }}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { accentColor } as Partial<CustomTabButtonProps>);
            }
            return child;
          })}
        </View>
      </SafeAreaView>
    );
  }
);

export { CustomTabButton };
