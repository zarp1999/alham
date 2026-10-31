import { tr, getLanguage, canonicalUnit } from "./i18n";
import { weekStart, shift, type Data, type Entry, type MeasureGoal } from './domain';
export type GoalDraft = { kind: 'check' | MeasureGoal['kind']; target: string; unit: string; originalUnit?: string };
export function parseAmount(text: string): number | null {
  const n = text.normalize('NFKC').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(n)) return null;
  const value = Number(n); return value > 0 && value <= 1000000 ? value : null;
}
export function goalDraft(goal?: MeasureGoal): GoalDraft { return goal ? { ...goal, unit: tr(goal.unit), originalUnit: goal.unit, target: String(goal.target) } : { kind: 'check', target: '', unit: tr('ページ') }; }
export function draftGoal(draft: GoalDraft): MeasureGoal | undefined {
  const target = parseAmount(draft.target), unit = draft.kind === 'time' ? '分' : draft.kind === 'count' ? '回' : (draft.originalUnit && tr(draft.originalUnit) === draft.unit.trim() ? draft.originalUnit : canonicalUnit(draft.unit.trim()));
  return draft.kind !== 'check' && target && unit.length > 0 && unit.length <= 12 && !/[\x00-\x1f]/.test(unit) ? { kind: draft.kind, target, unit } : undefined;
}
export function amountLabel(n: number) { return Number(n.toFixed(2)).toLocaleString(getLanguage() === 'mn' ? 'mn-MN' : getLanguage() === 'en' ? 'en-US' : 'ja-JP'); }
export function entryLabel(entry?: Entry) { if (!entry) return tr("まだ記録がありません"); if (entry.status === 'rest') return tr("お休み"); const m = entry.measurement; return m ? amountLabel(m.value) + ' / ' + amountLabel(m.target) + tr(m.unit) + (entry.status === 'done' ? tr(" ✓ 達成") : tr(" · 取り組み中")) : tr("✓ 達成（量の記録なし）"); }
export function summarize(data: Data, habitId: string, end: string, days: number) {
  const start = shift(end, 1 - days), previousStart = shift(start, -days);
  const all = data.entries.filter(e => e.habitId === habitId);
  const entries = all.filter(e => e.date >= start && e.date <= end);
  const previous = all.filter(e => e.date >= previousStart && e.date < start);
  const keys = new Map<string, { kind: MeasureGoal['kind']; unit: string }>();
  for (const e of [...entries, ...previous]) if (e.measurement) keys.set(e.measurement.kind + ':' + e.measurement.unit, e.measurement);
  const series = [...keys.values()].map(({kind, unit}) => {
    const matches = (e: Entry) => e.measurement?.kind === kind && e.measurement.unit === unit;
    const current = entries.filter(matches), before = previous.filter(matches);
    const sum = (list: Entry[]) => Math.round(list.reduce((n, e) => n + e.measurement!.value, 0) * 100) / 100;
    return { kind, unit, total: sum(current), previous: sum(before), recorded: current.length, achieved: current.filter(e => e.status === 'done').length,
      points: Array.from({ length: days }, (_, i) => { const date = shift(start, i); return { date, value: sum(current.filter(e => e.date === date)) }; }) };
  });
  const activity = Array.from({ length: days }, (_, i) => {
    const date = shift(start, i);
    return { date, status: entries.find(e => e.date === date)?.status ?? 'none' };
  });
  return { activity, start, end, days: entries.filter(e => e.status !== 'rest').length, done: entries.filter(e => e.status === 'done').length, unmeasured: entries.filter(e => e.status === 'done' && !e.measurement).length, series };
}

export function summarizeAll(data: Data, end: string, days: number) {
  const start = shift(end, 1 - days), previousStart = shift(start, -days);
  const points = Array.from({ length: days }, (_, i) => ({ date: shift(start, i), done: 0, progress: 0 }));
  const byDate = new Map(points.map(p => [p.date, p]));
  let previousDone = 0;
  for (const entry of data.entries) {
    const point = byDate.get(entry.date);
    if (point && entry.status === 'done') point.done++;
    if (point && entry.status === 'progress') point.progress++;
    if (entry.date >= previousStart && entry.date < start && entry.status === 'done') previousDone++;
  }
  return { start, end, points, done: points.reduce((n, p) => n + p.done, 0), progress: points.reduce((n, p) => n + p.progress, 0), activeDays: points.filter(p => p.done + p.progress > 0).length, previousDone };
}

const habitColors = ['#439CDC', '#DF7BA5', '#80CDA9', '#B295D6', '#E6AF54', '#55B8BF', '#D98264', '#8198CB'];
export function habitChart(data: Data, end: string, days: number) {
  const start = shift(end, 1 - days);
  const habits = data.habits.map((habit, index) => ({ id: habit.id, name: habit.name, color: habitColors[index] ?? 'hsl(' + ((index * 137.5) % 360) + ', 55%, 55%)' }));
  const byDate = new Map<string, Map<string, Entry>>();
  for (const entry of data.entries) {
    if (entry.date < start || entry.date > end || entry.status === 'rest') continue;
    if (!byDate.has(entry.date)) byDate.set(entry.date, new Map());
    byDate.get(entry.date)!.set(entry.habitId, entry);
  }
  const points = Array.from({ length: days }, (_, i) => {
    const date = shift(start, i);
    const records = byDate.get(date);
    const segments = habits.flatMap(h => { const entry = records?.get(h.id); return entry ? [{ ...h, entry }] : []; });
    return { date, segments, done: segments.filter(s => s.entry.status === 'done').length };
  });
  const present = new Set(points.flatMap(p => p.segments.map(s => s.id)));
  return { start, end, points, habits: habits.filter(h => present.has(h.id)) };
}

export function currentWeekChart(data: Data, today: string) {
  return habitChart({ ...data, entries: data.entries.filter(e => e.date <= today) }, shift(weekStart(today), 6), 7);
}
