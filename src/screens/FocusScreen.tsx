import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StartFocusSheet } from '@/components/focus/start-focus-sheet';
import { KivoWordmark } from '@/components/kivo-wordmark';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_DANGER,
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
import { useTickingNow } from '@/hooks/use-ticking-now';
import { formatFocusCountdown } from '@/services/focus/focus-session-store';
import {
  buildFocusDayStats,
  formatMinutesShort,
  getFocusChecklistTasks,
  getFocusTaskDueLabel,
  getGreetingLabel,
  getNextTimedBlock,
  type FocusDashboardKpi,
  type FocusTimedBlock,
} from '@/utils/focus-utils';
import type { TaskItem } from '@/types/assistant';

const TEAL = '#2DD4BF';
const TAB_BAR_CLEARANCE = 92;

function OverdueBanner({ count, onPress }: { count: number; onPress: () => void }) {
  const label = count === 1 ? '1 pendiente atrasado' : `${count} pendientes atrasados`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${label} en Tareas`}
      onPress={onPress}
      className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-85"
      style={{
        backgroundColor: 'rgba(248,113,113,0.10)',
        borderColor: 'rgba(248,113,113,0.35)',
      }}>
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(248,113,113,0.16)' }}>
        <Ionicons name="alert-circle" size={22} color={APP_DANGER} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className="text-[11px] font-semibold uppercase tracking-[1.2px]"
          style={{ color: APP_DANGER }}>
          Atrasos
        </Text>
        <Text className="text-[16px] font-semibold text-white" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={APP_DANGER} />
    </Pressable>
  );
}

function KpiCell({ kpi }: { kpi: FocusDashboardKpi }) {
  return (
    <View className="min-w-0 flex-1 gap-1">
      <Text
        className="text-[11px] font-semibold uppercase tracking-[1.2px]"
        style={{ color: APP_TEXT_MUTED }}
        numberOfLines={1}>
        {kpi.label}
      </Text>
      <Text className="text-[26px] font-bold leading-8 text-white" numberOfLines={1}>
        {kpi.value}
      </Text>
      {kpi.hint ? (
        <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }} numberOfLines={1}>
          {kpi.hint}
        </Text>
      ) : null}
    </View>
  );
}

function NextTimedBlockCard({
  block,
  onPress,
}: {
  block: FocusTimedBlock;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ver agenda"
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-2xl border px-4 py-3.5 active:opacity-85"
      style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(45,212,191,0.12)' }}>
        <Ionicons
          name={block.kind === 'event' ? 'calendar-outline' : 'checkbox-outline'}
          size={20}
          color={TEAL}
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-baseline gap-x-1.5">
          <Text
            className="text-[11px] font-semibold uppercase tracking-[1.2px]"
            style={{ color: TEAL }}>
            Próximo bloque
          </Text>
          <Text className="text-[12px] font-semibold" style={{ color: TEAL }}>
            · {block.minutesUntil <= 0 ? 'ahora' : `en ${formatMinutesShort(block.minutesUntil)}`}
          </Text>
        </View>
        <Text className="text-[16px] font-semibold text-white" numberOfLines={1}>
          {block.title}
        </Text>
        <Text className="text-[13px]" style={{ color: APP_TEXT_MUTED }}>
          {block.timeLabel}
          {block.kind === 'event' ? ' · Cita' : ' · Tarea'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={APP_TEXT_MUTED} />
    </Pressable>
  );
}

function ChecklistBlock({
  tasks,
  nextTimed,
  onStartFocus,
  onComplete,
  onSeeTasks,
}: {
  tasks: TaskItem[];
  nextTimed: FocusTimedBlock | null;
  onStartFocus: (task: TaskItem) => void;
  onComplete: (taskId: string) => void;
  onSeeTasks: () => void;
}) {
  const primary = tasks[0] ?? null;

  if (!primary) {
    return (
      <View
        className="gap-4 rounded-2xl border p-5"
        style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
        <Text
          className="text-[11px] font-semibold uppercase tracking-[1.4px]"
          style={{ color: APP_TEXT_MUTED }}>
          No olvides de
        </Text>
        <Text className="text-[20px] font-bold text-white">
          {nextTimed ? 'Después del próximo bloque' : 'Nada flexible por ahora'}
        </Text>
        <Text className="text-[14px] leading-5" style={{ color: APP_TEXT_MUTED }}>
          {nextTimed
            ? `Tu próxima actividad es a las ${nextTimed.timeLabel}. Las tareas con hora aparecen en la agenda.`
            : 'Buen momento para planear o capturar algo nuevo.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a Tareas"
          onPress={onSeeTasks}
          className="flex-row items-center justify-center gap-2 rounded-2xl border py-[13px] active:opacity-90"
          style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE_SOFT }}>
          <Text className="text-[14px] font-semibold text-white">Ver tareas</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="gap-5 rounded-2xl border p-5"
      style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[11px] font-semibold uppercase tracking-[1.4px]"
          style={{ color: APP_TEXT_MUTED }}>
          No olvides de
        </Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: 'rgba(196,181,253,0.14)' }}>
          <Text
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: APP_ACCENT }}>
            Flexible
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[22px] font-bold leading-7 text-white">{primary.title}</Text>
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={15} color={APP_TEXT_MUTED} />
          <Text className="text-[14px]" style={{ color: APP_TEXT_MUTED }}>
            {getFocusTaskDueLabel(primary)}
          </Text>
        </View>
      </View>

      <View className="gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar Focus"
          onPress={() => onStartFocus(primary)}
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
          onPress={() => onComplete(primary.id)}
          className="flex-row items-center justify-center gap-2 rounded-2xl border py-[13px] active:opacity-90"
          style={{ borderColor: APP_BORDER, backgroundColor: APP_SURFACE_SOFT }}>
          <Text className="text-[14px] font-semibold text-white">Completar ahora</Text>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

export function FocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { preferredName } = useUserPreferences();
  const { tasks, events, isRecordsLoading, recordsError, refreshRecords, toggleTaskComplete } =
    useAssistant();
  const { deviceCalendarEvents, refreshDeviceCalendar } = useDeviceCalendar();
  const { isActive, session, remainingMs, openSessionUi, startSession } = useFocusSession();
  const now = useTickingNow();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStartSheet, setShowStartSheet] = useState(false);
  const [focusTaskForSheet, setFocusTaskForSheet] = useState<TaskItem | null>(null);

  const displayName = preferredName.trim() || user?.name?.split(' ')[0] || 'Usuario';
  const greeting = getGreetingLabel();

  const mergedEvents = useMemo(
    () => [...events, ...deviceCalendarEvents],
    [events, deviceCalendarEvents],
  );

  const { insightStats, checklistTasks } = useMemo(() => {
    const clock = new Date(now);
    const nextTimed = getNextTimedBlock(mergedEvents, undefined, clock, tasks);
    const checklist = getFocusChecklistTasks(tasks, {
      excludeIds: nextTimed?.kind === 'task' ? [nextTimed.id] : [],
      limit: 1,
    });
    return {
      insightStats: buildFocusDayStats(tasks, mergedEvents, undefined, checklist[0] ?? null, clock),
      checklistTasks: checklist,
    };
  }, [tasks, mergedEvents, now]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshRecords(), refreshDeviceCalendar(true)]);
    } finally {
      setIsRefreshing(false);
    }
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
              gap: 22,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || isRecordsLoading}
                onRefresh={handleRefresh}
                tintColor={APP_ACCENT}
                colors={[APP_ACCENT]}
              />
            }>
            <View className="gap-3">
              <KivoWordmark size={24} />
              <Text className="text-[15px]" style={{ color: APP_TEXT_MUTED }}>
                {greeting},{' '}
                <Text className="font-semibold text-white">{displayName}</Text>
              </Text>
            </View>

            {recordsError ? (
              <View className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
                <Text className="text-sm text-danger">{recordsError}</Text>
              </View>
            ) : null}

            <View
              className="flex-row gap-3 rounded-2xl border px-4 py-4"
              style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
              {insightStats.kpis.map((kpi, index) => (
                <View key={kpi.key} className="min-w-0 flex-1 flex-row">
                  {index > 0 ? (
                    <View
                      className="mr-3 w-px self-stretch"
                      style={{ backgroundColor: APP_BORDER }}
                    />
                  ) : null}
                  <KpiCell kpi={kpi} />
                </View>
              ))}
            </View>

            {insightStats.overdueCount > 0 ? (
              <OverdueBanner
                count={insightStats.overdueCount}
                onPress={() =>
                  router.push({ pathname: '/tasks', params: { filter: 'overdue' } })
                }
              />
            ) : null}

            {isActive && session ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver sesión Focus"
                onPress={openSessionUi}
                className="gap-4 rounded-2xl border p-5 active:opacity-90"
                style={{
                  backgroundColor: 'rgba(196,181,253,0.10)',
                  borderColor: APP_ACCENT,
                }}>
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-[11px] font-semibold uppercase tracking-[1.4px]"
                    style={{ color: APP_ACCENT }}>
                    Sesión activa
                  </Text>
                  <Ionicons name="timer-outline" size={18} color={APP_ACCENT} />
                </View>
                <Text className="text-[40px] font-bold leading-[44px] text-white">
                  {formatFocusCountdown(remainingMs)}
                </Text>
                <Text className="text-[15px]" style={{ color: APP_TEXT_MUTED }} numberOfLines={2}>
                  {session.title}
                </Text>
                <Text className="text-[14px] font-semibold" style={{ color: APP_ACCENT }}>
                  Tocar para volver a la sesión
                </Text>
              </Pressable>
            ) : null}

            {insightStats.nextTimed ? (
              <NextTimedBlockCard
                block={insightStats.nextTimed}
                onPress={() => router.push('/agenda')}
              />
            ) : null}

            {!isActive ? (
              <ChecklistBlock
                tasks={checklistTasks}
                nextTimed={insightStats.nextTimed}
                onStartFocus={(task) => {
                  setFocusTaskForSheet(task);
                  setShowStartSheet(true);
                }}
                onComplete={toggleTaskComplete}
                onSeeTasks={() => router.push('/tasks')}
              />
            ) : null}

            <View className="flex-row items-start gap-3 px-1">
              <Ionicons name="sparkles" size={16} color={TEAL} style={{ marginTop: 2 }} />
              <Text className="flex-1 text-[15px] leading-6 text-white">{insightStats.insight}</Text>
            </View>
          </ScrollView>
        </View>
      </ScreenSafeArea>

      {focusTaskForSheet ? (
        <StartFocusSheet
          visible={showStartSheet}
          taskTitle={focusTaskForSheet.title}
          onClose={() => {
            setShowStartSheet(false);
            setFocusTaskForSheet(null);
          }}
          onConfirm={(endsAt) => {
            const task = focusTaskForSheet;
            setShowStartSheet(false);
            setFocusTaskForSheet(null);
            void startSession({
              taskId: task.id,
              title: task.title,
              endsAt,
            });
          }}
        />
      ) : null}
    </View>
  );
}
