import { useTheme, themeColor, themeTextColor, themeSurface } from '../theme';
import { useLanguage } from "../useLanguage";
import { tr } from "../i18n";
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { dateKey, fromKey, withMeasurement, withEntry, withNote, type MeasureGoal } from '../domain';
import { amountLabel, parseAmount } from '../measurements';
import { useHabitStore } from '../store';
import { useTimer } from '../TimerStore';
import { persist } from '../storage';
function Button({label,onPress,disabled=false,secondary=false}:{label:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}) {
  useTheme(); const s = makeStyles();
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,secondary && {backgroundColor:themeColor('#E3EFE5')},disabled && {opacity:.4}]}><Text style={{color:secondary ? themeTextColor('#266C53'):'white',fontWeight:'700',fontSize:16}}>{label}</Text></Pressable>; }
export default function RecordScreen() {
  useTheme(); const s = makeStyles();

  useLanguage();
  const params=useLocalSearchParams<{id:string;date?:string;elapsed?:string;duration?:string;timer?:string}>();
  const {data,setData,ready,error}=useHabitStore();
  const {session,finish}=useTimer();
  const [allowExit,setAllowExit]=useState(false);
  const habit=data.habits.find(h=>h.id===params.id);
  const date=params.date ?? dateKey();
  const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(fromKey(date).getTime()) && dateKey(fromKey(date))===date && date<=dateKey() && !!habit && date>=habit.created;
  const existing=data.entries.find(e=>e.habitId===params.id && e.date===date);
  const elapsed=parseAmount(params.elapsed ?? '');
  const goal: MeasureGoal | undefined = existing?.measurement ?? habit?.goal ?? (params.timer === '1' ? {kind:'time',unit:'分',target:parseAmount(params.duration ?? '') ?? 15} : undefined);
  const suggested=goal?.kind === 'time' && elapsed ? Math.round(((existing?.measurement?.kind === 'time' ? existing.measurement.value : 0)+elapsed)*100)/100 : existing?.measurement?.value;
  const [input,setInput]=useState<string|null>(null), [noteInput,setNoteInput]=useState<string|null>(null), [saving,setSaving]=useState(false);
  const note = noteInput ?? existing?.note ?? '';
  const value=parseAmount(input ?? (suggested !== undefined ? String(suggested) : ''));
  const dirty = (noteInput !== null && noteInput !== (existing?.note ?? '')) || (input !== null && input !== (suggested !== undefined ? String(suggested) : ''));
  function back() { if(router.canGoBack()) router.back(); else router.replace('/today'); }
  const disablePrevention = usePreventRemove(dirty && !allowExit, ({repeat}) => {
    Alert.alert(tr('入力内容を破棄しますか？'), tr('保存していない内容は失われます。'), [{text:tr('キャンセル'),style:'cancel'}, {text:tr('破棄する'),style:'destructive',onPress:() => { setAllowExit(true); repeat(); }}]);
  });
  function close() { back(); }
  function save(remove=false) {
    if(!habit || !validDate || saving || (!remove && goal && value===null)) return;
    try {
      setSaving(true);
      const recorded = remove ? withEntry(data,habit.id,date) : goal ? withMeasurement(data,habit.id,date,goal,value!) : existing?.status === 'done' ? data : withEntry(data,habit.id,date,'done');
      const next = remove ? recorded : withNote(recorded,habit.id,date,note);
      if(params.timer==='1' && session?.habitId===habit.id) { if(!finish(next)) { setSaving(false); return; } }
      else { persist(next); setData(next); }
      disablePrevention(); setAllowExit(true); back();
    } catch { setSaving(false); Alert.alert(tr("記録を保存できませんでした"),tr("入力を確認して、もう一度お試しください。")); }
  }
  if(error) return <SafeAreaView style={s.safe}><Text>{error}</Text></SafeAreaView>;
  if(!ready) return <SafeAreaView style={s.safe}><ActivityIndicator /></SafeAreaView>;
  return <View style={s.overlay}><Pressable accessibilityRole="button" accessibilityLabel={tr('閉じる')} style={s.backdrop} onPress={close} /><KeyboardAvoidingView style={s.modalWrap} behavior={Platform.OS==='ios'?'padding':undefined}><View accessibilityViewIsModal style={s.modalCard}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Pressable accessibilityRole="button" accessibilityLabel={tr('閉じる')} onPress={close} style={s.close}><Text style={s.closeText}>×</Text></Pressable>
    <Text style={s.title}>{habit?.name ?? tr("習慣が見つかりません")}</Text><Text style={s.body}>{date} {tr("の記録")}</Text>
    {!validDate ? <Text style={s.body}>{tr("この日付には記録できません。")}</Text> : <>
      {goal && <>
      <Text style={s.body}>{tr("1日の目標：")}{amountLabel(goal.target)}{tr(goal.unit)}</Text>
      {!!elapsed && <Text style={s.body}>{tr("タイマーで取り組んだ時間：")}{amountLabel(elapsed)}{tr("分")}{goal.kind === 'time' ? tr("（記録済みの時間があれば合算しています）") : ''}</Text>}
      <Text style={s.label}>{tr("この日の合計（{0}）",tr(goal.unit))}</Text><TextInput accessibilityLabel={tr("実績（{0}）",tr(goal.unit))} value={input ?? (suggested !== undefined ? String(suggested) : '')} onChangeText={setInput} keyboardType="decimal-pad" maxLength={10} placeholder={tr("例：5")} style={s.input} />
      <Text style={s.body}>{tr("追加分ではなく、1日分の合計を入力してください。")}</Text>
      <Text accessibilityLiveRegion="polite" style={s.body}>{value===null?tr("0より大きい数値を、小数2桁まで入力してください。"):value>=goal.target?tr("目標達成です！"):amountLabel(value)+' / '+amountLabel(goal.target)+tr(goal.unit)+tr("。できた分を残しましょう。")}</Text>
      </>}
      <Text style={s.label}>{tr('メモ（任意）')}</Text><TextInput accessibilityLabel={tr('メモ（任意）')} value={note} onChangeText={setNoteInput} multiline maxLength={2000} placeholder={tr('例：今日やったこと、読んだページなど')} placeholderTextColor={themeColor('#718078')} textAlignVertical="top" style={s.noteInput} />
      <Button label={tr("記録を保存する")} disabled={(!!goal && value===null) || saving} onPress={()=>save()} />
    </>}
  </ScrollView></View></KeyboardAvoidingView></View>;
}
const makeStyles = () => StyleSheet.create({overlay:{flex:1,justifyContent:'center',backgroundColor:'rgba(0,0,0,0.5)'},backdrop:{position:'absolute',top:0,bottom:0,left:0,right:0},modalWrap:{width:'100%',maxHeight:'90%',paddingHorizontal:20},modalCard:{width:'100%',maxWidth:600,alignSelf:'center',backgroundColor:themeSurface(),borderRadius:22,overflow:'hidden'},close:{alignSelf:'flex-end',minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'},closeText:{fontSize:28,color:themeColor('#718078')},safe:{flex:1,backgroundColor:themeColor('#F6F7F2')},content:{padding:20,paddingBottom:28,maxWidth:680,width:'100%',alignSelf:'center'},title:{fontSize:28,fontWeight:'700',color:themeColor('#233B34'),marginVertical:18},body:{fontSize:14,color:themeColor('#718078'),lineHeight:24,marginVertical:10},label:{color:themeColor('#233B34'),fontSize:16,fontWeight:'700',marginTop:24,marginBottom:12},input:{fontSize:28,padding:18,borderWidth:1,borderColor:themeColor('#E0E5DE'),borderRadius:16,backgroundColor: themeSurface(),color:themeColor('#233B34')},noteInput:{minHeight:110,padding:16,borderWidth:1,borderColor:themeColor('#E0E5DE'),borderRadius:16,backgroundColor:themeSurface(),color:themeColor('#233B34'),fontSize:16,lineHeight:24},button:{padding:18,borderRadius:16,backgroundColor:themeColor('#266C53'),alignItems:'center',marginVertical:8,minHeight:50}});
