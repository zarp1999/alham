import { useTheme, themeColor, themeSurface, themeTextColor, themeOptions, setTheme, getDisplayMode, setDisplayMode, isDark } from './src/theme';
import { canPinWidget, requestWidgetPin } from './src/widget-pin';
import { useLanguage } from "./src/useLanguage";
import { tr, weekday, setLanguage, getLanguage, dayLabel } from "./src/i18n";
import { HabitTemplatePicker } from './src/HabitTemplatePicker';
import { habitCategories } from './src/habit-templates';
import { GoalField } from './src/GoalField';
import { ProgressReview } from './src/ProgressReview';
import { goalDraft, draftGoal, entryLabel, amountLabel, type GoalDraft } from './src/measurements';
import { useTimer } from './src/TimerStore';
import { ReminderField } from './src/ReminderField';
import { validReminder } from './src/reminder-plan';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { dateKey, fromKey, isDue, scheduleAt, scheduleLabel, updateHabit, weeklyCount, withEntry, type Data, type Habit, type Schedule } from './src/domain';
import { persist, writePreference } from './src/storage';
import { useHabitStore } from './src/store';
import { Redirect, router, useLocalSearchParams } from 'expo-router';

const C = {  get bg() { return themeColor('#F6F7F2'); }, get white() { return '#FFFFFF'; }, get ink() { return themeColor('#233B34'); }, get muted() { return themeColor('#718078'); }, get green() { return themeColor('#266C53'); }, get pale() { return themeColor('#E3EFE5'); }, get line() { return themeColor('#E0E5DE'); }, get gold() { return themeColor('#F4EAD1'); }  };
type Tab = 'today' | 'habits' | 'review' | 'settings';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const tabs: { id: Tab; title: string; icon: IconName }[] = [{ id: 'today', title: '今日', icon: 'sunny-outline' }, { id: 'habits', title: '習慣', icon: 'grid-outline' }, { id: 'review', title: '振り返り', icon: 'bar-chart-outline' }, { id: 'settings', title: '設定', icon: 'settings-outline' }];
function Icon({ name, size = 22, color = themeTextColor('#266C53') }: { name: IconName; size?: number; color?: string }) { return <Ionicons name={name} size={size} color={color} />; }
function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  useTheme(); const s = makeStyles();

  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && { opacity: .45 }]}><Text style={[s.buttonText, secondary && { color: themeTextColor('#266C53') }]}>{label}</Text></Pressable>;
}
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  useTheme(); const s = makeStyles();

  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.chip, selected && { backgroundColor: C.green, borderColor: C.green }]}><Text style={{ color: selected ? C.white : C.ink, fontWeight: '600' }}>{label}</Text></Pressable>;
}
function AppContent() {
  const activeTheme = useTheme(); const s = makeStyles();

  useLanguage();
  const { session: timerSession } = useTimer();
  const { data, setData, ready, error, onboarding, notificationError, remindersEnabled, changeRemindersEnabled } = useHabitStore();
  const params = useLocalSearchParams<{ tab?: string; origin?: string; id?: string; date?: string }>();
  const tab: Tab = tabs.some(t => t.id === params.tab) ? params.tab as Tab : tabs.some(t => t.id === params.origin) ? params.origin as Tab : 'today';
  const detailId = params.tab === 'detail' ? params.id ?? null : null;
  const editor = params.tab === 'edit' ? params.id === 'new' ? 'new' : data.habits.find(h => h.id === params.id) ?? null : null;
  function goBack() { if (router.canGoBack()) router.back(); else router.replace({ pathname: '/[tab]', params: { tab } }); }
  function setDetailId(id: string | null) { if (id) router.push({ pathname: '/[tab]', params: { tab: 'detail', origin: tab, id, date: selectedDate } }); else if (detailId) goBack(); }
  function setTab(next: Tab) { if (router.canDismiss()) router.dismissAll(); router.replace({ pathname: '/[tab]', params: { tab: next } }); }
  function setEditor(_value: null) { goBack(); }
  const [today, setToday] = useState(dateKey());
  const [notice, setNotice] = useState('');
  const [showColors, setShowColors] = useState(false);
  const [settingsPicker, setSettingsPicker] = useState<'mode' | 'language' | null>(null);
  const [month, setMonth] = useState(dateKey().slice(0, 7)), [selectedDate, setSelectedDate] = useState(dateKey());
  const [choosingTemplate, setChoosingTemplate] = useState(true);
  const [goal, setGoal] = useState<GoalDraft>(goalDraft());
  const [reminder, setReminder] = useState<string | undefined>();
  const [name, setName] = useState(''), [action, setAction] = useState(''), [reason, setReason] = useState(''), [category, setCategory] = useState('暮らし');
  const [kind, setKind] = useState<Schedule['kind']>('daily'), [days, setDays] = useState([1, 2, 3, 4, 5]), [target, setTarget] = useState(3);
  useEffect(() => {
    const refresh = () => setToday(dateKey());
    const timer = setInterval(refresh, 30000), sub = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
  function commit(next: Data): boolean {
    try { persist(next); setData(next); return true; }
    catch { Alert.alert(tr("保存できませんでした"), tr("空き容量を確認して、もう一度お試しください。")); return false; }
  }
  function openEditor(habit: Habit | 'new') {
    router.push({ pathname: '/[tab]', params: { tab: 'edit', origin: tab, id: habit === 'new' ? 'new' : habit.id } });
  }
  useEffect(() => {
    if (params.tab !== 'edit' || !ready) return;
    const h = params.id === 'new' ? null : data.habits.find(habit => habit.id === params.id);
    const sc = h ? scheduleAt(h, today) : null;
    setChoosingTemplate(params.id === 'new');
    setReminder(h?.reminder); setGoal(goalDraft(h?.goal));
    setName(h?.name ?? ''); setAction(h?.action ?? ''); setReason(h?.reason ?? ''); setCategory(h?.category ?? '暮らし');
    setKind(sc?.kind ?? 'daily'); setDays(sc?.days ?? [1, 2, 3, 4, 5]); setTarget(sc?.target ?? 3);
    // Initialize once per editor route, preserving unsaved input during store updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tab, params.id, ready]);
  useEffect(() => {
    const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) && params.date <= today ? params.date : today;
    setSelectedDate(date); setMonth(date.slice(0, 7));
  }, [params.date, today]);
  function saveHabit() {
    if (goal.kind !== 'check' && !draftGoal(goal)) return;
    if ((reminder !== undefined && !validReminder(reminder)) || !name.trim() || (kind === 'days' && !days.length)) return;
    const previous = editor && editor !== 'new' ? editor : null;
    const sc: Schedule = { from: today, kind, days: [...days].sort(), target };
    const old = previous ? scheduleAt(previous, today) : null;
    const changed = !old || old.kind !== kind || old.target !== target || old.days.join() !== sc.days.join();
    const schedules = previous ? changed ? [...previous.schedules.filter(x => x.from < today), sc] : previous.schedules : [sc];
    const habit: Habit = { id: previous?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, name: name.trim(), action: action.trim(), reason: reason.trim(), category, created: previous?.created ?? today, paused: previous?.paused ?? false, reminder, goal: draftGoal(goal), schedules };
    if (commit(updateHabit(data, habit))) { setEditor(null); setNotice(previous ? tr("習慣を更新しました") : tr("小さな一歩を登録しました")); }
  }
  function record(habit: Habit, date: string, status: 'done' | 'rest') {
    const existing = data.entries.find(e => e.habitId === habit.id && e.date === date);
    if (status === 'done') {
      if (!habit.goal && !existing?.measurement && existing?.status !== 'done') {
        if (!commit(withEntry(data, habit.id, date, 'done'))) return;
      }
      router.push({ pathname: '/record', params: { id: habit.id, date } }); return;
    }
    const remove = existing?.status === 'rest';
    const apply = () => { if (commit(withEntry(data, habit.id, date, remove ? undefined : 'rest'))) setNotice(remove ? tr("記録を取り消しました") : tr("休みを記録しました。また次の一歩から")); };
    if (remove && existing?.note) Alert.alert(tr('記録を取り消しますか？'), tr('メモも削除されます。'), [{text:tr('キャンセル'),style:'cancel'}, {text:tr('取り消す'),style:'destructive',onPress:apply}]); else apply();
  }
  function toggleToday(habit: Habit) {
    const existing = data.entries.find(e => e.habitId === habit.id && e.date === today);
    if (habit.goal || existing?.measurement || existing?.status !== 'done') { record(habit, today, 'done'); return; }
    const undo = () => { if (commit(withEntry(data, habit.id, today))) setNotice(tr('記録を取り消しました')); };
    if (existing.note) Alert.alert(tr('記録を取り消しますか？'), tr('メモも削除されます。'), [{text:tr('キャンセル'),style:'cancel'}, {text:tr('取り消す'),style:'destructive',onPress:undo}]);
    else undo();
  }
  const active = data.habits.filter(h => !h.paused);
  const due = active.filter(h => isDue(h, today));
  const completed = due.filter(h => data.entries.some(e => e.habitId === h.id && e.date === today && e.status === 'done')).length;
  const detail = data.habits.find(h => h.id === detailId);
  function openDetail(h: Habit) { setSelectedDate(today); setMonth(today.slice(0, 7)); setDetailId(h.id); }
  function habitCard(h: Habit, interactive: boolean) {
    const status = data.entries.find(e => e.habitId === h.id && e.date === today)?.status;
    const sc = scheduleAt(h, today);
    return <View key={h.id} style={[s.habitCard, status === 'done' && interactive && { backgroundColor: C.pale }]}>
      <View style={s.row}>
        <View style={s.habitIcon}><Icon name={h.category === '運動' ? 'fitness-outline' : h.category === '読書' ? 'book-outline' : h.category === '勉強' ? 'pencil-outline' : 'leaf-outline'} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={tr("{0}の詳細", h.name)} onPress={() => openDetail(h)} style={{ flex: 1, paddingVertical: 6 }}>
          <Text style={s.habitName}>{h.name}</Text><Text style={s.small}>{h.action || tr("小さな一歩から始めよう")}</Text>
        </Pressable>
        {interactive ? <Pressable accessibilityRole={h.goal || data.entries.some(e => e.habitId === h.id && e.date === today && e.measurement) ? 'button' : 'checkbox'} accessibilityState={h.goal || data.entries.some(e => e.habitId === h.id && e.date === today && e.measurement) ? undefined : {checked: status === 'done'}} accessibilityLabel={h.goal || data.entries.some(e => e.habitId === h.id && e.date === today && e.measurement) ? tr("{0}の実績を記録", h.name) : tr("{0}を{1}", h.name, status === 'done' ? tr("取り消す") : tr("達成にする"))} onPress={() => toggleToday(h)} style={s.checkHit}>
          <View style={[s.check, status === 'done' && { backgroundColor: C.green, borderColor: C.green }]}>{status === 'done' ? <Icon name="checkmark" size={22} color={C.white} /> : h.goal ? <Icon name="add" size={22} /> : null}</View>
        </Pressable> : <Pressable accessibilityRole="button" accessibilityLabel={tr("{0}の詳細", h.name)} onPress={() => openDetail(h)} style={s.checkHit}><Icon name="chevron-forward" size={20} /></Pressable>}
      </View>
      {(h.goal || data.entries.some(e => e.habitId === h.id && e.date === today && e.measurement)) && <Pressable accessibilityRole="button" onPress={() => record(h, today, 'done')} style={{ paddingVertical: 12 }}><Text style={s.link}>{data.entries.some(e => e.habitId === h.id && e.date === today) ? entryLabel(data.entries.find(e => e.habitId === h.id && e.date === today)) : tr("目標 {0}{1} · 実績を記録", amountLabel(h.goal!.target), tr(h.goal!.unit))}</Text></Pressable>}
      <View style={s.habitFooter}> 
        <Text style={[s.small, s.habitSchedule]}>{h.reminder ? tr("通知 {0} · ", h.reminder) : ''}{h.paused ? tr("休止中") : scheduleLabel(sc)}{sc?.kind === 'weekly' ? tr("  ·  今週 {0}/{1}回", weeklyCount(data, h.id, today), sc.target) : ''}</Text>
        {interactive && <Pressable accessibilityRole="button" onPress={() => record(h, today, 'rest')} style={s.restButton}><Text style={[s.small, { textAlign: 'right' }]}>{status === 'rest' ? tr("休みを取り消す") : status === 'done' ? tr("休みに変更") : tr("今日は休む")}</Text></Pressable>}
      </View>
    </View>;
  }
  function calendar(habit?: Habit) {
    const first = `${month}-01`, date = fromKey(first), end = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const offset = (date.getDay() + 6) % 7;
    const monthLabel = tr("{0}年{1}月", date.getFullYear(), date.getMonth() + 1);
    const moveMonth = (delta: number) => { const next = fromKey(first); next.setMonth(next.getMonth() + delta); setMonth(dateKey(next).slice(0, 7)); };
    return <View style={s.card}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr("前の月")} onPress={() => moveMonth(-1)} style={s.checkHit}><Icon name="chevron-back" /></Pressable>
        <Text style={s.section}>{monthLabel}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={tr("次の月")} disabled={month >= today.slice(0, 7)} onPress={() => moveMonth(1)} style={s.checkHit}><Icon name="chevron-forward" color={month >= today.slice(0, 7) ? C.line : C.green} /></Pressable>
      </View>
      <View style={s.calendar}>{['月', '火', '水', '木', '金', '土', '日'].map(d => <Text key={d} style={[s.day, s.small]}>{tr(d)}</Text>)}
        {Array.from({ length: offset }, (_, i) => <View key={`blank${i}`} style={s.day} />)}
        {Array.from({ length: end }, (_, i) => {
          const key = `${month}-${String(i + 1).padStart(2, '0')}`;
          const records = data.entries.filter(e => e.date === key && (!habit || e.habitId === habit.id));
          const done = records.some(e => e.status === 'done'), rest = records.some(e => e.status === 'rest'), progress = records.some(e => e.status === 'progress');
          const disabled = key > today || (!!habit && key < habit.created);
          return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${key} ${done ? tr("達成あり") : progress ? tr("取り組みあり") : rest ? tr("休み") : tr("記録なし")}`} disabled={disabled} onPress={() => setSelectedDate(key)} style={s.day}>
            <View style={[s.dateCircle, done && { backgroundColor: C.green }, rest && !done && { backgroundColor: C.gold }, selectedDate === key && { borderColor: C.ink, borderWidth: 2 }]}>
              <Text style={{ color: done ? C.white : disabled ? themeColor('#B8BFB8') : C.ink }}>{i + 1}</Text>
              <Text style={{ color: done ? C.white : C.muted, fontSize: 10 }}>{done ? '✓' : progress ? '・' : rest ? tr("休") : ' '}</Text>
            </View>
          </Pressable>;
        })}
      </View><Text style={[s.small, { marginTop: 14 }]}>{tr("✓ 達成　・取り組み　休 お休み")}</Text>
    </View>;
  }
  if (error) return <SafeAreaView style={s.safe}><View style={s.content}><Text style={s.title}>{tr("読み込みエラー")}</Text><Text style={s.body}>{error}</Text></View></SafeAreaView>;
  if (!ready) return <SafeAreaView style={[s.safe, s.center]}><ActivityIndicator color={C.green} /><Text style={s.small}>{tr("記録を読み込んでいます")}</Text></SafeAreaView>;
  if (onboarding) return <Redirect href="/discover" />;
  return <SafeAreaView style={s.safe} edges={['top']}><StatusBar style={isDark() ? "light" : "dark"} />
    <View style={s.brand}><View style={s.row}><Icon name="leaf" size={20} /><Text style={s.brandText}>{tr("Alham")}</Text></View><Text style={[s.small,{flex:1,textAlign:'right'}]}>{tr("小さく、長く、自分のペースで。")}</Text></View>
    {!!notificationError && <View style={{ padding: 14, backgroundColor: C.gold }}><Text accessibilityLiveRegion="polite" style={s.body}>{notificationError}</Text></View>}
    <ScrollView key={detailId ?? tab} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {!!timerSession && <Button secondary label={tr("タイマーに戻る")} onPress={() => router.push({ pathname: '/timer', params: { id: timerSession.habitId } })} />}
      {detail ? <>
        <Pressable accessibilityRole="button" onPress={() => setDetailId(null)} style={[s.row, { paddingVertical: 10 }]}><Icon name="arrow-back" /><Text style={s.link}>{tr("戻る")}</Text></Pressable>
        <Text style={s.eyebrow}>{tr(detail.category)} · {scheduleLabel(scheduleAt(detail, today))}</Text><Text style={s.title}>{detail.name}</Text><Text style={s.body}>{detail.action}</Text>
        {!!detail.reason && <Text style={[s.body, { marginTop: 8 }]}>{tr("続けたい理由：")}{detail.reason}</Text>}
        <View style={s.statRow}><View style={s.stat}><Text style={s.statNumber}>{data.entries.filter(e => e.habitId === detail.id && e.status !== 'rest').length}</Text><Text style={s.small}>{tr("累計実践日数")}</Text></View><View style={s.stat}><Text style={s.statNumber}>{weeklyCount(data, detail.id, today)}</Text><Text style={s.small}>{tr("今週できた回数")}</Text></View></View>
        <Button label={tr("タイマーを開く")} onPress={() => router.push({ pathname: '/timer', params: { id: detail.id } })} />
        {calendar(detail)}
        <View style={s.card}><Text style={s.section}>{selectedDate} {tr("の記録")}</Text><Text style={[s.small, { marginVertical: 10 }]}>{entryLabel(data.entries.find(e => e.habitId === detail.id && e.date === selectedDate))}</Text>{data.entries.find(e => e.habitId === detail.id && e.date === selectedDate)?.note ? <Text style={[s.body, {marginBottom:12}]}>{data.entries.find(e => e.habitId === detail.id && e.date === selectedDate)?.note}</Text> : null}
          <View style={s.row}><View style={{ flex: 1 }}><Button disabled={selectedDate < detail.created} label={detail.goal || data.entries.some(e => e.habitId === detail.id && e.date === selectedDate && e.measurement) ? tr("実績を記録・編集") : tr("記録・メモを開く")} onPress={() => record(detail, selectedDate, 'done')} /></View><View style={{ flex: 1 }}><Button disabled={selectedDate < detail.created} secondary label={tr("休み / 取り消し")} onPress={() => record(detail, selectedDate, 'rest')} /></View></View>
        </View>
        <Button secondary label={tr("習慣を編集する")} onPress={() => openEditor(detail)} />
        <Button secondary label={detail.paused ? tr("この習慣を再開する") : tr("この習慣を休止する")} onPress={() => { if (commit(updateHabit(data, { ...detail, paused: !detail.paused }))) setNotice(detail.paused ? tr("また、ここから始めよう") : tr("記録を残して休止しました")); }} />
      </> : tab === 'today' ? <>
        <Text style={s.eyebrow}>{dayLabel(fromKey(today))}</Text>
        <Text style={s.title}>{tr("今日も、小さな一歩。")}</Text><Text style={s.body}>{tr("完璧じゃなくていい。できる分だけ。")}</Text>
        <View style={s.hero}><View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1, minWidth: 0 }}><Text style={s.heroLabel}>{tr("今日できたこと")}</Text><Text style={s.heroNumber}>{completed}<Text style={{ fontSize: 19, color: '#E3EFE5' }}> / {due.length}</Text></Text></View><Icon name="leaf-outline" size={54} color="#E3EFE5" /></View>
          <View style={s.track}><View style={[s.fill, { width: `${due.length ? completed / due.length * 100 : 0}%` }]} /></View>{!!due.length && completed === due.length && <Text style={[s.heroLabel, { marginTop: 12 }]}>{tr("今日の一歩を、すべて記録できました。")}</Text>}</View>
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}><Text style={s.section}>{tr("今日の習慣")}</Text><Pressable accessibilityRole="button" onPress={() => openEditor('new')} style={s.checkHit}><Icon name="add" /></Pressable></View>
        {due.length ? due.map(h => habitCard(h, true)) : <View style={s.card}><Icon name="leaf-outline" /><Text style={s.section}>{active.length ? tr("今日は予定がありません") : tr("最初の一歩を決めよう")}</Text><Text style={[s.body, { marginVertical: 12 }]}>{active.length ? tr("習慣タブから、好きな習慣を選んで記録できます。") : tr("「１ページ読む」くらいの、小さな目標から。")}</Text><Button label={tr("習慣を追加する")} onPress={() => openEditor('new')} /></View>}
        
      </> : tab === 'habits' ? <>
        <Text style={s.title}>{tr("自分のペースをつくる")}</Text>
        <Button label={tr("＋ 習慣を追加する")} onPress={() => openEditor('new')} />
        {active.map(h => habitCard(h, false))}
        {!data.habits.length && <View style={s.card}><Text style={s.section}>{tr("まずは１つから")}</Text><Text style={s.body}>{tr("追加画面で運動・読書・勉強の例を選べます。")}</Text></View>}
        {!!data.habits.filter(h => h.paused).length && <Text style={[s.section, { marginVertical: 14 }]}>{tr("休止中 · 記録は残っています")}</Text>}
        {data.habits.filter(h => h.paused).map(h => habitCard(h, false))}
      </> : tab === 'review' ? <>
        <Text style={s.title}>{tr("積み重ねを眺めよう")}</Text>
        <ProgressReview data={data} today={today} />
        {calendar()}<Text style={s.section}>{selectedDate} {tr("の記録")}</Text>
        {data.entries.filter(e => e.date === selectedDate).length ? data.entries.filter(e => e.date === selectedDate).map(e => <Pressable accessibilityRole="button" key={e.habitId} onPress={() => { setDetailId(e.habitId); }} style={s.reviewRow}><Text style={s.body}>{data.habits.find(h => h.id === e.habitId)?.name}</Text><Text style={s.link}>{entryLabel(e)}</Text></Pressable>) : <Text style={[s.small, { marginVertical: 18 }]}>{tr("この日の記録はありません。")}</Text>}
      </> : <>
        <Text style={s.title}>{tr("設定")}</Text>
        <Text style={s.settingsHeading}>{tr('通知')}</Text>
        <View style={s.settingsGroup}><View style={s.settingsRow}><View style={s.settingsIcon}><Icon name="notifications-outline" size={20} /></View><Text style={s.settingsLabel}>{tr('習慣の通知')}</Text><Switch accessibilityLabel={tr('習慣の通知')} value={remindersEnabled} trackColor={{true:C.green}} onValueChange={enabled => { try { changeRemindersEnabled(enabled); } catch { Alert.alert(tr('保存できませんでした'), tr('もう一度お試しください。')); } }} /></View></View>
        <Text style={s.settingsHeading}>{tr('表示')}</Text>
        <View style={s.settingsGroup}>
          <Pressable accessibilityRole="button" accessibilityLabel={tr('表示モード')} onPress={() => setSettingsPicker('mode')} style={s.settingsRow}>
            <View style={s.settingsIcon}><Icon name="contrast-outline" size={20} /></View><View style={s.settingsText}><Text style={s.settingsLabel}>{tr('表示モード')}</Text><Text style={s.settingsValue}>{tr(getDisplayMode() === 'system' ? 'デフォルト' : getDisplayMode() === 'light' ? 'ライト' : 'ダーク')}</Text></View><Icon name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
          <View style={s.settingsDivider} />
          <Pressable accessibilityRole="button" accessibilityState={{expanded:showColors}} accessibilityLabel={tr('カラーテーマ')} onPress={() => setShowColors(!showColors)} style={s.settingsRow}><View style={s.settingsIcon}><Icon name="color-palette-outline" size={20} /></View><Text style={s.settingsLabel}>{tr('カラーテーマ')}</Text><View style={[s.settingsSwatch,{backgroundColor:themeOptions.find(o=>o.id===activeTheme)?.accent}]} /><Icon name={showColors ? 'chevron-up' : 'chevron-forward'} size={18} color={C.muted} /></Pressable>
          {showColors && <View style={s.settingsColors}>{themeOptions.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={tr(option.label)} accessibilityState={{selected: activeTheme === option.id}} onPress={() => { try { writePreference('theme', option.id); setTheme(option.id); } catch { Alert.alert(tr('保存できませんでした'), tr('もう一度お試しください。')); } }} style={[s.themeChoice, activeTheme === option.id && {borderColor: option.accent, borderWidth: 2}]}><View style={{width:24,height:24,borderRadius:12,backgroundColor:option.accent}} /></Pressable>)}</View>}
        </View>
        <Text style={s.settingsHeading}>{tr('一般')}</Text>
        <View style={s.settingsGroup}><Pressable accessibilityRole="button" accessibilityLabel={tr('言語')} onPress={() => setSettingsPicker('language')} style={s.settingsRow}><View style={s.settingsIcon}><Icon name="language-outline" size={20} /></View><View style={s.settingsText}><Text style={s.settingsLabel}>{tr('言語')}</Text><Text style={s.settingsValue}>{getLanguage() === 'ja' ? '日本語' : getLanguage() === 'mn' ? 'Монгол' : 'English'}</Text></View><Icon name="chevron-forward" size={18} color={C.muted} /></Pressable>
        {canPinWidget() && <><View style={s.settingsDivider}/><Pressable accessibilityRole="button" accessibilityLabel={tr('今日の習慣をホーム画面に追加')} onPress={() => { try { if (!requestWidgetPin()) Alert.alert(tr('追加できませんでした'), tr('ホーム画面のウィジェット一覧から追加してください。')); } catch { Alert.alert(tr('追加できませんでした'), tr('もう一度お試しください。')); } }} style={s.settingsRow}><View style={s.settingsIcon}><Icon name="grid-outline" size={20} /></View><Text style={s.settingsLabel}>{tr('今日の習慣をホーム画面に追加')}</Text><Icon name="chevron-forward" size={18} color={C.muted}/></Pressable></>}
        </View>
        <Text style={[s.footnote, { marginTop: 24 }]}>{tr("Alham 1.0.0")}</Text>
      </>}
    </ScrollView>
    {!!notice && <View accessibilityLiveRegion="polite" style={s.toast}><Text style={{ color: C.white, textAlign: 'center' }}>{notice}</Text></View>}
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: themeSurface() }}><View style={s.nav}>{tabs.map(t => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} key={t.id} onPress={() => { setTab(t.id); setMonth(today.slice(0, 7)); setSelectedDate(today); }} style={[s.navItem, tab === t.id && { backgroundColor: C.pale }]}><Icon name={t.icon} color={tab === t.id ? themeTextColor('#266C53') : C.muted} /><Text style={{ color: tab === t.id ? themeTextColor('#266C53') : C.muted, fontSize: 11, fontWeight: '600' }}>{tr(t.title)}</Text></Pressable>)}</View></SafeAreaView>
    <Modal visible={settingsPicker !== null} transparent animationType="fade" onRequestClose={() => setSettingsPicker(null)}>
      <View style={s.pickerOverlay}><Pressable accessibilityRole="button" accessibilityLabel={tr('閉じる')} onPress={() => setSettingsPicker(null)} style={s.pickerBackdrop} /><View style={s.pickerCard} accessibilityViewIsModal><Text accessibilityRole="header" style={[s.section, {marginBottom: 12}]}>{tr(settingsPicker === 'mode' ? '表示モード' : '言語')}</Text>
      {(settingsPicker === 'mode' ? [{id:'system',label:tr('デフォルト')},{id:'light',label:tr('ライト')},{id:'dark',label:tr('ダーク')}] : [{id:'ja',label:'日本語'},{id:'mn',label:'Монгол'},{id:'en',label:'English'}]).map(option => { const selected = settingsPicker === 'mode' ? getDisplayMode() === option.id : getLanguage() === option.id; return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{checked:selected}} style={s.pickerOption} onPress={() => { try { if(settingsPicker === 'mode') { writePreference('displayMode',option.id); setDisplayMode(option.id); } else if(option.id === 'ja' || option.id === 'mn' || option.id === 'en') { writePreference('language',option.id); setLanguage(option.id); } setSettingsPicker(null); } catch { Alert.alert(tr('保存できませんでした'),tr('もう一度お試しください。')); } }}><Text style={s.pickerText}>{option.label}</Text>{selected && <Icon name="checkmark" size={22}/>}</Pressable>; })}
      </View></View>
    </Modal>
    <Modal visible={!!editor} animationType="slide" onRequestClose={() => setEditor(null)}>
      <SafeAreaProvider><SafeAreaView style={s.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.brand, { justifyContent: 'space-between' }]}><Text style={s.section}>{editor === 'new' ? tr("新しい習慣") : tr("習慣を編集")}</Text><Pressable accessibilityRole="button" accessibilityLabel={tr("編集を閉じる")} onPress={() => setEditor(null)} style={s.checkHit}><Icon name="close" /></Pressable></View>
        {!!notificationError && <View style={{ padding: 14, backgroundColor: C.gold }}><Text accessibilityLiveRegion="polite" style={s.body}>{notificationError}</Text></View>}
    <ScrollView key={editor === 'new' && choosingTemplate ? 'templates' : 'habit-form'} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {editor === 'new' && choosingTemplate ? <HabitTemplatePicker onCustom={() => { setName(''); setAction(''); setCategory('暮らし'); setGoal(goalDraft()); setChoosingTemplate(false); }} onSelect={t => { setName(tr(t.name)); setAction(tr(t.action)); setCategory(t.category); setGoal(goalDraft(t.goal)); setChoosingTemplate(false); }} /> : <>
          <Text style={s.title}>{tr("小さく始めよう。")}</Text><Text style={s.body}>{tr("疲れた日にもできるくらいで、大丈夫。")}</Text>
          <Text style={s.label}>{tr("習慣名 *")}</Text><TextInput accessibilityLabel={tr("習慣名")} value={name} onChangeText={setName} maxLength={60} placeholder={tr("例：本を読む")} placeholderTextColor={C.muted} style={s.input} />
          <Text style={s.label}>{tr("小さな実行目標")}</Text><TextInput accessibilityLabel={tr("小さな実行目標")} value={action} onChangeText={setAction} maxLength={120} placeholder={tr("例：１ページ読む")} placeholderTextColor={C.muted} style={s.input} />
          <Text style={s.label}>{tr("カテゴリー")}</Text><View style={s.wrap}>{[...new Set([...habitCategories, category])].map(c => <Chip key={c} label={tr(c)} selected={category === c} onPress={() => setCategory(c)} />)}</View>
          <Text style={s.label}>{tr("取り組む頻度")}</Text><View style={s.wrap}>{([{ k: 'daily', t: tr("毎日") }, { k: 'days', t: tr("曜日を選ぶ") }, { k: 'weekly', t: tr("週に○回") }] as const).map(v => <Chip key={v.k} label={tr(v.t)} selected={kind === v.k} onPress={() => setKind(v.k)} />)}</View>
          {kind === 'days' && <View style={[s.wrap, { marginTop: 12 }]}>{[1, 2, 3, 4, 5, 6, 0].map(d => <Chip key={d} label={weekday(d)} selected={days.includes(d)} onPress={() => setDays(days.includes(d) ? days.filter(x => x !== d) : [...days, d])} />)}</View>}
          {kind === 'weekly' && <><View style={[s.wrap, { marginTop: 12 }]}>{[1, 2, 3, 4, 5, 6, 7].map(n => <Chip key={n} label={tr("{0}回", n)} selected={target === n} onPress={() => setTarget(n)} />)}</View><Text style={[s.small, { marginTop: 10 }]}>{tr("月曜〜日曜の好きな日に取り組みます。１日１回として数えます。")}</Text></>}
          <GoalField value={goal} onChange={setGoal} />
          <ReminderField value={reminder} onChange={setReminder} weekly={kind === 'weekly'} />
          <Text style={s.label}>{tr("続けたい理由（任意）")}</Text><TextInput accessibilityLabel={tr("続けたい理由")} value={reason} onChangeText={setReason} maxLength={300} multiline placeholder={tr("例：自分のための時間をつくりたい")} placeholderTextColor={C.muted} style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]} />
          {editor !== 'new' && <Text style={[s.small, { marginTop: 12 }]}>{tr("頻度の変更は今日から適用されます。過去の記録は残ります。")}</Text>}
          <Button disabled={(goal.kind !== 'check' && !draftGoal(goal)) || (reminder !== undefined && !validReminder(reminder)) || !name.trim() || (kind === 'days' && !days.length)} label={tr("保存する")} onPress={saveHabit} />
          </>}
        </ScrollView>
      </KeyboardAvoidingView></SafeAreaView></SafeAreaProvider>
    </Modal>
  </SafeAreaView>;
}
export default AppContent;
const makeStyles = () => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line, gap: 10 },
  brandText: { fontSize: 18, fontWeight: '800', color: C.ink }, content: { padding: 22, paddingBottom: 36, width: '100%', maxWidth: 680, alignSelf: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, color: themeTextColor('#266C53'), fontWeight: '700', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 27, fontWeight: '800', lineHeight: 38, letterSpacing: -.6, color: C.ink, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 24, color: C.muted }, small: { fontSize: 12, lineHeight: 18, color: C.muted },
  section: { fontSize: 17, fontWeight: '700', color: C.ink }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hero: { backgroundColor: C.green, borderRadius: 24, padding: 24, marginTop: 24, marginBottom: 24 }, heroLabel: { color: '#E3EFE5', fontSize: 12, lineHeight: 20 },
  heroNumber: { color: C.white, fontSize: 44, fontWeight: '600', marginTop: 6 }, track: { height: 5, backgroundColor: themeColor('#4B896D'), borderRadius: 4, marginTop: 18 }, fill: { height: 5, backgroundColor: themeColor('#D7E9B2'), borderRadius: 4 },
  pickerOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  pickerCard: { width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: themeSurface(), borderRadius: 22, padding: 20 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 10, gap: 12 }, pickerText: { flex: 1, color: C.ink, fontSize: 16, lineHeight: 24 },
  settingsHeading: { fontSize: 13, fontWeight: '700', color: C.muted, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  settingsGroup: { backgroundColor: themeSurface(), borderRadius: 18, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  settingsRow: { minHeight: 68, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  settingsText: { flex: 1, minWidth: 0 }, settingsLabel: { flex: 1, color: C.ink, fontSize: 15, fontWeight: '600' },
  settingsValue: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 2 }, settingsDivider: { height: 1, backgroundColor: C.line, marginLeft: 66 },
  settingsSwatch: { width: 22, height: 22, borderRadius: 11 }, settingsColors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  themeChoice: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: themeSurface() },
  habitFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4, marginTop: 10 },
  habitSchedule: { flexBasis: 160, flexGrow: 1, flexShrink: 1 },
  restButton: { padding: 8, minHeight: 44, justifyContent: 'center', marginLeft: 'auto', maxWidth: '100%', flexShrink: 1 },
  habitCard: { padding: 16, backgroundColor: themeSurface(), borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  habitIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, habitName: { fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 5 },
  checkHit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, check: { width: 32, height: 32, borderRadius: 12, borderWidth: 1.5, borderColor: themeColor('#B5C5B9'), alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: themeSurface(), borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.line },
  button: { backgroundColor: C.green, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 12, marginVertical: 8 },
  secondary: { backgroundColor: C.pale }, buttonText: { color: C.white, fontSize: 14, fontWeight: '700' },
  footnote: { textAlign: 'center', color: C.muted, fontSize: 12, lineHeight: 22, marginTop: 18 },
  nav: { flexDirection: 'row', backgroundColor: themeSurface(), borderTopWidth: 1, borderColor: C.line, padding: 8, gap: 6 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 8, gap: 5 },
  statRow: { flexDirection: 'row', gap: 12, marginVertical: 24 }, stat: { flex: 1, backgroundColor: C.pale, borderRadius: 18, padding: 20 }, statNumber: { fontSize: 34, color: themeTextColor('#266C53'), fontWeight: '700', marginBottom: 4 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.2857%', minHeight: 46, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  dateCircle: { width: 37, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.line }, link: { color: themeTextColor('#266C53'), fontWeight: '600', fontSize: 14 },
  label: { marginTop: 24, marginBottom: 10, color: C.ink, fontSize: 14, fontWeight: '700' }, input: { backgroundColor: themeSurface(), borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 15, color: C.ink, fontSize: 16 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.line, borderRadius: 14, backgroundColor: themeSurface() },
  toast: { position: 'absolute', zIndex: 10, bottom: 110, left: 24, right: 24, borderRadius: 14, backgroundColor: isDark() ? '#34433E' : C.ink, padding: 14 },
  welcomeIcon: { width: 100, height: 100, borderRadius: 30, backgroundColor: C.pale, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
});









