import { tr } from "./i18n";
import { dateKey, scheduleAt, type Habit } from './domain';
export function validReminder(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export type ReminderPlan = { id: string; habitId: string; title: string; body: string; hour: number; minute: number; weekday?: number };
export function reminderPlans(habits: Habit[], today = dateKey(), enabled = true): ReminderPlan[] {
  if (!enabled) return [];
  return habits.flatMap(h => {
    if (h.paused || !validReminder(h.reminder) || h.created > today) return [];
    const schedule = scheduleAt(h, today);
    if (!schedule) return [];
    const [hour, minute] = h.reminder.split(':').map(Number);
    const base = { habitId: h.id, title: tr("{0}の時間です", h.name), body: h.action || tr("小さな一歩から始めましょう。"), hour, minute };
    return schedule.kind === 'days'
      ? schedule.days.map(day => ({ ...base, id: `habit-reminder:${h.id}:${day}`, weekday: day + 1 }))
      : [{ ...base, id: `habit-reminder:${h.id}:daily` }];
  });
}
