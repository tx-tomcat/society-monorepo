/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Switch } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
} from '@/components/ui/icons';
import { useDeleteAccount, useSafeBack } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/use-auth';

type PrivacySetting = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  enabled: boolean;
};

type SecurityAction = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  iconBg: string;
  iconColor: string;
  danger?: boolean;
};

const INITIAL_PRIVACY_SETTINGS: PrivacySetting[] = [
  {
    id: 'profile_visible',
    labelKey: 'hirer.privacy.profile_visible',
    descriptionKey: 'hirer.privacy.profile_visible_desc',
    enabled: true,
  },
  {
    id: 'show_online_status',
    labelKey: 'hirer.privacy.show_online_status',
    descriptionKey: 'hirer.privacy.show_online_status_desc',
    enabled: true,
  },
  {
    id: 'show_last_active',
    labelKey: 'hirer.privacy.show_last_active',
    descriptionKey: 'hirer.privacy.show_last_active_desc',
    enabled: false,
  },
  {
    id: 'share_location',
    labelKey: 'hirer.privacy.share_location',
    descriptionKey: 'hirer.privacy.share_location_desc',
    enabled: true,
  },
];

const SECURITY_ACTIONS: SecurityAction[] = [
  {
    id: 'change_password',
    labelKey: 'hirer.privacy.change_password',
    descriptionKey: 'hirer.privacy.change_password_desc',
    icon: Lock,
    iconBg: 'bg-lavender-100',
    iconColor: colors.lavender[400],
  },
  {
    id: 'two_factor',
    labelKey: 'hirer.privacy.two_factor',
    descriptionKey: 'hirer.privacy.two_factor_desc',
    icon: ShieldCheck,
    iconBg: 'bg-teal-100',
    iconColor: colors.teal[400],
  },
  {
    id: 'blocked_users',
    labelKey: 'hirer.privacy.blocked_users',
    descriptionKey: 'hirer.privacy.blocked_users_desc',
    icon: Shield,
    iconBg: 'bg-yellow-100',
    iconColor: colors.yellow[500],
  },
  {
    id: 'delete_account',
    labelKey: 'hirer.privacy.delete_account',
    descriptionKey: 'hirer.privacy.delete_account_desc',
    icon: Trash2,
    iconBg: 'bg-danger-50',
    iconColor: colors.danger[400],
    danger: true,
  },
];

function PrivacyToggle({
  setting,
  onToggle,
}: {
  setting: PrivacySetting;
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

function SecurityActionItem({
  action,
  onPress,
}: {
  action: SecurityAction;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const Icon = action.icon;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-4 rounded-xl bg-white p-4"
    >
      <View
        className={`size-11 items-center justify-center rounded-xl ${action.iconBg}`}
      >
        <Icon color={action.iconColor} width={22} height={22} />
      </View>
      <View className="flex-1">
        <Text
          className={`font-urbanist-semibold text-base ${action.danger ? 'text-danger-500' : 'text-midnight'}`}
        >
          {t(action.labelKey)}
        </Text>
        <Text className="mt-0.5 text-sm text-text-tertiary">
          {t(action.descriptionKey)}
        </Text>
      </View>
      {!action.danger && (
        <ArrowRight color={colors.text.tertiary} width={20} height={20} />
      )}
    </Pressable>
  );
}

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const deleteAccount = useDeleteAccount();
  const goBack = useSafeBack('/(app)/account');
  const [privacySettings, setPrivacySettings] = React.useState<
    PrivacySetting[]
  >(INITIAL_PRIVACY_SETTINGS);

  const handleToggle = React.useCallback((id: string, value: boolean) => {
    setPrivacySettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: value } : s))
    );
  }, []);

  const handleSecurityAction = React.useCallback(
    (action: SecurityAction) => {
      if (action.id === 'delete_account') {
        Alert.alert(
          t('hirer.privacy.delete_account_title'),
          t('hirer.privacy.delete_account_warning'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('hirer.privacy.delete_confirm'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteAccount.mutateAsync();
                  await signOut();
                } catch (error) {
                  Alert.alert(t('common.error'), t('common.something_went_wrong'));
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.coming_soon'));
      }
    },
    [t, deleteAccount, signOut]
  );

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
            {t('hirer.privacy.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Privacy Icon Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center py-6"
        >
          <View className="mb-3 size-16 items-center justify-center rounded-full bg-midnight/10">
            <Lock color={colors.midnight.DEFAULT} size={32} />
          </View>
          <Text className="text-center text-sm text-text-secondary">
            {t('hirer.privacy.subtitle')}
          </Text>
        </MotiView>

        {/* Privacy Settings */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="px-4"
        >
          <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
            {t('hirer.privacy.privacy_section')}
          </Text>
          {privacySettings.map((setting) => (
            <PrivacyToggle
              key={setting.id}
              setting={setting}
              onToggle={handleToggle}
            />
          ))}
        </MotiView>

        {/* Security Actions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="px-4 pt-6"
        >
          <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
            {t('hirer.privacy.security_section')}
          </Text>
          {SECURITY_ACTIONS.map((action) => (
            <SecurityActionItem
              key={action.id}
              action={action}
              onPress={() => handleSecurityAction(action)}
            />
          ))}
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-6 rounded-2xl bg-teal-50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-teal-700">
            {t('hirer.privacy.data_protection_title')}
          </Text>
          <Text className="text-sm leading-5 text-text-secondary">
            {t('hirer.privacy.data_protection_message')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
