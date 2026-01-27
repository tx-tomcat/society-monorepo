/* eslint-disable max-lines-per-function */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Switch } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft } from '@/components/ui/icons';
import { useBiometricAuth } from '@/lib/hooks';

type SecurityItemToggle = {
  id: string;
  label: string;
  isToggle: true;
  value: boolean;
  onToggle: () => void;
};

type SecurityItemLink = {
  id: string;
  label: string;
  isToggle: false;
  description?: string;
  onPress: () => void;
  danger?: boolean;
};

type SecurityItem = SecurityItemToggle | SecurityItemLink;

function SecurityToggleItem({
  label,
  value,
  onToggle,
  testID,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  testID?: string;
}) {
  return (
    <View className="flex-row items-center justify-between" testID={testID}>
      <Text className="flex-1 text-xl font-semibold leading-[1.4] text-offwhite">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.neutral[700], true: colors.gold[400] }}
        thumbColor={colors.white}
        testID={testID ? `${testID}-switch` : undefined}
      />
    </View>
  );
}

function SecurityLinkItem({
  label,
  description,
  onPress,
  danger,
  testID,
}: {
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      className="flex-row items-start gap-5"
      onPress={onPress}
      testID={testID}
    >
      <View className="flex-1 gap-1.5">
        <Text
          className={`text-xl font-semibold leading-[1.4] ${
            danger ? 'text-danger-500' : 'text-offwhite'
          }`}
        >
          {label}
        </Text>
        {description && (
          <Text className="text-base font-normal leading-[1.6] tracking-[0.2px] text-neutral-400">
            {description}
          </Text>
        )}
      </View>
      <View className="pt-0.5">
        <Text className="text-2xl text-neutral-400">›</Text>
      </View>
    </Pressable>
  );
}

export default function AccountSecurity() {
  const { isEnabled, isAvailable, toggleBiometric, getBiometricName } =
    useBiometricAuth();

  const [biometricEnabled, setBiometricEnabled] = React.useState(isEnabled);
  const [faceIdEnabled, setFaceIdEnabled] = React.useState(false);
  const [smsAuthEnabled, setSmsAuthEnabled] = React.useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = React.useState(false);

  // Sync biometric state
  React.useEffect(() => {
    setBiometricEnabled(isEnabled);
  }, [isEnabled]);

  const handleBiometricToggle = React.useCallback(async () => {
    const result = await toggleBiometric();
    if (result.success) {
      setBiometricEnabled(!biometricEnabled);
    }
  }, [biometricEnabled, toggleBiometric]);

  const handleBackPress = React.useCallback(() => {
    router.back();
  }, []);

  const securityToggles: SecurityItem[] = React.useMemo(() => {
    const items: SecurityItem[] = [];

    if (isAvailable) {
      items.push({
        id: 'biometric',
        label: 'Biometric ID',
        isToggle: true,
        value: biometricEnabled,
        onToggle: handleBiometricToggle,
      });

      items.push({
        id: 'faceid',
        label: getBiometricName(),
        isToggle: true,
        value: faceIdEnabled,
        onToggle: () => setFaceIdEnabled(!faceIdEnabled),
      });
    }

    items.push(
      {
        id: 'sms',
        label: 'SMS Authenticator',
        isToggle: true,
        value: smsAuthEnabled,
        onToggle: () => setSmsAuthEnabled(!smsAuthEnabled),
      },
      {
        id: 'google',
        label: 'Google Authenticator',
        isToggle: true,
        value: googleAuthEnabled,
        onToggle: () => setGoogleAuthEnabled(!googleAuthEnabled),
      },
      {
        id: 'password',
        label: 'Change Password',
        isToggle: false,
        onPress: () => console.log('Change password'),
      }
    );

    return items;
  }, [
    isAvailable,
    biometricEnabled,
    faceIdEnabled,
    smsAuthEnabled,
    googleAuthEnabled,
    handleBiometricToggle,
    getBiometricName,
  ]);

  const accountItems: SecurityItemLink[] = [
    {
      id: 'devices',
      label: 'Device Management',
      isToggle: false,
      description: 'Manage your account on the various devices you own.',
      onPress: () => console.log('Device management'),
    },
    {
      id: 'deactivate',
      label: 'Deactivate Account',
      isToggle: false,
      description:
        "Temporarily deactivate your account. Easily reactivate when you're ready.",
      onPress: () => console.log('Deactivate account'),
    },
    {
      id: 'delete',
      label: 'Delete Account',
      isToggle: false,
      description:
        'Permanently remove your account and data. Proceed with caution.',
      danger: true,
      onPress: () => console.log('Delete account'),
    },
  ];

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-6 py-3">
          {/* Back Button */}
          <Pressable onPress={handleBackPress} testID="back-button">
            <ArrowLeft color={colors.offwhite.DEFAULT} size={28} />
          </Pressable>

          {/* Title */}
          <Text className="flex-1 text-center text-2xl font-bold leading-[1.4] text-offwhite">
            Account & Security
          </Text>

          {/* Spacer for alignment */}
          <View className="w-7" />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Toggles */}
        <View className="gap-7 rounded-lg bg-neutral-900 p-4">
          {securityToggles.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.isToggle ? (
                <SecurityToggleItem
                  label={item.label}
                  value={item.value}
                  onToggle={item.onToggle}
                  testID={`security-toggle-${item.id}`}
                />
              ) : (
                <SecurityLinkItem
                  label={item.label}
                  description={item.description}
                  onPress={item.onPress}
                  danger={item.danger}
                  testID={`security-link-${item.id}`}
                />
              )}
              {index < securityToggles.length - 1 && (
                <View className="h-px w-full bg-neutral-800" />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Account Management */}
        <View className="gap-5 rounded-lg bg-neutral-900 p-4">
          {accountItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <SecurityLinkItem
                label={item.label}
                description={item.description}
                onPress={item.onPress}
                danger={item.danger}
                testID={`account-link-${item.id}`}
              />
              {index < accountItems.length - 1 && (
                <View className="h-px w-full bg-neutral-800" />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Bottom spacer */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}

