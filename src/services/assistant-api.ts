import type { AssistantChatRequest, AssistantChatResponse } from '@/types/api';

import { apiRequest } from './api/api-client';

export class AssistantApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AssistantApiError';
  }
}

type ChatApiResponse = AssistantChatResponse & {
  success?: boolean;
  data?: AssistantChatResponse & { records?: unknown[] };
};

export async function sendMessageToAssistant(
  payload: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  try {
    const response = await apiRequest<ChatApiResponse>('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const reply = response.reply?.trim() || response.data?.reply?.trim();
    if (!reply) {
      throw new AssistantApiError('Kivo no devolvió una respuesta válida.');
    }

    return {
      reply,
      newTasks: response.newTasks ?? response.data?.newTasks,
      newEvents: response.newEvents ?? response.data?.newEvents,
      completedTaskIds: response.completedTaskIds ?? response.data?.completedTaskIds,
    };
  } catch (error) {
    if (error instanceof AssistantApiError) throw error;
    const message = error instanceof Error ? error.message : 'No se pudo contactar a Kivo';
    const statusCode =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status?: number }).status)
        : undefined;
    throw new AssistantApiError(message, statusCode);
  }
}
