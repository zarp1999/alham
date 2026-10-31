import { useTheme, themeColor, themeSurface, themeTextColor, isDark } from '../theme';
import { useLanguage } from "../useLanguage";
import { tr, weekday, setLanguage } from "../i18n";
import { GoalField } from '../GoalField';
import { goalDraft, draftGoal, type GoalDraft } from '../measurements';
import { discoveryGoals } from '../discovery';
import { HabitTemplatePicker } from '../HabitTemplatePicker';
import { habitCategories, type HabitTemplate } from '../habit-templates';
import { ReminderField } from '../ReminderField';
import { validReminder } from '../reminder-plan';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Redirect, router } from 'expo-router';
import { dateKey, updateHabit, type Habit, type Schedule } from '../domain';
import { useHabitStore } from '../store';
import { persistFirstHabit, writePreference } from '../storage';

export default function Discover() {
  useTheme(); const s = makeStyles();

  const language = useLanguage();
  const { data, setData, ready, error, onboarding, setOnboarding } = useHabitStore();
  const [step, setStep] = useState(0), [goal, setGoal] = useState<number | null>(null);
  const [name, setName] = useState(''), [action, setAction] = useState(''), [category, setCategory] = useState('暮らし');
  const [reminder, setReminder] = useState<string | undefined>();
  const [frequency, setFrequency] = useState(3), [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<Schedule['kind']>('weekly');
  const [days, setDays] = useState<number[]>([]);
  const [measureDraft, setMeasure] = useState<GoalDraft>(goalDraft());
  const measureValid = measureDraft.kind === 'check' || !!draftGoal(measureDraft);
  const locked = useRef(false);
  const titles = [tr('どんな毎日にしたいですか？'), tr('気になる一歩を選びましょう'), tr('どんな目標で始めますか？'), tr('あなたの最初の一歩')];
  const captions = [tr('気になる分野を選んでください。まだ決まっていなくても大丈夫。'), tr('別のカテゴリーからも選べます。'), tr('時間・回数・量、または実施したかだけを記録できます。'), tr('名前や目標は自由に直せます。無理のないペースで始めましょう。')];
  function selectIdea(idea: HabitTemplate) {
    setName(tr(idea.name)); setAction(tr(idea.action)); setCategory(idea.category);
    setMeasure(goalDraft(idea.goal)); setStep(2);
  }
  function save() {
    if (!measureValid) return;
    if ((kind === 'days' && !days.length) || (reminder !== undefined && !validReminder(reminder)) || locked.current || !name.trim() || !action.trim()) return;
    locked.current = true; setSaving(true);
    const today = dateKey();
    const habit: Habit = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, name: name.trim(), action: action.trim(), category, reason: goal === null || !discoveryGoals[goal].category ? '' : tr(discoveryGoals[goal].label), created: today, paused: false, reminder, goal: draftGoal(measureDraft), schedules: [{ from: today, kind, days: [...days].sort((a, b) => a - b), target: kind === 'daily' ? 7 : kind === 'days' ? days.length : frequency }] };
    const next = updateHabit(data, habit);
    try {
      persistFirstHabit(next);
      setData(next); setOnboarding(false);
      if (router.canDismiss()) router.dismissAll();
      router.replace('/today');
    } catch { locked.current = false; setSaving(false); Alert.alert(tr("保存できませんでした"), tr("入力はそのまま残っています。空き容量を確認して、もう一度お試しください。")); }
  }
  function option(label: string, selected: boolean, onPress: () => void, detail?: string) {
    return <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.option, selected && s.selected]}><Text style={s.optionTitle}>{selected ? '✓  ' : ''}{label}</Text>{detail && <Text style={s.body}>{detail}</Text>}</Pressable>;
  }
  const canContinue = step === 0 ? goal !== null : step === 2 ? measureValid : measureValid && !!name.trim() && !!action.trim() && (kind !== 'days' || days.length > 0) && (reminder === undefined || validReminder(reminder));
  if (ready && !error && !onboarding) return <Redirect href="/today" />;
  return <SafeAreaView style={s.safe}><StatusBar style={isDark() ? "light" : "dark"} /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    {error ? <Text style={s.content}>{error}</Text> : !ready ? <ActivityIndicator accessibilityLabel={tr("読み込み中")} /> : <>
      <View style={s.header}><Text style={s.brand}>{tr("Alham")}</Text><Text style={s.body}>{tr("習慣を見つける ·")}{step + 1} / 4</Text></View>
      {step === 0 && <View style={s.languageRow}>{([{id:'ja', label:'日本語'}, {id:'mn', label:'Монгол'}, {id:'en', label:'English'}] as const).map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{selected: language === option.id}} onPress={() => { try { writePreference('language', option.id); setLanguage(option.id); } catch { Alert.alert(tr('保存できませんでした'), tr('もう一度お試しください。')); } }} style={[s.languageChoice, language === option.id && s.selected]}><Text style={s.languageText}>{option.label}</Text></Pressable>)}</View>}
      <View style={s.progress}>{titles.map((title, i) => <View key={title} style={[s.segment, i <= step && { backgroundColor: themeColor('#266C53') }]} />)}</View>
      <ScrollView key={step} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.eyebrow}>{step === 0 ? tr("小さな一歩を、一緒に探そう") : tr("小さく、長く、自分のペースで。")}</Text>
        <Text accessibilityRole="header" style={s.title}>{titles[step]}</Text><Text style={[s.body, { marginBottom: 24 }]}>{captions[step]}</Text>
        {step === 0 && discoveryGoals.map((item, index) => option(tr(item.label), goal === index, () => setGoal(index), item.category ? tr(item.category) : undefined))}
        {step === 1 && <HabitTemplatePicker showHeading={false} initialCategory={goal === null ? '' : discoveryGoals[goal].category} onSelect={selectIdea} onCustom={() => { setName(''); setAction(''); setCategory(goal === null ? '暮らし' : discoveryGoals[goal].category || '暮らし'); setMeasure(goalDraft()); setStep(2); }} />}
        {step === 2 && <><Text style={s.optionTitle}>{name}</Text><GoalField value={measureDraft} onChange={setMeasure} /></>}
        {step === 3 && <>
          <Text style={s.label}>{tr("習慣名 *")}</Text><TextInput accessibilityLabel={tr("習慣名")} style={s.input} value={name} onChangeText={setName} maxLength={60} placeholder={tr("例：本を読む")} />
          <Text style={s.label}>{tr("これができたら達成 *")}</Text><TextInput accessibilityLabel={tr("小さな実行目標")} style={s.input} value={action} onChangeText={setAction} maxLength={120} placeholder={tr("例：１ページ読む")} />
          <Text style={s.label}>{tr('カテゴリー')}</Text><View style={s.choices}>{habitCategories.map(c => <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: category === c }} onPress={() => setCategory(c)} style={[s.choice, category === c && s.selected]}><Text style={s.optionTitle}>{tr(c)}</Text></Pressable>)}</View>
          <Text style={s.label}>{tr("取り組むペース")}</Text>
          {option(tr("毎日"), kind === 'daily', () => setKind('daily'))}
          {option(tr("曜日を選ぶ"), kind === 'days', () => setKind('days'))}
          {kind === 'days' && <>
            <View style={s.choices}>{[1, 2, 3, 4, 5, 6, 0].map(day => <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={tr("{0}曜日", weekday(day))} accessibilityState={{ checked: days.includes(day) }} onPress={() => setDays(previous => previous.includes(day) ? previous.filter(d => d !== day) : [...previous, day])} style={[s.choice, days.includes(day) && s.selected]}><Text style={s.optionTitle}>{weekday(day)}</Text></Pressable>)}</View>
            {!days.length && <Text style={[s.body, { marginBottom: 12 }]}>{tr("取り組む曜日を１つ以上選んでください。")}</Text>}
          </>}
          {option(tr("週に○回"), kind === 'weekly', () => setKind('weekly'))}
          {kind === 'weekly' && <View style={s.choices}>{[1, 2, 3, 4, 5, 6, 7].map(n => <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: frequency === n }} onPress={() => setFrequency(n)} style={[s.choice, frequency === n && s.selected]}><Text style={s.optionTitle}>{n}{tr("回")}</Text></Pressable>)}</View>}
          <ReminderField value={reminder} onChange={setReminder} weekly={kind === 'weekly'} />
          <View style={s.note}><Text style={s.optionTitle}>{tr("休んでも、またここから。")}</Text><Text style={s.body}>{tr("登録後も内容や頻度を変更できます。")}</Text></View>
        </>}
        {step !== 1 && <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canContinue || saving }} disabled={!canContinue || saving} style={[s.button, (!canContinue || saving) && { opacity: .4 }]} onPress={() => step === 3 ? save() : setStep(step + 1)}><Text style={s.buttonText}>{saving ? tr("保存しています…") : step === 3 ? tr("この習慣で始める") : tr("次へ")}</Text></Pressable>}
        {step > 0 && <Pressable accessibilityRole="button" disabled={saving} style={s.back} onPress={() => setStep(step - 1)}><Text style={s.link}>{tr("戻る")}</Text></Pressable>}
      </ScrollView>
    </>}
  </KeyboardAvoidingView></SafeAreaView>;
}
const makeStyles = () => StyleSheet.create({
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingBottom: 14 },
  languageChoice: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: themeColor('#E0E5DE'), backgroundColor: themeSurface() },
  languageText: { color: themeColor('#233B34'), fontSize: 14, fontWeight: '600' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }, choice: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: themeColor('#E0E5DE'), backgroundColor: themeSurface() },
  safe: { flex: 1, backgroundColor: themeColor('#F6F7F2') }, header: { padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, brand: { color: themeTextColor('#266C53'), fontSize: 22, fontWeight: '800' },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 22 }, segment: { height: 4, flex: 1, backgroundColor: themeColor('#E0E5DE'), borderRadius: 3 },
  content: { padding: 24, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, eyebrow: { fontSize: 12, color: themeTextColor('#266C53'), marginBottom: 16, marginTop: 14 }, title: { fontSize: 28, lineHeight: 40, color: themeColor('#233B34'), fontWeight: '800', marginBottom: 12 },
  body: { color: themeColor('#63756B'), fontSize: 14, lineHeight: 23 }, option: { padding: 18, borderRadius: 18, backgroundColor: themeSurface(), borderWidth: 1, borderColor: themeColor('#E0E5DE'), marginBottom: 12, gap: 6 }, selected: { backgroundColor: themeColor('#E3EFE5'), borderColor: themeColor('#266C53') }, optionTitle: { fontSize: 16, lineHeight: 24, color: themeColor('#233B34'), fontWeight: '700' },
  button: { padding: 18, minHeight: 54, borderRadius: 16, backgroundColor: themeColor('#266C53'), alignItems: 'center', marginTop: 16 }, buttonText: { color: 'white', fontWeight: '700', fontSize: 16 }, back: { padding: 16, minHeight: 48, alignItems: 'center' }, link: { color: themeTextColor('#266C53'), fontSize: 14 }, label: { color: themeColor('#233B34'), fontWeight: '700', marginBottom: 10, marginTop: 14 }, input: { backgroundColor: themeSurface(), padding: 16, borderRadius: 14, borderWidth: 1, borderColor: themeColor('#E0E5DE'), color: themeColor('#233B34'), fontSize: 16 }, note: { backgroundColor: themeColor('#E3EFE5'), borderRadius: 18, padding: 20, gap: 8, marginTop: 12 },
});


