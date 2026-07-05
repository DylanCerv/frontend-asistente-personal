import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isBackendConfigured } from '@/config/api';
import { getAssistantWelcomeMessage } from '@/constants/branding';
import { useUserPreferences } from '@/context/user-preferences-context';
import { sendMessageToAssistant } from '@/services/assistant-api';
import { extractPreferredNameRequest } from '@/utils/preferred-name';

import { processVoiceRecording } from '@/services/audio/process-voice-recording';
import {
  createUserRecord,
  fetchUserRecords,
  patchUserRecord,
  removeUserRecord,
} from '@/services/records/records-service';
import { createChatMessage } from '@/services/chat-utils';
import {
  buildVoiceAssistantReply,
  normalizeVoiceJobResult,
} from '@/services/voice-result-utils';
import { getApiErrorMessage } from '@/utils/job-status-message';
import {
  apiRecordToMemory,
  buildRecordStatusPatch,
  buildRemindersFromRecords,
  memoryRecordToEvent,
  memoryRecordToTask,
} from '@/utils/record-mappers';
import type { AssistantChatResponse } from '@/types/api';
import type { ApiRecord, CreateRecordPayload } from '@/types/record-api';
import type { CalendarEvent, ChatMessage, DaySummary, ReminderItem, TaskItem } from '@/types/assistant';
import { useAuth } from '@/context/auth-context';
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
  refreshRecords: () => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioUri: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => void;
  deleteRecord: (recordId: string) => Promise<void>;
  createRecord: (payload: CreateRecordPayload) => Promise<void>;
  patchRecord: (recordId: string, payload: import('@/types/record-api').UpdateRecordPayload) => Promise<void>;
  addWelcomeMessage: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

const API_NOT_CONFIGURED_MESSAGE =
  'No hay conexión con el asistente. Revisa la configuración del servidor e intenta de nuevo.';

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { preferredName, setPreferredName } = useUserPreferences();
  const [apiRecords, setApiRecords] = useState<ApiRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [hasWelcome, setHasWelcome] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const userName = preferredName.trim() || user?.name || 'Usuario';
  const isProcessing = processingStep !== 'idle';

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
      setRecordsError(null);
      setIsRecordsLoading(false);
      return;
    }

    setIsRecordsLoading(true);
    setRecordsError(null);

    try {
      const result = await fetchUserRecords();
      setApiRecords(result);
    } catch (error) {
      setRecordsError(getApiErrorMessage(error));
      setApiRecords([]);
    } finally {
      setIsRecordsLoading(false);
    }
  }, [user]);

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
    setMessages([createChatMessage('assistant', getAssistantWelcomeMessage(userName))]);
    setHasWelcome(true);
  }, [hasWelcome, userName]);

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

  const applyAssistantResponse = useCallback(
    async (response: AssistantChatResponse) => {
      setMessages((prev) => [...prev, createChatMessage('assistant', response.reply)]);
      await refreshRecords();
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
        const requestedName = extractPreferredNameRequest(userText);
        if (requestedName) {
          await setPreferredName(requestedName);
          setMessages((prev) => [
            ...prev,
            createChatMessage(
              'assistant',
              `Perfecto, a partir de ahora te llamaré ${requestedName}. Si quieres cambiarlo después, dímelo o ajústalo en Perfil.`,
            ),
          ]);
          return;
        }

        if (!isBackendConfigured()) {
          setMessages((prev) => [
            ...prev,
            createChatMessage('assistant', API_NOT_CONFIGURED_MESSAGE),
          ]);
          return;
        }

        const response = await sendMessageToAssistant({
          message: userText,
          userName,
          userEmail: user?.email,
          context: buildChatContext(),
        });
        await applyAssistantResponse(response);
      } catch (error) {
        handleAssistantError(error);
      } finally {
        setProcessingStep('idle');
      }
    },
    [
      userName,
      user?.email,
      buildChatContext,
      applyAssistantResponse,
      handleAssistantError,
      setPreferredName,
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

  const applyVoiceJobResult = useCallback(
    async (rawResult: Parameters<typeof normalizeVoiceJobResult>[0], fallbackText?: string) => {
      const result = normalizeVoiceJobResult(rawResult);
      const transcription = result.transcription?.trim() || fallbackText?.trim();

      if (transcription) {
        setMessages((prev) => [...prev, createChatMessage('user', transcription)]);
      }

      setMessages((prev) => [
        ...prev,
        createChatMessage('assistant', buildVoiceAssistantReply(result)),
      ]);

      await refreshRecords();
    },
    [refreshRecords],
  );

  const sendVoiceMessage = useCallback(
    async (audioUri: string) => {
      if (isProcessing || !audioUri) return;

      setProcessingStep('transcribing');

      try {
        if (!isBackendConfigured()) {
          setMessages((prev) => [
            ...prev,
            createChatMessage('assistant', API_NOT_CONFIGURED_MESSAGE),
          ]);
          return;
        }

        const rawResult = await processVoiceRecording(audioUri, {
          onTranscribing: () => setProcessingStep('transcribing'),
          onUploading: () => setProcessingStep('uploading'),
          onProgress: (_progress, status) => {
            if (status === 'pending' || status === 'processing') {
              setProcessingStep('thinking');
            }
          },
        });

        await applyVoiceJobResult(rawResult);
      } catch (error) {
        handleAssistantError(error);
      } finally {
        setProcessingStep('idle');
      }
    },
    [isProcessing, applyVoiceJobResult, handleAssistantError],
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
            ? { ...item, data: { ...(item.data ?? {}), ...patch.data } }
            : item,
        ),
      );

      void patchUserRecord(taskId, patch).catch(async () => {
        await refreshRecords();
      });
    },
    [apiRecords, refreshRecords],
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      setApiRecords((prev) => prev.filter((item) => item.id !== recordId));
      try {
        await removeUserRecord(recordId);
      } catch {
        await refreshRecords();
      }
    },
    [refreshRecords],
  );

  const createRecord = useCallback(
    async (payload: CreateRecordPayload) => {
      const newRecord = await createUserRecord(payload);
      setApiRecords((prev) => [newRecord, ...prev]);
    },
    [],
  );

  const patchRecord = useCallback(
    async (recordId: string, payload: import('@/types/record-api').UpdateRecordPayload) => {
      const updated = await patchUserRecord(recordId, payload);
      setApiRecords((prev) =>
        prev.map((item) => (item.id === recordId ? updated : item)),
      );
    },
    [],
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
      refreshRecords,
      sendTextMessage,
      sendVoiceMessage,
      toggleTaskComplete,
      deleteRecord,
      createRecord,
      patchRecord,
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
      refreshRecords,
      sendTextMessage,
      sendVoiceMessage,
      toggleTaskComplete,
      deleteRecord,
      createRecord,
      patchRecord,
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
