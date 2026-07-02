import Ionicons from '@react-native-vector-icons/ionicons';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceHomeCard } from '@/components/voice-home-card';
import { ReportPanel } from '@/components/report-panel';
import { PRIORITY_LABELS } from '@/constants/mock-data';
import { useAssistant } from '@/context/assistant-context';
import { useAuth } from '@/context/auth-context';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { daySummary, nextEvent, topPriorityTask, reminders } = useAssistant();

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="w-full max-w-3xl gap-5 self-center px-6 pb-36 pt-3">
        <View className="gap-1">
          <Text className="text-[15px] text-subtle dark:text-subtle-dark">{getGreeting()},</Text>
          <Text className="text-[32px] font-bold text-foreground dark:text-foreground-dark">
            {user?.name ?? 'Usuario'}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <SummaryPill icon="calendar-outline" label="Reuniones" value={daySummary.meetings} />
          <SummaryPill icon="checkbox-outline" label="Tareas" value={daySummary.tasks} />
          <SummaryPill
            icon="flag-outline"
            label="Importantes"
            value={daySummary.importantPending}
            highlight
          />
        </View>

        <VoiceHomeCard />

        <ReportPanel />

        {nextEvent ? (
          <SectionCard title="Próximo evento" icon="time-outline">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                {nextEvent.title}
              </Text>
              <Text className="text-sm text-brand dark:text-brand-dark">{nextEvent.time}</Text>
            </View>
          </SectionCard>
        ) : null}

        {topPriorityTask ? (
          <SectionCard title="Prioridad máxima" icon="flame-outline">
            <View className="gap-1">
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                {topPriorityTask.title}
              </Text>
              <Text className="text-sm text-subtle dark:text-subtle-dark">
                {topPriorityTask.dueLabel ?? 'Sin fecha'} · {PRIORITY_LABELS[topPriorityTask.priority]}
              </Text>
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Recordatorios" icon="notifications-outline">
          <View className="gap-3">
            {reminders.map((reminder) => (
              <View key={reminder.id} className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-brand dark:bg-brand-dark" />
                <View className="flex-1">
                  <Text className="text-[15px] font-medium text-foreground dark:text-foreground-dark">
                    {reminder.title}
                  </Text>
                  {reminder.timeLabel ? (
                    <Text className="text-xs text-subtle dark:text-subtle-dark">
                      {reminder.timeLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryPill({
  icon,
  label,
  value,
  highlight,
}: {
  icon: 'calendar-outline' | 'checkbox-outline' | 'flag-outline';
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View
      className={`min-w-[100px] flex-1 gap-1 rounded-2xl border p-3 ${
        highlight
          ? 'border-brand/30 bg-surface-soft dark:border-brand-dark/30 dark:bg-surface-soft-dark'
          : 'border-border bg-surface dark:border-border-dark dark:bg-surface-dark'
      }`}>
      <Ionicons name={icon} size={18} color="#7C3AED" />
      <Text className="text-xl font-bold text-foreground dark:text-foreground-dark">{value}</Text>
      <Text className="text-xs text-subtle dark:text-subtle-dark">{label}</Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: 'time-outline' | 'flame-outline' | 'notifications-outline';
  children: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-[28px] border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={20} color="#7C3AED" />
        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
