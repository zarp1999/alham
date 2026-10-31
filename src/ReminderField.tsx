import { useTheme, themeColor, themeSurface } from './theme';
import { useLanguage } from "./useLanguage";
import { tr } from "./i18n";
import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { requestReminderPermission } from './notifications';
import { validReminder } from './reminder-plan';
export function ReminderField({ value, onChange, weekly = false }: { value?: string; onChange: (value: string | undefined) => void; weekly?: boolean }) {
  useTheme(); const s = makeStyles();

  useLanguage();
  const [busy, setBusy] = useState(false);
  const [hour, minute] = (value ?? '20:00').split(':');
  async function toggle(enabled: boolean) {
    if (!enabled) { onChange(undefined); return; }
    setBusy(true);
    try {
      if (await requestReminderPermission()) onChange('20:00');
      else Alert.alert(tr("通知の許可が必要です"), tr("スマホの設定で通知を許可すると、設定した時刻にお知らせできます。"), [{ text: tr("閉じる"), style: 'cancel' }, { text: tr("設定を開く"), onPress: () => { void Linking.openSettings(); } }]);
    } catch { Alert.alert(tr("通知を設定できませんでした"), tr("アプリを開き直して、もう一度お試しください。")); }
    finally { setBusy(false); }
  }
  return <View style={s.box}><View style={s.row}><Text style={s.label}>{tr("時刻を決めてお知らせ")}</Text><Switch accessibilityLabel={tr("習慣のリマインダー")} value={value !== undefined} disabled={busy} onValueChange={toggle} trackColor={{ true: themeColor('#266C53') }} /></View>
    {value !== undefined && <><View style={s.row}><TextInput accessibilityLabel={tr("通知の時（0〜23）")} value={hour} onChangeText={text => onChange(`${text.replace(/[^0-9]/g, '')}:${minute}`)} keyboardType="number-pad" maxLength={2} style={s.input} /><Text style={s.label}>{tr("時")}</Text><TextInput accessibilityLabel={tr("通知の分（0〜59）")} value={minute} onChangeText={text => onChange(`${hour}:${text.replace(/[^0-9]/g, '')}`)} keyboardType="number-pad" maxLength={2} style={s.input} /><Text style={s.label}>{tr("分")}</Text></View>
      <Pressable accessibilityRole="button" onPress={() => { if (hour !== '' && minute !== '') onChange(`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`); }} style={{ paddingVertical: 12 }}><Text style={s.text}>{tr("時刻を確定（24時間表記）")}</Text></Pressable>
      {!validReminder(value) && <Text style={s.error}>{tr("0〜23時、0〜59分で入力し「時刻を確定」を押してください。")}</Text>}
      <Text style={s.text}>{weekly ? tr("週に○回の習慣は、毎日この時刻に通知します。") : tr("習慣を行う日に、この時刻に通知します。")}{tr("達成済みの日も通知します。")}</Text>
    </>}
  </View>;
}
const makeStyles = () => StyleSheet.create({ box: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: themeColor('#E3EFE5'), gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, label: { color: themeColor('#233B34'), fontSize: 14, fontWeight: '700' }, input: { minWidth: 64, padding: 12, backgroundColor: themeSurface(), borderRadius: 12, fontSize: 20, textAlign: 'center', color: themeColor('#233B34') }, text: { color: themeColor('#63756B'), fontSize: 12, lineHeight: 20 }, error: { color: themeColor('#A23825'), fontSize: 12 } });
