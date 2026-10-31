import { setTheme, setDisplayMode, setSystemDark } from './theme';
import { useLanguage } from './useLanguage';
import { setLanguage, tr } from './i18n';
import { AppState, Appearance } from 'react-native';
import { syncReminders } from './notifications';
import React, { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { emptyData, type Data } from './domain';
import { initialize, readPreference, writePreference } from './storage';
type Store = { data: Data; setData: Dispatch<SetStateAction<Data>>; ready: boolean; error: string; notificationError: string; remindersEnabled: boolean; changeRemindersEnabled: (enabled: boolean) => void; onboarding: boolean; setOnboarding: Dispatch<SetStateAction<boolean>> };
const Context = createContext<Store | null>(null);
export function HabitStore({ children }: { children: React.ReactNode }) {
  const language = useLanguage();
  const [data, setData] = useState<Data>(emptyData), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  function changeRemindersEnabled(enabled: boolean) { writePreference('remindersEnabled', enabled ? '1' : '0'); setRemindersEnabled(enabled); }
  const [onboarding, setOnboarding] = useState(false);
  useEffect(() => {
    initialize().then(result => { const savedLanguage = readPreference('language'); setLanguage(savedLanguage === 'ja' || savedLanguage === 'mn' || savedLanguage === 'en' ? savedLanguage : 'en'); setTheme(readPreference('theme')); setSystemDark(Appearance.getColorScheme() === 'dark'); setDisplayMode(readPreference('displayMode')); setRemindersEnabled(readPreference('remindersEnabled') !== '0'); setData(result.data); setOnboarding(!result.onboarded && result.data.habits.length === 0); setReady(true); })
      .catch(() => setError(tr("記録を読み込めませんでした。アプリを開き直してください。データは上書きしていません。")));
  }, []);
  useEffect(() => { const sub = Appearance.addChangeListener(({colorScheme}) => setSystemDark(colorScheme === 'dark')); return () => sub.remove(); }, []);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const sync = () => { syncReminders(data.habits, remindersEnabled).then(message => { if (active) setNotificationError(message); }).catch(() => { if (active) setNotificationError(tr("習慣は保存済みですが、通知予約を更新できませんでした。アプリを開き直して再試行してください。")); }); };
    sync();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    return () => { active = false; sub.remove(); };
  }, [ready, data.habits, language, remindersEnabled]);
  return <Context.Provider value={{ data, setData, ready, error, notificationError, remindersEnabled, changeRemindersEnabled, onboarding, setOnboarding }}>{children}</Context.Provider>;
}
export function useHabitStore() { const value = useContext(Context); if (!value) throw new Error('Missing HabitStore'); return value; }


