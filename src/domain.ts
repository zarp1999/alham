import { tr, weekday } from "./i18n";
export type Schedule = { from: string; kind: 'daily' | 'days' | 'weekly'; days: number[]; target: number };
export type MeasureGoal = { kind: 'time' | 'count' | 'amount'; unit: string; target: number };
export type Habit = { id: string; name: string; action: string; reason: string; category: string; created: string; paused: boolean; reminder?: string; goal?: MeasureGoal; schedules: Schedule[] };
export type Entry = { habitId: string; date: string; status: 'done' | 'rest' | 'progress'; note?: string; measurement?: MeasureGoal & { value: number } };
export type Data = { habits: Habit[]; entries: Entry[] };
export const emptyData = (): Data => ({ habits: [], entries: [] });
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function fromKey(key: string): Date { return new Date(`${key}T12:00:00`); }
export function shift(key: string, amount: number): string {
  const date = fromKey(key); date.setDate(date.getDate() + amount); return dateKey(date);
}
export function weekStart(key: string): string { return shift(key, -((fromKey(key).getDay() + 6) % 7)); }
export function scheduleAt(habit: Habit, date: string): Schedule | undefined {
  return [...habit.schedules].reverse().find(schedule => schedule.from <= date);
}
export function weeklyCount(data: Data, id: string, date: string): number {
  const start = weekStart(date), end = shift(start, 6);
  return data.entries.filter(e => e.habitId === id && e.status === 'done' && e.date >= start && e.date <= end).length;
}
export function isDue(habit: Habit, date: string): boolean {
  if (date < habit.created) return false;
  const schedule = scheduleAt(habit, date);
  return !!schedule && (schedule.kind !== 'days' || schedule.days.includes(fromKey(date).getDay()));
}
export function scheduleLabel(schedule?: Schedule): string {
  if (!schedule || schedule.kind === 'daily') return tr("毎日");
  if (schedule.kind === 'weekly') return tr("週{0}回", schedule.target);
  return schedule.days.map(day => weekday(day)).join('・');
}
export function withEntry(data: Data, habitId: string, date: string, status?: Entry['status']): Data {
  const previous = data.entries.find(e => e.habitId === habitId && e.date === date);
  return { ...data, entries: [...data.entries.filter(e => !(e.habitId === habitId && e.date === date)), ...(status ? [{ habitId, date, status, ...(previous?.note !== undefined ? { note: previous.note } : {}) }] : [])] };
}
export function updateHabit(data: Data, habit: Habit): Data {
  return { ...data, habits: data.habits.some(h => h.id === habit.id) ? data.habits.map(h => h.id === habit.id ? habit : h) : [...data.habits, habit] };
}
function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(fromKey(value).getTime()) && dateKey(fromKey(value)) === value;
}
export function backup(data: Data): string { return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...data }, null, 2); }
export function parseBackup(text: string): Data {
  if (text.length > 10_000_000) throw new Error(tr("バックアップが大きすぎます。"));
  const value = JSON.parse(text);
  const fail = () => { throw new Error(tr("対応していない、または壊れたバックアップです。")); };
  if (!value || ![1, 2].includes(value.version) || !Array.isArray(value.habits) || !Array.isArray(value.entries)) return fail();
  if (value.habits.length > 1000 || value.entries.length > 100000) return fail();
  const ids = new Set<string>(), recordKeys = new Set<string>();
  const habits: Habit[] = value.habits.map((h: any) => {
    if (!h || typeof h.id !== 'string' || !h.id || ids.has(h.id) || typeof h.name !== 'string' || !h.name.trim() || h.name.length > 60 ||
      typeof h.action !== 'string' || h.action.length > 120 || typeof h.reason !== 'string' || h.reason.length > 300 ||
      typeof h.category !== 'string' || h.category.length > 30 || typeof h.paused !== 'boolean' || !validDate(h.created) ||
      !Array.isArray(h.schedules) || !h.schedules.length || h.schedules.length > 10000) return fail();
    if (h.reminder !== undefined && (typeof h.reminder !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.reminder))) return fail();
    if (h.goal !== undefined && !validGoal(h.goal)) return fail();
    ids.add(h.id);
    let previous = '';
    const schedules: Schedule[] = h.schedules.map((s: any) => {
      if (!s || !validDate(s.from) || s.from < h.created || s.from <= previous || !['daily', 'days', 'weekly'].includes(s.kind) ||
        !Array.isArray(s.days) || s.days.some((d: any) => !Number.isInteger(d) || d < 0 || d > 6) ||
        new Set(s.days).size !== s.days.length || (s.kind === 'days' && !s.days.length) ||
        !Number.isInteger(s.target) || s.target < 1 || s.target > 7) return fail();
      previous = s.from;
      return { from: s.from, kind: s.kind, days: s.days, target: s.target };
    });
    if (schedules[0].from !== h.created) return fail();
    return { id: h.id, name: h.name, action: h.action, reason: h.reason, category: h.category, paused: h.paused, created: h.created, schedules, ...(h.goal !== undefined ? { goal: { kind: h.goal.kind, unit: h.goal.unit, target: h.goal.target } } : {}), ...(h.reminder !== undefined ? { reminder: h.reminder } : {}) };
  });
  const byId = new Map(habits.map(h => [h.id, h]));
  const entries: Entry[] = value.entries.map((e: any) => {
    if (!e || !ids.has(e.habitId) || !validDate(e.date) || e.date < byId.get(e.habitId)!.created || !['done', 'rest', 'progress'].includes(e.status)) return fail();
    if (e.measurement !== undefined && (!validGoal(e.measurement) || !validAmount(e.measurement.value) || e.status === 'rest' || e.status !== (e.measurement.value >= e.measurement.target ? 'done' : 'progress'))) return fail();
    if (e.status === 'progress' && !e.measurement) return fail();
    if (e.note !== undefined && (typeof e.note !== 'string' || e.note.length > 2000)) return fail();
    const key = `${e.habitId}/${e.date}`;
    if (recordKeys.has(key)) return fail();
    recordKeys.add(key);
    return { habitId: e.habitId, date: e.date, status: e.status, ...(e.note !== undefined ? { note: e.note } : {}), ...(e.measurement !== undefined ? { measurement: { kind: e.measurement.kind, unit: e.measurement.unit, target: e.measurement.target, value: e.measurement.value } } : {}) };
  });
  return { habits, entries };
}


export function validAmount(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1000000 && Math.abs(value * 100 - Math.round(value * 100)) < 0.00001; }
export function validGoal(value: unknown): value is MeasureGoal {
  if (!value || typeof value !== 'object') return false;
  const g = value as MeasureGoal;
  return ['time', 'count', 'amount'].includes(g.kind) && typeof g.unit === 'string' && g.unit === g.unit.trim() && g.unit.length > 0 && g.unit.length <= 12 && !/[\x00-\x1f]/.test(g.unit) && validAmount(g.target) && (g.kind !== 'time' || g.unit === '分') && (g.kind !== 'count' || g.unit === '回');
}
export function withMeasurement(data: Data, habitId: string, date: string, goal: MeasureGoal, value: number): Data {
  if (!validGoal(goal) || !validAmount(value)) throw new Error(tr("数値を確認してください。"));
  const habit = data.habits.find(h => h.id === habitId);
  if (!habit || !validDate(date) || date < habit.created) throw new Error(tr("記録する日付を確認してください。"));
  const previous = data.entries.find(e => e.habitId === habitId && e.date === date);
  const next = withEntry(data, habitId, date);
  return { ...next, entries: [...next.entries, { habitId, date, status: value >= goal.target ? 'done' : 'progress', measurement: { ...goal, value }, ...(previous?.note !== undefined ? { note: previous.note } : {}) }] };
}
export function withNote(data: Data, habitId: string, date: string, note: string): Data {
  if (typeof note !== 'string' || note.length > 2000) throw new Error(tr('メモを確認してください。'));
  if (!data.entries.some(e => e.habitId === habitId && e.date === date)) throw new Error(tr('記録が見つかりません。'));
  return { ...data, entries: data.entries.map(e => { if (e.habitId !== habitId || e.date !== date) return e; const { note: _previous, ...rest } = e; return note.trim() ? { ...rest, note } : rest; }) };
}
