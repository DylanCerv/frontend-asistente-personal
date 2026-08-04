import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { CriticalAlarmScreen } from '@/components/critical-alarm/critical-alarm-screen';
import { AssistantProvider, useAssistant } from '@/context/assistant-context';
import { useUserPreferences } from '@/context/user-preferences-context';
import {
  cancelCriticalAlarmForRecord,
  CRITICAL_SNOOZE_MINUTES,
} from '@/services/reminders/critical-alarm-notifications';
import { snoozeInAppAlert } from '@/services/reminders/kivo-alerts';
import { snoozeReminderNotification } from '@/services/reminders/reminder-notifications';

function CriticalAlarmContent() {
  const router = useRouter();
  const { recordId, title: titleParam } = useLocalSearchParams<{
    recordId?: string;
    title?: string;
  }>();
  const { records, toggleTaskComplete, toggleEventComplete } = useAssistant();
  const { reminderAlertStyle, reminderAlertSound, reminderAlertVibration } = useUserPreferences();

  const record = useMemo(
    () => (recordId ? records.find((item) => item.id === recordId) : undefined),
    [recordId, records],
  );

  const title =
    (typeof titleParam === 'string' && titleParam.trim()) ||
    record?.title ||
    'Tarea urgente';

  function leaveAlarm() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(main)/assistant');
  }

  async function handleComplete() {
    if (recordId && recordId !== 'test-critical') {
      if (record?.type === 'meeting' || record?.type === 'reminder') {
        toggleEventComplete(recordId);
      } else {
        toggleTaskComplete(recordId);
      }
      await cancelCriticalAlarmForRecord(recordId);
    }
    leaveAlarm();
  }

  async function handleSnooze() {
    const body = record?.description?.trim() || `Recordatorio pospuesto: ${title}`;

    if (recordId) {
      snoozeInAppAlert(recordId, CRITICAL_SNOOZE_MINUTES);
      await snoozeReminderNotification(
        {
          recordId,
          title: 'Alarma crítica',
          body,
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
    leaveAlarm();
  }

  function handleTalk() {
    router.replace({
      pathname: '/(main)/assistant',
      params: { autoRecord: '1' },
    });
  }

  return (
    <CriticalAlarmScreen
      title={title}
      alertStyle={reminderAlertStyle}
      soundId={reminderAlertSound}
      vibrationId={reminderAlertVibration}
      onComplete={() => void handleComplete()}
      onSnooze={() => void handleSnooze()}
      onTalk={handleTalk}
    />
  );
}

export default function CriticalAlarmRoute() {
  return (
    <AssistantProvider>
      <CriticalAlarmContent />
    </AssistantProvider>
  );
}
