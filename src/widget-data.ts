import { dateKey, isDue, type Data } from './domain';
import type { Language } from './i18n';
export type TodayWidgetProps = { title: string; empty: string; more: string; rows: { id: string; name: string; done: boolean; rest: boolean; url: string }[] };
export function widgetProps(data: Data, date: string, language: Language): TodayWidgetProps {
  const rows = data.habits.filter(h => !h.paused && isDue(h, date)).map(h => {
    const status = data.entries.find(e => e.habitId === h.id && e.date === date)?.status;
    return { id: h.id, name: h.name, done: status === 'done', rest: status === 'rest', url: 'kotsukotsu://widget?id=' + encodeURIComponent(h.id) };
  }).sort((a,b) => Number(a.done || a.rest) - Number(b.done || b.rest));
  return { title: language === 'mn' ? 'Өнөөдрийн дадлууд' : language === 'en' ? "Today's habits" : '今日の習慣', empty: language === 'mn' ? 'Өнөөдөр хийх дадал алга' : language === 'en' ? 'No habits scheduled today' : '今日の習慣はありません', more: language === 'mn' ? 'Бүгдийг харах' : language === 'en' ? 'See all' : 'すべて見る', rows };
}
export function widgetTimeline(data: Data, language: Language, now = new Date()) {
  // Local midnights preserve weekday schedules across DST changes.
  const timeline = Array.from({ length: 367 }, (_, i) => {
    const date = i === 0 ? new Date(now) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return { date, props: widgetProps(data, dateKey(date), language) };
  });
  // Never leave an old weekday's habits on screen after a very long absence.
  timeline.push({date:new Date(now.getFullYear(),now.getMonth(),now.getDate()+367),props:{...widgetProps({habits:[],entries:[]},'',language),empty:language==='mn'?'Аппаа нээж шинэчилнэ үү':language==='en'?'Open the app to refresh':'アプリを開いて更新',rows:[]}});
  return timeline;
}
