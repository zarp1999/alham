import { useTheme, themeColor, themeSurface } from './theme';
import { useLanguage } from "./useLanguage";
import { tr } from "./i18n";
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { draftGoal, type GoalDraft } from './measurements';
export function GoalField({ value, onChange }: { value: GoalDraft; onChange: (value: GoalDraft) => void }) {
  useTheme(); const s = makeStyles();

  useLanguage();
  return <View style={{ marginVertical: 18 }}><Text style={s.label}>{tr("記録のしかた・1日の目標")}</Text><View style={s.row}>
    {([{kind:'check',label:tr("達成チェック")}, {kind:'time',label:tr("時間")}, {kind:'count',label:tr("回数")}, {kind:'amount',label:tr("量")}] as const).map(item => <Pressable key={item.kind} accessibilityRole="button" accessibilityState={{selected:value.kind === item.kind}} onPress={() => onChange({...value,kind:item.kind})} style={[s.chip,value.kind === item.kind && {backgroundColor:themeColor('#E3EFE5'),borderColor:themeColor('#266C53')}]}><Text style={s.text}>{item.label}</Text></Pressable>)}
  </View>{value.kind !== 'check' && <><Text style={s.hint}>{tr("目標に届かなくても、できた分を記録できます。")}</Text><View style={s.row}><TextInput accessibilityLabel={tr("1日の目標量")} value={value.target} onChangeText={target => onChange({...value,target})} keyboardType="decimal-pad" maxLength={10} placeholder={tr("例：10")} style={[s.input,{flex:1}]} />{value.kind === 'amount' ? <TextInput accessibilityLabel={tr("記録の単位")} value={value.unit} onChangeText={unit => onChange({...value,unit})} maxLength={12} placeholder={tr("ページ・kmなど")} style={[s.input,{flex:1}]} /> : <Text style={s.text}>{tr(value.kind === 'time' ? '分' : '回')}</Text>}</View>{!draftGoal(value) && <Text style={s.hint}>{tr("0より大きい数値（小数2桁まで）と単位を入力してください。")}</Text>}</>}
  </View>;
}
const makeStyles = () => StyleSheet.create({label:{fontSize:14,fontWeight:'700',color:themeColor('#233B34'),marginBottom:12},row:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center'},chip:{padding:12,minHeight:44,borderRadius:12,borderWidth:1,borderColor:themeColor('#E0E5DE'),backgroundColor: themeSurface()},text:{color:themeColor('#233B34')},hint:{color:themeColor('#718078'),fontSize:12,lineHeight:20,marginVertical:10},input:{padding:15,borderWidth:1,borderColor:themeColor('#E0E5DE'),borderRadius:14,backgroundColor: themeSurface(),fontSize:16,color:themeColor('#233B34')}});
