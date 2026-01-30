import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { notificationsService } from '@/lib/api/services/notifications.service';
import { useAuth } from '@/lib/hooks/use-auth';

import {
  type AppNotificationData,
  NotificationChannels,
  NotificationType,
} from './types';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Get the deep link URL for a notification based on its type and data
 */
function getNotificationDeepLink(data: AppNotificationData): string | null {
  // If URL is provided in data, use it directly
  if (data.url) {
    return data.url;
  }

  // Generate URL based on notification type
  switch (data.type) {
    case NotificationType.BOOKING_REQUEST:
      return `/companion/bookings/${(data as { bookingId: string }).bookingId}`;

    case NotificationType.BOOKING_CONFIRMED:
    case NotificationType.BOOKING_DECLINED:
    case NotificationType.BOOKING_CANCELLED:
      return `/hirer/bookings/${(data as { bookingId: string }).bookingId}`;

    case NotificationType.BOOKING_REMINDER:
    case NotificationType.BOOKING_COMPLETED:
      return `/bookings/${(data as { bookingId: string }).bookingId}`;

    case NotificationType.NEW_MESSAGE:
      return `/chat/${(data as { conversationId: string }).conversationId}`;

    case NotificationType.NEW_REVIEW:
      return '/companion/reviews';

    case NotificationType.PAYMENT_RECEIVED:
    case NotificationType.WITHDRAWAL_COMPLETED:
      return '/companion/earnings';

    case NotificationType.ACCOUNT_VERIFIED:
      return '/(app)/account';

    case NotificationType.FAVORITE_ONLINE:
      return `/hirer/companion/${(data as { companionProfileId: string }).companionProfileId}`;

    default:
      return null;
  }
}

/**
 * Handle notification tap - navigate to appropriate screen
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse
) {
  const data = response.notification.request.content
    .data as AppNotificationData;

  if (!data?.type) {
    console.warn('Notification response missing type:', data);
    return;
  }

  const deepLink = getNotificationDeepLink(data);

  if (deepLink) {
    // Use setTimeout to ensure navigation happens after app is ready
    setTimeout(() => {
      router.push(deepLink as never);
    }, 100);
  }
}

/**
 * Setup Android notification channels
 */
async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

  // Create all notification channels
  await Promise.all([
    Notifications.setNotificationChannelAsync(NotificationChannels.DEFAULT.id, {
      name: NotificationChannels.DEFAULT.name,
      description: NotificationChannels.DEFAULT.description,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F87171',
    }),
    Notifications.setNotificationChannelAsync(NotificationChannels.BOOKINGS.id, {
      name: NotificationChannels.BOOKINGS.name,
      description: NotificationChannels.BOOKINGS.description,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F87171',
    }),
    Notifications.setNotificationChannelAsync(NotificationChannels.MESSAGES.id, {
      name: NotificationChannels.MESSAGES.name,
      description: NotificationChannels.MESSAGES.description,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F87171',
    }),
    Notifications.setNotificationChannelAsync(NotificationChannels.PAYMENTS.id, {
      name: NotificationChannels.PAYMENTS.name,
      description: NotificationChannels.PAYMENTS.description,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    }),
    Notifications.setNotificationChannelAsync(
      NotificationChannels.REMINDERS.id,
      {
        name: NotificationChannels.REMINDERS.name,
        description: NotificationChannels.REMINDERS.description,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F59E0B',
      }
    ),
  ]);
}

/**
 * Register for push notifications and get Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Setup Android notification channels
  await setupNotificationChannels();

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  // Get Expo push token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error('Project ID not found for push notifications');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Expo push token:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register the push token with the backend
 */
async function registerTokenWithBackend(token: string): Promise<boolean> {
  try {
    const platform = Platform.OS as 'ios' | 'android';
    await notificationsService.registerPushToken(token, platform);
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
    return false;
  }
}

/**
 * Hook to manage push notifications
 */
export function useNotifications() {
  const { isSignedIn } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Only register for notifications if user is signed in
    if (!isSignedIn) {
      return;
    }

    // Register for push notifications
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        // Register token with backend
        const registered = await registerTokenWithBackend(token);
        setIsRegistered(registered);
      }
    });

    // Listen for incoming notifications (foreground)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        console.log('Notification received:', notification);
      });

    // Listen for notification interactions (tap)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      });

    // Handle notification that opened the app
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isSignedIn]);

  return {
    expoPushToken,
    notification,
    isRegistered,
  };
}

/**
 * Hook to get the last notification response (for deep linking)
 */
export function useLastNotificationResponse() {
  return Notifications.useLastNotificationResponse();
}

/**
 * Clear the badge count
 */
export async function clearBadgeCount() {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Schedule a local notification (for testing or local reminders)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: AppNotificationData,
  triggerSeconds = 1
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger:
      triggerSeconds > 0
        ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: triggerSeconds,
        }
        : null,
  });
}
