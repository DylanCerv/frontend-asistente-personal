import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isAssistantApiConfigured, isMockDataMode, isWhisperConfigured } from '@/config/api';
import { sendMessageToAssistant } from '@/services/assistant-api';
import { processVoiceRecording } from '@/services/audio/process-voice-recording';
import { runMockAssistant } from '@/services/mock/mock-assistant-engine';
import { simulateVoiceProcessing } from '@/services/mock/mock-voice-parser';
import {
  appendMockMemoryRecords,
  fetchUserRecords,
  patchUserRecord,
  type RecordsDataSource,
} from '@/services/records/records-service';
import { createChatMessage } from '@/services/chat-utils';
import {
  buildVoiceAssistantReply,
  normalizeVoiceJobResult,
} from '@/services/voice-result-utils';
import { transcribeAudio } from '@/services/whisper-service';
import { getApiErrorMessage } from '@/utils/job-status-message';
import {
  apiRecordToMemory,
  buildRecordStatusPatch,
  buildRemindersFromRecords,
  memoryRecordToEvent,
  memoryRecordToTask,
} from '@/utils/record-mappers';
import type { AssistantChatResponse } from '@/types/api';
import type { ApiRecord } from '@/types/record-api';
import type { CalendarEvent, ChatMessage, DaySummary, ReminderItem, TaskItem } from '@/types/assistant';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { todayIso } from '@/utils/date-utils';

type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'thinking';

type AssistantContextValue = {
  records: ReturnType<typeof apiRecordToMemory>[];
  tasks: TaskItem[];
  events: CalendarEvent[];
  reminders: ReminderItem[];
  messages: ChatMessage[];
  daySummary: DaySummary;
  nextEvent: CalendarEvent | null;
  topPriorityTask: TaskItem | null;
  isProcessing: boolean;
  processingStep: ProcessingStep;
  isRecordsLoading: boolean;
  recordsError: string | null;
  isMockMode: boolean;
  refreshRecords: () => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioUri: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => void;
  addWelcomeMessage: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

const WELCOME_MESSAGE =
  'Hola, soy tu asistente personal. Puedes preguntarme qué tienes hoy, pedirme recordatorios o simplemente hablarme. ¿En qué te ayudo?';

const DEMO_TRANSCRIPTION =
  'Recuérdame revisar las tareas urgentes de hoy y gasté 35 dólares en almuerzo.';

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { recordVoiceUsage, recordAiUsage } = useSubscription();
  const [apiRecords, setApiRecords] = useState<ApiRecord[]>([]);
  const [recordsSource, setRecordsSource] = useState<RecordsDataSource>('mock');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [hasWelcome, setHasWelcome] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const userName = user?.name ?? 'Usuario';
  const userId = user?.id ?? 'local-user';
  const isProcessing = processingStep !== 'idle';
  const isMockMode = isMockDataMode() || recordsSource === 'mock';

  const records = useMemo(() => apiRecords.map(apiRecordToMemory), [apiRecords]);

  const tasks = useMemo(
    () => records.map(memoryRecordToTask).filter((task): task is TaskItem => task !== null),
    [records],
  );

  const events = useMemo(
    () => records.map(memoryRecordToEvent).filter((event): event is CalendarEvent => event !== null),
    [records],
  );

  const reminders = useMemo(() => buildRemindersFromRecords(records), [records]);

  const refreshRecords = useCallback(async () => {
    if (!user) {
      setApiRecords([]);
      setIsRecordsLoading(false);
      return;
    }

    setIsRecordsLoading(true);
    setRecordsError(null);

    try {
      const result = await fetchUserRecords(userId);
      setApiRecords(result.records);
      setRecordsSource(result.source);
    } catch (error) {
      setRecordsError(getApiErrorMessage(error));
      setApiRecords([]);
    } finally {
      setIsRecordsLoading(false);
    }
  }, [user, userId]);

  useEffect(() => {
    void refreshRecords();
  }, [refreshRecords]);

  const daySummary = useMemo<DaySummary>(() => {
    const today = todayIso();
    const todayMeetings = events.filter(
      (event) => event.scheduledAt === today && event.type === 'meeting',
    ).length;
    const todayTasks = tasks.filter(
      (task) => task.status === 'pending' && task.scheduledAt === today,
    ).length;
    const importantPending = tasks.filter(
      (task) => task.status === 'pending' && task.priority === 'high',
    ).length;
    return { meetings: todayMeetings, tasks: todayTasks, importantPending };
  }, [tasks, events]);

  const nextEvent = useMemo(() => {
    const today = todayIso();
    const todayEvents = events.filter((event) => event.scheduledAt === today);
    return todayEvents[0] ?? null;
  }, [events]);

  const topPriorityTask = useMemo(() => {
    return tasks.find((task) => task.status === 'pending' && task.priority === 'high') ?? null;
  }, [tasks]);

  const addWelcomeMessage = useCallback(() => {
    if (hasWelcome) return;
    setMessages([createChatMessage('assistant', WELCOME_MESSAGE)]);
    setHasWelcome(true);
  }, [hasWelcome]);

  const buildChatContext = useCallback(
    () => ({
      tasks,
      events,
      records: records.map((record) => ({
        id: record.id,
        type: record.type,
        title: record.title,
        description: record.description,
        scheduledAt: record.scheduledAt,
        client: record.client,
        project: record.project,
        amount: record.amount,
        currency: record.currency,
      })),
    }),
    [tasks, events, records],
  );

  const applyMockChatResult = useCallback(
    async (userText: string) => {
      const result = runMockAssistant(userText, { tasks, events, records });
      setMessages((prev) => [...prev, createChatMessage('assistant', result.reply)]);

      if (result.newRecords.length > 0) {
        const updated = await appendMockMemoryRecords(userId, result.newRecords);
        setApiRecords(updated);
        setRecordsSource('mock');
      }
    },
    [tasks, events, records, userId],
  );

  const applyAssistantResponse = useCallback(
    async (response: AssistantChatResponse) => {
      setMessages((prev) => [...prev, createChatMessage('assistant', response.reply)]);

      if (response.newTasks?.length || response.newEvents?.length || response.completedTaskIds?.length) {
        await refreshRecords();
      }
    },
    [refreshRecords],
  );

  const handleAssistantError = useCallback((error: unknown) => {
    const message = getApiErrorMessage(error);
    setMessages((prev) => [...prev, createChatMessage('assistant', message)]);
  }, []);

  const runAssistantPipeline = useCallback(
    async (userText: string) => {
      setMessages((prev) => [...prev, createChatMessage('user', userText)]);
      setProcessingStep('thinking');

      try {
        if (isMockDataMode() || !isAssistantApiConfigured()) {
          await applyMockChatResult(userText);
          await recordAiUsage();
          return;
        }

        const response = await sendMessageToAssistant({
          message: userText,
          userName,
          userEmail: user?.email,
          context: buildChatContext(),
        });
        await applyAssistantResponse(response);
        await recordAiUsage();
      } catch (error) {
        if (isMockDataMode() || recordsSource === 'mock') {
          await applyMockChatResult(userText);
        } else {
          handleAssistantError(error);
        }
      } finally {
        setProcessingStep('idle');
      }
    },
    [
      userName,
      user?.email,
      buildChatContext,
      applyAssistantResponse,
      applyMockChatResult,
      handleAssistantError,
      recordAiUsage,
      recordsSource,
    ],
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isProcessing) return;
      await runAssistantPipeline(trimmed);
    },
    [isProcessing, runAssistantPipeline],
  );

  const processMockVoice = useCallback(
    async (audioUri: string) => {
      setProcessingStep('transcribing');

      const parsed = await simulateVoiceProcessing(async () => {
        if (isWhisperConfigured()) {
          return transcribeAudio(audioUri);
        }
        return DEMO_TRANSCRIPTION;
      });

      setMessages((prev) => [...prev, createChatMessage('user', parsed.transcription)]);
      setMessages((prev) => [...prev, createChatMessage('assistant', parsed.summary)]);

      const updated = await appendMockMemoryRecords(userId, parsed.records);
      setApiRecords(updated);
      setRecordsSource('mock');
      await recordVoiceUsage();
    },
    [userId, recordVoiceUsage],
  );

  const sendVoiceMessage = useCallback(
    async (audioUri: string) => {
      if (isProcessing || !audioUri) return;

      setProcessingStep('uploading');

      try {
        if (isMockDataMode()) {
          await processMockVoice(audioUri);
          return;
        }

        const rawResult = await processVoiceRecording(audioUri, {
          onUploading: () => setProcessingStep('uploading'),
          onProgress: (_progress, status) => {
            if (status === 'pending' || status === 'processing') {
              setProcessingStep('transcribing');
            }
          },
        });

        const result = normalizeVoiceJobResult(rawResult);
        const transcription = result.transcription?.trim();

        if (transcription) {
          setMessages((prev) => [...prev, createChatMessage('user', transcription)]);
        }

        setMessages((prev) => [
          ...prev,
          createChatMessage('assistant', buildVoiceAssistantReply(result)),
        ]);

        await recordVoiceUsage();
        await refreshRecords();
      } catch (error) {
        try {
          await processMockVoice(audioUri);
        } catch {
          handleAssistantError(error);
        }
      } finally {
        setProcessingStep('idle');
      }
    },
    [isProcessing, processMockVoice, handleAssistantError, recordVoiceUsage, refreshRecords],
  );

  const toggleTaskComplete = useCallback(
    (taskId: string) => {
      const record = apiRecords.find((item) => item.id === taskId);
      if (!record || record.type !== 'task') return;

      const currentStatus =
        typeof record.data?.status === 'string' && record.data.status === 'completed'
          ? 'completed'
          : 'pending';
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const patch = buildRecordStatusPatch(record, nextStatus);

      setApiRecords((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                data: {
                  ...(item.data ?? {}),
                  ...patch.data,
                },
              }
            : item,
        ),
      );

      void patchUserRecord(userId, taskId, patch, recordsSource).catch(async () => {
        await refreshRecords();
      });
    },
    [apiRecords, recordsSource, userId, refreshRecords],
  );

  const value = useMemo(
    () => ({
      records,
      tasks,
      events,
      reminders,
      messages,
      daySummary,
      nextEvent,
      topPriorityTask,
      isProcessing,
      processingStep,
      isRecordsLoading,
      recordsError,
      isMockMode,
      refreshRecords,
      sendTextMessage,
      sendVoiceMessage,
      toggleTaskComplete,
      addWelcomeMessage,
    }),
    [
      records,
      tasks,
      events,
      reminders,
      messages,
      daySummary,
      nextEvent,
      topPriorityTask,
      isProcessing,
      processingStep,
      isRecordsLoading,
      recordsError,
      isMockMode,
      refreshRecords,
      sendTextMessage,
      sendVoiceMessage,
      toggleTaskComplete,
      addWelcomeMessage,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within AssistantProvider');
  }
  return context;
}
