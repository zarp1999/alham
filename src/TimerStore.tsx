import { useLanguage } from './useLanguage';
import { tr } from "./i18n";
import type { Data } from './domain';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Alert } from 'react-native';
import { useHabitStore } from './store';
import { readPreference, writePreference, persistTimerRecord } from './storage';
import { parseTimer, remaining, type TimerSession } from './timer';
import { syncTimerNotification } from './notifications';
const Context = createContext<{ session: TimerSession | null; loaded: boolean; now: number; finish: (data: Data) => boolean; change: (next: TimerSession | null) => boolean } | null>(null);
export function TimerStore({ children }: { children: React.ReactNode }) {
  const language = useLanguage();
  const { ready, data, setData } = useHabitStore();
  const [session, setSession] = useState<TimerSession | null>(null), [loaded, setLoaded] = useState(false), [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!ready) return; let active = true; Promise.resolve().then(() => parseTimer(readPreference('timer'))).then(saved => { if (active) { setSession(saved); setLoaded(true); } }).catch(() => { if (active) Alert.alert(tr("タイマーを読み込めませんでした"), tr("アプリを開き直してください。")); }); return () => { active = false; }; }, [ready]);
  useEffect(() => { if (!session?.endAt) return; const refresh = () => setNow(Date.now()); const interval = setInterval(refresh, 500); const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(); }); return () => { clearInterval(interval); sub.remove(); }; }, [session?.endAt]);
  useEffect(() => {
    if (!loaded) return;
    const habit = data.habits.find(h => h.id === session?.habitId);
    syncTimerNotification(habit ? session : null, habit?.name ?? '').catch(() => Alert.alert(tr("終了通知を設定できませんでした"), tr("タイマーは続けられます。終了はタイマー画面で確認してください。")));
  }, [loaded, session, data.habits, language]);
  function change(next: TimerSession | null) {
    try { writePreference('timer', JSON.stringify(next)); setSession(next); setNow(Date.now()); return true; }
    catch { Alert.alert(tr("タイマーを保存できませんでした"), tr("空き容量を確認して、もう一度お試しください。")); return false; }
  }
  function finish(next: Data) {
    try { persistTimerRecord(next); setData(next); setSession(null); return true; }
    catch { Alert.alert(tr("記録を保存できませんでした"), tr("もう一度お試しください。")); return false; }
  }
  const validSession = session && data.habits.some(h => h.id === session.habitId) ? session : null;
  return <Context.Provider value={{ session: validSession, loaded, now, change, finish }}>{children}</Context.Provider>;
}
export function useTimer() { const context = useContext(Context); if (!context) throw new Error('Missing TimerStore'); return context; }
export function timerLabel(session: TimerSession, now: number) { const seconds = Math.ceil(remaining(session, now) / 1000); return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }