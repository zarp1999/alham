import type { Data } from './domain';
import type { Language } from './i18n';
import { widgetTimeline } from './widget-data';
export function syncWidgetSnapshot(data: Data, language: Language) {
  // Loaded only after the Expo Go guard, and only in an iOS bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const widget = require('./widgets/TodayHabits.ios').default;
  widget.updateTimeline(widgetTimeline(data, language));
}
