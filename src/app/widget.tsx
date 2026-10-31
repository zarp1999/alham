import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { useHabitStore } from '../store';
export default function WidgetEntry() {
  const {id} = useLocalSearchParams<{id?:string}>();
  const {data,ready,error,onboarding} = useHabitStore();
  if (error) return <Text>{error}</Text>;
  if (!ready) return <ActivityIndicator />;
  if (onboarding) return <Redirect href="/discover" />;
  const habit = data.habits.find(h => h.id === id && !h.paused);
  return habit ? <Redirect href={{pathname:'/record',params:{id:habit.id}}} /> : <Redirect href="/today" />;
}
