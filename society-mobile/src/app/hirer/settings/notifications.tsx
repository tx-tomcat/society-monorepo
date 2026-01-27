/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Bell } from '@/components/ui/icons';
import { useSafeBack } from '@/lib/hooks';

type NotificationSetting = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  enabled: boolean;
};

type NotificationSection = {
  titleKey: string;
  settings: NotificationSetting[];
};

const INITIAL_SETTINGS: NotificationSection[] = [
  {
    titleKey: 'hirer.notifications.bookings_section',
    settings: [
      {
        id: 'booking_confirmed',
        labelKey: 'hirer.notifications.booking_confirmed',
        descriptionKey: 'hirer.notifications.booking_confirmed_desc',
        enabled: true,
      },
      {
        id: 'booking_reminder',
        labelKey: 'hirer.notifications.booking_reminder',
        descriptionKey: 'hirer.notifications.booking_reminder_desc',
        enabled: true,
      },
      {
        id: 'booking_updates',
        labelKey: 'hirer.notifications.booking_updates',
        descriptionKey: 'hirer.notifications.booking_updates_desc',
        enabled: true,
      },
    ],
  },
  {
    titleKey: 'hirer.notifications.messages_section',
    settings: [
      {
        id: 'new_messages',
        labelKey: 'hirer.notifications.new_messages',
        descriptionKey: 'hirer.notifications.new_messages_desc',
        enabled: true,
      },
      {
        id: 'companion_online',
        labelKey: 'hirer.notifications.companion_online',
        descriptionKey: 'hirer.notifications.companion_online_desc',
        enabled: false,
      },
    ],
  },
  {
    titleKey: 'hirer.notifications.promotions_section',
    settings: [
      {
        id: 'special_offers',
        labelKey: 'hirer.notifications.special_offers',
        descriptionKey: 'hirer.notifications.special_offers_desc',
        enabled: true,
      },
      {
        id: 'new_companions',
        labelKey: 'hirer.notifications.new_companions',
        descriptionKey: 'hirer.notifications.new_companions_desc',
        enabled: false,
      },
    ],
  },
];

function NotificationToggle({
  setting,
  onToggle,
}: {
  setting: NotificationSetting;
  onToggle: (id: string, value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="mb-3 flex-row items-center justify-between rounded-xl bg-white p-4">
      <View className="mr-4 flex-1">
        <Text className="font-urbanist-semibold text-base text-midnight">
          {t(setting.labelKey)}
        </Text>
        <Text className="mt-0.5 text-sm text-text-tertiary">
          {t(setting.descriptionKey)}
        </Text>
      </View>
      <Switch
        value={setting.enabled}
        onValueChange={(value) => onToggle(setting.id, value)}
        trackColor={{ false: colors.neutral[200], true: colors.rose[300] }}
        thumbColor={setting.enabled ? colors.rose[400] : colors.neutral[100]}
        ios_backgroundColor={colors.neutral[200]}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/(app)/account');
  const [sections, setSections] =
    React.useState<NotificationSection[]>(INITIAL_SETTINGS);

  const handleToggle = React.useCallback((id: string, value: boolean) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        settings: section.settings.map((s) =>
          s.id === id ? { ...s, enabled: value } : s
        ),
      }))
    );
  }, []);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={goBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.notifications.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Notification Icon Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center py-6"
        >
          <View className="mb-3 size-16 items-center justify-center rounded-full bg-yellow-100">
            <Bell color={colors.yellow[400]} width={32} height={32} />
          </View>
          <Text className="text-center text-sm text-text-secondary">
            {t('hirer.notifications.subtitle')}
          </Text>
        </MotiView>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <MotiView
            key={section.titleKey}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: 100 + sectionIndex * 100,
            }}
            className="px-4 pt-4"
          >
            <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
              {t(section.titleKey)}
            </Text>
            {section.settings.map((setting) => (
              <NotificationToggle
                key={setting.id}
                setting={setting}
                onToggle={handleToggle}
              />
            ))}
          </MotiView>
        ))}

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 500 }}
          className="mx-4 mt-6 rounded-2xl bg-rose-50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-rose-600">
            {t('hirer.notifications.push_info_title')}
          </Text>
          <Text className="text-sm leading-5 text-text-secondary">
            {t('hirer.notifications.push_info_message')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
