import { tr } from "../i18n";
import { Redirect } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { useHabitStore } from '../store';
export default function Index() {
  const { ready, error, onboarding } = useHabitStore();
  if (error) return <Text>{error}</Text>;
  if (!ready) return <ActivityIndicator accessibilityLabel={tr("読み込み中")} />;
  return <Redirect href={onboarding ? '/discover' : '/today'} />;
}
