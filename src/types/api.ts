import type { CalendarEvent, TaskItem } from '@/types/assistant';

export type AssistantChatRequest = {
  message: string;
  userName: string;
  userEmail?: string;
  context: {
    tasks: TaskItem[];
    events: CalendarEvent[];
  };
};

export type AssistantChatResponse = {
  reply: string;
  newTasks?: TaskItem[];
  newEvents?: CalendarEvent[];
  completedTaskIds?: string[];
};

export type WhisperTranscriptionResponse = {
  text: string;
};
