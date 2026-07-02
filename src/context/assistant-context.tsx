import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { INITIAL_EVENTS, INITIAL_REMINDERS, INITIAL_TASKS } from '@/constants/mock-data';
import { sendMessageToAssistant } from '@/services/assistant-api';
import { createChatMessage } from '@/services/chat-utils';
import { transcribeAudio, WhisperServiceError } from '@/services/whisper-service';
import type { AssistantChatResponse } from '@/types/api';
import type { CalendarEvent, ChatMessage, DaySummary, ReminderItem, TaskItem } from '@/types/assistant';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { todayIso } from '@/utils/date-utils';

type ProcessingStep = 'idle' | 'transcribing' | 'thinking';

type AssistantContextValue = {
  tasks: TaskItem[];
  events: CalendarEvent[];
  reminders: ReminderItem[];
  messages: ChatMessage[];
  daySummary: DaySummary;
  nextEvent: CalendarEvent | null;
  topPriorityTask: TaskItem | null;
  isProcessing: boolean;
  processingStep: ProcessingStep;
  sendTextMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioUri: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => void;
  addWelcomeMessage: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

const WELCOME_MESSAGE =
  'Hola, soy tu asistente personal. Puedes preguntarme qué tienes hoy, pedirme recordatorios o simplemente hablarme. ¿En qué te ayudo?';

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { recordVoiceUsage, recordAiUsage } = useSubscription();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [reminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [hasWelcome, setHasWelcome] = useState(false);

  const userName = user?.name ?? 'Usuario';
  const isProcessing = processingStep !== 'idle';

  const daySummary = useMemo<DaySummary>(() => {
    const today = todayIso();
    const todayMeetings = events.filter(
      (e) => e.scheduledAt === today && e.type === 'meeting',
    ).length;
    const todayTasks = tasks.filter(
      (t) => t.status === 'pending' && t.scheduledAt === today,
    ).length;
    const importantPending = tasks.filter(
      (t) => t.status === 'pending' && t.priority === 'high',
    ).length;
    return { meetings: todayMeetings, tasks: todayTasks, importantPending };
  }, [tasks, events]);

  const nextEvent = useMemo(() => {
    const today = todayIso();
    const todayEvents = events.filter((e) => e.scheduledAt === today);
    return todayEvents[0] ?? null;
  }, [events]);

  const topPriorityTask = useMemo(() => {
    return tasks.find((t) => t.status === 'pending' && t.priority === 'high') ?? null;
  }, [tasks]);

  const addWelcomeMessage = useCallback(() => {
    if (hasWelcome) return;
    setMessages([createChatMessage('assistant', WELCOME_MESSAGE)]);
    setHasWelcome(true);
  }, [hasWelcome]);

  const applyAssistantResponse = useCallback((response: AssistantChatResponse) => {
    setMessages((prev) => [...prev, createChatMessage('assistant', response.reply)]);

    if (response.newTasks?.length) {
      setTasks((prev) => [
        ...response.newTasks!.map((task) => ({
          ...task,
          scheduledAt: task.scheduledAt ?? todayIso(),
        })),
        ...prev,
      ]);
    }

    if (response.newEvents?.length) {
      setEvents((prev) => [
        ...response.newEvents!.map((event) => ({
          ...event,
          scheduledAt: event.scheduledAt ?? todayIso(),
        })),
        ...prev,
      ]);
    }

    if (response.completedTaskIds?.length) {
      setTasks((prev) =>
        prev.map((t) =>
          response.completedTaskIds!.includes(t.id) ? { ...t, status: 'completed' } : t,
        ),
      );
    }
  }, []);

  const handleAssistantError = useCallback((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo contactar al asistente. Intenta de nuevo.';

    setMessages((prev) => [...prev, createChatMessage('assistant', message)]);
  }, []);

  const runAssistantPipeline = useCallback(
    async (userText: string) => {
      setMessages((prev) => [...prev, createChatMessage('user', userText)]);
      setProcessingStep('thinking');

      try {
        const response = await sendMessageToAssistant({
          message: userText,
          userName,
          userEmail: user?.email,
          context: { tasks, events },
        });
        applyAssistantResponse(response);
        await recordAiUsage();
      } catch (error) {
        handleAssistantError(error);
      } finally {
        setProcessingStep('idle');
      }
    },
    [userName, user?.email, tasks, events, applyAssistantResponse, handleAssistantError, recordAiUsage],
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isProcessing) return;
      await runAssistantPipeline(trimmed);
    },
    [isProcessing, runAssistantPipeline],
  );

  const sendVoiceMessage = useCallback(
    async (audioUri: string) => {
      if (isProcessing || !audioUri) return;

      setProcessingStep('transcribing');

      try {
        const transcription = await transcribeAudio(audioUri);
        await recordVoiceUsage();
        setProcessingStep('thinking');
        await runAssistantPipeline(transcription);
      } catch (error) {
        if (error instanceof WhisperServiceError) {
          setMessages((prev) => [
            ...prev,
            createChatMessage(
              'assistant',
              `No pude transcribir el audio: ${error.message}`,
            ),
          ]);
        } else {
          handleAssistantError(error);
        }
        setProcessingStep('idle');
      }
    },
    [isProcessing, runAssistantPipeline, handleAssistantError, recordVoiceUsage],
  );

  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      events,
      reminders,
      messages,
      daySummary,
      nextEvent,
      topPriorityTask,
      isProcessing,
      processingStep,
      sendTextMessage,
      sendVoiceMessage,
      toggleTaskComplete,
      addWelcomeMessage,
    }),
    [
      tasks,
      events,
      reminders,
      messages,
      daySummary,
      nextEvent,
      topPriorityTask,
      isProcessing,
      processingStep,
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
