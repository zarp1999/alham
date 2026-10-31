import { tr } from "./i18n";
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as N from './local-notifications';
import { AndroidImportance, IosAuthorizationStatus } from './local-notifications';
import { dateKey } from './domain';
import { reminderPlans } from './reminder-plan';
import type { Habit } from './domain';
// Expo Go's scoped channel manager fails on this SDK; use its default channel.
const inExpoGo = Constants.expoGoConfig != null;
const channelId = inExpoGo ? undefined : 'habit-reminders';
N.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
async function channel() {
  if (Platform.OS === 'android' && channelId) await N.setNotificationChannelAsync(channelId, { name: tr("習慣のリマインダー"), importance: AndroidImportance.HIGH });
}
function allowed(p: N.NotificationPermissionsStatus) {
  return p.granted || p.ios?.status === IosAuthorizationStatus.PROVISIONAL || p.ios?.status === IosAuthorizationStatus.EPHEMERAL;
}
export async function requestReminderPermission() {
  await channel();
  let permission = await N.getPermissionsAsync();
  if (!allowed(permission) && permission.canAskAgain) permission = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return allowed(permission);
}
let queue: Promise<unknown> = Promise.resolve();
export function syncReminders(habits: Habit[], enabled = true): Promise<string> {
  const work = queue.catch(() => undefined).then(async () => {
    const plans = reminderPlans(habits, dateKey(), enabled);
    const scheduled = await N.getAllScheduledNotificationsAsync();
    const owned = scheduled.filter(n => n.identifier.startsWith('habit-reminder:'));
    const permission = plans.length ? allowed(await N.getPermissionsAsync()) : true;
    const desired = new Map(plans.map(p => [p.id, p]));
    // Remove obsolete or changed requests first, including paused and restored habits.
    const unchanged = new Set<string>();
    for (const request of owned) {
      const plan = desired.get(request.identifier);
      if (permission && plan && request.content.data?.signature === JSON.stringify(plan)) unchanged.add(plan.id);
      else await N.cancelScheduledNotificationAsync(request.identifier);
    }
    if (!permission) return tr("通知が許可されていません。スマホの設定から通知を許可してください。");
    if (plans.length > 60) return tr("通知の予約上限を超えています。通知を使う習慣や曜日を減らしてください。");
    if (plans.length) await channel();
    for (const plan of plans) {
      if (unchanged.has(plan.id)) continue;
      await N.scheduleNotificationAsync({ identifier: plan.id, content: { title: plan.title, body: plan.body, sound: 'default', data: { habitId: plan.habitId, signature: JSON.stringify(plan) } }, trigger: plan.weekday === undefined
        ? { type: N.SchedulableTriggerInputTypes.DAILY, hour: plan.hour, minute: plan.minute, channelId }
        : { type: N.SchedulableTriggerInputTypes.WEEKLY, weekday: plan.weekday, hour: plan.hour, minute: plan.minute, channelId } });
    }
    return '';
  });
  queue = work;
  return work;
}
export async function testReminder() {
  if (!await requestReminderPermission()) throw new Error(tr("スマホの設定から通知を許可してください。"));
  await N.scheduleNotificationAsync({ identifier: 'habit-test', content: { title: tr("Alhamの通知テスト"), body: tr("習慣の時間になったら、このようにお知らせします。"), sound: 'default' }, trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId } });
}






let timerQueue: Promise<unknown> = Promise.resolve();
export function syncTimerNotification(session: import('./timer').TimerSession | null, name: string) {
  const work = timerQueue.catch(() => undefined).then(async () => {
    await N.cancelScheduledNotificationAsync('habit-timer');
    if (!session?.endAt || session.endAt <= Date.now()) return;
    if (!allowed(await N.getPermissionsAsync())) return;
    await channel();
    await N.scheduleNotificationAsync({ identifier: 'habit-timer', content: { title: tr("{0}のタイマーが終了しました", name), body: tr("おつかれさまでした。タップして習慣を開きましょう。"), sound: 'default', data: { habitId: session.habitId } }, trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: new Date(session.endAt), channelId } });
  });
  timerQueue = work;
  return work;
}
