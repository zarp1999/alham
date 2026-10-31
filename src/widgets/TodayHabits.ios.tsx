import { Link, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, lineLimit, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { TodayWidgetProps } from '../widget-data';
const TodayHabits = (props: TodayWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const family = environment.widgetFamily;
  const compact = family === 'accessoryRectangular' || family === 'accessoryInline';
  const limit = family === 'accessoryInline' ? 1 : compact ? 2 : family === 'systemLarge' ? 8 : 3;
  const pending = props.rows.filter(r => !r.done && !r.rest);
  const rows = (compact && pending.length ? pending : props.rows).slice(0, limit);
  const color = environment.colorScheme === 'dark' ? '#E3EFE5' : '#233B34';
  const target = rows[0]?.url ?? 'kotsukotsu://today';
  return <VStack alignment="leading" spacing={compact ? 2 : 8} modifiers={[widgetURL(target)]}>
    {!compact && <Text modifiers={[font({size:16,weight:'bold'}),foregroundStyle(color),lineLimit(1)]}>{props.title}</Text>}
    {rows.length === 0 && <Text modifiers={[font({size:13}),lineLimit(2)]}>{props.empty}</Text>}
    {rows.map(row => family === 'systemMedium' || family === 'systemLarge' ?
      <Link key={row.id} destination={row.url}><Text modifiers={[font({size:15}),foregroundStyle(color),lineLimit(1)]}>{row.done ? '✓ ' : row.rest ? '− ' : '○ '}{row.name}</Text></Link> :
      <Text key={row.id} modifiers={[font({size:compact ? 12 : 14}),lineLimit(1)]}>{row.done ? '✓ ' : row.rest ? '− ' : '○ '}{row.name}</Text>)}
    {!compact && props.rows.length > limit && <Link destination="kotsukotsu://today" label={props.more} />}
  </VStack>;
};
export default createWidget('TodayHabits', TodayHabits, {title:'今日の習慣',empty:'アプリを開いて習慣を設定',more:'すべて見る',rows:[]});
