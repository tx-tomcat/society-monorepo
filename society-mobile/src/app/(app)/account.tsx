/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView } from 'react-native';

import {
    colors,
    FocusAwareStatusBar,
    Image,
    SafeAreaView,
    Text,
    View,
} from '@/components/ui';
import {
    ArrowRight,
    Bell,
    Edit,
    Heart,
    Help,
    HiremeLogo,
    Language,
    Lock,
    Logout,
    Shield,
    Star,
    User
} from '@/components/ui/icons';
import { useAuth, useCurrentUser, useUnreadNotificationCount } from '@/lib/hooks';

type SettingsItem = {
    id: string;
    labelKey: string;
    icon: React.ComponentType<{ color: string; width: number; height: number }>;
    iconBg: string;
    iconColor: string;
    route?: string;
    action?: 'logout';
    badge?: string;
};

const SETTINGS_SECTIONS: { titleKey: string; items: SettingsItem[] }[] = [
    {
        titleKey: 'hirer.settings.account',
        items: [
            {
                id: 'edit-profile',
                labelKey: 'hirer.settings.edit_profile',
                icon: Edit,
                iconBg: 'bg-lavender-900/10',
                iconColor: colors.lavender[400],
                route: '/hirer/profile/edit',
            },
            {
                id: 'favorites',
                labelKey: 'hirer.settings.favorites',
                icon: Heart,
                iconBg: 'bg-rose-400/10',
                iconColor: colors.rose[400],
                route: '/hirer/favorites',
            },
        ],
    },
    {
        titleKey: 'hirer.settings.preferences',
        items: [
            {
                id: 'notifications',
                labelKey: 'hirer.settings.notifications',
                icon: Bell,
                iconBg: 'bg-yellow-400/10',
                iconColor: colors.yellow[400],
                route: '/hirer/settings/notifications',
            },
            {
                id: 'language',
                labelKey: 'hirer.settings.language',
                icon: Language,
                iconBg: 'bg-lavender-900/10',
                iconColor: colors.lavender[400],
                route: '/hirer/settings/language',
                badge: 'Tiếng Việt',
            },
            {
                id: 'privacy',
                labelKey: 'hirer.settings.privacy',
                icon: Lock,
                iconBg: 'bg-midnight/10',
                iconColor: colors.midnight.DEFAULT,
                route: '/hirer/settings/privacy',
            },
        ],
    },
    {
        titleKey: 'hirer.settings.support_section',
        items: [
            {
                id: 'help',
                labelKey: 'hirer.settings.help_center',
                icon: Help,
                iconBg: 'bg-teal-400/10',
                iconColor: colors.teal[400],
                route: '/support',
            },
            {
                id: 'safety',
                labelKey: 'hirer.settings.safety_center',
                icon: Shield,
                iconBg: 'bg-rose-400/10',
                iconColor: colors.rose[400],
                route: '/safety',
            },
            {
                id: 'rate-app',
                labelKey: 'hirer.settings.rate_app',
                icon: Star,
                iconBg: 'bg-yellow-400/10',
                iconColor: colors.yellow[400],
            },
        ],
    },
    {
        titleKey: '',
        items: [
            {
                id: 'logout',
                labelKey: 'hirer.settings.logout',
                icon: Logout,
                iconBg: 'bg-danger-50',
                iconColor: colors.danger[400],
                action: 'logout',
            },
        ],
    },
];

function SettingsMenuItem({
    item,
    onPress,
}: {
    item: SettingsItem;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    const isLogout = item.action === 'logout';

    return (
        <Pressable
            onPress={onPress}
            className="mb-2 flex-row items-center gap-4 rounded-xl bg-white p-4"
        >
            <View
                className={`size-11 items-center justify-center rounded-xl ${item.iconBg}`}
            >
                <item.icon color={item.iconColor} width={22} height={22} />
            </View>
            <Text
                className={`flex-1 text-base ${isLogout ? 'font-semibold text-danger-400' : 'text-midnight'}`}
            >
                {t(item.labelKey)}
            </Text>
            {item.badge && (
                <Text className="text-sm text-text-tertiary">{item.badge}</Text>
            )}
            {!isLogout && (
                <ArrowRight color={colors.text.tertiary} width={20} height={20} />
            )}
        </Pressable>
    );
}

export default function HirerSettingsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { signOut } = useAuth();
    const { data: userData } = useCurrentUser();
    const { data: unreadData } = useUnreadNotificationCount();
    const user = userData?.user;
    const unreadCount = unreadData?.count ?? 0;

    const handleBack = React.useCallback(() => {
        router.back();
    }, [router]);

    const handleLogout = React.useCallback(() => {
        Alert.alert(
            t('hirer.settings.logout_title'),
            t('hirer.settings.logout_message'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('hirer.settings.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            // Navigation handled by _layout.tsx guard
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    },
                },
            ]
        );
    }, [router, t, signOut]);

    const handleItemPress = React.useCallback(
        (item: SettingsItem) => {
            if (item.action === 'logout') {
                handleLogout();
            } else if (item.route) {
                router.push(item.route as Href);
            }
        },
        [router, handleLogout]
    );

    return (
        <SafeAreaView className="flex-1 bg-warmwhite">
            <FocusAwareStatusBar />

            {/* Header with notification bell */}
            <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3">
                <Text className="font-urbanist-bold text-xl text-midnight">
                    {t('hirer.settings.title')}
                </Text>
                <Pressable
                    onPress={() => router.push('/hirer/notifications' as Href)}
                    className="relative"
                >
                    <Bell color={colors.midnight.DEFAULT} width={24} height={24} />
                    {unreadCount > 0 && (
                        <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full bg-rose-400 px-1">
                            <Text className="text-[10px] font-bold text-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                    className="mx-4 mt-4 rounded-2xl bg-white p-5"
                >
                    <View className="flex-row items-center gap-4">
                        {user?.avatarUrl ? (
                            <Image
                                source={{ uri: user.avatarUrl }}
                                className="size-20 rounded-full"
                                contentFit="cover"
                            />
                        ) : (
                            <View className="size-20 items-center justify-center rounded-full bg-rose-100">
                                <User color={colors.rose[400]} width={32} height={32} />
                            </View>
                        )}
                        <View className="flex-1">
                            <Text className="font-urbanist-bold text-xl text-midnight">
                                {user?.fullName || t('hirer.settings.unnamed_user')}
                            </Text>
                            {user?.isVerified && (
                                <View className="mt-2 flex-row items-center gap-3">
                                    <View className="rounded-full bg-teal-400/10 px-3 py-1">
                                        <Text className="text-xs font-medium text-teal-500">
                                            {t('hirer.settings.verified')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                    <Pressable
                        onPress={() => router.push('/hirer/profile/edit' as Href)}
                        className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-rose-400/10 py-3"
                    >
                        <Edit color={colors.rose[400]} width={18} height={18} />
                        <Text className="font-semibold text-rose-400">
                            {t('hirer.settings.view_profile')}
                        </Text>
                    </Pressable>
                </MotiView>

                {/* Settings Sections */}
                {SETTINGS_SECTIONS.map((section, sectionIndex) => (
                    <MotiView
                        key={section.titleKey || `section-${sectionIndex}`}
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{
                            type: 'timing',
                            duration: 400,
                            delay: 100 + sectionIndex * 50,
                        }}
                        className="px-4 pt-6"
                    >
                        {section.titleKey && (
                            <Text className="mb-3 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
                                {t(section.titleKey)}
                            </Text>
                        )}
                        {section.items.map((item) => (
                            <SettingsMenuItem
                                key={item.id}
                                item={item}
                                onPress={() => handleItemPress(item)}
                            />
                        ))}
                    </MotiView>
                ))}

                {/* App Info */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 400, delay: 400 }}
                    className="items-center px-4 py-8"
                >
                    <HiremeLogo color={colors.neutral[300]} width={40} height={40} />
                    <Text className="mt-3 text-sm text-text-tertiary">
                        Hireme v1.0.0
                    </Text>
                </MotiView>
            </ScrollView>
        </SafeAreaView>
    );
}
