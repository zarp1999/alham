import { tr } from "./i18n";
export function normalizeMinutesInput(value: string): string {
  return value.replace(/[０-９]/g, c => String(c.charCodeAt(0) - 0xff10));
}
export function parseMinutes(value: string): number | null {
  const normalized = normalizeMinutesInput(value).trim();
  if (!/^\d{1,4}$/.test(normalized)) return null;
  const minutes = Number(normalized);
  return minutes >= 1 && minutes <= 1440 ? minutes : null;
}
export function timedAction(activity: string, minutes: number): string {
  return tr("{0}分、{1}", minutes, activity);
}

export const discoveryGoals = [
  { label: '体を動かしたい', category: '運動' },
  { label: '健康的に過ごしたい', category: '健康' },
  { label: '気持ちを整えたい', category: '心のケア' },
  { label: '本に親しみたい', category: '読書' },
  { label: '学びを増やしたい', category: '勉強' },
  { label: '暮らしを整えたい', category: '暮らし' },
  { label: '趣味を楽しみたい', category: '趣味' },
  { label: '人とのつながりを大切にしたい', category: '人とのつながり' },
  { label: '仕事に集中したい', category: '仕事' },
  { label: 'お金の使い方を見直したい', category: 'お金' },
  { label: 'まだ決まっていない', category: '' },
];
