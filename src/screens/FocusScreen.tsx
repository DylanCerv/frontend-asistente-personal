import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StartFocusSheet } from '@/components/focus/start-focus-sheet';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';
import { useDeviceCalendar } from '@/context/device-calendar-context';
import { useFocusSession } from '@/context/focus-session-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import { formatFocusCountdown } from '@/services/focus/focus-session-store';
import {
  estimateFreeMinutes,
  getAssistantSuggestion,
  getFocusTask,
  getFocusTaskDueLabel,
  getGreetingLabel,
  getLaterItems,
  getOptimizedTimePercent,
  getTodayPendingTasks,
} from '@/utils/focus-utils';

const TEAL = '#2DD4BF';
const TAB_BAR_CLEARANCE = 92;

export function FocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const { tasks, events, isRecordsLoading, recordsError, refreshRecords, toggleTaskComplete } =
    useAssistant();
  const { deviceCalendarEvents, refreshDeviceCalendar } = useDeviceCalendar();
  const { isActive, session, remainingMs, openSessionUi, startSession } = useFocusSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStartSheet, setShowStartSheet] = useState(false);

  const displayName = preferredName.trim() || user?.name?.split(' ')[0] || 'Usuario';
  const greeting = getGreetingLabel();

  const mergedEvents = useMemo(
    () => [...events, ...deviceCalendarEvents],
    [events, deviceCalendarEvents],
  );

  const focusTask = useMemo(() => getFocusTask(tasks), [tasks]);
  const pendingToday = useMemo(() => getTodayPendingTasks(tasks), [tasks]);
  const laterItems = useMemo(
    () => getLaterItems(tasks, mergedEvents, focusTask?.id ?? null),
    [tasks, mergedEvents, focusTask?.id],
  );
  const freeMinutes = useMemo(() => estimateFreeMinutes(mergedEvents), [mergedEvents]);
  const optimizedPercent = useMemo(() => getOptimizedTimePercent(freeMinutes), [freeMinutes]);
  const assistantSuggestion = useMemo(
    () => getAssistantSuggestion(freeMinutes, laterItems),
    [freeMinutes, laterItems],
  );

  const taskCount = pendingToday.length || tasks.filter((task) => task.status === 'pending').length;

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshRecords(), refreshDeviceCalendar(true)]);
    } finally {
      setIsRefreshing(false);
    }
  }

  function openItem(kind: 'task' | 'event', id: string) {
    if (kind === 'event' && id.startsWith('device-')) return;
    router.push({
      pathname: '/tasks',
      params: kind === 'event' ? { eventId: id } : { taskId: id },
    });
  }

  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND }}>
      <ScreenSafeArea edges={['top']}>
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 72,
              gap: 20,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || isRecordsLoading}
                onRefresh={handleRefresh}
                tintColor={APP_ACCENT}
                colors={[APP_ACCENT]}
              />
            }>
            <View className="gap-2">
              <Text className="text-[32px] font-bold leading-[40px] text-white">
                {greeting},{' '}
                <Text style={{ color: APP_ACCENT }}>{displayName}</Text>
              </Text>
              {taskCount > 0 ? (
                <Text className="text-[15px] leading-6" style={{ color: APP_TEXT_MUTED }}>
                  Tienes{' '}
                  <Text className="font-semibold text-white">
                    {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}
                  </Text>
                  . Una necesita tu atención primero.
                </Text>
              ) : (
                <Text className="text-[15px] leading-6" style={{ color: APP_TEXT_MUTED }}>
                  No tienes tareas pendientes. Buen momento para planear.
                </Text>
              )}
            </View>

            {recordsError ? (
              <View className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
                <Text className="text-sm text-danger">{recordsError}</Text>
              </View>
            ) : null}

            {focusTask ? (
              <View
                className="gap-5 rounded-2xl border p-5"
                style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(196,181,253,0.15)' }}>
                      <Text className="text-[11px] font-bold" style={{ color: APP_ACCENT }}>
                        !
                      </Text>
                    </View>
                    <Text
                      className="text-[11px] font-semibold uppercase tracking-[1.4px]"
                      style={{ color: APP_TEXT_MUTED }}>
                      Prioridad alta
                    </Text>
                  </View>
                  <View
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: 'rgba(196,181,253,0.14)' }}>
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: APP_ACCENT }}>
                      Ahora
                    </Text>
                  </View>
                </View>

                <View className="gap-2.5">
                  <Text className="text-[24px] font-bold leading-8 text-white">
                    {focusTask.title}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time-outline" size={15} color={APP_TEXT_MUTED} />
                    <Text className="text-[14px]" style={{ color: APP_TEXT_MUTED }}>
                      {getFocusTaskDueLabel(focusTask)}
                    </Text>
                  </View>
                </View>

                {isActive && session?.taskId === focusTask.id ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ver sesión Focus"
                    onPress={openSessionUi}
                    className="flex-row items-center justify-center gap-2 rounded-2xl border py-[15px] active:opacity-90"
                    style={{ borderColor: APP_ACCENT, backgroundColor: 'rgba(196,181,253,0.12)' }}>
                    <Ionicons name="timer-outline" size={18} color={APP_ACCENT} />
                    <Text className="text-[16px] font-bold" style={{ color: APP_ACCENT }}>
                      En Focus · {formatFocusCountdown(remainingMs)}
                    </Text>
                  </Pressable>
                ) : (
                  <View className="gap-2.5">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Iniciar Focus"
                      onPress={() => setShowStartSheet(true)}
                      className="flex-row items-center justify-center gap-2 rounded-2xl py-[15px] active:opacity-90"
                      style={{ backgroundColor: APP_ACCENT }}>
                      <Ionicons name="locate" size={18} color={APP_ON_ACCENT} />
                      <Text className="text-[16px] font-bold" style={{ color: APP_ON_ACCENT }}>
                        Iniciar Focus
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Completar ahora"
                      onPress={() => toggleTaskComplete(focusTask.id)}
                      className="flex-row items-center justify-center gap-2 rounded-2xl border py-[13px] active:opacity-90"
                      style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE_SOFT }}>
                      <Text className="text-[14px] font-semibold text-white">Completar ahora</Text>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                )}
              </View>
            ) : (
              <View
                className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
                style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
                <Text
                  className="text-[11px] font-semibold uppercase tracking-[1.4px]"
                  style={{ color: APP_TEXT_MUTED }}>
                  Focus
                </Text>
                <Text className="flex-1 text-[14px]" style={{ color: APP_TEXT_MUTED }}>
                  Nada urgente por ahora
                </Text>
              </View>
            )}

            <View
              className="gap-4 rounded-2xl border p-5"
              style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={15} color={TEAL} />
                <Text
                  className="text-[11px] font-semibold uppercase tracking-[1.6px]"
                  style={{ color: TEAL }}>
                  Asistente
                </Text>
              </View>

              <Text className="text-[17px] font-medium leading-6 text-white">
                {assistantSuggestion.freeMinutes > 0 ? (
                  <>
                    Tienes{' '}
                    <Text style={{ color: TEAL }}>{assistantSuggestion.freeMinutes} minutos</Text>{' '}
                    libres. {assistantSuggestion.actionText}
                  </>
                ) : (
                  assistantSuggestion.actionText
                )}
              </Text>

              <View className="gap-2">
                <View className="h-[6px] overflow-hidden rounded-full" style={{ backgroundColor: APP_BORDER }}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, optimizedPercent)}%`,
                      backgroundColor: TEAL,
                    }}
                  />
                </View>
                <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
                  Tiempo optimizado: {optimizedPercent}%
                </Text>
              </View>
            </View>

            <View className="gap-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[22px] font-bold text-white">Después</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todo"
                  onPress={() => router.push('/tasks')}
                  className="active:opacity-80">
                  <Text className="text-[14px] font-semibold" style={{ color: APP_ACCENT }}>
                    Ver todo
                  </Text>
                </Pressable>
              </View>

              {laterItems.length === 0 ? (
                <View
                  className="rounded-2xl border px-4 py-5"
                  style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
                  <Text className="text-[14px]" style={{ color: APP_TEXT_MUTED }}>
                    No hay más pendientes para hoy.
                  </Text>
                </View>
              ) : (
                laterItems.map((item) => (
                  <Pressable
                    key={`${item.kind}-${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    onPress={() => openItem(item.kind, item.id)}
                    className="flex-row items-center gap-3.5 rounded-2xl border px-3.5 py-3.5 active:opacity-85"
                    style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
                    <View
                      className="h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: APP_SURFACE_SOFT }}>
                      <Ionicons name={item.icon} size={20} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-[16px] font-semibold text-white" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text className="text-[13px]" style={{ color: APP_TEXT_MUTED }} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Grabar audio"
            onPress={() =>
              router.push({ pathname: '/assistant', params: { autoRecord: '1' } })
            }
            className="absolute right-5 h-16 w-16 items-center justify-center rounded-full active:opacity-85"
            style={{
              bottom: insets.bottom + 68,
              backgroundColor: APP_ACCENT,
              shadowColor: APP_ACCENT,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 12,
              elevation: 10,
            }}>
            <Ionicons name="mic" size={28} color={APP_ON_ACCENT} />
          </Pressable>
        </View>
      </ScreenSafeArea>

      {focusTask ? (
        <StartFocusSheet
          visible={showStartSheet}
          taskTitle={focusTask.title}
          onClose={() => setShowStartSheet(false)}
          onConfirm={(endsAt) => {
            setShowStartSheet(false);
            void startSession({
              taskId: focusTask.id,
              title: focusTask.title,
              endsAt,
            });
          }}
        />
      ) : null}
    </View>
  );
}
