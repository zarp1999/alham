import { useSyncExternalStore } from 'react';
export type ThemeId = 'green' | 'blue' | 'warm' | 'purple';
export const themeOptions: {id: ThemeId; label: string; accent: string}[] = [
  {id:'green',label:'標準',accent:'#266C53'}, {id:'blue',label:'さわやか',accent:'#245D91'},
  {id:'warm',label:'あたたかい',accent:'#99502F'}, {id:'purple',label:'落ち着き',accent:'#684B87'}
];
let current: ThemeId = 'green';
export type DisplayMode = 'system' | 'light' | 'dark';
let mode: DisplayMode = 'system';
let systemDark = false;
export function getDisplayMode() { return mode; }
export function isDark() { return mode === 'dark' || (mode === 'system' && systemDark); }
export function setDisplayMode(value: string | null) { mode = value === 'dark' || value === 'light' ? value : 'system'; listeners.forEach(fn => fn()); }
export function setSystemDark(value: boolean) { if (systemDark !== value) { systemDark = value; listeners.forEach(fn => fn()); } }
const listeners = new Set<() => void>();
export function getTheme() { return current; }
export function setTheme(id: string | null) { current = themeOptions.some(t => t.id === id) ? id as ThemeId : 'green'; listeners.forEach(fn => fn()); }
export function useTheme() { useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => current + ':' + mode + ':' + systemDark, () => current + ':' + mode + ':' + systemDark); return current; }
const maps: Record<ThemeId, Record<string,string>> = {
 green: {},
 blue: {'#266C53':'#245D91','#E3EFE5':'#E1EEF8','#F6F7F2':'#F3F7FA','#233B34':'#203746','#718078':'#627583','#63756B':'#627583','#E0E5DE':'#DCE5EB','#4B896D':'#4C80A9','#D7E9B2':'#CFE6F7','#8DBDA0':'#85B7D8','#B5C5B9':'#B4C7D4','#F0F5F0':'#ECF4FA','#EDF0ED':'#EAF0F4','#E8EDE8':'#DFE9F0','#52665C':'#516B7B'},
 warm: {'#266C53':'#99502F','#E3EFE5':'#F8E9DA','#F6F7F2':'#FAF5EF','#233B34':'#493329','#718078':'#816F63','#63756B':'#79685D','#E0E5DE':'#EADFD5','#4B896D':'#B77855','#D7E9B2':'#F5D7B9','#8DBDA0':'#D3A185','#B5C5B9':'#D5BFB0','#F0F5F0':'#FAF0E6','#EDF0ED':'#F1E9E1','#E8EDE8':'#EDE2D8','#52665C':'#775E4F'},
 purple: {'#266C53':'#684B87','#E3EFE5':'#EEE7F5','#F6F7F2':'#F8F5FA','#233B34':'#392F46','#718078':'#776C80','#63756B':'#746879','#E0E5DE':'#E7DFEB','#4B896D':'#9074A8','#D7E9B2':'#E5D4F2','#8DBDA0':'#B9A2CF','#B5C5B9':'#C7B9D2','#F0F5F0':'#F3EDF8','#EDF0ED':'#F0EBF3','#E8EDE8':'#ECE3F1','#52665C':'#675A70'}
};
const dark: Record<string,string> = {'#F6F7F2':'#111B19','#FFFFFF':'#1D2927','#233B34':'#EDF5EF','#718078':'#B6C6BD','#63756B':'#B6C6BD','#E0E5DE':'#3A4C46','#E3EFE5':'#293D36','#F0F5F0':'#293D36','#EDF0ED':'#34423E','#E8EDE8':'#3A4C46','#52665C':'#B6C6BD','#F4EAD1':'#574A2A','#B8BFB8':'#83928A','#A23825':'#FFAAA0'};
const lightAccents: Record<ThemeId,string> = {green:'#8DD8B5',blue:'#99C9F4',warm:'#F0B396',purple:'#D2B6EF'};
export function themeColor(value: string): string { const v=value.toUpperCase(); if (isDark() && dark[v]) return dark[v]; return maps[current][v] ?? value; }
export function themeTextColor(value: string): string { if (isDark() && value.toUpperCase() === '#266C53') return lightAccents[current]; return themeColor(value); }
export function themeSurface(): string { return isDark() ? '#1D2927' : '#FFFFFF'; }

