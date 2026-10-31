import { useTheme, themeColor, themeSurface } from './theme';
import { useLanguage } from "./useLanguage";
import { tr } from "./i18n";
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { habitCategories, categorySymbols, filterTemplates, type HabitTemplate } from './habit-templates';
export function HabitTemplatePicker({ onSelect, onCustom, initialCategory = '', showHeading = true }: { initialCategory?: string; showHeading?: boolean; onSelect: (habit: HabitTemplate) => void; onCustom: () => void }) {
  useTheme(); const s = makeStyles();

  useLanguage();
 const [category,setCategory]=useState(initialCategory);
 const matches=filterTemplates('',category);
 return <View>{showHeading && <><Text style={s.title}>{tr("習慣を選ぶ")}</Text></>}
 <Pressable accessibilityRole="button" onPress={onCustom} style={s.custom}><Text style={s.name}>{tr("＋ 自分で習慣を作る")}</Text></Pressable>
 <View style={s.filters}>{['',...habitCategories].map(c=><Pressable key={c} accessibilityRole="button" accessibilityState={{selected:category===c}} onPress={()=>setCategory(c)} style={[s.chip,category===c && {backgroundColor:themeColor('#266C53')}]}><Text style={{color:category===c?'white':themeColor('#233B34'),fontSize:12}}>{c ? tr(c) : tr("すべて")}</Text></Pressable>)}</View>
 {habitCategories.map(c=>{const list=matches.filter(t=>t.category===c);return list.length ? <View key={c} style={s.group}><Text style={s.heading}>{categorySymbols[c]} {tr(c)}</Text><View style={s.grid}>{list.map(t=><Pressable key={t.id} accessibilityRole="button" accessibilityLabel={tr(t.name)+'、'+tr(t.action)} onPress={()=>onSelect(t)} style={s.item}><Text style={s.name}>{tr(t.name)}</Text><Text style={s.preview}>{t.goal ? t.goal.target+' '+tr(t.goal.unit)+tr("から") : tr("小さな一歩から")}</Text></Pressable>)}</View></View> : null;})}
 </View>;
}
const makeStyles = () => StyleSheet.create({title:{fontSize:27,fontWeight:'800',color:themeColor('#233B34'),marginBottom:8},caption:{fontSize:13,lineHeight:22,color:themeColor('#718078')},custom:{backgroundColor:themeColor('#E3EFE5'),borderRadius:14,padding:18,minHeight:50,marginVertical:16},input:{backgroundColor: themeSurface(),padding:15,borderRadius:14,borderWidth:1,borderColor:themeColor('#E0E5DE'),fontSize:15,color:themeColor('#233B34')},filters:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:12},chip:{minHeight:44,paddingHorizontal:12,paddingVertical:12,borderRadius:12,backgroundColor: themeSurface()},group:{marginTop:24},heading:{fontSize:18,fontWeight:'700',color:themeColor('#233B34'),marginBottom:12},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},item:{width:'48%',flexGrow:1,backgroundColor: themeSurface(),borderRadius:14,padding:14,minHeight:82,borderWidth:1,borderColor:themeColor('#E0E5DE'),justifyContent:'center'},name:{fontSize:14,fontWeight:'600',lineHeight:22,color:themeColor('#233B34')},preview:{fontSize:11,color:themeColor('#718078'),marginTop:6}});
