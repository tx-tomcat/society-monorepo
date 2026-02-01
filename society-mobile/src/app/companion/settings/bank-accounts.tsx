/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';

import {
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';
import {
  Bank,
  CheckCircle,
  Plus,
  Trash2,
} from '@/components/ui/icons';
import type { BankAccount } from '@/lib/api/services/earnings.service';
import {
  useAddBankAccount,
  useBankAccounts,
  useDeleteBankAccount,
  useSafeBack,
} from '@/lib/hooks';

// Popular Vietnam banks
const POPULAR_BANKS = [
  'Vietcombank',
  'Techcombank',
  'VPBank',
  'MB Bank',
  'ACB',
  'TPBank',
  'Sacombank',
  'Agribank',
  'BIDV',
  'VietinBank',
];

export default function CompanionBankAccountsScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/companion/(app)/account');

  // React Query hooks
  const { data, isLoading } = useBankAccounts();
  const addBankAccountMutation = useAddBankAccount();
  const deleteBankAccountMutation = useDeleteBankAccount();

  const bankAccounts = data?.accounts ?? [];

  const [isAddingAccount, setIsAddingAccount] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Form state
  const [bankName, setBankName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountHolder, setAccountHolder] = React.useState('');
  const [showBankPicker, setShowBankPicker] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setBankName('');
    setAccountNumber('');
    setAccountHolder('');
    setIsAddingAccount(false);
  }, []);

  const handleAddAccount = React.useCallback(async () => {
    if (!bankName || !accountNumber || !accountHolder) {
      Alert.alert(t('common.error'), t('companion.bank_accounts.fill_all_fields'));
      return;
    }

    if (accountNumber.length < 8) {
      Alert.alert(t('common.error'), t('companion.bank_accounts.invalid_account_number'));
      return;
    }

    try {
      await addBankAccountMutation.mutateAsync({
        bankName,
        accountNumber,
        accountHolder: accountHolder.toUpperCase(),
      });
      resetForm();
      Alert.alert(t('common.success'), t('companion.bank_accounts.added_success'));
    } catch (error) {
      console.error('Failed to add bank account:', error);
      Alert.alert(t('common.error'), t('companion.bank_accounts.add_failed'));
    }
  }, [bankName, accountNumber, accountHolder, t, addBankAccountMutation, resetForm]);

  const handleDeleteAccount = React.useCallback(
    (account: BankAccount) => {
      if (account.isPrimary && bankAccounts.length > 1) {
        Alert.alert(
          t('companion.bank_accounts.cannot_delete_primary_title'),
          t('companion.bank_accounts.cannot_delete_primary_message')
        );
        return;
      }

      Alert.alert(
        t('companion.bank_accounts.delete_title'),
        t('companion.bank_accounts.delete_message', { bank: account.bankName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: async () => {
              setDeletingId(account.id);
              try {
                await deleteBankAccountMutation.mutateAsync(account.id);
              } catch (error) {
                console.error('Failed to delete bank account:', error);
                Alert.alert(t('common.error'), t('errors.try_again'));
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    },
    [bankAccounts.length, t, deleteBankAccountMutation]
  );

  const handleSelectBank = React.useCallback((bank: string) => {
    setBankName(bank);
    setShowBankPicker(false);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader title={t('companion.bank_accounts.header')} onBack={goBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mx-4 mt-4 rounded-xl bg-yellow-50 p-4"
        >
          <Text className="text-sm text-yellow-700">
            {t('companion.bank_accounts.info_message')}
          </Text>
        </MotiView>

        {/* Existing Bank Accounts */}
        {bankAccounts.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="mx-4 mt-4"
          >
            <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
              {t('companion.bank_accounts.saved_accounts')}
            </Text>
            {bankAccounts.map((account) => (
              <View
                key={account.id}
                className="mb-3 flex-row items-center rounded-xl bg-white p-4"
              >
                <View className="mr-3 size-10 items-center justify-center rounded-full bg-yellow-100">
                  <Bank color={colors.yellow[500]} width={20} height={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-urbanist-semibold text-base text-midnight">
                      {account.bankName}
                    </Text>
                    {account.isPrimary && (
                      <View className="rounded bg-lavender-100 px-1.5 py-0.5">
                        <Text className="text-xs font-semibold text-lavender-400">
                          {t('companion.bank_accounts.primary')}
                        </Text>
                      </View>
                    )}
                    {account.isVerified && (
                      <CheckCircle color={colors.teal[400]} width={14} height={14} />
                    )}
                  </View>
                  <Text className="mt-0.5 text-sm text-text-secondary">
                    ****{account.accountNumber.slice(-4)} • {account.accountHolder}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteAccount(account)}
                  disabled={deletingId === account.id}
                  className="size-8 items-center justify-center"
                >
                  {deletingId === account.id ? (
                    <ActivityIndicator size="small" color={colors.danger[400]} />
                  ) : (
                    <Trash2 color={colors.danger[400]} width={18} height={18} />
                  )}
                </Pressable>
              </View>
            ))}
          </MotiView>
        )}

        {/* Add Account Form */}
        {isAddingAccount ? (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="mx-4 mt-4 rounded-xl bg-white p-4"
          >
            <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
              {t('companion.bank_accounts.add_new')}
            </Text>

            {/* Bank Name */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-midnight">
                {t('companion.bank_accounts.bank_name')}
              </Text>
              <Pressable
                onPress={() => setShowBankPicker(true)}
                className="rounded-xl border border-border-light bg-warmwhite p-4"
              >
                <Text
                  className={`text-base ${bankName ? 'text-midnight' : 'text-text-tertiary'}`}
                >
                  {bankName || t('companion.bank_accounts.select_bank')}
                </Text>
              </Pressable>
            </View>

            {/* Bank Picker */}
            {showBankPicker && (
              <View className="mb-4 rounded-xl border border-border-light bg-warmwhite p-2">
                {POPULAR_BANKS.map((bank) => (
                  <Pressable
                    key={bank}
                    onPress={() => handleSelectBank(bank)}
                    className="rounded-lg p-3"
                  >
                    <Text
                      className={`text-base ${bankName === bank ? 'font-semibold text-lavender-400' : 'text-midnight'
                        }`}
                    >
                      {bank}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Account Number */}
            <View className="mb-2">
              <Input
                label={t('companion.bank_accounts.account_number')}
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                placeholder={t('companion.bank_accounts.account_number_placeholder')}
                keyboardType="number-pad"
                maxLength={20}
              />
            </View>

            {/* Account Holder */}
            <View className="mb-2">
              <Input
                label={t('companion.bank_accounts.account_holder')}
                value={accountHolder}
                onChangeText={(text) => setAccountHolder(text.toUpperCase())}
                placeholder={t('companion.bank_accounts.account_holder_placeholder')}
                autoCapitalize="characters"
                maxLength={50}
              />
              <Text className="-mt-1 text-xs text-text-tertiary">
                {t('companion.bank_accounts.holder_hint')}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <Button
                label={t('common.cancel')}
                onPress={resetForm}
                variant="outline"
                size="default"
                disabled={addBankAccountMutation.isPending}
                className="flex-1"
              />
              <Button
                label={t('common.save')}
                onPress={handleAddAccount}
                disabled={addBankAccountMutation.isPending}
                loading={addBankAccountMutation.isPending}
                variant="default"
                size="default"
                className="flex-1 bg-lavender-400"
              />
            </View>
          </MotiView>
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            className="mx-4 mt-4"
          >
            <Pressable
              onPress={() => setIsAddingAccount(true)}
              className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-lavender-400 bg-lavender-50/50 p-4"
            >
              <Plus color={colors.lavender[400]} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-lavender-400">
                {t('companion.bank_accounts.add_account')}
              </Text>
            </Pressable>
          </MotiView>
        )}

        {/* Security Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-6 rounded-xl bg-teal-50 p-4"
        >
          <Text className="mb-1 font-urbanist-semibold text-sm text-teal-700">
            {t('companion.bank_accounts.security_title')}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('companion.bank_accounts.security_message')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}
