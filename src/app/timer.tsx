import { useTheme, themeColor, themeSurface, themeTextColor } from '../theme';
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useHabitStore } from '../store';
import { useTimer, timerLabel } from '../TimerStore';
import { defaultMinutes, pauseTimer, remaining, resumeTimer } from '../timer';
import { parseMinutes } from '../discovery';
import { dateKey } from '../domain';
function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  useTheme(); const s = makeStyles();
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && { opacity: .4 }]}><Text style={[s.buttonText, secondary && { color: themeTextColor('#266C53') }]}>{label}</Text></Pressable>; }
export default function TimerScreen() {
  useTheme(); const s = makeStyles();

  useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, ready } = useHabitStore();
  const { session, loaded, now, change } = useTimer();
  const habit = data.habits.find(h => h.id === id);
  const [input, setInput] = useState<string | null>(null);
  const minutes = input ?? String(habit?.goal?.kind === 'time' ? Math.min(1440, Math.max(1, Math.ceil(habit.goal.target))) : defaultMinutes(habit?.action ?? ''));
  const active = session?.habitId === id ? session : null;
  const finished = !!active && remaining(active, now) === 0;
  function back() { if (router.canGoBack()) router.back(); else router.replace('/today'); }
  function record() {
    if (!habit || !active) return;
    const paused = pauseTimer(active, Date.now());
    const elapsed = Math.round((active.durationMs - paused.remainingMs) / 600) / 100;
    if (!change(paused)) return;
    router.push({ pathname: '/record', params: { id: habit.id, date: dateKey(), timer: '1', elapsed: String(elapsed), duration: String(active.durationMs / 60000) } });
  }
  if (!ready || !loaded) return <SafeAreaView style={s.safe}><ActivityIndicator /></SafeAreaView>;
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Button label={tr("← 戻る")} onPress={back} secondary />
    <Text style={s.heading}>{habit?.name ?? tr("習慣が見つかりません")}</Text>
    {!!habit && <><Text style={s.body}>{habit.action}</Text>
      {active ? <>
        <Text style={s.status}>{finished ? tr("おつかれさまでした！") : active.endAt === null ? tr("一時停止中") : tr("今は、この一歩に集中。")}</Text>
        <Text accessibilityLabel={tr("残り {0}", timerLabel(active, now))} style={s.clock}>{timerLabel(active, now)}</Text>
        {!finished && <Button label={active.endAt === null ? tr("再開する") : tr("一時停止する")} onPress={() => change(active.endAt === null ? resumeTimer(active, Date.now()) : pauseTimer(active, Date.now()))} />}
        {finished && <Button label={tr("取り組みを記録する")} onPress={record} />}
        {!finished && <Button label={tr("ここまでで終了する")} onPress={() => Alert.alert(tr("ここまでの取り組みを終了しますか？"), tr("できた分を確認して記録できます。"), [{ text: tr("続ける"), style: 'cancel' }, { text: tr("記録せず終了"), onPress: () => { change(null); } }, { text: tr("取り組みを記録する"), onPress: record }])} secondary />}
        {finished && <Button label={tr("記録せず閉じる")} onPress={() => { if (change(null)) back(); }} secondary />}
      </> : session ? <><Text style={s.status}>{tr("別の習慣のタイマーがあります。")}</Text><Button label={tr("進行中のタイマーを開く")} onPress={() => router.replace({ pathname: '/timer', params: { id: session.habitId } })} /></> : <>
        <Text style={s.status}>{tr("何分取り組みますか？")}</Text>
        <TextInput accessibilityLabel={tr("タイマーの分数")} value={minutes} onChangeText={setInput} keyboardType="number-pad" maxLength={4} style={s.input} />
        <Text style={s.body}>{tr("分（1〜1440）")}</Text>
        <Button label={tr("タイマーを開始する")} onPress={() => { const n = parseMinutes(minutes); if (n) change({ habitId: habit.id, durationMs: n * 60000, remainingMs: n * 60000, endAt: Date.now() + n * 60000 }); }} disabled={!parseMinutes(minutes)} />
      </>}
    </>}
  </ScrollView></SafeAreaView>;
}
const makeStyles = () => StyleSheet.create({ safe: { flex: 1, backgroundColor: themeColor('#F6F7F2') }, content: { padding: 24, maxWidth: 680, width: '100%', alignSelf: 'center' }, heading: { fontSize: 28, fontWeight: '700', color: themeColor('#233B34'), marginTop: 24 }, body: { fontSize: 15, lineHeight: 24, color: themeColor('#718078'), marginVertical: 12 }, status: { fontSize: 18, color: themeColor('#233B34'), marginTop: 36, marginBottom: 20 }, clock: { fontSize: 64, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'center', color: themeTextColor('#266C53'), marginVertical: 36 }, input: { backgroundColor: themeSurface(), borderWidth: 1, borderColor: themeColor('#E0E5DE'), borderRadius: 16, padding: 18, fontSize: 28, color: themeColor('#233B34') }, button: { backgroundColor: themeColor('#266C53'), borderRadius: 16, padding: 18, marginVertical: 8, alignItems: 'center' }, secondary: { backgroundColor: themeColor('#E3EFE5') }, buttonText: { fontSize: 16, fontWeight: '600', color: 'white' } });