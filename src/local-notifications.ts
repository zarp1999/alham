// SDK 58.1.5's root index eagerly loads ExpoTopicSubscriptionModule, which is
// absent in Expo Go. Keep local-only notification imports in this adapter;
// revisit these package subpaths when upgrading expo-notifications.
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
export { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
export type { NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
export { addNotificationResponseReceivedListener, getLastNotificationResponse, clearLastNotificationResponse, DEFAULT_ACTION_IDENTIFIER } from 'expo-notifications/build/NotificationsEmitter';
export type { NotificationResponse } from 'expo-notifications/build/Notifications.types';
