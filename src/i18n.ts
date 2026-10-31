import { en } from './en';
import { mn } from './mn';
export type Language = 'ja' | 'mn' | 'en';
let language: Language = 'en';
const listeners = new Set<() => void>();
export function getLanguage() { return language; }
export function subscribeLanguage(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setLanguage(languageValue: Language) { language = languageValue; listeners.forEach(listener => listener()); }
export function tr(key: string, ...values: unknown[]): string { const translated = language === 'mn' ? mn[key] ?? key : language === 'en' ? en[key] ?? key : key; return translated.replace(/\{(\d+)\}/g, (match, index) => index < values.length ? String(values[index]) : match); }
export function weekday(day: number) { return (language === 'mn' ? ['Ня','Да','Мя','Лх','Пү','Ба','Бя'] : language === 'en' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['日','月','火','水','木','金','土'])[day]; }
export function dayLabel(date: Date) { return language === 'mn' ? date.getMonth()+1 + '/' + date.getDate() + ' · ' + weekday(date.getDay()) : language === 'en' ? (date.getMonth()+1)+'/'+date.getDate()+' · '+weekday(date.getDay()) : (date.getMonth()+1)+'月'+date.getDate()+'日 '+weekday(date.getDay())+'曜日'; }

export function canonicalUnit(unit: string) { const units = ['分','回','ページ','杯','本','語','問','個','曲','枚']; return units.find(key => mn[key] === unit || en[key] === unit) ?? unit; }
