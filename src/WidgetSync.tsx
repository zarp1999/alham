import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useHabitStore } from './store';
import { useLanguage } from './useLanguage';
import { dateKey } from './domain';
import { syncWidgetSnapshot } from './widget-platform';
export function WidgetSync() {
  const { data, ready, error } = useHabitStore();
  const language = useLanguage();
  useEffect(() => {
    if (!ready || error || Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Platform.OS === 'web') return;
    let lastDay = '';
    const sync = () => {
      try {
        const today = dateKey();
        syncWidgetSnapshot(data, language);
        lastDay = today;
      } catch (e) { console.warn('Widget update failed', e); }
    };
    sync();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    const timer = setInterval(() => { if (lastDay !== dateKey()) sync(); }, 30000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [data, ready, error, language]);
  return null;
}
