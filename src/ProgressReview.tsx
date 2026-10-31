import { useTheme, themeColor, themeSurface, themeTextColor } from './theme';
import { useLanguage } from "./useLanguage";
import { tr } from "./i18n";
import { OverallProgress } from './OverallProgress';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { amountLabel, summarize } from './measurements';
import type { Data } from './domain';
function HabitProgressReview({ data, today, habitId }: { data: Data; today: string; habitId?: string }) {
  useTheme(); const s = makeStyles();

  useLanguage();
  const [period,setPeriod]=useState(7);
  const habits=data.habits.filter(h => !habitId || h.id === habitId);
  return <View style={{marginVertical:20}}><Text style={s.heading}>{tr("積み重ねをグラフで見る")}</Text><View style={s.row}>{[7,30].map(n => <Pressable key={n} accessibilityRole="button" accessibilityState={{selected:period === n}} style={[s.chip,period === n && {backgroundColor:themeColor('#E3EFE5')}]} onPress={() => setPeriod(n)}><Text style={s.text}>{tr("直近{0}日",n)}</Text></Pressable>)}</View>
    {habits.map(h => { const result=summarize(data,h.id,today,period); return <View key={h.id} style={s.card}><Text style={s.heading}>{h.name}</Text><Text style={s.small}>{result.start} 〜 {result.end}</Text><Text style={s.text}>{tr("{0}日取り組み · {1}日達成",result.days,result.done)}</Text>
      {result.series.map(series => { const max=Math.max(1,...series.points.map(p=>p.value)); const delta=Math.round((series.total-series.previous)*100)/100; return <View key={series.kind+series.unit} style={{marginTop:18}}><Text style={s.total}>{amountLabel(series.total)}<Text style={{fontSize:17}}> {tr(series.unit)}</Text></Text><Text style={s.small}>{tr("前の{0}日：{1}{2}（{3}{4}{2}）",period,amountLabel(series.previous),tr(series.unit),delta>0?'+':'',amountLabel(delta))}</Text>
        <View accessible accessibilityLabel={series.points.map(p=>p.date+' '+amountLabel(p.value)+tr(series.unit)).join('、')} style={s.chart}>{series.points.map(p=><View key={p.date} style={s.column}><View style={{height:Math.max(2,p.value/max*70),backgroundColor:p.value?themeColor('#266C53'):themeColor('#E0E5DE'),borderRadius:3,width:'100%'}} /></View>)}</View><View style={[s.row,{justifyContent:'space-between'}]}><Text style={s.small}>{result.start.slice(5)}</Text><Text style={s.small}>{today.slice(5)}</Text></View>
        <Text style={s.small}>{tr("量を記録した{0}日のうち、目標達成{1}日",series.recorded,series.achieved)}</Text>
      </View>; })}
      {!result.series.length && <View style={{marginTop:18}}>
        <Text style={s.text}>{tr("日ごとの取り組み")}</Text>
        <View accessible accessibilityLabel={result.activity.map(p => p.date + ' ' + (p.status === 'done' ? tr("達成") : p.status === 'progress' ? tr("取り組み") : p.status === 'rest' ? tr("休み") : tr("記録なし"))).join('、')} style={s.chart}>
          {result.activity.map(p => <View key={p.date} style={s.column}><View style={{height:p.status === 'done' || p.status === 'progress' ? 70 : p.status === 'rest' ? 12 : 2,backgroundColor:p.status === 'done' ? themeColor('#266C53') : p.status === 'progress' ? themeColor('#8DBDA0') : p.status === 'rest' ? themeColor('#D6B875') : themeColor('#E0E5DE'),borderRadius:3,width:'100%'}} /></View>)}
        </View>
        <View style={[s.row,{justifyContent:'space-between'}]}><Text style={s.small}>{result.start.slice(5)}</Text><Text style={s.small}>{today.slice(5)}</Text></View>
        <Text style={s.small}>{tr("濃い緑：達成　薄い緑：取り組み　黄：休み")}</Text>
        {!result.days && <Text style={s.small}>{tr("この期間には取り組みの記録がありません。記録すると棒が伸びます。")}</Text>}
        <Text style={s.small}>{tr("時間や量のグラフを見るには、習慣の編集で「時間・回数・量」を選び、実績を記録してください。")}</Text>
      </View>}
      {result.unmeasured>0 && <Text style={s.small}>{tr("量を記録していない達成：{0}日（合計量には含みません）",result.unmeasured)}</Text>}
      {result.days>0 && <Text style={[s.text,{marginTop:12}]}>{tr("目標に届かない日も、取り組んだ分は積み重なっています。")}</Text>}
    </View>; })}
  </View>;
}
const makeStyles = () => StyleSheet.create({heading:{fontSize:17,fontWeight:'700',color:themeColor('#233B34'),marginBottom:8},row:{flexDirection:'row',gap:8,marginVertical:8},chip:{padding:12,minHeight:44,borderRadius:12,backgroundColor: themeSurface()},card:{backgroundColor: themeSurface(),borderRadius:20,padding:20,marginTop:12,borderWidth:1,borderColor:themeColor('#E0E5DE')},text:{color:themeColor('#233B34'),fontSize:14,lineHeight:23},small:{color:themeColor('#718078'),fontSize:12,lineHeight:20,marginVertical:4},total:{fontSize:32,fontWeight:'700',color: themeTextColor('#266C53')},chart:{height:80,flexDirection:'row',gap:3,alignItems:'flex-end',marginTop:12},column:{flex:1,justifyContent:'flex-end',height:70}});

export function ProgressReview(props: { data: Data; today: string; habitId?: string }) {
  return props.habitId ? <HabitProgressReview {...props} /> : <OverallProgress data={props.data} today={props.today} />;
}
