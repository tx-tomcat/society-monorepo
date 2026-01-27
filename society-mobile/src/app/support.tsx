/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView } from 'react-native';

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
  Headset,
  Help,
  Info,
  Phone,
  Send,
} from '@/components/ui/icons';

type FAQItem = {
  id: string;
  questionKey: string;
  answerKey: string;
};

type SupportOption = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  iconBg: string;
  iconColor: string;
  action: () => void;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'how_booking_works',
    questionKey: 'support.faq.how_booking_works',
    answerKey: 'support.faq.how_booking_works_answer',
  },
  {
    id: 'payment_security',
    questionKey: 'support.faq.payment_security',
    answerKey: 'support.faq.payment_security_answer',
  },
  {
    id: 'cancellation_policy',
    questionKey: 'support.faq.cancellation_policy',
    answerKey: 'support.faq.cancellation_policy_answer',
  },
  {
    id: 'verification_process',
    questionKey: 'support.faq.verification_process',
    answerKey: 'support.faq.verification_process_answer',
  },
];

function FAQCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onToggle} className="mb-3 rounded-xl bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 pr-4 font-urbanist-semibold text-base text-midnight">
          {t(item.questionKey)}
        </Text>
        <MotiView
          animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <ArrowRight
            color={colors.text.tertiary}
            width={20}
            height={20}
            style={{ transform: [{ rotate: '90deg' }] }}
          />
        </MotiView>
      </View>
      {isExpanded && (
        <MotiView
          from={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <Text className="mt-3 border-t border-border-light pt-3 text-sm leading-5 text-text-secondary">
            {t(item.answerKey)}
          </Text>
        </MotiView>
      )}
    </Pressable>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [expandedFAQ, setExpandedFAQ] = React.useState<string | null>(null);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const supportOptions: SupportOption[] = React.useMemo(
    () => [
      {
        id: 'live_chat',
        labelKey: 'support.live_chat',
        descriptionKey: 'support.live_chat_desc',
        icon: Headset,
        iconBg: 'bg-rose-100',
        iconColor: colors.rose[400],
        action: () => Alert.alert(t('common.coming_soon')),
      },
      {
        id: 'email',
        labelKey: 'support.email_us',
        descriptionKey: 'support.email_desc',
        icon: Send,
        iconBg: 'bg-teal-100',
        iconColor: colors.teal[400],
        action: () => Linking.openURL('mailto:support@hireme.vn'),
      },
      {
        id: 'phone',
        labelKey: 'support.call_us',
        descriptionKey: 'support.call_desc',
        icon: Phone,
        iconBg: 'bg-lavender-100',
        iconColor: colors.lavender[400],
        action: () => Linking.openURL(`tel:${t('support.phone_number')}`),
      },
    ],
    [t]
  );

  const handleToggleFAQ = React.useCallback((id: string) => {
    setExpandedFAQ((prev) => (prev === id ? null : id));
  }, []);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('support.header')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Support Icon Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          className="items-center py-6"
        >
          <View className="mb-3 size-16 items-center justify-center rounded-full bg-teal-100">
            <Help color={colors.teal[400]} width={32} height={32} />
          </View>
          <Text className="mb-1 font-urbanist-bold text-xl text-midnight">
            {t('support.hero_title')}
          </Text>
          <Text className="text-center text-sm text-text-secondary">
            {t('support.hero_subtitle')}
          </Text>
        </MotiView>

        {/* Support Options */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="px-4"
        >
          <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
            {t('support.contact_us')}
          </Text>

          {supportOptions.map((option, index) => (
            <MotiView
              key={option.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <Pressable
                onPress={option.action}
                className="mb-3 flex-row items-center gap-4 rounded-xl bg-white p-4"
              >
                <View
                  className={`size-12 items-center justify-center rounded-xl ${option.iconBg}`}
                >
                  <option.icon
                    color={option.iconColor}
                    width={24}
                    height={24}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-urbanist-semibold text-base text-midnight">
                    {t(option.labelKey)}
                  </Text>
                  <Text className="text-sm text-text-tertiary">
                    {t(option.descriptionKey)}
                  </Text>
                </View>
                <ArrowRight
                  color={colors.text.tertiary}
                  width={20}
                  height={20}
                />
              </Pressable>
            </MotiView>
          ))}
        </MotiView>

        {/* FAQ Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="px-4 pt-6"
        >
          <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
            {t('support.faq_title')}
          </Text>

          {FAQ_ITEMS.map((item) => (
            <FAQCard
              key={item.id}
              item={item}
              isExpanded={expandedFAQ === item.id}
              onToggle={() => handleToggleFAQ(item.id)}
            />
          ))}
        </MotiView>

        {/* Additional Help Card */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-6 rounded-2xl bg-rose-50 p-4"
        >
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-rose-100">
              <Info color={colors.rose[400]} width={20} height={20} />
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-urbanist-semibold text-sm text-rose-600">
                {t('support.need_more_help')}
              </Text>
              <Text className="text-sm text-text-secondary">
                {t('support.need_more_help_desc')}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Operating Hours */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          className="items-center px-4 pt-6"
        >
          <Text className="text-sm text-text-tertiary">
            {t('support.operating_hours')}
          </Text>
          <Text className="mt-1 font-urbanist-semibold text-base text-midnight">
            {t('support.hours_value')}
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}

