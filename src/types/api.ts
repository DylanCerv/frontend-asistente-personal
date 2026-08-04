import type { CalendarEvent, TaskItem } from '@/types/assistant';

export type ApiUser = {
  id: string;
  email: string;
  roleId: number;
  role: { id: number; name: string };
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
};

export type ApiSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
};

export type AuthPayload = {
  user: ApiUser;
  session: ApiSession;
};

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

export type ApiDataResponse<T> = {
  success: true;
  data: T;
};

export type AssistantChatRequest = {
  message: string;
  userName: string;
  userEmail?: string;
  context: {
    tasks: TaskItem[];
    events: CalendarEvent[];
    records?: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      scheduledAt?: string;
      client?: string;
      project?: string;
      amount?: number;
      currency?: string;
    }>;
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
