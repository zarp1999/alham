import { requireOptionalNativeModule } from 'expo';
import { dateKey, type Data } from './domain';
import type { Language } from './i18n';
import { widgetProps } from './widget-data';
export function syncWidgetSnapshot(data: Data, language: Language) {
  const native = requireOptionalNativeModule<{update: (json: string) => void}>('HabitWidget');
  if (!native) return;
  const today = dateKey(), labels = widgetProps(data, today, language);
  native.update(JSON.stringify({ habits: data.habits, entries: data.entries.filter(e => e.date === today), title: labels.title, empty: labels.empty, more: labels.more }));
}
