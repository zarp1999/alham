import { useTheme, themeColor, themeSurface } from './theme';
import { useLanguage } from "./useLanguage";
import { tr, weekday } from "./i18n";
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fromKey, type Data } from './domain';
import { entryLabel, currentWeekChart } from './measurements';
export function OverallProgress({ data, today }: { data: Data; today: string }) {
  useTheme(); const s = makeStyles();

  useLanguage();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const result = currentWeekChart(data, today);
  const max = Math.max(1, ...result.points.map(p => p.segments.length));
  const selected = result.points.find(p => p.date === selectedDate);
  const hasProgress = result.points.some(p => p.segments.some(s => s.entry.status === 'progress'));
  return <View style={s.card}>
    <Text style={s.heading}>{tr("今週の積み重ね")}</Text>
    <Text style={s.range}>{result.start.replaceAll('-', '/')} 〜 {result.end.slice(5).replace('-', '/')}</Text>
    <View style={s.chartRow}>
      <View style={s.axis}><Text style={s.small}>{max}{tr("件")}</Text><Text style={s.small}>0</Text></View>
      <View style={s.chart}>
        {result.points.map(p => <Pressable key={p.date} disabled={p.date > today} accessibilityRole="button" accessibilityState={{selected:p.date === selectedDate}} accessibilityLabel={p.date + '、' + (p.segments.map(s => s.name + (s.entry.status === 'done' ? tr(" 達成") : tr(" 取り組み中"))).join('、') || (p.date > today ? tr("これから") : tr("記録なし")))} onPress={() => setSelectedDate(p.date === selectedDate ? null : p.date)} style={[s.day,p.date === selectedDate && s.selectedDay,p.date > today && {opacity:.4}]}>
          <View style={s.column}>
            {[0, .5, 1].map(ratio => <View key={ratio} style={[s.grid,{bottom:ratio*140}]} />)}
            <Text style={s.count}>{p.segments.length || ''}</Text>
            {[...p.segments].reverse().map(segment => <View key={segment.id} style={{height:140/max,backgroundColor:segment.color,opacity:segment.entry.status === 'progress' ? .35 : 1,width:18}} />)}
          </View>
          <Text style={s.date}>{Number(p.date.slice(5,7))}/{Number(p.date.slice(8,10))}</Text>
          <Text style={s.weekday}>{weekday(fromKey(p.date).getDay())}</Text>
        </Pressable>)}
      </View>
    </View>
    <View style={s.legend}>{result.habits.map(h => <View key={h.id} style={s.legendItem}><View style={[s.dot,{backgroundColor:h.color}]} /><Text style={s.habitName}>{h.name}</Text></View>)}</View>
    {hasProgress && <Text style={s.small}>{tr("薄い色は取り組み中")}</Text>}
    {!result.habits.length && <Text style={s.empty}>{tr("今週の記録はまだありません")}</Text>}
    {selected ? <View style={s.detail}><Text style={s.detailTitle}>{selected.date.slice(5).replace('-', '/')} {tr("の記録")}</Text>{selected.segments.length ? selected.segments.map(segment => <View key={segment.id} style={s.detailItem}><View style={[s.dot,{backgroundColor:segment.color}]} /><View style={{flex:1}}><Text style={s.habitName}>{segment.name}</Text><Text style={s.small}>{segment.entry.measurement ? entryLabel(segment.entry) : tr("✓ 達成")}</Text></View></View>) : <Text style={s.small}>{tr("取り組みの記録はありません")}</Text>}</View> : result.habits.length > 0 && <Text style={s.hint}>{tr("日付をタップして記録を確認")}</Text>}
  </View>;
}
const makeStyles = () => StyleSheet.create({card:{backgroundColor: themeSurface(),borderRadius:20,padding:20,marginVertical:20,borderWidth:1,borderColor:themeColor('#E0E5DE')},heading:{fontSize:17,fontWeight:'700',color:themeColor('#233B34'),marginBottom:14},range:{fontSize:12,color:themeColor('#52665C'),textAlign:'center',marginTop:0,marginBottom:12},small:{fontSize:12,color:themeColor('#718078'),lineHeight:20},chartRow:{flexDirection:'row',marginTop:6},axis:{width:28,height:162,paddingTop:12,justifyContent:'space-between'},chart:{flex:1,flexDirection:'row',paddingBottom:8},day:{flex:1,minWidth:0,paddingBottom:6,borderRadius:6},selectedDay:{backgroundColor:themeColor('#F0F5F0')},column:{height:162,justifyContent:'flex-end',alignItems:'center'},grid:{position:'absolute',left:0,right:0,height:1,backgroundColor:themeColor('#EDF0ED')},date:{fontSize:10,color:themeColor('#718078'),textAlign:'center',marginTop:10,lineHeight:18},weekday:{fontSize:11,color:themeColor('#718078'),textAlign:'center',lineHeight:18},count:{fontSize:11,color:themeColor('#52665C'),marginBottom:4},legend:{gap:12,marginTop:16,marginBottom:8},legendItem:{flexDirection:'row',gap:10,alignItems:'center'},dot:{height:10,width:10,borderRadius:5,flexShrink:0},habitName:{fontSize:13,color:themeColor('#233B34'),lineHeight:21,flexShrink:1},empty:{fontSize:13,color:themeColor('#718078'),textAlign:'center',marginVertical:12},hint:{fontSize:11,color:themeColor('#718078'),textAlign:'center',marginTop:12},detail:{borderTopWidth:1,borderColor:themeColor('#E8EDE8'),marginTop:16,paddingTop:14,gap:10},detailTitle:{fontSize:13,fontWeight:'700',color:themeColor('#233B34')},detailItem:{flexDirection:'row',gap:10,alignItems:'center'}});
