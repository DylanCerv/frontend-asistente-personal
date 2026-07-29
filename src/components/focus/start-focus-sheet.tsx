import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';

type StartFocusSheetProps = {
  visible: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: (endsAt: number) => void;
};

function nextHourDate(hour: number, minute = 0): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function addMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

const PRESETS: { id: string; label: string; getDate: () => Date }[] = [
  { id: '25', label: '+25 min', getDate: () => addMinutes(25) },
  { id: '60', label: '+1 h', getDate: () => addMinutes(60) },
  { id: '17', label: 'Hasta las 17:00', getDate: () => nextHourDate(17) },
];

export function StartFocusSheet({
  visible,
  taskTitle,
  onClose,
  onConfirm,
}: StartFocusSheetProps) {
  const insets = useSafeAreaInsets();
  const [customDate, setCustomDate] = useState(() => addMinutes(25));
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('25');

  const endsAt = useMemo(() => {
    if (selectedPreset === 'custom') return customDate.getTime();
    const preset = PRESETS.find((item) => item.id === selectedPreset);
    return (preset?.getDate() ?? addMinutes(25)).getTime();
  }, [selectedPreset, customDate]);

  function handlePickerChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) {
      setCustomDate(date);
      setSelectedPreset('custom');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="rounded-t-3xl border-t px-5 pt-5"
          style={{
            backgroundColor: APP_BACKGROUND,
            borderColor: APP_BORDER,
            paddingBottom: Math.max(insets.bottom, 20) + 8,
          }}>
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full" style={{ backgroundColor: APP_BORDER }} />
          </View>

          <Text className="text-[20px] font-bold text-white">Iniciar Focus</Text>
          <Text className="mt-1 text-[14px] leading-5" style={{ color: APP_TEXT_MUTED }}>
            Concéntrate en “{taskTitle}” hasta la hora que elijas.
          </Text>

          <View className="mt-5 flex-row flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const selected = selectedPreset === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedPreset(preset.id)}
                  className="rounded-2xl border px-4 py-3 active:opacity-80"
                  style={{
                    borderColor: selected ? APP_ACCENT : APP_BORDER,
                    backgroundColor: selected ? 'rgba(196,181,253,0.14)' : APP_SURFACE,
                  }}>
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: selected ? APP_ACCENT : '#FFFFFF' }}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPreset === 'custom' }}
              onPress={() => {
                setSelectedPreset('custom');
                setShowPicker(true);
              }}
              className="rounded-2xl border px-4 py-3 active:opacity-80"
              style={{
                borderColor: selectedPreset === 'custom' ? APP_ACCENT : APP_BORDER,
                backgroundColor:
                  selectedPreset === 'custom' ? 'rgba(196,181,253,0.14)' : APP_SURFACE,
              }}>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: selectedPreset === 'custom' ? APP_ACCENT : '#FFFFFF' }}>
                Hora personalizada
              </Text>
            </Pressable>
          </View>

          {showPicker || (selectedPreset === 'custom' && Platform.OS === 'ios') ? (
            <View className="mt-3">
              <DateTimePicker
                value={customDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                themeVariant="dark"
              />
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => onConfirm(endsAt)}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl py-[15px] active:opacity-90"
            style={{ backgroundColor: APP_ACCENT }}>
            <Ionicons name="locate" size={18} color={APP_ON_ACCENT} />
            <Text className="text-[16px] font-bold" style={{ color: APP_ON_ACCENT }}>
              Empezar sesión
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
