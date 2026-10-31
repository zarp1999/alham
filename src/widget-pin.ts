import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
type PinModule = { canPin?: () => boolean; requestPin?: () => boolean };
function native() { return Platform.OS === 'android' ? requireOptionalNativeModule<PinModule>('HabitWidget') : null; }
export function canPinWidget() { return native()?.canPin?.() ?? false; }
export function requestWidgetPin() { return native()?.requestPin?.() ?? false; }
