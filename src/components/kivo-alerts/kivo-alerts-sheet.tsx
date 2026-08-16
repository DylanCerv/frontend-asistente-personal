import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_BACKGROUND,
  APP_BORDER,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { useAssistant } from '@/context/assistant-context';
import { useDeviceCalendar } from '@/context/device-calendar-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  buildKivoAlerts,
  snoozeInAppAlert,
  type KivoAlert,
  type KivoAssistantAlert,
  type KivoCriticalAlert,
} from '@/services/reminders/kivo-alerts';
import { snoozeReminderNotification } from '@/services/reminders/reminder-notifications';
import { CRITICAL_SNOOZE_MINUTES } from '@/services/reminders/critical-alarm-notifications';
import { todayIso } from '@/utils/date-utils';

const PEACH = '#F8A49B';
const PEACH_SOFT = 'rgba(248,164,155,0.16)';
const TEAL = '#2DD4BF';
const TEAL_SOFT = 'rgba(45,212,191,0.14)';

type KivoAlertsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function CriticalCard({
  alert,
  onComplete,
  onSnooze,
}: {
  alert: KivoCriticalAlert;
  onComplete: () => void;
  onSnooze: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-[22px] border"
      style={{
        backgroundColor: APP_SURFACE,
        borderColor: 'rgba(248,164,155,0.45)',
        borderLeftWidth: 3,
        borderLeftColor: PEACH,
      }}>
      <View className="gap-3.5 p-4">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-[11px] font-bold uppercase tracking-[1.2px]"
            style={{ color: PEACH }}>
            Alerta crítica
          </Text>
          <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
            {alert.timeLabel}
          </Text>
        </View>

        <View className="flex-row items-start gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: PEACH_SOFT }}>
            <Ionicons name="warning" size={22} color={PEACH} />
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-[18px] font-bold leading-6 text-white">{alert.title}</Text>
            <Text className="text-[14px] leading-5" style={{ color: APP_TEXT_MUTED }}>
              {alert.body}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            onPress={onComplete}
            className="min-h-[44px] flex-1 items-center justify-center rounded-2xl active:opacity-90"
            style={{ backgroundColor: PEACH }}>
            <Text className="text-[14px] font-bold" style={{ color: '#1A0B2E' }}>
              Ya lo hago
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSnooze}
            className="min-h-[44px] flex-1 items-center justify-center rounded-2xl active:opacity-90"
            style={{ backgroundColor: APP_SURFACE_SOFT, borderWidth: 1, borderColor: APP_BORDER }}>
            <Text className="text-[14px] font-semibold" style={{ color: APP_TEXT_MUTED }}>
              Posponer 5 min
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AssistantCard({
  alert,
  onOpen,
}: {
  alert: KivoAssistantAlert;
  onOpen: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-[22px] border"
      style={{
        backgroundColor: APP_SURFACE,
        borderColor: 'rgba(45,212,191,0.35)',
      }}>
      <View className="gap-3.5 p-4">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-[11px] font-bold uppercase tracking-[1.2px]"
            style={{ color: TEAL }}>
            Asistente
          </Text>
          <Text className="text-[12px]" style={{ color: APP_TEXT_MUTED }}>
            {alert.timeLabel}
          </Text>
        </View>

        <View className="flex-row items-start gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: TEAL_SOFT }}>
            <Ionicons name="sparkles" size={20} color={TEAL} />
          </View>
          <Text className="flex-1 text-[18px] font-bold leading-6 text-white">{alert.title}</Text>
        </View>

        <View className="gap-2.5">
          {alert.lines.map((line) => (
            <View key={line.id} className="flex-row items-center gap-2.5">
              <Ionicons
                name={
                  line.icon === 'trending'
                    ? 'trending-up'
                    : line.icon === 'alert'
                      ? 'alert-circle'
                      : 'checkmark-circle'
                }
                size={18}
                color={TEAL}
              />
              <Text className="flex-1 text-[14px] leading-5 text-white/90">{line.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="min-h-[44px] items-center justify-center rounded-2xl active:opacity-90"
          style={{ borderWidth: 1.5, borderColor: TEAL }}>
          <Text className="text-[14px] font-bold" style={{ color: TEAL }}>
            Abrir resumen completo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function KivoAlertsSheet({ visible, onClose }: KivoAlertsSheetProps) {
  const router = useRouter();
  const { records, toggleTaskComplete, toggleEventComplete } = useAssistant();
  const { deviceCalendarEvents } = useDeviceCalendar();
  const {
    reminderNotifications,
    pushNotifications,
    reminderAlertStyle,
    reminderAlertSound,
    reminderAlertVibration,
  } = useUserPreferences();
  const [snoozeTick, setSnoozeTick] = useState(0);

  const deviceMeetingsToday = useMemo(
    () => deviceCalendarEvents.filter((event) => event.scheduledAt === todayIso()).length,
    [deviceCalendarEvents],
  );

  const showMorningDigest = reminderNotifications && pushNotifications;

  const alerts = useMemo(
    () =>
      buildKivoAlerts(records, {
        includeAssistant: showMorningDigest,
        deviceMeetingsToday,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, showMorningDigest, deviceMeetingsToday, snoozeTick],
  );

  function handleComplete(alert: KivoCriticalAlert) {
    const record = records.find((item) => item.id === alert.recordId);
    if (record?.type === 'meeting' || record?.type === 'reminder') {
      toggleEventComplete(alert.recordId);
    } else {
      toggleTaskComplete(alert.recordId);
    }
    onClose();
    router.push({ pathname: '/tasks', params: { taskId: alert.recordId } });
  }

  async function handleSnooze(alert: KivoCriticalAlert) {
    snoozeInAppAlert(alert.recordId, CRITICAL_SNOOZE_MINUTES);
    setSnoozeTick((value) => value + 1);
    await snoozeReminderNotification(
      {
        recordId: alert.recordId,
        title: 'Alerta crítica',
        body: alert.body,
        kind: 'critical',
      },
      reminderAlertStyle,
      CRITICAL_SNOOZE_MINUTES,
      {
        soundId: reminderAlertSound,
        vibrationId: reminderAlertVibration,
      },
    );
  }

  function handleOpenBriefing() {
    onClose();
    router.push('/');
  }

  const criticalCount = alerts.filter((item) => item.kind === 'critical').length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScreenSafeArea>
        <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND }}>
          <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
            <Text className="text-[28px] font-bold text-white">Alertas Kivo</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
              style={{ backgroundColor: APP_SURFACE_SOFT, borderWidth: 1, borderColor: APP_BORDER }}>
              <Ionicons name="close" size={18} color={APP_TEXT_MUTED} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-3.5 px-5 pb-10"
            showsVerticalScrollIndicator={false}>
            {alerts.length === 0 ? (
              <View
                className="rounded-[22px] border px-4 py-6"
                style={{ backgroundColor: APP_SURFACE, borderColor: APP_BORDER }}>
                <Text className="text-center text-[15px]" style={{ color: APP_TEXT_MUTED }}>
                  No hay alertas por ahora. Cuando haya algo urgente o el resumen del día, aparecerá
                  aquí.
                </Text>
              </View>
            ) : (
              alerts.map((alert: KivoAlert) =>
                alert.kind === 'critical' ? (
                  <CriticalCard
                    key={alert.id}
                    alert={alert}
                    onComplete={() => handleComplete(alert)}
                    onSnooze={() => void handleSnooze(alert)}
                  />
                ) : (
                  <AssistantCard
                    key={alert.id}
                    alert={alert}
                    onOpen={handleOpenBriefing}
                  />
                ),
              )
            )}

            {criticalCount > 0 ? (
              <Text className="px-1 text-[12px]" style={{ color: APP_TEXT_MUTED }}>
                {criticalCount}{' '}
                {criticalCount === 1 ? 'alerta crítica activa' : 'alertas críticas activas'}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </ScreenSafeArea>
    </Modal>
  );
}
