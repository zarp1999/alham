import { useEffect, useRef } from 'react';
import { router, useRootNavigationState, usePathname } from 'expo-router';
import * as N from './local-notifications';
import { useHabitStore } from './store';
import { notificationHabitId } from './timer';
export function NotificationNavigation() {
  const { ready, data } = useHabitStore();
  const navigation = useRootNavigationState();
  const pathname = usePathname();
  const last = useRef('');
  useEffect(() => {
    // Wait until the index screen has finished its initial redirect.
    if (!ready || !navigation?.key || pathname === '/') return;
    const open = (response: N.NotificationResponse) => {
      if (response.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return;
      const key = `${response.notification.request.identifier}:${response.notification.date}`;
      if (last.current === key) return;
      last.current = key;
      const id = notificationHabitId(response.notification.request.content.data, data.habits.map(h => h.id));
      N.clearLastNotificationResponse();
      if (id) router.push({ pathname: '/[tab]', params: { tab: 'detail', origin: 'today', id } });
      else if (data.habits.length) router.replace('/today');
    };
    const subscription = N.addNotificationResponseReceivedListener(open);
    const initial = N.getLastNotificationResponse();
    if (initial) open(initial);
    return () => subscription.remove();
  }, [ready, navigation?.key, data.habits, pathname]);
  return null;
}