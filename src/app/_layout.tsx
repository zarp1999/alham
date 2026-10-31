import { WidgetSync } from '../WidgetSync';
import { TimerStore } from '../TimerStore';
import { NotificationNavigation } from '../NotificationNavigation';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitStore } from '../store';
export default function RootLayout() { return <SafeAreaProvider><HabitStore><TimerStore><NotificationNavigation /><WidgetSync /><Stack screenOptions={{ headerShown: false, animation: 'none' }}><Stack.Screen name="record" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} /></Stack></TimerStore></HabitStore></SafeAreaProvider>; }
