import Ionicons from '@react-native-vector-icons/ionicons';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusSession } from '@/context/focus-session-context';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import {
  FOCUS_EXTEND_MINUTES,
  FOCUS_POSTPONE_MINUTES,
} from '@/services/focus/focus-session-notifications';
import { formatFocusCountdown } from '@/services/focus/focus-session-store';

const TEAL = '#2DD4BF';

type FocusSessionViewProps = {
  onClose?: () => void;
};

export function FocusSessionView({ onClose }: FocusSessionViewProps) {
  const insets = useSafeAreaInsets();
  const {
    session,
    remainingMs,
    progressPercent,
    completeSession,
    postponeSession,
    extendSession,
    stopSession,
  } = useFocusSession();

  if (!session) return null;

  async function handleComplete() {
    await completeSession();
    onClose?.();
  }

  async function handlePostpone() {
    await postponeSession(FOCUS_POSTPONE_MINUTES);
  }

  async function handleExtend() {
    await extendSession(FOCUS_EXTEND_MINUTES);
  }

  async function handleStop() {
    await stopSession();
    onClose?.();
  }

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND, paddingTop: insets.top }}>
      <View className="flex-1 px-5 pb-6" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-row items-center justify-between pt-3">
          <View className="flex-row items-center gap-3">
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: APP_ACCENT }}>
              <Ionicons name="locate" size={22} color={APP_ON_ACCENT} />
            </View>
            <View>
              <Text className="text-[15px] font-semibold" style={{ color: APP_ACCENT }}>
                Sesión Focus
              </Text>
              <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
                Productividad Kivo
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[28px] font-bold tabular-nums text-white">
              {formatFocusCountdown(remainingMs)}
            </Text>
            <Text
              className="mt-0.5 text-[11px] font-bold uppercase tracking-wide"
              style={{ color: TEAL }}>
              En curso
            </Text>
          </View>
        </View>

        <View
          className="mt-8 flex-1 justify-center rounded-3xl border p-6"
          style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
          <Text className="text-[26px] font-bold leading-8 text-white">{session.title}</Text>

          <View className="mt-6 flex-row items-center gap-3">
            <View className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: APP_BORDER }}>
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                  backgroundColor: APP_ACCENT,
                }}
              />
            </View>
            <Text className="text-[13px] font-medium text-white">{progressPercent}% hecho</Text>
          </View>

          <Text className="mt-4 text-[13px]" style={{ color: APP_TEXT_MUTED }}>
            Intensidad:{' '}
            {session.effectiveIntensity === 'strict' ? 'Estricto' : 'Estándar'}
            {session.intensity !== session.effectiveIntensity ? ' (degradado)' : ''}
          </Text>
        </View>

        <View className="mt-5 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Completar"
            onPress={() => void handleComplete()}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-[15px] active:opacity-90"
            style={{ backgroundColor: APP_ACCENT }}>
            <Ionicons name="checkmark" size={18} color={APP_ON_ACCENT} />
            <Text className="text-[15px] font-bold" style={{ color: APP_ON_ACCENT }}>
              Completar
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Posponer"
            onPress={() => void handlePostpone()}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-[15px] active:opacity-90"
            style={{ backgroundColor: APP_SURFACE_SOFT, borderWidth: 1, borderColor: APP_BORDER }}>
            <Ionicons name="moon-outline" size={18} color="#FFFFFF" />
            <Text className="text-[15px] font-bold text-white">Posponer</Text>
          </Pressable>
        </View>

        <View className="mt-3 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleExtend()}
            className="flex-1 items-center rounded-2xl border py-3 active:opacity-80"
            style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE }}>
            <Text className="text-[13px] font-semibold text-white">
              Aumentar +{FOCUS_EXTEND_MINUTES} min
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleStop()}
            className="flex-1 items-center rounded-2xl border py-3 active:opacity-80"
            style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE }}>
            <Text className="text-[13px] font-semibold text-white">Desactivar</Text>
          </Pressable>
        </View>

        {onClose ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="mt-4 items-center py-2 active:opacity-70">
            <Text className="text-[13px]" style={{ color: APP_TEXT_MUTED }}>
              Seguir en segundo plano
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FocusSessionHost() {
  const { isActive, sessionUiOpen, closeSessionUi } = useFocusSession();

  return (
    <Modal
      visible={isActive && sessionUiOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={closeSessionUi}>
      <FocusSessionView onClose={closeSessionUi} />
    </Modal>
  );
}
